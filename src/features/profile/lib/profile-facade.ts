import { getAddressNames } from "@/lib/addresses";
import { MAX_ADDRESSES, NAME_MAX_LENGTH, PHONE_MAX_LENGTH, STREET_MAX_LENGTH } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import type { Prisma } from "@/app/generated/prisma/client";
import { z } from "zod";

const addressSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false),
  receiverName: z.string().trim().max(NAME_MAX_LENGTH).optional().default(""),
  receiverPhone: z
    .string()
    .trim()
    .max(PHONE_MAX_LENGTH)
    .refine(
      (value) => !value || /^(0[0-9]{9,10})$/.test(value.replace(/[\s().-]/g, '')),
      "Số điện thoại Việt Nam không hợp lệ.",
    )
    .optional()
    .default(""),
  street: z.string().trim().min(1).max(STREET_MAX_LENGTH),
  provinceCode: z.number().int().positive(),
  districtCode: z.number().int().positive(),
  wardCode: z.number().int().positive(),
});

const profileUpdateSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX_LENGTH)
    .refine(
      (value) => !value || /^(0[0-9]{9,10})$/.test(value.replace(/[\s().-]/g, '')),
      "Số điện thoại Việt Nam không hợp lệ.",
    )
    .nullable()
    .optional(),
  birthDate: z
    .string()
    .date()
    .refine(
      (value) => new Date(`${value}T00:00:00.000Z`) <= new Date(),
      "Ngày sinh không thể ở tương lai.",
    )
    .nullable()
    .optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  addresses: z.array(addressSchema).max(MAX_ADDRESSES).optional(),
});

type SessionUser = {
  id: string;
  role?: string | null;
  [key: string]: unknown;
};

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
type TransactionClient = Prisma.TransactionClient;

export class ProfileAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

interface ProfileCommand {
  execute(transaction: TransactionClient, profileId: string): Promise<void>;
}

class UpdatePersonalInfoCommand implements ProfileCommand {
  constructor(private readonly input: Omit<ProfileUpdateInput, "addresses">) {}

  async execute(transaction: TransactionClient, profileId: string) {
    const data = {
      ...(this.input.phone !== undefined && { phone: this.input.phone }),
      ...(this.input.birthDate !== undefined && {
        birthDate: this.input.birthDate
          ? new Date(`${this.input.birthDate}T00:00:00.000Z`)
          : null,
      }),
      ...(this.input.gender !== undefined && { gender: this.input.gender }),
    };

    if (Object.keys(data).length === 0) return;
    await transaction.profile.update({ where: { id: profileId }, data });
  }
}

class ReplaceAddressesCommand implements ProfileCommand {
  constructor(
    private readonly addresses: NonNullable<ProfileUpdateInput["addresses"]>,
  ) {}

  async execute(transaction: TransactionClient, profileId: string) {
    const resolved = this.addresses.map((address) => ({
      ...address,
      names: getAddressNames(
        address.provinceCode,
        address.districtCode,
        address.wardCode,
      ),
    }));

    if (
      resolved.some(
        ({ names }) =>
          !names.provinceName || !names.districtName || !names.wardName,
      )
    ) {
      throw new ProfileAccessError(
        "Invalid province, district, or ward selection.",
        400,
      );
    }

    const requestedDefaultIndex = resolved.findIndex(
      (address) => address.isDefault,
    );
    const defaultIndex =
      resolved.length === 0
        ? -1
        : requestedDefaultIndex >= 0
          ? requestedDefaultIndex
          : 0;

    const existingAddresses = await transaction.address.findMany({
      where: { profileId },
      select: { id: true },
    });


    if (resolved.length === 0 && existingAddresses.length > 0) {
      throw new ProfileAccessError(
        "Bạn phải giữ lại ít nhất 1 địa chỉ giao hàng.",
        400,
      );
    }

    const existingIds = new Set(existingAddresses.map((a) => a.id));

    const incomingIds = new Set(
      resolved.filter((a) => a.id).map((a) => a.id!),
    );
    const idsToDelete = existingAddresses
      .filter((a) => !incomingIds.has(a.id))
      .map((a) => a.id);
    if (idsToDelete.length > 0) {
      await transaction.address.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    for (let i = 0; i < resolved.length; i++) {
      const address = resolved[i];
      const data = {
        profileId,
        type: address.type,
        isDefault: i === defaultIndex,
        receiverName: address.receiverName || null,
        receiverPhone: address.receiverPhone || null,
        street: address.street,
        provinceCode: address.provinceCode,
        provinceName: address.names.provinceName,
        districtCode: address.districtCode,
        districtName: address.names.districtName,
        wardCode: address.wardCode,
        wardName: address.names.wardName,
      };

      if (address.id && existingIds.has(address.id)) {
        await transaction.address.update({ where: { id: address.id }, data });
      } else {
        await transaction.address.create({ data });
      }
    }
  }
}

export class ProfileFacade {
  assertCustomer(user: SessionUser | null | undefined) {
    if (!user) throw new ProfileAccessError("Unauthorized", 401);
    if (isStaff(user.role)) {
      throw new ProfileAccessError("Customer access only.", 403);
    }
  }

  async getProfile(user: SessionUser) {
    this.assertCustomer(user);
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    return (
      profile ?? {
        user,
        phone: null,
        birthDate: null,
        gender: null,
        addresses: [],
      }
    );
  }

  async updateProfile(user: SessionUser, rawInput: unknown) {
    this.assertCustomer(user);
    const result = profileUpdateSchema.safeParse(rawInput);

    if (!result.success) {
      const exceedsAddressLimit = result.error.issues.some(
        (issue) => issue.path[0] === "addresses" && issue.code === "too_big",
      );
      throw new ProfileAccessError(
        exceedsAddressLimit
          ? `You can save up to ${MAX_ADDRESSES} addresses.`
          : "Invalid profile data",
        400,
        result.error.flatten().fieldErrors,
      );
    }

    const { addresses, ...personalInfo } = result.data;
    const commands: ProfileCommand[] = [
      new UpdatePersonalInfoCommand(personalInfo),
    ];
    if (addresses) commands.push(new ReplaceAddressesCommand(addresses));

    return prisma.$transaction(async (transaction) => {
      const profile = await transaction.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      for (const command of commands) {
        await command.execute(transaction, profile.id);
      }

      return transaction.profile.findUniqueOrThrow({
        where: { id: profile.id },
        include: {
          user: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          },
        },
      });
    });
  }
}

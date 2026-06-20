import type { Prisma } from "@/app/generated/prisma/client";
import { OrderStatus } from "@/app/generated/prisma/enums";
import {
  accountListQuerySchema,
  createStaffSchema,
  updateAccountSchema,
} from "@/features/admin/schemas/accounts";
import { ADMIN_ERRORS, DEFAULT_BAN_REASON } from "@/features/admin/constants";
import prisma from "@/lib/prisma";
import { isAdmin, isStaff, UserRole } from "@/lib/roles";
import { cancelOrderAndReleaseResources } from "@/features/order/lib/order-cancellation";

type Actor = {
  id: string;
  role?: string | null;
};

type AccountTarget = {
  id: string;
  role: UserRole;
  banned: boolean;
};

type MutationContext = {
  actor: Actor;
  target: AccountTarget;
};

export class AccountAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

interface AccountPolicy {
  setNext(policy: AccountPolicy): AccountPolicy;
  check(context: MutationContext): void;
}

abstract class BaseAccountPolicy implements AccountPolicy {
  private nextPolicy: AccountPolicy | null = null;

  setNext(policy: AccountPolicy) {
    this.nextPolicy = policy;
    return policy;
  }

  check(context: MutationContext) {
    this.nextPolicy?.check(context);
  }
}

class AdminActorPolicy extends BaseAccountPolicy {
  override check(context: MutationContext) {
    if (!isAdmin(context.actor.role)) {
      throw new AccountAccessError(ADMIN_ERRORS.adminRequired, 403);
    }
    super.check(context);
  }
}

class SelfManagementPolicy extends BaseAccountPolicy {
  override check(context: MutationContext) {
    if (context.actor.id === context.target.id) {
      throw new AccountAccessError(
        ADMIN_ERRORS.selfManagement,
        400,
      );
    }
    super.check(context);
  }
}

class ProtectedAdminPolicy extends BaseAccountPolicy {
  override check(context: MutationContext) {
    if (context.target.role === UserRole.admin) {
      throw new AccountAccessError(
        ADMIN_ERRORS.protectedAdmin,
        403,
      );
    }
    super.check(context);
  }
}

interface AccountState {
  shouldRevokeSessions(nextBanned: boolean): boolean;
}

class ActiveAccountState implements AccountState {
  shouldRevokeSessions(nextBanned: boolean) {
    return nextBanned;
  }
}

class BannedAccountState implements AccountState {
  shouldRevokeSessions() {
    return false;
  }
}

interface AccountCommand {
  execute(transaction: Prisma.TransactionClient): Promise<unknown>;
}

class SetRoleCommand implements AccountCommand {
  constructor(
    private readonly target: AccountTarget,
    private readonly role: UserRole,
  ) {}

  async execute(transaction: Prisma.TransactionClient) {
    return transaction.user.update({
      where: { id: this.target.id },
      data: { role: this.role },
      select: accountMutationSelection,
    });
  }
}

class SetBanCommand implements AccountCommand {
  constructor(
    private readonly target: AccountTarget,
    private readonly banned: boolean,
    private readonly reason: string | undefined,
    private readonly banExpires: string | null | undefined,
    private readonly state: AccountState,
  ) {}

  async execute(transaction: Prisma.TransactionClient) {
    const user = await transaction.user.update({
      where: { id: this.target.id },
      data: {
        banned: this.banned,
        banReason: this.banned
          ? this.reason || DEFAULT_BAN_REASON
          : null,
        banExpires: this.banned && this.banExpires
          ? new Date(this.banExpires)
          : null,
      },
      select: accountMutationSelection,
    });

    if (this.state.shouldRevokeSessions(this.banned)) {
      await transaction.session.deleteMany({
        where: { userId: this.target.id },
      });
    }

    return user;
  }
}

const accountMutationSelection = {
  id: true,
  name: true,
  email: true,
  role: true,
  banned: true,
  banReason: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class AccountManagementFacade {
  private readonly mutationPolicies: AccountPolicy;

  constructor() {
    const admin = new AdminActorPolicy();
    admin
      .setNext(new SelfManagementPolicy())
      .setNext(new ProtectedAdminPolicy());
    this.mutationPolicies = admin;
  }

  async list(actor: Actor | null | undefined, rawQuery: unknown) {
    if (!actor || !isStaff(actor.role)) {
      throw new AccountAccessError(ADMIN_ERRORS.forbidden, 403);
    }

    const query = accountListQuerySchema.safeParse(rawQuery);
    if (!query.success) {
      throw new AccountAccessError(ADMIN_ERRORS.invalidQuery, 400);
    }
    if (query.data.kind === "staff" && !isAdmin(actor.role)) {
      throw new AccountAccessError(ADMIN_ERRORS.adminRequired, 403);
    }

    const { kind, page, pageSize, search, status } = query.data;
    const roles = kind === "customer" ? [UserRole.customer] : [UserRole.staff];
    const where: Prisma.UserWhereInput = {
      role: { in: roles },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status === "active" && { banned: false }),
      ...(status === "banned" && { banned: true }),
    };

    const [users, total, statTotal, totalActive, totalBanned, staffCount] =
      await prisma.$transaction([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            role: true,
            banned: true,
            banReason: true,
            createdAt: true,
            updatedAt: true,
            sessions: {
              orderBy: { updatedAt: "desc" },
              take: 1,
              select: { updatedAt: true },
            },
            profile: {
              select: {
                phone: true,
                _count: { select: { addresses: true } },
              },
            },
          },
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { role: { in: roles } } }),
        prisma.user.count({ where: { role: { in: roles }, banned: false } }),
        prisma.user.count({ where: { role: { in: roles }, banned: true } }),
        prisma.user.count({ where: { role: UserRole.staff } }),
      ]);

    return {
      data: users.map(({ sessions, profile, ...user }) => ({
        ...user,
        phone: profile?.phone ?? null,
        addressCount: profile?._count.addresses ?? 0,
        lastActiveAt: sessions[0]?.updatedAt ?? null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      stats: {
        total: statTotal,
        active: totalActive,
        banned: totalBanned,
        staff: staffCount,
      },
      permissions: {
        canManage: isAdmin(actor.role),
        currentUserId: actor.id,
      },
    };
  }

  async createStaff(actor: Actor | null | undefined, rawInput: unknown) {
    if (!actor || !isAdmin(actor.role)) {
      throw new AccountAccessError(ADMIN_ERRORS.adminRequired, 403);
    }

    const result = createStaffSchema.safeParse(rawInput);
    if (!result.success) {
      throw new AccountAccessError(
        ADMIN_ERRORS.invalidStaffData,
        400,
        result.error.flatten().fieldErrors,
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: result.data.email },
      select: { role: true },
    });
    if (existing) {
      throw new AccountAccessError(
        existing.role === UserRole.customer
          ? ADMIN_ERRORS.emailBelongsToCustomer
          : ADMIN_ERRORS.emailAlreadyExists,
        409,
      );
    }

    return prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        role: UserRole.staff,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getDetail(actor: Actor | null | undefined, userId: string) {
    if (!actor || !isStaff(actor.role)) {
      throw new AccountAccessError(ADMIN_ERRORS.forbidden, 403);
    }

    const select = {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
      updatedAt: true,
      accounts: { select: { providerId: true } },
      profile: {
        select: {
          phone: true,
          birthDate: true,
          gender: true,
          addresses: {
            orderBy: { isDefault: "desc" as const },
            select: {
              id: true,
              type: true,
              isDefault: true,
              street: true,
              provinceCode: true,
              provinceName: true,
              districtCode: true,
              districtName: true,
              wardCode: true,
              wardName: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { updatedAt: "desc" as const },
        take: 10,
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" as const },
        take: 10,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      feedbacks: {
        orderBy: { createdAt: "desc" as const },
        take: 10,
        select: {
          id: true,
          rating: true,
          content: true,
          isVisible: true,
          createdAt: true,
          product: { select: { id: true, name: true, slug: true } },
        },
      },
      _count: {
        select: {
          orders: true,
          feedbacks: true,
          wishlists: true,
          sessions: true,
        },
      },
    } satisfies Prisma.UserSelect;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select,
    });

    if (!user) {
      throw new AccountAccessError(ADMIN_ERRORS.accountNotFound, 404);
    }

    const isTargetAdmin = user.role === UserRole.admin;
    const isTargetStaff = user.role === UserRole.staff;
    const canManage = isAdmin(actor.role);

    if (isTargetAdmin && !isAdmin(actor.role)) {
      throw new AccountAccessError(ADMIN_ERRORS.forbidden, 403);
    }
    if (isTargetStaff && !canManage) {
      throw new AccountAccessError(ADMIN_ERRORS.adminRequired, 403);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accounts: user.accounts,
      profile: user.profile,
      sessions: user.sessions,
      orders: user.orders,
      feedbacks: user.feedbacks,
      isTargetAdmin,
      isTargetStaff,
      permissions: {
        canManage,
        canBan: canManage && !isTargetAdmin && user.id !== actor.id,
        canChangeRole: canManage && !isTargetAdmin && user.id !== actor.id,
        isSelf: user.id === actor.id,
      },
      stats: {
        orderCount: user._count.orders,
        feedbackCount: user._count.feedbacks,
        wishlistCount: user._count.wishlists,
        sessionCount: user._count.sessions,
      },
    };
  }

  async updateAccount(
    actor: Actor | null | undefined,
    userId: string,
    rawInput: unknown,
  ) {
    if (!actor) throw new AccountAccessError(ADMIN_ERRORS.adminRequired, 403);

    const result = updateAccountSchema.safeParse(rawInput);
    if (!result.success) {
      throw new AccountAccessError(ADMIN_ERRORS.invalidUpdate, 400);
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, banned: true },
    });
    if (!target) throw new AccountAccessError(ADMIN_ERRORS.accountNotFound, 404);

    this.mutationPolicies.check({ actor, target });
    const state: AccountState = target.banned
      ? new BannedAccountState()
      : new ActiveAccountState();
    const command: AccountCommand =
      result.data.action === "set-role"
        ? new SetRoleCommand(target, result.data.role)
        : new SetBanCommand(
            target,
            result.data.banned,
            result.data.reason,
            result.data.banExpires,
            state,
          );

    const updatedAccount = await prisma.$transaction(
      (transaction) => command.execute(transaction),
      { timeout: 30000 },
    );

    if (result.data.action === "set-ban" && result.data.banned) {
      await this.cancelPendingOrders(userId);
    }

    return updatedAccount;
  }

  private async cancelPendingOrders(userId: string) {
    try {
      const pendingOrders = await prisma.orders.findMany({
        where: {
          userId,
          status: OrderStatus.pending,
          paymentStatus: { in: ["unpaid", "failed"] },
        },
        select: { id: true },
        orderBy: { id: "asc" },
      });

      for (const order of pendingOrders) {
        try {
          await prisma.$transaction(
            (transaction) =>
              cancelOrderAndReleaseResources(transaction, order.id, {
                userId,
                allowedStatuses: [OrderStatus.pending],
                paymentStatuses: ["unpaid", "failed"],
              }),
            { timeout: 30000 },
          );
        } catch (error) {
          console.error("Unable to cancel order after account ban", {
            userId,
            orderId: order.id,
            error,
          });
        }
      }
    } catch (error) {
      console.error("Unable to list pending orders after account ban", {
        userId,
        error,
      });
    }
  }
}

import { ForbiddenError } from "@/lib/auth-helpers";
import { hasRole } from "@/lib/roles";
import { UserRole } from "@/app/generated/prisma/enums";
import { BrandRepository } from "./brand-repository";
import { BrandService } from "./brand-service";
import type { createBrandSchema, updateBrandSchema } from "@/features/brand/schemas/brand.schema";
import type { z } from "zod";

export class BrandFacade {
  private readonly service: BrandService;

  constructor() {
    const repository = new BrandRepository();
    this.service = new BrandService(repository);
  }

  async listBrands(query: {
    search?: string;
    isActive?: boolean;
    page: number;
    pageSize: number;
  }) {
    return this.service.getBrands(query);
  }

  async getBrand(idOrSlug: string) {
    try {
      return await this.service.getBrandById(idOrSlug);
    } catch {
      return this.service.getBrandBySlug(idOrSlug);
    }
  }

  async createBrand(actorRole: string | null | undefined, data: z.infer<typeof createBrandSchema>) {
    this.assertAdminOrStaff(actorRole);
    return this.service.createBrand(data);
  }

  async updateBrand(actorRole: string | null | undefined, id: string, data: z.infer<typeof updateBrandSchema>) {
    this.assertAdminOrStaff(actorRole);
    return this.service.updateBrand(id, data);
  }

  async deleteBrand(actorRole: string | null | undefined, id: string) {
    this.assertAdminOrStaff(actorRole);
    return this.service.deleteBrand(id);
  }

  private assertAdminOrStaff(role: string | null | undefined) {
    if (!hasRole(role, [UserRole.admin, UserRole.staff])) {
      throw new ForbiddenError("Bạn không có quyền thực hiện hành động này.");
    }
  }
}

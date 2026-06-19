import { ForbiddenError } from "@/lib/auth-helpers";
import { hasRole } from "@/lib/roles";
import { UserRole } from "@/app/generated/prisma/enums";
import { CategoryRepository } from "./category-repository";
import { CategoryService } from "./category-service";
import type { createCategorySchema, updateCategorySchema } from "@/features/category/schemas/category.schema";
import type { z } from "zod";

export class CategoryFacade {
  private readonly service: CategoryService;

  constructor() {
    const repository = new CategoryRepository();
    this.service = new CategoryService(repository);
  }

  async listCategories(query: {
    search?: string;
    isActive?: boolean;
    parentId?: string;
    page: number;
    pageSize: number;
  }) {
    return this.service.getCategories(query);
  }

  async getCategory(idOrSlug: string) {
    try {
      return await this.service.getCategoryById(idOrSlug);
    } catch {
      return this.service.getCategoryBySlug(idOrSlug);
    }
  }

  async createCategory(actorRole: string | null | undefined, data: z.infer<typeof createCategorySchema>) {
    this.assertAdminOrStaff(actorRole);
    return this.service.createCategory(data);
  }

  async updateCategory(actorRole: string | null | undefined, id: string, data: z.infer<typeof updateCategorySchema>) {
    this.assertAdminOrStaff(actorRole);
    return this.service.updateCategory(id, data);
  }

  async deleteCategory(actorRole: string | null | undefined, id: string) {
    this.assertAdminOrStaff(actorRole);
    return this.service.deactivateCategory(id);
  }

  async getPopularCategories(limit: number) {
    return this.service.getPopularCategories(limit);
  }

  async getCategoryConfig(slug: string) {
    return this.service.getCategoryConfig(slug);
  }

  async getCategoryConfigAndFilters(slug: string) {
    return this.service.getCategoryConfigAndFilters(slug);
  }

  private assertAdminOrStaff(role: string | null | undefined) {

    if (!hasRole(role, [UserRole.admin, UserRole.staff])) {
      throw new ForbiddenError("Bạn không có quyền thực hiện hành động này.");
    }
  }
}

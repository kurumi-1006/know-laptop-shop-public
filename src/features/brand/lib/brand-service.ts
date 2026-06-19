import { BrandRepository } from "./brand-repository";
import type { Prisma } from "@/app/generated/prisma/client";

export class BrandService {
  constructor(private readonly repository: BrandRepository) {}

  async getBrands(query: {
    search?: string;
    isActive?: boolean;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.BrandWhereInput = {
      ...(query.search && {
        name: { contains: query.search, mode: "insensitive" },
      }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [data, total] = await Promise.all([
      this.repository.findMany({ where, skip, take: query.pageSize }),
      this.repository.count(where),
    ]);

    return { data, total };
  }

  async createBrand(data: {
    name: string;
    slug: string;
    description?: string | null;
    logo?: string | null;
    isActive?: boolean;
  }) {
    const existing = await this.repository.findBySlug(data.slug);
    if (existing) {
      throw new Error("Slug thương hiệu đã tồn tại.");
    }

    return this.repository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo: data.logo,
      isActive: data.isActive,
    });
  }

  async updateBrand(id: string, data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    isActive: boolean;
  }>) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Không tìm thấy thương hiệu.");

    if (data.slug && data.slug !== current.slug) {
      const existing = await this.repository.findBySlug(data.slug);
      if (existing) throw new Error("Slug thương hiệu đã tồn tại.");
    }

    const updateData: Prisma.BrandUpdateInput = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo: data.logo,
      isActive: data.isActive,
    };

    return this.repository.update(id, updateData);
  }

  async getBrandById(id: string) {
    const brand = await this.repository.findById(id);
    if (!brand) throw new Error("Không tìm thấy thương hiệu.");
    return brand;
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.repository.findBySlug(slug);
    if (!brand) throw new Error("Không tìm thấy thương hiệu.");
    return brand;
  }

  async deactivateBrand(id: string) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Không tìm thấy thương hiệu.");

    return this.repository.update(id, { isActive: false });
  }

  async deleteBrand(id: string) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Không tìm thấy thương hiệu.");

    return this.repository.delete(id);
  }
}

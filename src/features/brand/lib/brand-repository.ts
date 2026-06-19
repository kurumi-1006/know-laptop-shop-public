import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export class BrandRepository {
  async findMany(params: {
    where: Prisma.BrandWhereInput;
    skip: number;
    take: number;
  }) {
    return prisma.brand.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { id: "asc" },
    });
  }

  async count(where: Prisma.BrandWhereInput) {
    return prisma.brand.count({ where });
  }

  async findById(id: string) {
    return prisma.brand.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return prisma.brand.findUnique({
      where: { slug },
    });
  }

  async create(data: Prisma.BrandCreateInput) {
    return prisma.brand.create({ data });
  }

  async update(id: string, data: Prisma.BrandUpdateInput) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.brand.delete({
      where: { id },
    });
  }
}

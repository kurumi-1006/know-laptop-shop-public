import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export class CategoryRepository {
  async findMany(params: {
    where: Prisma.CategoryWhereInput;
    skip: number;
    take: number;
  }) {
    return prisma.category.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { id: "asc" },
    });
  }

  async count(where: Prisma.CategoryWhereInput) {
    return prisma.category.count({ where });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  }

  async findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: true },
    });
  }

  async create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async findPopularCategories(limit: number) {
    const categories = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      image: string | null;
      description: string | null;
      isActive: boolean;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
      soldCount: number;
    }>>`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.image, 
        c.description, 
        c."isActive", 
        c."parentId", 
        c."createdAt", 
        c."updatedAt",
        COALESCE(SUM(od.quantity), 0)::int as "soldCount"
      FROM category c
      LEFT JOIN product p ON p."categoryId" = c.id AND p."isDeleted" = false
      LEFT JOIN order_detail od ON od."productId" = p.id
      LEFT JOIN orders o ON od."orderId" = o.id AND o.status != 'cancelled'
      WHERE c."isActive" = true
      GROUP BY c.id, c.name, c.slug, c.image, c.description, c."isActive", c."parentId", c."createdAt", c."updatedAt"
      ORDER BY "soldCount" DESC, (SELECT COUNT(*)::int FROM product p2 WHERE p2."categoryId" = c.id AND p2."isDeleted" = false) DESC, c.name ASC
      LIMIT ${limit};
    `;
    return categories;
  }
}


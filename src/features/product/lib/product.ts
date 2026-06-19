import prisma, { type PrismaTx } from '@/lib/prisma';
import { ProductStatus } from '@/app/generated/prisma/client';
import { serializeDecimal } from '@/lib/utils';


export interface ProductFilters {
  search?: string;
  status?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  cpu?: string;
  ram?: string;
  storage?: string;
  display?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  status?: ProductStatus;
  categoryId: string;
  brandId: string;
}

export interface CreateProductWithDetailsInput extends CreateProductInput {
  specs?: Array<{ name: string; groupName?: string; value: string }>;
  images?: Array<{
    imageUrl: string;
    isPrimary?: boolean;
    displayOrder?: number;
  }>;
}

export interface UpdateProductInput {
  name: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  status?: ProductStatus;
  categoryId: string;
  brandId: string;
  specs?: Array<{ name: string; groupName?: string; value: string }>;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  brand: { name: string };
  category: { name: string };
  images: Array<{ imageUrl: string }>;
}





export class ProductRepository {
  static async findMany(filters: ProductFilters, pagination: PaginationParams, tx: PrismaTx = prisma) {
    const where = this.buildWhereClause(filters);
    const { page, pageSize, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    return tx.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
        feedbacks: {
          where: { isVisible: true },
          select: { rating: true },
        },
        productCoupons: {
          include: {
            coupon: { select: { code: true, name: true } }
          }
        }
      },
    });
  }

  static async count(filters: ProductFilters, tx: PrismaTx = prisma) {
    const where = this.buildWhereClause(filters);
    return tx.product.count({ where });
  }

  static async getStats() {
    const [total, active, inactive, draft, lowStock] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { isDeleted: false, status: "active" } }),
      prisma.product.count({ where: { isDeleted: false, status: "inactive" } }),
      prisma.product.count({ where: { isDeleted: false, status: "draft" } }),
      prisma.product.count({ where: { isDeleted: false, status: "active", stock: { lt: 5 } } }),
    ]);

    return { total, active, inactive, draft, lowStock };
  }

  static async findById(id: string, tx: PrismaTx = prisma) {
    return tx.product.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { displayOrder: "asc" } },
        specs: { include: { attribute: true } },
        productCoupons: { include: { coupon: true } },
      },
    });
  }

  static async findBySlug(slug: string, tx: PrismaTx = prisma) {
    return tx.product.findFirst({
      where: { slug, isDeleted: false },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { displayOrder: "asc" } },
        specs: { include: { attribute: true } },
        productCoupons: { include: { coupon: true } },
      },
    });
  }

  static async findPublicById(id: string, tx: PrismaTx = prisma) {
    return tx.product.findFirst({
      where: { id, isDeleted: false, status: ProductStatus.active },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { displayOrder: "asc" } },
        specs: { include: { attribute: true } },
        productCoupons: {
          where: {
            coupon: {
              isActive: true,
              isDeleted: false,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
          include: { coupon: true },
        },
      },
    });
  }

  static async findPublicBySlug(slug: string, tx: PrismaTx = prisma) {
    return tx.product.findFirst({
      where: { slug, isDeleted: false, status: ProductStatus.active },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { displayOrder: "asc" } },
        specs: { include: { attribute: true } },
        productCoupons: {
          where: {
            coupon: {
              isActive: true,
              isDeleted: false,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
          include: { coupon: true },
        },
      },
    });
  }

  static async create(data: CreateProductInput, tx: PrismaTx = prisma) {
    return tx.product.create({
      data,
    });
  }

  static async createWithDetails(data: CreateProductWithDetailsInput) {
    const { specs = [], images = [], ...productData } = data;

    const productId = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: productData });

      for (const spec of specs) {
        if (!spec.value?.trim()) continue;

        let attribute = await tx.specAttribute.findFirst({
          where: {
            name: spec.name,
            groupName: spec.groupName ?? "General",
          },
        });

        attribute ??= await tx.specAttribute.create({
          data: {
            name: spec.name,
            groupName: spec.groupName ?? "General",
          },
        });

        await tx.productSpec.create({
          data: {
            productId: product.id,
            attributeId: attribute.id,
            value: spec.value,
          },
        });
      }

      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            productId: product.id,
            imageUrl: image.imageUrl,
            isPrimary: image.isPrimary ?? index === 0,
            displayOrder: image.displayOrder ?? index,
          })),
        });
      }

      return product.id;
    });

    return prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { displayOrder: "asc" } },
        specs: { include: { attribute: true } },
        productCoupons: { include: { coupon: true } },
      },
    });
  }

  static async update(id: string, data: UpdateProductInput, tx: PrismaTx = prisma) {
    const { specs, ...productData } = data;


    return tx.$transaction(async (transactionClient: PrismaTx) => {
      const product = await transactionClient.product.update({
        where: { id },
        data: productData,
      });

      if (specs && Array.isArray(specs)) {

        await transactionClient.productSpec.deleteMany({
          where: { productId: id },
        });


        for (const spec of specs) {
          if (spec.value && spec.value.trim() !== "") {
            let attribute = await transactionClient.specAttribute.findFirst({
              where: { name: spec.name },
            });

            if (!attribute) {
              attribute = await transactionClient.specAttribute.create({
                data: {
                  name: spec.name,
                  groupName: spec.groupName ?? "General",
                },
              });
            }

            await transactionClient.productSpec.create({
              data: {
                productId: id,
                attributeId: attribute.id,
                value: spec.value,
              },
            });
          }
        }
      }

      return product;
    });
  }

  static async softDelete(id: string, tx: PrismaTx = prisma) {
    return tx.product.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  static async getFeaturedProducts(limit: number, tx: PrismaTx = prisma) {
    return tx.product.findMany({
      where: { status: 'active', isDeleted: false },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        stock: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          where: { isPrimary: true },
          orderBy: { displayOrder: "asc" },
          take: 1,
          select: { imageUrl: true },
        },
      },
    });
  }

  static async findRelatedProducts(productId: string, categoryId: string, brandId: string, limit: number = 4, tx: PrismaTx = prisma) {
    return tx.product.findMany({
      where: {
        id: { not: productId },
        status: 'active',
        isDeleted: false,
        OR: [
          { categoryId },
          { brandId }
        ]
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        stock: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          where: { isPrimary: true },
          orderBy: { displayOrder: "asc" },
          take: 1,
          select: { imageUrl: true },
        },
      },
    });
  }

  static async findManyBrands(tx: PrismaTx = prisma) {
    return tx.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  static async findAllBrands(tx: PrismaTx = prisma) {
    return tx.brand.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async findBrandById(id: string, tx: PrismaTx = prisma) {
    return tx.brand.findUnique({ where: { id } });
  }

  static async createBrand(data: { name: string; slug: string; logo?: string | null; description?: string | null }, tx: PrismaTx = prisma) {
    return tx.brand.create({ data });
  }

  static async updateBrand(id: string, data: { name?: string; slug?: string; logo?: string | null; description?: string | null; isActive?: boolean }, tx: PrismaTx = prisma) {
    return tx.brand.update({ where: { id }, data });
  }

  static async deleteBrand(id: string, tx: PrismaTx = prisma) {
    return tx.brand.delete({ where: { id } });
  }

  static async findManyCategories(tx: PrismaTx = prisma) {
    return tx.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { parent: { select: { id: true, name: true } } },
    });
  }

  static async findAllCategories(tx: PrismaTx = prisma) {
    return tx.category.findMany({
      orderBy: { name: "asc" },
      include: { parent: { select: { id: true, name: true } } },
    });
  }

  static async findCategoryById(id: string, tx: PrismaTx = prisma) {
    return tx.category.findUnique({ where: { id }, include: { parent: { select: { id: true, name: true } } } });
  }

  static async createCategory(data: { name: string; slug: string; description?: string | null; parentId?: string | null }, tx: PrismaTx = prisma) {
    return tx.category.create({ data, include: { parent: { select: { id: true, name: true } } } });
  }

  static async updateCategory(id: string, data: { name?: string; slug?: string; description?: string | null; parentId?: string | null; isActive?: boolean }, tx: PrismaTx = prisma) {
    return tx.category.update({ where: { id }, data, include: { parent: { select: { id: true, name: true } } } });
  }

  static async deleteCategory(id: string, tx: PrismaTx = prisma) {
    return tx.category.update({ where: { id }, data: { isActive: false } });
  }

  private static buildWhereClause(filters: ProductFilters) {
    const { search, status, categoryId, brandId, minPrice, maxPrice, cpu, ram, storage, display } = filters;

    const andConditions: Record<string, unknown>[] = [
      { isDeleted: false }
    ];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { brand: { name: { contains: search, mode: "insensitive" as const } } },
          {
            specs: {
              some: {
                value: { contains: search, mode: "insensitive" as const }
              }
            }
          }
        ]
      });
    }

    if (status && status !== "all") {
      andConditions.push({ status: status as ProductStatus });
    }

    if (categoryId && categoryId !== "all") {
      andConditions.push({ categoryId });
    }

    if (brandId && brandId !== "all") {
      const brandIds = brandId.split(",");
      andConditions.push({ brandId: { in: brandIds } });
    }


    Object.keys(filters).forEach(key => {
      if (key.startsWith("spec_")) {
        const attributeName = key.replace("spec_", "");
        const value = filters[key];
        if (value) {
          const valuesList = (typeof value === "string" ? value.split(",") : [value]).map(v => String(v));
          andConditions.push({
            specs: {
              some: {
                attribute: { name: { equals: attributeName, mode: "insensitive" as const } },
                OR: valuesList.map(v => ({
                  value: { contains: v, mode: "insensitive" as const }
                }))
              }
            }
          });
        }
      }
    });

    if (minPrice !== undefined || maxPrice !== undefined) {
      andConditions.push({
        OR: [
          {
            salePrice: null,
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            }
          },
          {
            salePrice: {
              not: null,
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            }
          }
        ]
      });
    }

    if (cpu) {
      andConditions.push({
        specs: {
          some: {
            attribute: { name: { contains: "Processor", mode: "insensitive" as const } },
            value: { contains: cpu, mode: "insensitive" as const }
          }
        }
      });
    }

    if (ram) {
      andConditions.push({
        specs: {
          some: {
            attribute: { name: { contains: "Memory", mode: "insensitive" as const } },
            value: { contains: ram, mode: "insensitive" as const }
          }
        }
      });
    }

    if (storage) {
      andConditions.push({
        specs: {
          some: {
            attribute: { name: { contains: "Storage", mode: "insensitive" as const } },
            value: { contains: storage, mode: "insensitive" as const }
          }
        }
      });
    }

    if (display) {
      andConditions.push({
        specs: {
          some: {
            attribute: { name: { contains: "Display", mode: "insensitive" as const } },
            value: { contains: display, mode: "insensitive" as const }
          }
        }
      });
    }

    return {
      AND: andConditions
    };
  }
}




export class ProductFacade {
  static async getProductsList(filters: ProductFilters, pagination: PaginationParams) {
    const [data, total, stats] = await Promise.all([
      ProductRepository.findMany(filters, pagination),
      ProductRepository.count(filters),
      ProductRepository.getStats(),
    ]);
    return serializeDecimal({ data, total, stats });
  }

  static async getProductDetail(id: string) {
    return serializeDecimal(await ProductRepository.findById(id));
  }

  static async getProductDetailBySlug(slug: string) {
    return serializeDecimal(await ProductRepository.findBySlug(slug));
  }

  static async getPublicProductDetail(id: string) {
    return serializeDecimal(await ProductRepository.findPublicById(id));
  }

  static async getPublicProductDetailBySlug(slug: string) {
    return serializeDecimal(await ProductRepository.findPublicBySlug(slug));
  }

  static async createProduct(data: CreateProductInput) {
    return serializeDecimal(await ProductRepository.create(data));
  }

  static async createProductWithDetails(data: CreateProductWithDetailsInput) {
    return serializeDecimal(await ProductRepository.createWithDetails(data));
  }

  static async updateProduct(id: string, data: UpdateProductInput) {
    return serializeDecimal(await ProductRepository.update(id, data));
  }

  static async deleteProduct(id: string) {
    return serializeDecimal(await ProductRepository.softDelete(id));
  }

  static async getFeaturedProducts(limit: number): Promise<FeaturedProduct[]> {
    return serializeDecimal(await ProductRepository.getFeaturedProducts(limit)) as unknown as FeaturedProduct[];
  }

  static async getRelatedProducts(productId: string, categoryId: string, brandId: string, limit: number = 4): Promise<FeaturedProduct[]> {
    return serializeDecimal(await ProductRepository.findRelatedProducts(productId, categoryId, brandId, limit)) as unknown as FeaturedProduct[];
  }

  static async getBrands() {
    return ProductRepository.findManyBrands();
  }

  static async getAllBrands() {
    return ProductRepository.findAllBrands();
  }

  static async createBrand(data: { name: string; slug: string; logo?: string | null; description?: string | null }) {
    return ProductRepository.createBrand(data);
  }

  static async updateBrand(id: string, data: { name?: string; slug?: string; logo?: string | null; description?: string | null; isActive?: boolean }) {
    return ProductRepository.updateBrand(id, data);
  }

  static async deleteBrand(id: string) {
    return ProductRepository.deleteBrand(id);
  }

  static async getCategories() {
    return ProductRepository.findManyCategories();
  }

  static async getAllCategories() {
    return ProductRepository.findAllCategories();
  }

  static async createCategory(data: { name: string; slug: string; description?: string | null; parentId?: string | null }) {
    return ProductRepository.createCategory(data);
  }

  static async updateCategory(id: string, data: { name?: string; slug?: string; description?: string | null; parentId?: string | null; isActive?: boolean }) {
    return ProductRepository.updateCategory(id, data);
  }

  static async deleteCategory(id: string) {
    return ProductRepository.deleteCategory(id);
  }
}

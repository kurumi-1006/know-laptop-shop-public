import fs from "fs";
import path from "path";
import { CategoryRepository } from "./category-repository";
import type { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async getCategories(query: {
    search?: string;
    isActive?: boolean;
    parentId?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.CategoryWhereInput = {
      ...(query.search && {
        name: { contains: query.search, mode: "insensitive" },
      }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [data, total] = await Promise.all([
      this.repository.findMany({ where, skip, take: query.pageSize }),
      this.repository.count(where),
    ]);

    return { data, total };
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    parentId?: string | null;
    isActive?: boolean;
  }) {
    const existing = await this.repository.findBySlug(data.slug);
    if (existing) {
      throw new Error("Slug danh mục đã tồn tại.");
    }

    if (data.parentId) {
      const parent = await this.repository.findById(data.parentId);
      if (!parent) {
        throw new Error("Danh mục cha không tồn tại.");
      }
    }

    return this.repository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      isActive: data.isActive,
      ...(data.parentId && {
        parent: { connect: { id: data.parentId } },
      }),
    });
  }

  async updateCategory(id: string, data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parentId: string | null;
    isActive: boolean;
  }>) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Không tìm thấy danh mục.");

    if (data.slug && data.slug !== current.slug) {
      const existing = await this.repository.findBySlug(data.slug);
      if (existing) throw new Error("Slug danh mục đã tồn tại.");
    }

    const updateData: Prisma.CategoryUpdateInput = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      isActive: data.isActive,
    };

    if (data.parentId !== undefined) {
      if (data.parentId === id) throw new Error("Danh mục cha không thể là chính nó.");
      if (data.parentId === null) {
        updateData.parent = { disconnect: true };
      } else {
        updateData.parent = { connect: { id: data.parentId } };
      }
    }

    return this.repository.update(id, updateData);
  }

  async getCategoryById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) throw new Error("Không tìm thấy danh mục.");
    return category;
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.repository.findBySlug(slug);
    if (!category) throw new Error("Không tìm thấy danh mục.");
    return category;
  }

  async deactivateCategory(id: string) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Không tìm thấy danh mục.");

    return this.repository.update(id, { isActive: false });
  }

  async getPopularCategories(limit: number) {
    return this.repository.findPopularCategories(limit);
  }

  async getCategoryConfig(slug: string) {
    let category = null;
    try {
      category = await this.getCategoryBySlug(slug);
    } catch {
      category = {
        id: "temp-id-" + slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        slug: slug,
        description: "",
        image: null,
        isActive: true,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    let configData: any = {};
    try {
      const configPath = path.join(process.cwd(), "src/features/category/config/plp-config.json");
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        configData = JSON.parse(fileContent);
      }
    } catch (err) {
      console.error("Failed to read plp-config.json:", err);
    }

    const categoryConfig = configData[slug] || configData["default"] || {
      sections: [
        { type: "banner", enabled: true, sortOrder: 1 },
        { type: "featured_brands", enabled: true, sortOrder: 2 },
        { type: "trending_filters", enabled: true, sortOrder: 3 },
        { type: "product_listing", enabled: true, sortOrder: 4 }
      ],
      banners: [],
      trendingFilters: []
    };

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image
      },
      sections: categoryConfig.sections,
      banners: categoryConfig.banners,
      trendingFilters: categoryConfig.trendingFilters
    };
  }

  async getCategoryConfigAndFilters(slug: string) {
    const categoryConfig = await this.getCategoryConfig(slug);


    let categoryId = categoryConfig.category.id;


    const products = await prisma.product.findMany({
      where: {
        categoryId: categoryId.startsWith("temp-id-") ? undefined : categoryId,
        status: "active",
        isDeleted: false,
      },
      select: {
        price: true,
        salePrice: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        specs: {
          include: {
            attribute: {
              select: {
                name: true,
                groupName: true,
                unit: true,
              },
            },
          },
        },
      },
    });


    const brandMap = new Map<string, { id: string; name: string; slug: string; logo: string | null }>();
    products.forEach((p) => {
      if (p.brand && !brandMap.has(p.brand.id)) {
        brandMap.set(p.brand.id, p.brand);
      }
    });
    const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));


    let minPrice = Infinity;
    let maxPrice = -Infinity;
    products.forEach((p) => {
      const price = Number(p.salePrice ?? p.price);
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    });
    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === -Infinity) maxPrice = 100000000;


    const specMap = new Map<
      string,
      { name: string; groupName: string | null; unit: string | null; values: Set<string> }
    >();

    const simplifySpecValue = (attrName: string, rawValue: string): string => {
      const name = attrName.toLowerCase();
      const val = rawValue.trim();

      if (name.includes("memory") || name.includes("ram")) {
        const match = val.match(/\b(\d+)\s*(GB|Gb|Unified)\b/i);
        if (match) return `${match[1]} GB`;
      }

      if (name.includes("storage") || name.includes("ổ cứng")) {
        const match = val.match(/\b(\d+)\s*(GB|TB)\b/i);
        if (match) return `${match[1]} ${match[2].toUpperCase()}`;
      }

      if (name.includes("processor") || name.includes("cpu") || name.includes("vi xử lý")) {

        if (/apple\s*m4\s*pro/i.test(val)) return "Apple M4 Pro";
        if (/apple\s*m4/i.test(val)) return "Apple M4";
        if (/apple\s*m3/i.test(val)) return "Apple M3";
        if (/apple\s*m2/i.test(val)) return "Apple M2";
        if (/apple\s*m1/i.test(val)) return "Apple M1";
        if (/apple/i.test(val)) return "Apple M-Series";


        if (/ultra\s*9/i.test(val)) return "Intel Core Ultra 9";
        if (/ultra\s*7/i.test(val)) return "Intel Core Ultra 7";
        if (/ultra\s*5/i.test(val)) return "Intel Core Ultra 5";
        if (/ultra\s*3/i.test(val)) return "Intel Core Ultra 3";


        if (/core\s*i9/i.test(val)) return "Intel Core i9";
        if (/core\s*i7/i.test(val)) return "Intel Core i7";
        if (/core\s*i5/i.test(val)) return "Intel Core i5";
        if (/core\s*i3/i.test(val)) return "Intel Core i3";


        if (/core\s*9/i.test(val)) return "Intel Core 9";
        if (/core\s*7/i.test(val)) return "Intel Core 7";
        if (/core\s*5/i.test(val)) return "Intel Core 5";
        if (/core\s*3/i.test(val)) return "Intel Core 3";


        if (/ryzen\s*9/i.test(val)) return "AMD Ryzen 9";
        if (/ryzen\s*7/i.test(val)) return "AMD Ryzen 7";
        if (/ryzen\s*5/i.test(val)) return "AMD Ryzen 5";
        if (/ryzen\s*3/i.test(val)) return "AMD Ryzen 3";
      }

      if (name.includes("display") || name.includes("màn hình")) {
        const isOled = /oled/i.test(val);
        const isIps = /ips/i.test(val);
        const isRetina = /retina/i.test(val);
        const sizeMatch = val.match(/\b(\d+(\.\d+)?)"?\b/);
        const sizeStr = sizeMatch ? `${sizeMatch[1]} inch` : "";
        if (isOled) return sizeStr ? `${sizeStr} OLED` : "Màn hình OLED";
        if (isRetina) return sizeStr ? `${sizeStr} Retina` : "Màn hình Retina";
        if (isIps) return sizeStr ? `${sizeStr} IPS` : "Màn hình IPS";
        if (sizeStr) return sizeStr;
      }

      if (name.includes("gpu") || name.includes("đồ họa") || name.includes("graphics")) {
        if (/rtx\s*20/i.test(val)) return "NVIDIA GeForce RTX 20 Series";
        if (/rtx\s*30/i.test(val)) return "NVIDIA GeForce RTX 30 Series";
        if (/rtx\s*40/i.test(val)) return "NVIDIA GeForce RTX 40 Series";
        if (/rtx\s*a1000/i.test(val)) return "NVIDIA RTX A1000";
        if (/iris\s*xe/i.test(val)) return "Intel Iris Xe Graphics";
        if (/arc/i.test(val)) return "Intel Arc Graphics";
        if (/intel/i.test(val)) return "Intel Graphics";
        if (/radeon/i.test(val)) return "AMD Radeon Graphics";
        if (/apple|m1|m2|m3|m4/i.test(val)) return "Apple GPU";
      }

      if (name.includes("os") || name.includes("hệ điều hành")) {
        if (/window/i.test(val)) return "Windows";
        if (/mac|os x|macos/i.test(val)) return "macOS";
        if (/linux|ubuntu/i.test(val)) return "Linux";
      }

      if (name.includes("battery") || name.includes("pin")) {
        if (val === "1") return "4-Cell";
        const cellMatch = val.match(/(\d+)\s*cell/i);
        if (cellMatch) return `${cellMatch[1]}-Cell`;
        const whMatch = val.match(/(\d+)\s*wh/i);
        if (whMatch) return `${whMatch[1]} Wh`;
        return `${val}-Cell`;
      }

      if (name.includes("weight") || name.includes("trọng lượng") || name.includes("cân nặng")) {
        const floatMatch = val.match(/(\d+(\.\d+)?)/);
        if (floatMatch) {
          const weightNum = parseFloat(floatMatch[1]);
          if (weightNum < 1.3) return "Dưới 1.3 kg";
          if (weightNum >= 1.3 && weightNum < 1.8) return "1.3 - 1.8 kg";
          if (weightNum >= 1.8 && weightNum < 2.3) return "1.8 - 2.3 kg";
          return "Trên 2.3 kg";
        }
      }

      if (name.includes("warranty") || name.includes("bảo hành")) {
        const digitMatch = val.match(/(\d+)/);
        if (digitMatch) {
          const count = parseInt(digitMatch[1]);
          if (/năm|nam|year/i.test(val)) return `${count} Năm`;
          if (count === 1) return "12 Tháng";
          return `${count} Tháng`;
        }
      }

      return val;
    };

    products.forEach((p) => {
      p.specs.forEach((s) => {
        const attrName = s.attribute.name;
        const attrGroup = s.attribute.groupName;
        const attrUnit = s.attribute.unit;
        const key = `${attrName}::${attrGroup || ""}`;

        if (!specMap.has(key)) {
          specMap.set(key, {
            name: attrName,
            groupName: attrGroup,
            unit: attrUnit,
            values: new Set<string>(),
          });
        }

        if (s.value && s.value.trim()) {
          const simplified = simplifySpecValue(attrName, s.value);
          specMap.get(key)!.values.add(simplified);
        }
      });
    });

    const specs = Array.from(specMap.values())
      .filter((spec) => {
        const nameLower = spec.name.toLowerCase();
        return (
          !nameLower.includes("os") &&
          !nameLower.includes("hệ điều hành") &&
          !nameLower.includes("weight") &&
          !nameLower.includes("trọng lượng") &&
          !nameLower.includes("cân nặng") &&
          !nameLower.includes("warranty") &&
          !nameLower.includes("bảo hành") &&
          !nameLower.includes("battery") &&
          !nameLower.includes("pin")
        );
      })
      .map((spec) => ({
        name: spec.name,
        groupName: spec.groupName,
        unit: spec.unit,
        values: Array.from(spec.values).sort((a, b) => {
          const parseSize = (val: string) => {
            const match = val.match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MB|Gb|Mb|Tb|Unified)$/i);
            if (match) {
              const num = parseFloat(match[1]);
              const unit = match[2].toUpperCase();
              if (unit === "TB") return num * 1024;
              if (unit === "MB") return num / 1024;
              return num;
            }
            return null;
          };

          const sizeA = parseSize(a);
          const sizeB = parseSize(b);

          if (sizeA !== null && sizeB !== null) {
            return sizeA - sizeB;
          }
          if (sizeA !== null) return -1;
          if (sizeB !== null) return 1;

          return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        }),
      }));

    return {
      category: categoryConfig.category,
      sections: categoryConfig.sections,
      banners: categoryConfig.banners,
      trendingFilters: categoryConfig.trendingFilters,
      filters: {
        brands,
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        specs,
      },
    };
  }
}


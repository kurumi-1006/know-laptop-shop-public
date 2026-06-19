import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrandService } from "./brand-service";
import { BrandRepository } from "./brand-repository";

vi.mock("./brand-repository", () => {
  return {
    BrandRepository: class BrandRepositoryMock {
      findMany = vi.fn();
      count = vi.fn();
      findBySlug = vi.fn();
      create = vi.fn();
      findById = vi.fn();
      update = vi.fn();
      delete = vi.fn();
    },
  };
});

describe("BrandService", () => {
  let repository: any;
  let service: BrandService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new BrandRepository();
    service = new BrandService(repository);
  });

  describe("getBrands", () => {
    it("should successfully retrieve brands list with pagination calculation", async () => {
      repository.findMany.mockResolvedValue([{ id: "1", name: "Apple", slug: "apple" }]);
      repository.count.mockResolvedValue(1);

      const result = await service.getBrands({ page: 2, pageSize: 5, search: "App", isActive: true });

      expect(repository.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: "App", mode: "insensitive" },
          isActive: true,
        },
        skip: 5,
        take: 5,
      });
      expect(result).toEqual({
        data: [{ id: "1", name: "Apple", slug: "apple" }],
        total: 1,
      });
    });
  });

  describe("createBrand", () => {
    it("should fail to create brand if slug is already taken", async () => {
      repository.findBySlug.mockResolvedValue({ id: "1", name: "Apple", slug: "apple" });

      await expect(
        service.createBrand({ name: "Apple New", slug: "apple" })
      ).rejects.toThrow("Slug thương hiệu đã tồn tại.");
    });

    it("should successfully create brand if slug is available", async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: "2", name: "Asus", slug: "asus" });

      const result = await service.createBrand({ name: "Asus", slug: "asus" });

      expect(repository.create).toHaveBeenCalledWith({
        name: "Asus",
        slug: "asus",
        description: undefined,
        logo: undefined,
        isActive: undefined,
      });
      expect(result).toEqual({ id: "2", name: "Asus", slug: "asus" });
    });
  });

  describe("updateBrand", () => {
    it("should fail to update brand if brand does not exist", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateBrand("invalid-id", { name: "New Name" })
      ).rejects.toThrow("Không tìm thấy thương hiệu.");
    });

    it("should fail to update brand if new slug is already taken by another brand", async () => {
      repository.findById.mockResolvedValue({ id: "1", name: "Apple", slug: "apple" });
      repository.findBySlug.mockResolvedValue({ id: "2", name: "Asus", slug: "asus" });

      await expect(
        service.updateBrand("1", { slug: "asus" })
      ).rejects.toThrow("Slug thương hiệu đã tồn tại.");
    });

    it("should successfully update brand if inputs are valid", async () => {
      repository.findById.mockResolvedValue({ id: "1", name: "Apple", slug: "apple" });
      repository.update.mockResolvedValue({ id: "1", name: "Apple Pro", slug: "apple-pro" });

      const result = await service.updateBrand("1", { name: "Apple Pro", slug: "apple-pro" });

      expect(repository.update).toHaveBeenCalledWith("1", {
        name: "Apple Pro",
        slug: "apple-pro",
        description: undefined,
        logo: undefined,
        isActive: undefined,
      });
      expect(result).toEqual({ id: "1", name: "Apple Pro", slug: "apple-pro" });
    });
  });
});

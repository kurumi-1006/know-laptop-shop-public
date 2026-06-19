import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryService } from "./category-service";
import { CategoryRepository } from "./category-repository";

vi.mock("./category-repository", () => {
  return {
    CategoryRepository: class CategoryRepositoryMock {
      findMany = vi.fn();
      count = vi.fn();
      findBySlug = vi.fn();
      findById = vi.fn();
      create = vi.fn();
      update = vi.fn();
      findPopularCategories = vi.fn();
    },
  };
});


vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => "{}"),
  },
}));

describe("CategoryService", () => {
  let repository: any;
  let service: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CategoryRepository();
    service = new CategoryService(repository);
  });

  describe("getCategories", () => {
    it("should successfully retrieve categories with search query filtering", async () => {
      repository.findMany.mockResolvedValue([{ id: "cat-1", name: "Gaming Laptops", slug: "gaming-laptops" }]);
      repository.count.mockResolvedValue(1);

      const result = await service.getCategories({
        search: "gaming",
        page: 1,
        pageSize: 10,
      });

      expect(repository.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: "gaming", mode: "insensitive" },
        },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: [{ id: "cat-1", name: "Gaming Laptops", slug: "gaming-laptops" }],
        total: 1,
      });
    });
  });

  describe("createCategory", () => {
    it("should fail to create category with duplicate slug", async () => {
      repository.findBySlug.mockResolvedValue({ id: "cat-1", name: "Gaming Laptops", slug: "gaming" });

      await expect(
        service.createCategory({ name: "Gaming", slug: "gaming" })
      ).rejects.toThrow("Slug danh mục đã tồn tại.");
    });

    it("should successfully create category if parentId is valid", async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findById.mockResolvedValue({ id: "cat-parent", name: "Laptops", slug: "laptops" });
      repository.create.mockResolvedValue({ id: "cat-child", name: "Gaming", slug: "gaming" });

      const result = await service.createCategory({
        name: "Gaming",
        slug: "gaming",
        parentId: "cat-parent",
      });

      expect(repository.findById).toHaveBeenCalledWith("cat-parent");
      expect(repository.create).toHaveBeenCalledWith({
        name: "Gaming",
        slug: "gaming",
        description: undefined,
        image: undefined,
        isActive: undefined,
        parent: { connect: { id: "cat-parent" } },
      });
      expect(result).toEqual({ id: "cat-child", name: "Gaming", slug: "gaming" });
    });
  });

  describe("deactivateCategory", () => {
    it("should fail if category does not exist", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deactivateCategory("invalid-id")).rejects.toThrow(
        "Không tìm thấy danh mục."
      );
    });

    it("should successfully update isActive to false", async () => {
      repository.findById.mockResolvedValue({ id: "cat-1", name: "Gaming", slug: "gaming", isActive: true });
      repository.update.mockResolvedValue({ id: "cat-1", name: "Gaming", slug: "gaming", isActive: false });

      const result = await service.deactivateCategory("cat-1");

      expect(repository.update).toHaveBeenCalledWith("cat-1", { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });
});

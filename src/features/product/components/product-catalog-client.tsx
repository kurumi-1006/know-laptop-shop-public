"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shared/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { PAGE_SIZE_DEFAULT, PRICE_LOCALE } from "@/lib/constants";

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  brand: { name: string };
  category?: { name: string } | null;
  images: Array<{ imageUrl: string }>;
  feedbacks?: Array<{ rating: number }>;
}

interface ProductCatalogClientProps {
  products: Product[];
  brands: Brand[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export function ProductCatalogClient({
  products,
  brands,
  total,
  currentPage,
  pageSize = PAGE_SIZE_DEFAULT,
}: ProductCatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [minPriceInput, setMinPriceInput] = useState(searchParams.get("minPrice") ?? "0");
  const [maxPriceInput, setMaxPriceInput] = useState(searchParams.get("maxPrice") ?? "100000000");

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);


  useEffect(() => {
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);


  const updateFilters = (newFilters: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });


    if (!newFilters.hasOwnProperty("page")) {
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentUrlSearch = searchParams.get("search") ?? "";
      if (searchTerm !== currentUrlSearch) {
        updateFilters({ search: searchTerm });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const minVal = minPriceInput ? parseInt(minPriceInput) : 0;
      const maxVal = maxPriceInput ? parseInt(maxPriceInput) : 100000000;

      const currentMin = searchParams.get("minPrice") ?? "0";
      const currentMax = searchParams.get("maxPrice") ?? "100000000";

      if (minVal.toString() !== currentMin || maxVal.toString() !== currentMax) {
        updateFilters({
          minPrice: minVal > 0 ? minVal : null,
          maxPrice: maxVal < 100000000 ? maxVal : null,
        });
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [minPriceInput, maxPriceInput]);


  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "default") {
      updateFilters({ sort: null });
    } else {
      updateFilters({ sort: val });
    }
  };


  const handleBrandChange = (brandId: string) => {
    updateFilters({ brandId: brandId === "all" ? null : brandId });
  };


  const handleClearFilters = () => {
    setSearchTerm("");
    setMinPriceInput("0");
    setMaxPriceInput("100000000");
    router.push(pathname);
  };


  const totalPages = Math.ceil(total / pageSize);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateFilters({ page });
    }
  };

  const currentBrandId = searchParams.get("brandId") ?? "all";
  const currentSort = searchParams.get("sort") ?? "date-desc";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {           }
      <div className="border-b pb-5 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Danh mục Laptop
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tìm kiếm và bộ lọc giúp bạn chọn được chiếc laptop phù hợp nhất với nhu cầu của mình.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {                             }
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="sticky top-20 bg-card border rounded-xl p-5 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="size-4" />
                Bộ lọc tìm kiếm
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" />
                Xóa tất cả
              </Button>
            </div>

            {                  }
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Thương hiệu
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleBrandChange("all")}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    currentBrandId === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  Tất cả các hãng
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandChange(brand.id)}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      currentBrandId === brand.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {                        }
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Khoảng giá (VND)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Tối thiểu</span>
                  <Input
                    type="number"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="h-9 text-xs"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Tối đa</span>
                  <Input
                    type="number"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="h-9 text-xs"
                    min="0"
                  />
                </div>
              </div>

              {                            }
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinPriceInput("0");
                    setMaxPriceInput("15000000");
                  }}
                  className="text-[10px] h-7 px-1"
                >
                  Dưới 15 triệu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinPriceInput("15000000");
                    setMaxPriceInput("30000000");
                  }}
                  className="text-[10px] h-7 px-1"
                >
                  15 - 30 triệu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinPriceInput("30000000");
                    setMaxPriceInput("50000000");
                  }}
                  className="text-[10px] h-7 px-1"
                >
                  30 - 50 triệu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinPriceInput("50000000");
                    setMaxPriceInput("100000000");
                  }}
                  className="text-[10px] h-7 px-1"
                >
                  Trên 50 triệu
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {                  }
        <div className="flex-1 space-y-6">
          {                  }
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card border rounded-xl p-4 shadow-xs">
            {                  }
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full bg-background"
              />
            </div>

            {                                 }
            <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden h-10 gap-1.5"
              >
                <Filter className="size-4" />
                Lọc & Tìm kiếm
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Sắp xếp:
                </span>
                <select
                  value={currentSort}
                  onChange={handleSortChange}
                  className="h-10 text-sm border rounded-lg bg-background px-3 py-1.5 cursor-pointer text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="date-desc">Mới nhất</option>
                  <option value="date-asc">Cũ nhất</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name-asc">Tên: A đến Z</option>
                  <option value="name-desc">Tên: Z đến A</option>
                </select>
              </div>
            </div>
          </div>

          {                         }
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetContent side="right" className="flex flex-col p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  Bộ lọc tìm kiếm
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {           }
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Thương hiệu
                  </label>
                  <select
                    value={currentBrandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full h-10 text-sm border rounded-lg bg-background px-3"
                  >
                    <option value="all">Tất cả các hãng</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {           }
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Khoảng giá (VND)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t px-4 py-3">
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Xóa bộ lọc
                </Button>
                <Button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full"
                >
                  Áp dụng
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {                   }
          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (

            <div className="flex flex-col items-center justify-center border border-dashed rounded-2xl p-16 text-center bg-card">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <Search className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Chúng tôi không tìm thấy kết quả nào khớp với tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc từ khóa.
              </p>
              <Button onClick={handleClearFilters} className="mt-6">
                Đặt lại bộ lọc
              </Button>
            </div>
          )}

          {                }
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-6 border-t">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="size-9"
              >
                <ChevronLeft className="size-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {

                if (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      className="size-9 text-xs"
                    >
                      {page}
                    </Button>
                  );
                } else if (
                  page === 2 ||
                  page === totalPages - 1
                ) {
                  return (
                    <span key={page} className="text-muted-foreground text-xs px-1 select-none">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="size-9"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

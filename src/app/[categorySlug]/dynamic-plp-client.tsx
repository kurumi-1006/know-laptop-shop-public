"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/features/product/hooks/use-products";
import { useCategories } from "@/features/category/hooks/use-categories";
import { ProductCard } from "@/components/shared/product-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Laptop,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Palette,
  ChevronDown,
  ChevronUp,
  Cpu,
  Tv,
  HardDrive,
  Layers,
  Heart,
  Undo2
} from "lucide-react";
import { PRICE_LOCALE } from "@/lib/constants";


const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case "gaming":
      return <Gamepad2 className="size-6 text-primary" />;
    case "business":
      return <Briefcase className="size-6 text-primary" />;
    case "student":
      return <GraduationCap className="size-6 text-primary" />;
    case "creator":
      return <Palette className="size-6 text-primary" />;
    default:
      return <Laptop className="size-6 text-primary" />;
  }
};

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface SpecFilterOption {
  name: string;
  groupName: string | null;
  unit: string | null;
  values: string[];
}

interface PLPConfig {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
  };
  sections: Array<{ type: string; enabled: boolean; sortOrder: number }>;
  banners: Array<{ imageUrl: string; title?: string; subtitle?: string; linkUrl?: string }>;
  trendingFilters: Array<{ label: string; queryParams: string }>;
  filters: {
    brands: Brand[];
    priceRange: { min: number; max: number };
    specs: SpecFilterOption[];
  };
}

interface DynamicPLPClientProps {
  categorySlug: string;
  initialConfig: PLPConfig;
  initialSearchParams: Record<string, string | string[] | undefined>;
}

export default function DynamicPLPClient({
  categorySlug,
  initialConfig,
}: DynamicPLPClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  const currentBrands = searchParams.get("brand") ? searchParams.get("brand")!.split(",") : [];
  const currentSearch = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentSort = searchParams.get("sortBy") || "createdAt";
  const currentOrder = searchParams.get("sortOrder") || "desc";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const priceMinLimit = 0;
  const priceMaxLimit = 100000000;


  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice || String(priceMinLimit));
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice || String(priceMaxLimit));
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    category: true,
    brand: true,
    price: true,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);


  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (!currentSearch.trim()) return;

    const controller = new AbortController();
    void fetch("/api/tracking/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: currentSearch }),
      signal: controller.signal,
    }).catch(() => {

    });

    return () => controller.abort();
  }, [currentSearch]);


  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      updateFilters({ search: debouncedSearch || null });
    }

  }, [debouncedSearch]);


  useEffect(() => {
    setMinPriceInput(currentMinPrice || String(priceMinLimit));
    setMaxPriceInput(currentMaxPrice || String(priceMaxLimit));
  }, [currentMinPrice, currentMaxPrice, priceMinLimit, priceMaxLimit]);


  useEffect(() => {
    if (initialConfig.banners && initialConfig.banners.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % initialConfig.banners.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [initialConfig.banners]);


  const getActiveSpecFilters = () => {
    const specs: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("spec_")) {
        specs[key] = value;
      }
    });
    return specs;
  };

  const activeSpecs = getActiveSpecFilters();


  const { data: productsResult, isLoading } = useProducts({
    category: categorySlug === "all" ? undefined : categorySlug,
    brand: currentBrands.length > 0 ? currentBrands.join(",") : undefined,
    search: currentSearch || undefined,
    page: currentPage,
    pageSize: 12,
    sortBy: currentSort,
    sortOrder: currentOrder,
    minPrice: currentMinPrice ? parseFloat(currentMinPrice) : undefined,
    maxPrice: currentMaxPrice ? parseFloat(currentMaxPrice) : undefined,
    ...activeSpecs,
  });


  const { data: categories } = useCategories({ isActive: true });

  const hasActiveFilters =
    currentBrands.length > 0 ||
    currentSearch !== "" ||
    currentMinPrice !== "" ||
    currentMaxPrice !== "" ||
    Object.keys(activeSpecs).length > 0;

  const totalProducts = productsResult?.total || 0;
  const totalPages = Math.ceil(totalProducts / 12);
  const products = productsResult?.data || [];


  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    if (!updates.page) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleBrandFilter = (brandSlug: string) => {
    let nextBrands = [...currentBrands];
    if (nextBrands.includes(brandSlug)) {
      nextBrands = nextBrands.filter((b) => b !== brandSlug);
    } else {
      nextBrands.push(brandSlug);
    }
    updateFilters({ brand: nextBrands.length > 0 ? nextBrands.join(",") : null });
  };

  const toggleSpecFilter = (specName: string, specValue: string) => {
    const paramKey = `spec_${specName}`;
    const currentValue = searchParams.get(paramKey);
    let nextValues: string[] = [];
    if (currentValue) {
      nextValues = currentValue.split(",");
    }

    if (nextValues.includes(specValue)) {
      nextValues = nextValues.filter((v) => v !== specValue);
    } else {
      nextValues.push(specValue);
    }

    updateFilters({
      [paramKey]: nextValues.length > 0 ? nextValues.join(",") : null,
    });
  };

  const applyPriceRange = () => {
    updateFilters({
      minPrice: minPriceInput || null,
      maxPrice: maxPriceInput || null,
    });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setMinPriceInput(String(priceMinLimit));
    setMaxPriceInput(String(priceMaxLimit));
    router.push(pathname);
  };

  const toggleFilterExpand = (key: string) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  const presetPriceRanges = [
    { label: "Dưới 15 triệu", min: "0", max: "15000000" },
    { label: "15 - 25 triệu", min: "15000000", max: "25000000" },
    { label: "25 - 40 triệu", min: "25000000", max: "40000000" },
    { label: "Trên 40 triệu", min: "40000000", max: "100000000" },
  ];


  const FilterSidebar = () => {
    if (!mounted) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }

    const roundToNearestCleanUnit = (val: number): number => {
      if (val < 10000000) {
        return Math.round(val / 100000) * 100000;
      } else if (val < 20000000) {
        return Math.round(val / 200000) * 200000;
      } else if (val < 30000000) {
        return Math.round(val / 500000) * 500000;
      } else {
        return Math.round(val / 1000000) * 1000000;
      }
    };

    return (
      <div className="space-y-6">
      {                     }
      {categories && categories.length > 0 && (
        <div className="border-b pb-4">
          <button
            className="flex items-center justify-between w-full font-bold text-sm text-foreground uppercase tracking-wide py-2"
            onClick={() => toggleFilterExpand("category")}
          >
            <span>Danh mục</span>
            {expandedFilters.category ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {expandedFilters.category && (
            <div className="mt-2 space-y-1">
              <button
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  categorySlug === "all"
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-muted hover:border-foreground/20 hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => router.push("/products")}
              >
                Tất cả sản phẩm
              </button>
              {categories.map((cat) => {
                const isActive = categorySlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      isActive
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-muted hover:border-foreground/20 hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => router.push(`/${cat.slug}`)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {                  }
      {initialConfig.filters.brands.length > 0 && (
        <div className="border-b pb-4">
          <button
            className="flex items-center justify-between w-full font-bold text-sm text-foreground uppercase tracking-wide py-2"
            onClick={() => toggleFilterExpand("brand")}
          >
            <span>Thương hiệu</span>
            {expandedFilters.brand ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {expandedFilters.brand && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {initialConfig.filters.brands.map((brand) => {
                const isActive = currentBrands.includes(brand.slug);
                return (
                  <button
                    key={brand.id}
                    className={`flex items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary text-primary shadow-xs"
                        : "border-muted hover:border-foreground/20 hover:bg-muted/10"
                    }`}
                    onClick={() => toggleBrandFilter(brand.slug)}
                  >
                    {brand.logo ? (
                      <div className="relative w-12 h-6 flex items-center justify-center grayscale hover:grayscale-0 transition-all">
                        <span className="text-center truncate">{brand.name}</span>
                      </div>
                    ) : (
                      <span>{brand.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {                        }
      <div className="border-b pb-4">
        <button
          className="flex items-center justify-between w-full font-bold text-sm text-foreground uppercase tracking-wide py-2"
          onClick={() => toggleFilterExpand("price")}
        >
          <span>Khoảng Giá</span>
          {expandedFilters.price ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expandedFilters.price && (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {presetPriceRanges.map((range) => {
                const isActive = currentMinPrice === range.min && currentMaxPrice === range.max;
                return (
                  <Button
                    key={range.label}
                    className={`h-9 text-[11px] font-medium rounded-lg ${
                      isActive
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    variant="ghost"
                    onClick={() => {
                      setMinPriceInput(range.min);
                      setMaxPriceInput(range.max);
                      updateFilters({ minPrice: range.min, maxPrice: range.max });
                    }}
                  >
                    {range.label}
                  </Button>
                );
              })}
            </div>

            {                  }
            <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
              <span>{Number(minPriceInput).toLocaleString("vi-VN")}đ</span>
              <span>{Number(maxPriceInput).toLocaleString("vi-VN")}đ</span>
            </div>

            {                             }
            <div className="relative w-full h-10 flex items-center">
              {                      }
              <div className="absolute w-full h-2 bg-muted rounded-full" />
              {                            }
              <div
                className="absolute h-2 bg-primary/80 rounded-full transition-[left,width] duration-75 ease-out"
                style={{
                  left: `${((Number(minPriceInput) - priceMinLimit) / Math.max(1, priceMaxLimit - priceMinLimit)) * 100}%`,
                  width: `${((Number(maxPriceInput) - Number(minPriceInput)) / Math.max(1, priceMaxLimit - priceMinLimit)) * 100}%`
                }}
              />
              {               }
              <input
                type="range"
                min={priceMinLimit}
                max={priceMaxLimit}
                step={500000}
                value={Number(minPriceInput)}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const val = Math.min(raw, Number(maxPriceInput) - 500000);
                  setMinPriceInput(String(Math.max(priceMinLimit, val)));
                }}
                onPointerUp={() => {
                  const rounded = roundToNearestCleanUnit(Number(minPriceInput));
                  const val = Math.min(rounded, Number(maxPriceInput) - 500000);
                  setMinPriceInput(String(Math.max(priceMinLimit, val)));
                }}
                onTouchEnd={() => {
                  const rounded = roundToNearestCleanUnit(Number(minPriceInput));
                  const val = Math.min(rounded, Number(maxPriceInput) - 500000);
                  setMinPriceInput(String(Math.max(priceMinLimit, val)));
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-[3] cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
              />
              {               }
              <input
                type="range"
                min={priceMinLimit}
                max={priceMaxLimit}
                step={500000}
                value={Number(maxPriceInput)}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const val = Math.max(raw, Number(minPriceInput) + 500000);
                  setMaxPriceInput(String(Math.min(priceMaxLimit, val)));
                }}
                onPointerUp={() => {
                  const rounded = roundToNearestCleanUnit(Number(maxPriceInput));
                  const val = Math.max(rounded, Number(minPriceInput) + 500000);
                  setMaxPriceInput(String(Math.min(priceMaxLimit, val)));
                }}
                onTouchEnd={() => {
                  const rounded = roundToNearestCleanUnit(Number(maxPriceInput));
                  const val = Math.max(rounded, Number(minPriceInput) + 500000);
                  setMaxPriceInput(String(Math.min(priceMaxLimit, val)));
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-[4] cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
              />
            </div>

            {                                 }
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  className="h-8 rounded-lg text-xs pl-2 pr-6"
                  placeholder="Từ"
                  type="number"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">đ</span>
              </div>
              <span className="text-muted-foreground text-xs font-medium">→</span>
              <div className="relative flex-1">
                <Input
                  className="h-8 rounded-lg text-xs pl-2 pr-6"
                  placeholder="Đến"
                  type="number"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">đ</span>
              </div>
            </div>
            <Button className="w-full h-8 text-xs font-semibold rounded-lg" onClick={applyPriceRange}>
              Áp dụng
            </Button>
          </div>
        )}
      </div>

      {                           }
      {initialConfig.filters.specs.map((spec) => {
        const paramKey = `spec_${spec.name}`;
        const activeValues = searchParams.get(paramKey) ? searchParams.get(paramKey)!.split(",") : [];
        const isExpanded = expandedFilters[spec.name] ?? false;


        const getSpecLabel = (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName === "processor" || lowerName === "cpu") return "CPU";
          if (lowerName === "memory" || lowerName === "ram") return "RAM";
          if (lowerName === "storage" || lowerName === "ổ cứng") return "Ổ CỨNG";
          if (lowerName === "display" || lowerName === "màn hình") return "MÀN HÌNH";
          if (lowerName === "graphics" || lowerName === "gpu" || lowerName === "card màn hình" || lowerName === "vga" || lowerName.includes("card đồ họa")) return "CARD ĐỒ HỌA RỜI";
          return name.toUpperCase();
        };


        const getSpecIcon = (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName.includes("cpu") || lowerName.includes("processor")) return <Cpu className="size-3.5 text-primary" />;
          if (lowerName.includes("display") || lowerName.includes("màn hình")) return <Tv className="size-3.5 text-primary" />;
          if (lowerName.includes("storage") || lowerName.includes("ổ cứng")) return <HardDrive className="size-3.5 text-primary" />;
          if (lowerName.includes("graphics") || lowerName.includes("gpu") || lowerName.includes("card") || lowerName.includes("đồ họa") || lowerName.includes("vga")) return <Layers className="size-3.5 text-primary" />;
          return <Layers className="size-3.5 text-primary" />;
        };

        return (
          <div key={spec.name} className="border-b pb-4">
            <button
              className="flex items-center justify-between w-full font-bold text-sm text-foreground uppercase tracking-wide py-2"
              onClick={() => toggleFilterExpand(spec.name)}
            >
              <div className="flex items-center gap-1.5">
                {getSpecIcon(spec.name)}
                <span>{getSpecLabel(spec.name)}</span>
              </div>
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {spec.values.map((val) => {
                  const isChecked = activeValues.includes(val);
                  return (
                    <label
                      key={val}
                      className="flex items-center gap-2 py-1 cursor-pointer group text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        className="rounded size-4 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        onCheckedChange={() => toggleSpecFilter(spec.name, val)}
                      />
                      <span className="truncate">{val} {spec.unit}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
  };


  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case "banner":
        return null;

      case "featured_brands":
        return null;

      case "use_cases":

        const laptopUseCases = [
          { name: "Laptop Gaming", slug: "gaming", icon: <Gamepad2 className="size-8" />, desc: "Hiệu năng cực khủng chiến game đỉnh cao" },
          { name: "Mỏng Nhẹ AI / Ultrabook", slug: "ultrabook", icon: <Sparkles className="size-8" />, desc: "Thời thượng, siêu nhẹ và đa năng" },
          { name: "Doanh Nhân / Văn Phòng", slug: "business", icon: <Briefcase className="size-8" />, desc: "Bền bỉ, bảo mật tối cao và tin cậy" },
          { name: "Học Sinh - Sinh Viên", slug: "student", icon: <GraduationCap className="size-8" />, desc: "Thiết thực, tối ưu ngân sách tốt nhất" },
          { name: "Sáng Tạo Đồ Họa", slug: "creator", icon: <Palette className="size-8" />, desc: "Màn hình chuẩn màu, xử lý mượt mà" },
        ];
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Laptop className="size-5 text-primary" />
              <h3 className="font-extrabold text-base tracking-tight">Tìm Kiếm Theo Nhu Cầu</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {laptopUseCases.map((uc) => {
                const isSelected = categorySlug === uc.slug;
                return (
                  <Link href={`/${uc.slug}`} key={uc.slug} className="block">
                    <Card
                      className={`h-full group hover:shadow-md cursor-pointer transition-all duration-300 border ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "hover:border-primary/40 bg-card"
                      }`}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center justify-between h-full space-y-2">
                        <div
                          className={`p-3 rounded-2xl transition-all duration-300 ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-muted group-hover:bg-primary group-hover:text-white text-muted-foreground"
                          }`}
                        >
                          {uc.icon}
                        </div>
                        <h4 className="font-bold text-xs group-hover:text-primary transition-colors leading-tight">
                          {uc.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                          {uc.desc}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );

      case "trending_filters":
        if (!initialConfig.trendingFilters || initialConfig.trendingFilters.length === 0) return null;
        return (
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-4 text-primary" />
              Gợi ý lọc nhanh:
            </span>
            {initialConfig.trendingFilters.map((tf, index) => (
              <Link href={`${pathname}?${tf.queryParams}`} key={index}>
                <Badge className="bg-muted hover:bg-primary hover:text-white text-muted-foreground font-semibold px-2.5 py-1 transition-colors border border-muted-foreground/15 cursor-pointer">
                  {tf.label}
                </Badge>
              </Link>
            ))}
          </div>
        );

      case "product_listing":
        return (
          <div className="space-y-6">
            {                                  }
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div className="relative flex-1 max-w-md">
                <Input
                  className="pl-9 pr-8 rounded-xl h-10 border-muted-foreground/25"
                  placeholder="Tìm kiếm sản phẩm, cấu hình..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                {searchInput && (
                  <button
                    className="absolute right-3 top-3 hover:text-primary transition-colors"
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      updateFilters({ search: null });
                    }}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                {                          }
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="lg:hidden h-10" size="sm" variant="outline">
                      <SlidersHorizontal className="size-4 mr-2" />
                      Lọc Sản Phẩm
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto" side="left">
                    <SheetHeader className="mb-4 flex flex-row items-center justify-between border-b pb-2">
                      <SheetTitle className="text-base font-extrabold">Bộ lọc tìm kiếm</SheetTitle>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <X className="size-3" />
                          Xóa bộ lọc
                        </button>
                      )}
                    </SheetHeader>
                    {FilterSidebar()}
                  </SheetContent>
                </Sheet>

                {                 }
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-4 text-muted-foreground hidden sm:block" />
                  <Select
                    value={`${currentSort}-${currentOrder}`}
                    onValueChange={(val) => {
                      const [sortBy, sortOrder] = val.split("-");
                      updateFilters({ sortBy, sortOrder });
                    }}
                  >
                    <SelectTrigger className="w-[160px] h-10 rounded-xl text-xs font-semibold border-muted-foreground/25">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Mới nhất</SelectItem>
                      <SelectItem value="createdAt-asc">Cũ nhất</SelectItem>
                      <SelectItem value="price-asc">Giá: Thấp đến Cao</SelectItem>
                      <SelectItem value="price-desc">Giá: Cao đến Thấp</SelectItem>
                      <SelectItem value="name-asc">Tên: A đến Z</SelectItem>
                      <SelectItem value="name-desc">Tên: Z đến A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {                   }
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card className="overflow-hidden" key={i}>
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <CardHeader className="space-y-2 p-4">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 pt-0">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-2xl bg-muted/10 min-h-[400px]">
                <Laptop className="size-16 text-muted-foreground/45 mb-4" strokeWidth={1} />
                <h3 className="text-lg font-bold">Không có kết quả phù hợp</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2">
                  Hãy thử điều chỉnh bộ lọc, xóa bớt điều kiện hoặc nhập từ khóa tìm kiếm khác.
                </p>
                <Button className="mt-5 text-xs font-semibold rounded-xl" variant="outline" onClick={clearAllFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>

                {                }
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => updateFilters({ page: String(currentPage - 1) })}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <Button
                            className={`size-9 rounded-lg ${
                              currentPage === pageNum
                                ? "bg-primary hover:bg-primary/95 text-white"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                            key={pageNum}
                            size="icon"
                            variant="ghost"
                            onClick={() => updateFilters({ page: String(pageNum) })}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={currentPage >= totalPages}
                      onClick={() => updateFilters({ page: String(currentPage + 1) })}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };


  const sortedSections = [...initialConfig.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 w-full">
      {                         }
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {                             }
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 space-y-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-extrabold tracking-tight">
                Bộ lọc sản phẩm
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <X className="size-3" />
                  Xóa bộ lọc
                </button>
              )}
            </div>
            {FilterSidebar()}
          </div>
        </aside>

        {                                        }
        <div className="lg:col-span-3 space-y-8">
          {sortedSections.map((section) => (
            <div key={section.type}>{renderSection(section.type)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

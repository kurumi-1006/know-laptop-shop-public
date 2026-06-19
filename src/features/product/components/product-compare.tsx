"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SearchIcon,
  XIcon,
  CheckIcon,
  MinusIcon,
  Columns2Icon,
  ArrowLeftRightIcon,
  PlusIcon,
} from "lucide-react";
import { PRICE_LOCALE } from "@/lib/constants";
import { toast } from "sonner";
import Image from "next/image";

type CompareProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  brand: { name: string };
  category: { name: string };
  images: Array<{ imageUrl: string }>;
  specs: Array<{ value: string; attribute: { name: string; groupName: string | null; unit: string | null } }>;
};

type SearchResult = {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  brand: { name: string };
  images: Array<{ imageUrl: string }>;
};

export function ProductCompare() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || products.length >= 4) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ search: searchQuery.trim(), page: "1", pageSize: "5" });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults((data.data ?? []).filter(
          (r: SearchResult) => !products.some((p) => p.id === r.id)
        ));
      }
    } catch {
      toast.error("Không thể tìm kiếm sản phẩm.");
    } finally {
      setSearching(false);
    }
  }, [searchQuery, products]);

  const addProduct = useCallback(async (productId: number) => {
    if (products.length >= 4) {
      toast.error("Chỉ có thể so sánh tối đa 4 sản phẩm.");
      return;
    }
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      const product = data.data ?? data;
      if (product) {
        setProducts((prev) => [...prev, product]);
        setSearchResults((prev) => prev.filter((r) => r.id !== productId));
        setSearchQuery("");
      }
    } catch {
      toast.error("Không thể tải chi tiết sản phẩm.");
    } finally {
      setLoadingDetails(false);
    }
  }, [products]);

  const removeProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };


  const specGroups = new Map<string, Set<string>>();
  products.forEach((p) => {
    p.specs.forEach((s) => {
      const group = s.attribute.groupName ?? "Thông tin chung";
      if (!specGroups.has(group)) specGroups.set(group, new Set());
      specGroups.get(group)!.add(s.attribute.name);
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRightIcon className="size-6" />
          So sánh laptop
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chọn tối đa 4 laptop để so sánh thông số kỹ thuật chi tiết.
        </p>
      </div>

      {                }
      <div className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm laptop để so sánh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={products.length >= 4}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching || products.length >= 4}>
          {searching ? <Spinner className="mr-1" /> : <SearchIcon className="size-4 mr-1" />}
          Tìm
        </Button>
      </div>

      {                    }
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              className="flex items-center gap-3 p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
              onClick={() => addProduct(result.id)}
            >
              <div className="relative size-10 rounded bg-muted border overflow-hidden shrink-0">
                {result.images[0]?.imageUrl ? (
                  <Image
                    alt={result.name}
                    className="object-cover"
                    fill
                    sizes="40px"
                    src={result.images[0].imageUrl}
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-muted-foreground text-[8px]">
                    No img
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{result.name}</p>
                <p className="text-xs text-muted-foreground">{result.brand.name}</p>
              </div>
              <PlusIcon className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {loadingDetails && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Đang tải chi tiết sản phẩm...
        </div>
      )}

      {                      }
      {products.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="max-w-full">
              <div className="min-w-[600px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="sticky left-0 bg-muted/30 p-4 text-left font-semibold w-40">
                        Sản phẩm
                      </th>
                      {products.map((p) => (
                        <th key={p.id} className="p-4 text-center min-w-[200px]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative size-16 rounded-lg bg-muted border overflow-hidden">
                              {p.images[0]?.imageUrl ? (
                                <Image
                                  alt={p.name}
                                  className="object-cover"
                                  fill
                                  sizes="64px"
                                  src={p.images[0].imageUrl}
                                />
                              ) : (
                                <div className="size-full flex items-center justify-center text-muted-foreground text-[10px]">
                                  No img
                                </div>
                              )}
                            </div>
                            <p className="font-bold text-xs line-clamp-2">{p.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {p.brand.name}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => removeProduct(p.id)}
                            >
                              <XIcon className="size-3 mr-1" /> Gỡ
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {               }
                    <tr className="border-b">
                      <td className="sticky left-0 bg-background p-3 font-medium">Giá bán</td>
                      {products.map((p) => (
                        <td key={p.id} className="p-3 text-center">
                          {p.salePrice ? (
                            <div>
                              <span className="font-bold text-red-500">
                                {Number(p.salePrice).toLocaleString(PRICE_LOCALE)} VND
                              </span>
                              <br />
                              <span className="text-xs text-muted-foreground line-through">
                                {Number(p.price).toLocaleString(PRICE_LOCALE)} VND
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold">
                              {Number(p.price).toLocaleString(PRICE_LOCALE)} VND
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {               }
                    <tr className="border-b">
                      <td className="sticky left-0 bg-background p-3 font-medium">Tồn kho</td>
                      {products.map((p) => (
                        <td key={p.id} className="p-3 text-center">
                          <Badge variant={p.stock > 0 ? "outline" : "destructive"}>
                            {p.stock > 0 ? `${p.stock} máy` : "Hết hàng"}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {                  }
                    <tr className="border-b">
                      <td className="sticky left-0 bg-background p-3 font-medium">Danh mục</td>
                      {products.map((p) => (
                        <td key={p.id} className="p-3 text-center text-muted-foreground">
                          {p.category.name}
                        </td>
                      ))}
                    </tr>

                    {                 }
                    {Array.from(specGroups.entries()).map(([groupName, specNames]) => (
                      <React.Fragment key={groupName}>
                        <tr className="border-b bg-muted/20">
                          <td
                            colSpan={products.length + 1}
                            className="p-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            {groupName}
                          </td>
                        </tr>
                        {Array.from(specNames).map((specName) => (
                          <tr key={specName} className="border-b hover:bg-muted/30">
                            <td className="sticky left-0 bg-background p-3 text-xs text-muted-foreground">
                              {specName}
                            </td>
                            {products.map((p) => {
                              const spec = p.specs.find(
                                (s) => s.attribute.name === specName
                              );
                              return (
                                <td key={p.id} className="p-3 text-center text-sm">
                                  {spec ? (
                                    <span className="flex items-center justify-center gap-1">
                                      <CheckIcon className="size-3 text-green-500" />
                                      {spec.value}
                                      {spec.attribute.unit ? ` ${spec.attribute.unit}` : ""}
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-1 text-muted-foreground">
                                      <MinusIcon className="size-3" />—
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    {specGroups.size === 0 && (
                      <tr>
                        <td colSpan={products.length + 1} className="p-6 text-center text-muted-foreground">
                          Không có thông số kỹ thuật để so sánh.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-muted/10">
          <Columns2Icon className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg">Chưa có sản phẩm nào để so sánh</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md text-center">
            Tìm kiếm và chọn các laptop bạn muốn so sánh. Bạn có thể so sánh tối đa 4 sản phẩm cùng lúc.
          </p>
        </div>
      )}
    </div>
  );
}

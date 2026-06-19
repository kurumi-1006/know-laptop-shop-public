"use client";

import { Logo } from "@/components/shared/logo";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/features/auth/lib/auth-client";
import { MobileNav } from "@/features/marketing/components/mobile-nav";
import { DesktopNav } from "@/features/marketing/components/desktop-nav";
import { NavUser } from "@/features/shell/components/nav-user";
import { useScroll } from "@/hooks/use-scroll";
import { ROUTES, PRICE_LOCALE } from "@/lib/constants";
import { isStaff } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { HeartIcon, SearchIcon, ShoppingCartIcon } from "lucide-react";
import { useCart } from "@/features/cart/hooks/use-cart";
import { useWishlistIds } from "@/features/wishlist/hooks/use-wishlist";
import { usePopularCategories } from "@/features/category/hooks/use-categories";
import {
  LaptopIcon,
  TrendingUpIcon,
  X as XIcon,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


export function Header() {
  const scrolled = useScroll(8);
  const { data: session, isPending } = authClient.useSession();
  const { data: cartItems } = useCart({
    enabled: !!session && !isStaff(session.user.role),
  });
  const { data: wishlistIds } = useWishlistIds({
    enabled: !!session && !isStaff(session.user.role),
  });
  const { data: popularCategories } = usePopularCategories(3);
  const router = useRouter();


  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);


  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(query)}&pageSize=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setResults(data.data || []);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/products?search=${encodeURIComponent(suggestion)}`);
    setOpen(false);
  };

  const handleFilterClick = (url: string) => {
    router.push(url);
    setOpen(false);
  };

  const getSuggestions = (q: string) => {
    if (!q) return [];
    const lower = q.toLowerCase().trim();
    const suggestions: string[] = [];

    if (lower.includes("rtx")) {
      suggestions.push(`${q} 3050`, `${q} 3060`, `${q} 4050`, `${q} 4060`, `${q} 4070`);
    } else if (lower.includes("intel") || lower.includes("i5") || lower.includes("i7") || lower.includes("i9")) {
      suggestions.push("intel core i5", "intel core i7", "intel core i9");
    } else if (lower.includes("amd") || lower.includes("ryzen")) {
      suggestions.push("amd ryzen 5", "amd ryzen 7", "amd ryzen 9");
    } else if (lower.includes("laptop") || lower.includes("lap")) {
      suggestions.push(`${q} gaming`, `${q} văn phòng`, `${q} đồ họa`, `${q} mỏng nhẹ`);
    } else {
      suggestions.push(`${q} gaming`, `${q} giá rẻ`, `${q} chính hãng`);
    }

    return Array.from(new Set(suggestions)).slice(0, 5);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-transparent bg-background transition-all",
        scrolled &&
          "border-border/70 shadow-sm backdrop-blur-xl",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            aria-label="Trang chủ Know"
            className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={ROUTES.home}
          >
            <Logo className="size-9" />
            <span>
              <span className="block text-lg font-bold leading-none tracking-tight">
                Know
              </span>
              <span className="hidden text-[10px] leading-none text-muted-foreground sm:block">
                Cửa hàng Laptop
              </span>
            </span>
          </Link>
          <DesktopNav />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            aria-label="Tìm kiếm sản phẩm"
            size="icon"
            variant="ghost"
            onClick={() => setOpen(true)}
          >
            <SearchIcon />
          </Button>
          <ModeToggle />
          {isPending ? (
            <>
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="size-9 rounded-full" />
            </>
          ) : session ? (
            <NavUser user={session.user} />
          ) : (
            <Button asChild>
              <Link href={ROUTES.login}>Đăng nhập</Link>
            </Button>
          )}
          {!isStaff(session?.user.role) && (
            <>
              <Button
                aria-label="Yêu thích"
                asChild
                size="icon"
                variant="ghost"
                className="relative"
              >
                <Link href={ROUTES.wishlist}>
                  <HeartIcon />
                  {wishlistIds && wishlistIds.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm transition-transform scale-100 animate-in zoom-in duration-350">
                      {wishlistIds.length}
                    </span>
                  )}
                </Link>
              </Button>
              <Button aria-label="Giỏ hàng" asChild size="icon" variant="outline" className="relative">
                <Link href={ROUTES.cart}>
                  <ShoppingCartIcon />
                  {cartItems && cartItems.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm transition-transform scale-100">
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </Link>
              </Button>
            </>
          )}
        </div>
        <MobileNav
          isAuthenticated={Boolean(session)}
          userRole={session?.user.role}
        />
      </nav>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-2xl top-[20%] translate-y-0 animate-in fade-in zoom-in-95 duration-200" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Tìm kiếm sản phẩm</DialogTitle>
            <DialogDescription>Nhập từ khóa để tìm kiếm laptop</DialogDescription>
          </DialogHeader>
          <div className="w-full bg-background border border-border/50 shadow-2xl rounded-2xl overflow-hidden p-4 flex flex-col gap-4">

            {                            }
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="h-12 rounded-full border-2 border-[primary] bg-background pl-5 pr-[3px] flex items-center justify-between focus-within:ring-2 focus-within:ring-[primary]/20 transition-all">
                <input
                  type="text"
                  placeholder="Nhập tên laptop, CPU, RAM để tìm kiếm..."
                  className="flex-1 bg-transparent text-sm text-foreground outline-none py-2"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />

                <div className="flex items-center gap-2 flex-shrink-0">
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <XIcon className="size-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex size-10 items-center justify-center rounded-full bg-[primary] text-white hover:bg-[primary]/90 transition-all active:scale-95"
                  >
                    <SearchIcon className="size-5" />
                  </button>
                </div>
              </div>
            </form>

            {                   }
            <div className="no-scrollbar max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-3">
              {loading && (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  Đang tìm kiếm...
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy sản phẩm nào khớp với "{query}".
                </div>
              )}

              {                 }
              {!loading && query && (
                <div className="flex flex-col">
                  {getSuggestions(query).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      type="button"
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-foreground group"
                    >
                      <span className="font-medium">{suggestion}</span>
                      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {                          }
              {!loading && results.length > 0 && (
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 mt-4">
                    Sản phẩm đề xuất
                  </h3>
                  <div className="flex flex-col gap-2">
                    {results.map((product) => {
                      const finalPrice = product.salePrice ?? product.price;
                      const hasDiscount = !!product.salePrice;
                      const discountPercent = hasDiscount
                        ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                        : 0;

                      return (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border/50"
                        >
                          {product.images?.[0]?.imageUrl ? (
                            <div className="relative size-12 overflow-hidden rounded-lg border bg-muted flex-shrink-0">
                              <img
                                src={product.images[0].imageUrl}
                                alt={product.name}
                                className="object-cover size-full"
                              />
                            </div>
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted flex-shrink-0">
                              <LaptopIcon className="size-6 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-semibold text-sm text-foreground line-clamp-1">
                              {product.name}
                            </span>
                            <div className="flex flex-col mt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">
                                  {Number(finalPrice).toLocaleString(PRICE_LOCALE)}đ
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs font-bold text-red-500">
                                    -{discountPercent}%
                                  </span>
                                )}
                              </div>
                              {hasDiscount && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {Number(product.price).toLocaleString(PRICE_LOCALE)}đ
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {                                  }
              {!query && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      Danh mục phổ biến
                    </h3>
                    <div className="flex flex-col">
                      {popularCategories && popularCategories.length > 0 ? (
                        popularCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleFilterClick(`/products?category=${category.slug}`)}
                            type="button"
                            className="flex items-center w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-foreground"
                          >
                            <TrendingUpIcon className="mr-2 size-4 text-[primary]" />
                            <span>{category.name}</span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Đang tải danh mục...</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      Thương hiệu hàng đầu
                    </h3>
                    <div className="flex flex-col">
                      {["apple", "asus", "dell", "lenovo", "hp"].map((brand) => (
                        <button
                          key={brand}
                          onClick={() => handleFilterClick(`/products?brand=${brand}`)}
                          type="button"
                          className="flex items-center w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-foreground capitalize"
                        >
                          <LaptopIcon className="mr-2 size-4 text-muted-foreground" />
                          <span>{brand}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

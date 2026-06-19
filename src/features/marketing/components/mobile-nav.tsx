"use client";

import { useState } from "react";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isStaff } from "@/lib/roles";
import { useCategories } from "@/features/category/hooks/use-categories";
import { useBrands } from "@/features/brand/hooks/use-brands";
import { HeartIcon, MenuIcon, UserIcon, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export function MobileNav({
  isAuthenticated,
  userRole,
}: {
  isAuthenticated: boolean;
  userRole?: string | null;
}) {
  const [isOpenCategories, setIsOpenCategories] = useState(false);
  const [isOpenBrands, setIsOpenBrands] = useState(false);
  const { data: categories } = useCategories({ isActive: true });
  const { data: brands } = useBrands({ isActive: true });

  return (
    <div className="flex items-center gap-2 md:hidden">
      <ModeToggle />
      <Sheet>
        <SheetTrigger asChild>
          <Button aria-label="Mở điều hướng" size="icon" variant="outline">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-5 flex flex-col justify-between" side="right">
          <div className="overflow-y-auto pr-1">
            <SheetHeader>
              <SheetTitle>Điều hướng Know</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              <Button asChild className="justify-start hover:text-[primary] hover:bg-[primary]/5" variant="ghost">
                <Link href="/">Trang chủ</Link>
              </Button>

              {                       }
              <div>
                <Button
                  className="w-full justify-between hover:text-[primary] hover:bg-[primary]/5"
                  variant="ghost"
                  onClick={() => setIsOpenCategories(!isOpenCategories)}
                >
                  <span>Danh mục</span>
                  {isOpenCategories ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
                {isOpenCategories && (
                  <div className="pl-4 flex flex-col gap-1 border-l ml-4 mt-1">
                    {categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <Button
                          asChild
                          className="justify-start text-muted-foreground hover:text-[primary] hover:bg-[primary]/5 h-9"
                          key={category.id}
                          variant="ghost"
                        >
                          <Link href={`/products?category=${category.slug}`}>
                            {category.name}
                          </Link>
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground p-2">Đang tải...</p>
                    )}
                  </div>
                )}
              </div>

              {                   }
              <div>
                <Button
                  className="w-full justify-between hover:text-[primary] hover:bg-[primary]/5"
                  variant="ghost"
                  onClick={() => setIsOpenBrands(!isOpenBrands)}
                >
                  <span>Thương hiệu</span>
                  {isOpenBrands ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
                {isOpenBrands && (
                  <div className="pl-4 flex flex-col gap-1 border-l ml-4 mt-1">
                    {brands && brands.length > 0 ? (
                      brands.map((brand) => (
                        <Button
                          asChild
                          className="justify-start text-muted-foreground hover:text-[primary] hover:bg-[primary]/5 h-9"
                          key={brand.id}
                          variant="ghost"
                        >
                          <Link href={`/products?brand=${brand.slug}`}>
                            {brand.name}
                          </Link>
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground p-2">Đang tải...</p>
                    )}
                  </div>
                )}
              </div>

              <Button asChild className="justify-start hover:text-[primary] hover:bg-[primary]/5" variant="ghost">
                <Link href="/#deals">Khuyến mãi</Link>
              </Button>
            </nav>
          </div>

          <div className="mt-auto grid gap-2 border-t pt-6">
            {isAuthenticated ? (
              isStaff(userRole) ? (
                <Button asChild className="bg-[primary] hover:bg-[primary]/90 text-white">
                  <Link href="/dashboard">Bảng điều khiển</Link>
                </Button>
              ) : (
                <>
                  <Button asChild className="justify-start hover:text-[primary] hover:bg-[primary]/5" variant="ghost">
                    <Link href="/profile">
                      <UserIcon className="size-4 mr-2" />
                      Hồ sơ
                    </Link>
                  </Button>
                  <Button asChild className="justify-start" variant="outline">
                    <Link href="/wishlist">
                      <HeartIcon className="size-4 mr-2 text-[primary]" />
                      Yêu thích
                    </Link>
                  </Button>
                </>
              )
            ) : (
              <>
                <Button asChild className="bg-[primary] hover:bg-[primary]/90 text-white">
                  <Link href="/login">Bắt đầu</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

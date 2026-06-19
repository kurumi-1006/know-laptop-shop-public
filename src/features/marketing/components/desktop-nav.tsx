'use client';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useBrands } from '@/features/brand/hooks/use-brands';
import { useCategories } from '@/features/category/hooks/use-categories';
import { getLogoUrl } from '@/lib/utils';
import { Briefcase, Gamepad2, GraduationCap, Laptop, Palette } from 'lucide-react';
import Link from 'next/link';

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'gaming':
      return <Gamepad2 className="size-5" />;
    case 'business':
      return <Briefcase className="size-5" />;
    case 'student':
    case 'study':
      return <GraduationCap className="size-5" />;
    case 'creator':
      return <Palette className="size-5" />;
    default:
      return <Laptop className="size-5" />;
  }
};

export function DesktopNav() {
  const { data: categories } = useCategories({ isActive: true });
  const { data: brands } = useBrands({ isActive: true });

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-1">
        {                         }
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-[primary] hover:bg-[primary]/5 data-[state=open]:text-[primary] data-[state=open]:bg-[primary]/5 transition-colors">
            Danh mục
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-transparent p-0">
            <div className="grid w-[400px] grid-cols-1 gap-1.5 rounded-xl border bg-popover p-3 shadow-lg">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <NavigationMenuLink asChild key={category.id}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-[primary]/5 transition-all duration-200 text-left border border-transparent hover:border-[primary]/10"
                    >
                      <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-lg bg-[primary]/10 text-[primary] shadow-xs group-hover:bg-[primary]/20 transition-colors">
                        {getCategoryIcon(category.slug)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground group-hover:text-[primary] transition-colors">
                          {category.name}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {category.description || `Laptop dòng ${category.name}`}
                        </span>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                ))
              ) : (
                <p className="p-2 text-xs text-muted-foreground">Đang tải danh mục...</p>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {                     }
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-[primary] hover:bg-[primary]/5 data-[state=open]:text-[primary] data-[state=open]:bg-[primary]/5 transition-colors">
            Thương hiệu
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-transparent p-0">
            <div className="grid w-[320px] grid-cols-2 gap-1.5 rounded-xl border bg-popover p-3 shadow-lg">
              {brands && brands.length > 0 ? (
                brands.map((brand) => {
                  const logoUrl = getLogoUrl(brand.logo);
                  return (
                    <NavigationMenuLink asChild key={brand.id}>
                      <Link
                        href={`/products?brand=${brand.slug}`}
                        className="group flex items-center gap-2.5 rounded-lg p-2 hover:bg-[primary]/5 transition-all duration-200 text-left border border-transparent hover:border-[primary]/10"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[primary]/10 text-xs font-bold text-[primary] uppercase shadow-xs group-hover:bg-[primary]/20 transition-colors overflow-hidden">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={brand.name}
                              className="size-full object-contain p-0.5"
                            />
                          ) : (
                            brand.name.slice(0, 2)
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground group-hover:text-[primary] transition-colors">
                          {brand.name}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  );
                })
              ) : (
                <p className="p-2 text-xs text-muted-foreground col-span-2">
                  Đang tải thương hiệu...
                </p>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {                  }
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/products"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-[primary] hover:bg-[primary]/5 transition-colors"
            >
              Sản phẩm
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/#deals"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-[primary] hover:bg-[primary]/5 transition-colors"
            >
              Khuyến mãi
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

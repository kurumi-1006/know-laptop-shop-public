"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useClearCart,
} from "@/features/cart/hooks/use-cart";
import { PRICE_LOCALE, ROUTES } from "@/lib/constants";
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  Trash2Icon,
  ArrowLeftIcon,
  CreditCardIcon,
  PercentIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CartPage() {
  const { data: cartItems, isLoading, error } = useCart();
  const updateMutation = useUpdateCartQuantity();
  const removeMutation = useRemoveFromCart();
  const clearMutation = useClearCart();

  const router = useRouter();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);


  useEffect(() => {
    if (cartItems && cartItems.length > 0 && !hasInitializedSelection) {
      setSelectedProductIds(cartItems.map((item) => item.productId));
      setHasInitializedSelection(true);
    } else if (cartItems) {
      const currentProductIds = cartItems.map((item) => item.productId);
      setSelectedProductIds((prev) => prev.filter((id) => currentProductIds.includes(id)));
    }
  }, [cartItems, hasInitializedSelection]);

  const selectedItems = cartItems
    ? cartItems.filter((item) => selectedProductIds.includes(item.productId))
    : [];

  const subtotal = selectedItems.reduce((acc, item) => {
    const price = Number(item.product.salePrice ?? item.product.price);
    return acc + price * item.quantity;
  }, 0);


  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && cartItems) {
      setSelectedProductIds(cartItems.map((item) => item.productId));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleQuantityChange = (productId: string, currentQuantity: number, delta: number, stock: number) => {
    const newQty = currentQuantity + delta;
    if (newQty <= 0) {
      handleRemove(productId, "");
      return;
    }
    if (newQty > stock) {
      toast.error(`Chỉ còn lại ${stock} sản phẩm trong kho.`);
      return;
    }

    updateMutation.mutate(
      { productId, quantity: newQty },
      {
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Không thể cập nhật số lượng.");
        },
      }
    );
  };

  const handleRemove = (productId: string, productName: string) => {
    removeMutation.mutate(productId, {
      onSuccess: () => {
        if (productName) {
          toast.success(`Đã xóa "${productName}" khỏi giỏ hàng.`);
        }
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Không thể xóa sản phẩm.");
      },
    });
  };

  const handleClearCart = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
      clearMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success("Đã làm trống giỏ hàng.");
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Không thể làm trống giỏ hàng.");
        },
      });
    }
  };

  const handleCheckout = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }
    router.push(`${ROUTES.checkout}?items=${selectedProductIds.join(",")}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giỏ hàng</h1>
          <p className="mt-1 text-muted-foreground">Đang tải danh sách giỏ hàng của bạn...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="size-24 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="min-h-[50vh]">
        <EmptyHeader>
          <EmptyMedia>
            <ShoppingCartIcon className="size-12 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Đã xảy ra lỗi</EmptyTitle>
          <EmptyDescription>
            Không thể tải giỏ hàng của bạn lúc này. Vui lòng thử lại sau.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={ROUTES.home}>Quay lại trang chủ</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Empty className="min-h-[45vh]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCartIcon className="size-8" />
            </EmptyMedia>
            <EmptyTitle className="text-xl font-bold">Giỏ hàng của bạn đang trống</EmptyTitle>
            <EmptyDescription className="text-muted-foreground max-w-sm">
              Bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá các mẫu laptop chính hãng của chúng tôi ngay.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="mt-4">
            <Button asChild className="h-11 px-6 font-semibold">
              <Link href={ROUTES.products}>
                Xem danh sách laptop
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }


  const shippingFee = subtotal === 0 ? 0 : (subtotal >= 10000000 ? 0 : 30000);
  const total = subtotal + shippingFee;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giỏ hàng</h1>
          <p className="mt-1 text-muted-foreground">
            Bạn đang có {cartItems.length} sản phẩm khác nhau trong giỏ hàng.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit text-destructive border-destructive hover:bg-destructive/10"
          onClick={handleClearCart}
          disabled={clearMutation.isPending}
        >
          {clearMutation.isPending ? (
            <Spinner className="mr-2" />
          ) : (
            <Trash2Icon className="mr-2 size-4" />
          )}
          Xóa toàn bộ giỏ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {                                }
        <div className="lg:col-span-2 space-y-4">
          {                         }
          <div className="flex items-center justify-between border bg-card/60 backdrop-blur-md p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={selectedProductIds.length === cartItems.length}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-semibold text-foreground cursor-pointer select-none"
              >
                Chọn tất cả ({cartItems.length} sản phẩm)
              </label>
            </div>
            {selectedProductIds.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                Đã chọn {selectedProductIds.length} sản phẩm
              </span>
            )}
          </div>

          {cartItems.map((item) => {
            const product = item.product;
            const primaryImage = product.images[0]?.imageUrl;
            const displayPrice = Number(product.salePrice ?? product.price);
            const originalPrice = Number(product.price);
            const hasSale = product.salePrice !== null && product.salePrice !== undefined;
            const isUpdating = updateMutation.isPending && updateMutation.variables?.productId === item.productId;
            const isRemoving = removeMutation.isPending && removeMutation.variables === item.productId;

            return (
              <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:shadow-md">
                <CardContent className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6 relative">
                  {                          }
                  <Checkbox
                    checked={selectedProductIds.includes(item.productId)}
                    onCheckedChange={() => handleToggleProduct(item.productId)}
                    className="shrink-0 size-5"
                  />

                  {                                                   }
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {                       }
                    <div className="relative size-20 sm:size-24 rounded-lg bg-muted border overflow-hidden shrink-0">
                      {primaryImage ? (
                        <Image
                          alt={product.name}
                          className="object-cover"
                          fill
                          sizes="96px"
                          src={primaryImage}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                          Không có ảnh
                        </div>
                      )}
                    </div>

                    {                     }
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {product.brand.name}
                      </p>
                      <Link
                        href={`/products/${product.slug}`}
                        className="block text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Tồn kho: {product.stock} máy
                      </p>
                      {            }
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-sm sm:text-base font-bold text-red-500">
                          {displayPrice.toLocaleString(PRICE_LOCALE)} VND
                        </span>
                        {hasSale && (
                          <span className="text-xs text-muted-foreground line-through">
                            {originalPrice.toLocaleString(PRICE_LOCALE)} VND
                          </span>
                        )}
                      </div>
                    </div>

                    {                               }
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0 mt-2 sm:mt-0">
                      <div className="flex items-center border rounded-lg bg-background p-1 shadow-sm">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 h-7 w-7 rounded"
                          disabled={item.quantity <= 1 || isUpdating || isRemoving}
                          onClick={() => handleQuantityChange(item.productId, item.quantity, -1, product.stock)}
                        >
                          <MinusIcon className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {isUpdating ? <Spinner className="mx-auto" /> : item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 h-7 w-7 rounded"
                          disabled={item.quantity >= product.stock || isUpdating || isRemoving}
                          onClick={() => handleQuantityChange(item.productId, item.quantity, 1, product.stock)}
                        >
                          <PlusIcon className="size-3.5" />
                        </Button>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={isRemoving}
                        onClick={() => handleRemove(item.productId, product.name)}
                      >
                        {isRemoving ? <Spinner /> : <Trash2Icon className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="pt-2">
            <Button asChild variant="link" className="pl-0 text-primary">
              <Link href={ROUTES.products} className="flex items-center gap-2">
                <ArrowLeftIcon className="size-4" />
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>
        </div>

        {                               }
        <div className="space-y-6">
          <Card className="sticky top-24 border bg-card/60 backdrop-blur-md shadow-md">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-bold tracking-tight">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium">{subtotal.toLocaleString(PRICE_LOCALE)} VND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600 font-semibold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-xs">
                      Miễn phí
                    </span>
                  ) : (
                    <span className="font-medium">{shippingFee.toLocaleString(PRICE_LOCALE)} VND</span>
                  )}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Tổng tiền</span>
                  <span className="text-lg text-primary">{total.toLocaleString(PRICE_LOCALE)} VND</span>
                </div>
              </div>

              {                     }
              <Button onClick={handleCheckout} className="w-full h-12 text-base font-bold" size="lg">
                <CreditCardIcon className="mr-2 size-5" />
                Tiến hành thanh toán
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeftIcon, MapPinIcon, PercentIcon, ShoppingBagIcon, TruckIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { formatCurrency } from "@/lib/format-currency";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/features/order/lib/order-constants";

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    stock: number;
    brand: { name: string } | null;
    images: { imageUrl: string }[];
  };
};

type Address = {
  id: string;
  type: string;
  isDefault: boolean;
  receiverName: string | null;
  receiverPhone: string | null;
  street: string | null;
  provinceName: string;
  districtName: string;
  wardName: string;
};

export function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItemsParam = searchParams.get("items");
  const selectedProductIds = selectedItemsParam ? selectedItemsParam.split(",") : [];

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const couponParam = searchParams.get("coupon");
  const [couponCode, setCouponCode] = useState(couponParam ?? "");
  const [couponValidation, setCouponValidation] = useState<{
    valid: boolean;
    discountAmount?: number;
    message?: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  interface Coupon {
    code: string;
    name: string | null;
    discountType: "percent" | "amount";
    discountValue: any;
    minOrderValue: any;
    maxDiscountValue: any;
  }
  const [vouchers, setVouchers] = useState<Coupon[]>([]);

  const filteredCartItems = selectedProductIds.length > 0
    ? cartItems.filter((item) => selectedProductIds.includes(item.productId))
    : cartItems;

  const fetchData = useCallback(async () => {
    try {
      const [cartRes, addressRes, voucherRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/profile"),
        fetch(`/api/vouchers?items=${selectedItemsParam ?? ""}`),
      ]);

      if (cartRes.ok) {
        const items = await cartRes.json();
        setCartItems(items);
      }

      if (addressRes.ok) {
        const profile = await addressRes.json();
        const addrs = profile?.addresses ?? [];
        setAddresses(addrs);
        const defaultAddr = addrs.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addrs.length > 0) {
          setSelectedAddressId(addrs[0].id);
        }
      }

      if (voucherRes.ok) {
        const voucherData = await voucherRes.json();
        setVouchers(voucherData);
      }
    } catch (err) {
      console.error("Failed to load checkout data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subtotal = filteredCartItems.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + Number(price) * item.quantity;
  }, 0);

  const shippingFee = subtotal === 0 ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE);
  const discountAmount = couponValidation?.valid ? couponValidation.discountAmount ?? 0 : 0;
  const total = subtotal - discountAmount + shippingFee;

  const handleValidateCoupon = useCallback(async (codeToValidate?: string) => {
    const code = (codeToValidate ?? couponCode).trim();
    if (!code) return;
    try {
      const validationItems = filteredCartItems.map((item) => ({
        productId: item.productId,
        price: Number(item.product.salePrice ?? item.product.price),
        quantity: item.quantity,
      }));
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderValue: subtotal, items: validationItems }),
      });

      if (!res.ok) {
        const err = await res.json();
        setCouponValidation({ valid: false, message: err.error ?? "Mã giảm giá không hợp lệ." });
        return;
      }

      const data = await res.json();
      setCouponValidation(data);
    } catch {
      setCouponValidation({ valid: false, message: "Không thể kiểm tra mã giảm giá." });
    }
  }, [couponCode, filteredCartItems, subtotal]);

  useEffect(() => {
    if (!loading && couponParam && filteredCartItems.length > 0) {
      handleValidateCoupon(couponParam);
    }

  }, [loading, couponParam]);

  useSupabaseRealtime({
    channelName: "checkout-stock",
    table: "product",
    event: "UPDATE",
    callback: async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const items = await res.json();
          setCartItems(items);
          const lowStock = items.filter(
            (item: CartItem) =>
              (selectedProductIds.length === 0 || selectedProductIds.includes(item.productId)) &&
              item.quantity > item.product.stock
          );
          if (lowStock.length > 0) {
            toast.warning("Một số sản phẩm trong giỏ hàng đã thay đổi tồn kho. Vui lòng kiểm tra lại.");
          }
        }
      } catch {

      }
    },
  });

  async function handleCheckout() {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId || undefined,
          couponCode: couponCode.trim() || undefined,
          note: note.trim() || undefined,
          paymentMethod,
          selectedProductIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đặt hàng thất bại. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }


      if (paymentMethod === "stripe" && data.data?.payUrl) {
        window.location.href = data.data.payUrl;
        return;
      }


      if (data.data?.paymentError) {
        setError(data.data.paymentError + " Bạn có thể thanh toán lại từ trang chi tiết đơn hàng.");
        setSubmitting(false);
        return;
      }

      router.push(`/profile/orders/${data.data.id}`);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <ShoppingBagIcon className="size-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thanh toán</h1>
            <p className="mt-1 text-sm text-muted-foreground">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredCartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBagIcon className="size-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-semibold">Giỏ hàng trống</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Khám phá sản phẩm</Link>
        </Button>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="space-y-6">
      {            }
      <Button variant="ghost" size="sm" asChild>
        <Link href="/cart">
          <ArrowLeftIcon className="size-4" />
          Quay lại giỏ hàng
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <ShoppingBagIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thanh toán</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xác nhận đơn hàng và địa chỉ giao hàng
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {                 }
        <div className="space-y-6">
          {             }
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Địa chỉ giao hàng</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <MapPinIcon className="size-8 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm">Bạn chưa có địa chỉ giao hàng nào.</p>
                    <Button variant="link" size="sm" asChild>
                      <Link href="/address">Thêm địa chỉ mới</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn địa chỉ giao hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.receiverName} - {[addr.street, addr.wardName, addr.districtName]
                            .filter(Boolean)
                            .join(", ")}
                          {addr.isDefault ? " (Mặc định)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedAddress && (
                    <div className="mt-3 rounded-lg border p-3 text-sm">
                      <p className="font-medium">{selectedAddress.receiverName} · {selectedAddress.receiverPhone}</p>
                      <p className="text-muted-foreground">
                        {[selectedAddress.street, selectedAddress.wardName, selectedAddress.districtName, selectedAddress.provinceName]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {                }
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Sản phẩm ({filteredCartItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredCartItems.map((item) => {
                const price = Number(item.product.salePrice ?? item.product.price);
                const lineTotal = price * item.quantity;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
                      {item.product.images?.[0]?.imageUrl ? (
                        <Image
                          src={item.product.images[0].imageUrl}
                          alt={item.product.name}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No img</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.product.brand?.name} · SL: {item.quantity} × {formatCurrency(price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">{formatCurrency(lineTotal)}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {                  }
        <div className="space-y-4">
          <Card className="shadow-none sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {            }
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <PercentIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Select
                    value={couponCode}
                    onValueChange={(val) => {
                      setCouponCode(val);
                      setCouponValidation(null);
                    }}
                  >
                    <SelectTrigger className="pl-9 bg-background">
                      <SelectValue placeholder="Chọn mã giảm giá">
                        {couponCode || undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {vouchers.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">Không có mã giảm giá khả dụng</div>
                      ) : (
                        vouchers.map((v) => {
                          const valNum = Number(v.discountValue);
                          const minValNum = Number(v.minOrderValue);
                          const desc = v.discountType === "percent"
                            ? `Giảm ${valNum}% (Đơn tối thiểu ${formatCurrency(minValNum)})`
                            : `Giảm ${formatCurrency(valNum)} (Đơn tối thiểu ${formatCurrency(minValNum)})`;
                          return (
                            <SelectItem key={v.code} value={v.code}>
                              <span className="font-semibold text-xs">{v.code}</span> - <span className="text-[10px] text-muted-foreground">{desc}</span>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleValidateCoupon()}>
                  Áp dụng
                </Button>
              </div>
              {couponValidation && (
                <p className={cn("text-xs", couponValidation.valid ? "text-emerald-600" : "text-destructive")}>
                  {couponValidation.valid
                    ? `Giảm ${formatCurrency(couponValidation.discountAmount ?? 0)}`
                    : couponValidation.message}
                </p>
              )}

              {                    }
              <div>
                <Label className="text-xs text-muted-foreground">Phương thức thanh toán</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Thanh toán khi nhận hàng (COD)</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {          }
              <div>
                <Label className="text-xs text-muted-foreground">Ghi chú</Label>
                <Input
                  placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="flex items-center gap-1">
                    {shippingFee === 0 ? (
                      <Badge variant="secondary" className="text-xs">Miễn phí</Badge>
                    ) : (
                      formatCurrency(shippingFee)
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/50 p-2">
                  <TruckIcon className="size-3.5 shrink-0" />
                  Mua thêm {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} để được miễn phí vận chuyển
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full"
                size="lg"
                disabled={submitting || addresses.length === 0}
                onClick={handleCheckout}
              >
                {submitting
                  ? "Đang xử lý..."
                  : paymentMethod === "stripe"
                    ? "Thanh toán Stripe"
                    : "Đặt hàng (COD)"}
              </Button>

              {addresses.length === 0 && (
                <p className="text-xs text-destructive text-center">
                  Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

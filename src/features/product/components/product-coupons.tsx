"use client";

import { TicketPercentIcon, CopyIcon, CheckIcon, ClockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CouponData {
  id: string;
  code: string;
  name: string | null;
  discountType: string;
  discountValue: number | { toNumber(): number };
  isActive: boolean;
  startDate: Date | string;
  endDate: Date | string;
}

interface ProductCoupon {
  coupon: CouponData;
}

function toNumber(val: number | { toNumber(): number }): number {
  return typeof val === "number" ? val : val.toNumber();
}

function formatDiscount(coupon: CouponData): string {
  const value = toNumber(coupon.discountValue);
  if (coupon.discountType === "percent") {
    return `Giảm ${value}%`;
  }
  return `Giảm ${value.toLocaleString("vi-VN")} ₫`;
}

function isExpired(endDate: Date | string): boolean {
  return new Date(endDate) < new Date();
}

function daysLeft(endDate: Date | string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function ProductCoupons({ coupons }: { coupons: ProductCoupon[] | undefined | null }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeCoupons = (coupons ?? [])
    .filter((pc) => pc.coupon.isActive && !isExpired(pc.coupon.endDate))
    .sort((a, b) => new Date(a.coupon.endDate).getTime() - new Date(b.coupon.endDate).getTime())
    .slice(0, 5);

  if (activeCoupons.length === 0) return null;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Đã sao chép mã!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Không thể sao chép mã.");
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <TicketPercentIcon className="size-4 text-green-600" />
        <span className="text-sm font-semibold">Khuyến mãi</span>
      </div>
      <div className="space-y-2">
        {activeCoupons.map((pc) => {
          const remaining = daysLeft(pc.coupon.endDate);
          return (
            <div
              key={pc.coupon.id}
              className="flex items-center gap-2 rounded-lg border border-dashed border-green-300 bg-green-50/50 dark:bg-green-950/20 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {formatDiscount(pc.coupon)}
                </p>
                {pc.coupon.name && (
                  <p className="text-xs text-muted-foreground truncate">{pc.coupon.name}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ClockIcon className="size-3" />
                  {remaining > 0 ? `Còn ${remaining} ngày` : "Hết hạn hôm nay"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(pc.coupon.code)}
                className="flex items-center gap-1 shrink-0 rounded-md border border-green-300 bg-white dark:bg-green-950/40 px-2.5 py-1.5 text-xs font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                {copiedCode === pc.coupon.code ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
                {pc.coupon.code}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

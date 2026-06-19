"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import { authClient } from "@/features/auth/lib/auth-client";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { ShoppingCart, Minus, Plus, CreditCard } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ProductCartActionsProps {
  productId: string;
  stock: number;
  wishlistButton?: React.ReactNode;
}

export function ProductCartActions({ productId, stock, wishlistButton }: ProductCartActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const addToCartMutation = useAddToCart();

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const executeAdd = (callback?: () => void) => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này.");
      router.push(ROUTES.login);
      return;
    }

    addToCartMutation.mutate(
      { productId, quantity },
      {
        onSuccess: () => {
          toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`);
          setQuantity(1);
          if (callback) callback();
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Không thể thêm sản phẩm vào giỏ hàng.");
        },
      }
    );
  };

  const handleAddToCart = () => {
    executeAdd();
  };

  const handleBuyNow = () => {
    executeAdd(() => {
      router.push(ROUTES.cart);
    });
  };

  const isPending = addToCartMutation.isPending;

  if (stock <= 0) {
    return (
      <div className="text-sm font-semibold text-destructive py-3 bg-destructive/10 rounded-lg text-center max-w-sm">
        Sản phẩm hiện tại đã hết hàng
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {                       }
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Số lượng:</span>
        <div className="flex items-center border rounded-lg bg-background p-1 shadow-sm">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 h-8 w-8 rounded"
            disabled={quantity <= 1 || isPending}
            onClick={handleDecrement}
            type="button"
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-10 text-center font-bold text-sm">
            {quantity}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 h-8 w-8 rounded"
            disabled={quantity >= stock || isPending}
            onClick={handleIncrement}
            type="button"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {                     }
      <div className="flex gap-4 max-w-md">
        <Button
          onClick={handleBuyNow}
          disabled={isPending}
          size="lg"
          className="flex-1 text-base h-12"
          type="button"
        >
          {isPending ? <Spinner className="mr-2" /> : <CreditCard className="mr-2 size-5" />}
          Mua Ngay
        </Button>

        <Button
          onClick={handleAddToCart}
          disabled={isPending}
          size="lg"
          variant="outline"
          className="h-12 w-16 px-0 shrink-0"
          type="button"
          aria-label="Thêm vào giỏ hàng"
        >
          {isPending ? <Spinner /> : <ShoppingCart className="size-5" />}
        </Button>

        {wishlistButton}
      </div>
    </div>
  );
}

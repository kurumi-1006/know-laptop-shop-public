"use client";

import { authClient } from "@/features/auth/lib/auth-client";
import {
  useToggleWishlist,
  useWishlistIds,
} from "@/features/wishlist/hooks/use-wishlist";
import { isStaff } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { HeartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
  size?: "sm" | "md";
  className?: string;
}

export function WishlistButton({
  productId,
  size = "sm",
  className,
}: WishlistButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: wishlistIds } = useWishlistIds();
  const toggleMutation = useToggleWishlist();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }


  if (!session || isStaff(session.user.role)) {
    return null;
  }

  const isWishlisted = wishlistIds?.includes(productId) ?? false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleMutation.mutate(productId, {
      onSuccess: ({ added }) => {
        toast.success(
          added ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích",
        );
      },
      onError: (error) => {
        toast.error(error.message || "Không thể cập nhật yêu thích");
      },
    });
  };

  const iconSize = size === "sm" ? "size-4" : "size-5";
  const buttonSize = size === "sm" ? "size-8" : "size-10";

  return (
    <button
      aria-label={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all",
        "bg-background/80 backdrop-blur-sm border shadow-sm",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        buttonSize,
        className,
      )}
      disabled={toggleMutation.isPending}
      onClick={handleToggle}
      type="button"
    >
      <HeartIcon
        className={cn(
          iconSize,
          "transition-colors",
          isWishlisted
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-red-400",
        )}
      />
    </button>
  );
}

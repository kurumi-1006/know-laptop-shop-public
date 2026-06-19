import {
  getCartProducts,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "@/features/cart/api/cart-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const cartQueryKey = ["cart"] as const;

export function useCart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: getCartProducts,
    ...options,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItemQuantity(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => removeFromCart(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}

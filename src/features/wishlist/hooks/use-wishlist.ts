import {
  getWishlistProducts,
  getWishlistIds,
  toggleWishlist,
  removeFromWishlist,
} from "@/features/wishlist/api/wishlist-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const wishlistQueryKey = ["wishlist"] as const;
export const wishlistIdsQueryKey = ["wishlist", "ids"] as const;


export function useWishlist(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: wishlistQueryKey,
    queryFn: getWishlistProducts,
    ...options,
  });
}


export function useWishlistIds(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: wishlistIdsQueryKey,
    queryFn: getWishlistIds,
    ...options,
  });
}


export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => toggleWishlist(productId),
    onMutate: async (productId) => {

      await queryClient.cancelQueries({ queryKey: wishlistIdsQueryKey });


      const previousIds = queryClient.getQueryData<string[]>(wishlistIdsQueryKey);


      if (previousIds) {
        const isInWishlist = previousIds.includes(productId);
        queryClient.setQueryData<string[]>(
          wishlistIdsQueryKey,
          isInWishlist
            ? previousIds.filter((id) => id !== productId)
            : [...previousIds, productId],
        );
      }

      return { previousIds };
    },
    onError: (_error, _productId, context) => {

      if (context?.previousIds) {
        queryClient.setQueryData(wishlistIdsQueryKey, context.previousIds);
      }
    },
    onSettled: () => {

      queryClient.invalidateQueries({ queryKey: wishlistIdsQueryKey });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKey });
    },
  });
}


export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKey });
      await queryClient.cancelQueries({ queryKey: wishlistIdsQueryKey });

      const previousIds = queryClient.getQueryData<string[]>(wishlistIdsQueryKey);
      if (previousIds) {
        queryClient.setQueryData<string[]>(
          wishlistIdsQueryKey,
          previousIds.filter((id) => id !== productId),
        );
      }

      return { previousIds };
    },
    onError: (_error, _productId, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(wishlistIdsQueryKey, context.previousIds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistIdsQueryKey });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKey });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export const feedbacksQueryKey = ["admin", "feedbacks"] as const;

export function useFeedbacks(params: {
  page: number;
  pageSize: number;
  search: string;
  rating: string;
  status: string;
}) {
  return useQuery({
    queryKey: [...feedbacksQueryKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/feedbacks", { params });
      return data;
    },
  });
}

export function useUpdateFeedbackVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ feedbackId, isVisible }: { feedbackId: number; isVisible: boolean }) => {
      const { data } = await apiClient.put("/api/admin/feedbacks", { feedbackId, isVisible });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbacksQueryKey });
    },
  });
}

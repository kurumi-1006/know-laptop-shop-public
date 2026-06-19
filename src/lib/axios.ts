import axios from "axios";

export const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data;
      const message =
        typeof data === "object" && data !== null && "error" in data
          ? (data as { error: string }).error
          : error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);

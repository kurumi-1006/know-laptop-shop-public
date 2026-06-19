import { apiClient } from "@/lib/axios";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  status: string;
  category: { name: string };
  brand: { name: string };
  images: Array<{ imageUrl: string }>;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetProductsParams {
  category?: string;
  brand?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: number;
  maxPrice?: number;
  cpu?: string;
  ram?: string;
  storage?: string;
  display?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export async function getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
  const { data } = await apiClient.get<ProductsResponse>("/api/products", {
    params,
  });
  return data;
}

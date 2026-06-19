import { Metadata } from "next";
import { CategoryFacade } from "@/features/category/lib/category-facade";
import DynamicPLPClient from "../[categorySlug]/dynamic-plp-client";

export const metadata: Metadata = {
  title: "Tất Cả Laptop Chính Hãng - Trả Góp 0%, Giá Tốt Nhất | KNOW Store",
  description: "Tìm kiếm laptop phù hợp nhất với cấu hình mạnh mẽ, bảo hành chính hãng và đa dạng thương hiệu uy tín tại KNOW Store.",
  alternates: {
    canonical: "/products",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const facade = new CategoryFacade();


  const initialConfig = await facade.getCategoryConfigAndFilters("all");


  initialConfig.category = {
    id: "temp-id-all",
    name: "Tất Cả Sản Phẩm Laptop",
    slug: "all",
    description: "Tìm kiếm laptop phù hợp nhất với cấu hình mạnh mẽ và bảo hành chính hãng.",
    image: null,
  };

  return (
    <DynamicPLPClient
      categorySlug="all"
      initialConfig={initialConfig}
      initialSearchParams={resolvedSearchParams}
    />
  );
}

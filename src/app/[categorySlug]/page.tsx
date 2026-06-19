import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CategoryFacade } from "@/features/category/lib/category-facade";
import DynamicPLPClient from "./dynamic-plp-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const facade = new CategoryFacade();

  try {
    const config = await facade.getCategoryConfig(categorySlug);
    if (config.category.id.startsWith("temp-id-")) {
      return {
        title: "Danh mục không tồn tại | KNOW Store",
      };
    }
    const title = `${config.category.name} Chính Hãng - Trả Góp 0%, Giá Tốt Nhất | KNOW Store`;
    const description = config.category.description || `Mua sắm các dòng sản phẩm ${config.category.name} uy tín, cấu hình cực mạnh, giá ưu đãi.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/${categorySlug}`,
      },
    };
  } catch {
    return {
      title: "Danh mục sản phẩm | KNOW Store",
    };
  }
}

export default async function DynamicCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categorySlug } = await params;
  const resolvedSearchParams = await searchParams;

  const facade = new CategoryFacade();
  let initialConfig = null;

  try {
    initialConfig = await facade.getCategoryConfigAndFilters(categorySlug);
  } catch (error) {
    console.error("Error loading category config:", error);
    notFound();
  }



  if (initialConfig.category.id.startsWith("temp-id-")) {
    notFound();
  }

  return (
    <DynamicPLPClient
      categorySlug={categorySlug}
      initialConfig={initialConfig}
      initialSearchParams={resolvedSearchParams}
    />
  );
}

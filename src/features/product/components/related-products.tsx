import { ProductCard } from "@/components/shared/product-card";
import { FeaturedProduct } from "@/features/product/lib/product";

interface RelatedProductsProps {
  products: FeaturedProduct[];
  title?: string;
}

export function RelatedProducts({ products, title = "Sản phẩm liên quan" }: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 w-full">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

import { ProductCard } from '@/components/shared/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFacade } from '@/features/product/lib/product';
import { RecommendationSection } from '@/features/recommendation/components/recommendation-section';
import { FEATURED_PRODUCT_COUNT, ROUTES } from '@/lib/constants';
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  CpuIcon,
  Gamepad2Icon,
  GraduationCapIcon,
  LaptopIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

const categories = [
  {
    id: 'gaming',
    title: 'Laptop Gaming',
    description: 'Màn hình tần số quét cao, card RTX và tản nhiệt tiên tiến cho game thủ.',
    icon: Gamepad2Icon,
    specs: 'RTX 4050–4080, 144–360 Hz, Core i7 / Ryzen 7',
  },
  {
    id: 'business',
    title: 'Laptop Doanh nhân',
    description: 'Pin cả ngày, thiết kế nhẹ và bảo mật cao cho dân văn phòng.',
    icon: BriefcaseBusinessIcon,
    specs: 'Pin 12+ giờ, 1.2–1.5 kg, vân tay / TPM',
  },
  {
    id: 'study',
    title: 'Laptop Học tập',
    description: 'Giá hợp lý, nhẹ và đáng tin cậy cho việc học, ghi chú và bài tập.',
    icon: GraduationCapIcon,
    specs: '8–16 GB RAM, 256–512 GB SSD, dưới 1.6 kg',
  },
];

const features = [
  {
    icon: <TruckIcon className="size-5" />,
    title: 'Giao hàng nhanh',
    description: 'Vận chuyển có theo dõi với cập nhật từ lúc đặt hàng đến khi nhận.',
  },
  {
    icon: <ShieldCheckIcon className="size-5" />,
    title: 'Mua sắm an toàn',
    description: 'Thanh toán mã hóa và bảo vệ thông tin giao dịch.',
  },
  {
    icon: <RotateCcwIcon className="size-5" />,
    title: 'Hỗ trợ dễ dàng',
    description: 'Trợ giúp tận tình trước và sau khi mua hàng.',
  },
] as const;

export const metadata: Metadata = {
  title: 'Know — Cửa hàng Laptop',
  description:
    'Tìm laptop phù hợp cho gaming, doanh nghiệp và học tập với thông số rõ ràng và hỗ trợ đáng tin cậy.',
};

export default function Home() {
  return (
    <>
      {}
      <section className="border-b bg-linear-to-b from-muted/30 to-transparent">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge className="gap-1" variant="secondary">
              <SparklesIcon className="size-3" />
              Hàng mới về mỗi tuần
            </Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Laptop phù hợp cho cách bạn làm việc và giải trí.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              So sánh laptop uy tín cho gaming, doanh nghiệp và học tập với thông số rõ ràng và hỗ
              trợ đáng tin cậy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={ROUTES.categories}>
                  Xem laptop
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.profile}>Thiết lập giao hàng</Link>
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-primary/10 via-card to-muted p-8 shadow-sm">
            <div className="mx-auto flex aspect-square max-w-sm items-center justify-center rounded-full border bg-background/80 shadow-xl">
              <LaptopIcon className="size-40 text-primary" strokeWidth={1} />
            </div>
            <div className="absolute bottom-5 left-5 rounded-xl border bg-background/90 p-3 shadow-lg backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">Thiết kế cho nhu cầu thực tế</p>
              <p className="font-semibold">Làm việc. Sáng tạo. Giải trí.</p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" id="categories">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Mua theo nhu cầu</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Tìm laptop của bạn</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {categories.map(({ id, title, description, icon: Icon, specs }) => (
            <Card className="group transition-shadow hover:shadow-md" id={id} key={id}>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CpuIcon className="size-3.5" />
                  {specs}
                </div>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/products?category=${id === 'study' ? 'student' : id}`}>
                    Khám phá {title.split(' ')[0].toLowerCase()}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <RecommendationSection />

      {}
      <section className="border-y bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {features.map(({ icon, title, description }) => (
            <div className="flex gap-4" key={title}>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-primary/5 to-card p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LaptopIcon className="size-8" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Sẵn sàng tìm laptop tiếp theo?
          </h2>
          <p className="mt-3 max-w-md mx-auto text-muted-foreground">
            Duyệt danh mục, hỏi trợ lý để được tư vấn, hoặc đăng nhập để quản lý thông tin đã lưu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href={ROUTES.login}>
                Bắt đầu
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTES.categories}>Xem danh mục</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-56 mt-2" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-xl">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <CardHeader className="space-y-2 p-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

async function FeaturedProducts() {
  await connection();

  const products = await ProductFacade.getFeaturedProducts(FEATURED_PRODUCT_COUNT);

  if (products.length === 0) return null;

  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-primary">Cập nhật hàng giờ</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Laptop nổi bật</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { FullWidthDivider } from '@/components/shared/full-width-divider';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { CompassIcon, HomeIcon } from 'lucide-react';
import Link from 'next/link';

export function NotFoundPage() {
  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center overflow-hidden bg-background px-4">
      <div className="relative flex items-center border-x">
        <FullWidthDivider position="top" />
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="font-mono text-8xl font-black">404</EmptyTitle>
            <EmptyDescription>
              Trang bạn đang tìm có thể đã bị
              <br />
              di chuyển hoặc không tồn tại.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/">
                  <HomeIcon data-icon="inline-start" />
                  Về trang chủ
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <CompassIcon data-icon="inline-start" />
                  Khám phá
                </Link>
              </Button>
            </div>
          </EmptyContent>
        </Empty>
        <FullWidthDivider position="bottom" />
      </div>
    </div>
  );
}

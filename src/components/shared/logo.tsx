import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = Omit<ImageProps, 'alt' | 'height' | 'src' | 'width'>;

export function LogoIcon({ className, ...props }: LogoProps) {
  return (
    <Image
      alt="Know"
      className={cn('h-7 w-auto object-contain', className)}
      height={28}
      src="/images/know-brand-logo.png"
      width={28}
      {...props}
    />
  );
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <Image
      alt="Know"
      className={cn('h-8 w-auto object-contain', className)}
      height={32}
      priority
      src="/images/know-brand-logo.png"
      width={32}
      {...props}
    />
  );
}

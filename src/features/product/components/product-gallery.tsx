"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: Array<{ imageUrl: string }>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center rounded-lg border">
        <span className="text-muted-foreground">Không có hình ảnh</span>
      </div>
    );
  }

  const activeImage = images[activeIndex].imageUrl;

  return (
    <div className="flex flex-col gap-4">
      {                }
      <div className="relative w-full aspect-[4/3] bg-white rounded-lg border overflow-hidden group">
        <Image
          src={activeImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-500 ease-in-out group-hover:scale-125 cursor-crosshair"
        />
      </div>

      {                }
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden transition-all",
                activeIndex === idx
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.imageUrl}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

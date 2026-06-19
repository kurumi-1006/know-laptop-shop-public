"use client";

import { Button } from "@/components/ui/button";
import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useCallback, useRef } from "react";

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const el = ref.current;
    if (!el) return;
    const viewport = el.querySelector<HTMLDivElement>("[data-slot=scroll-area-viewport]");
    if (!viewport) return;
    viewport.scrollLeft += e.deltaY;
  }, []);

  return (
    <ScrollArea
      className="group/suggestions relative w-full overflow-x-auto whitespace-nowrap"
      onWheel={handleWheel}
      ref={ref}
      {...props}
    >
      <div className={cn("flex w-max flex-nowrap items-center gap-2 pr-12", className)}>
        {children}
      </div>
      <ScrollBar className="opacity-0 transition-opacity group-hover/suggestions:opacity-100" orientation="horizontal" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-r from-transparent to-background group-hover/suggestions:opacity-0 transition-opacity" />
    </ScrollArea>
  );
};

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = useCallback(() => {
    onClick?.(suggestion);
  }, [onClick, suggestion]);

  return (
    <Button
      className={cn("cursor-pointer rounded-full px-4", className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};

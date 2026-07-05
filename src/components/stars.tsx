"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** 評価・難易度の星表示 */
export function Stars({
  value,
  max = 5,
  className,
  color = "text-neon-amber",
}: {
  value: number;
  max?: number;
  className?: string;
  color?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < Math.round(value) ? `${color} fill-current` : "text-border"
          )}
        />
      ))}
    </span>
  );
}

/** クリックで評価を入力する星 */
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="cursor-pointer p-0.5"
          aria-label={`${i + 1}点`}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              i < value ? "text-neon-amber fill-current" : "text-border hover:text-muted-foreground"
            )}
          />
        </button>
      ))}
    </span>
  );
}

"use client";

/** ダミー広告枠(収益化想定)。PRラベル付きで自然に表示する */

import { ADS } from "@/lib/data/misc";
import { Card } from "@/components/ui/card";

export function AdBanner({ index = 0, count = 1 }: { index?: number; count?: number }) {
  const ads = Array.from({ length: count }).map((_, i) => ADS[(index + i) % ADS.length]);
  return (
    <div className={count > 1 ? "grid gap-3 sm:grid-cols-2" : ""}>
      {ads.map((ad) => (
        <Card
          key={ad.id}
          className="relative flex items-center gap-4 overflow-hidden border-dashed p-4 transition-transform hover:scale-[1.01]"
        >
          <span className="absolute right-2 top-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            PR
          </span>
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: `${ad.color}22`, border: `1px solid ${ad.color}55` }}
          >
            {ad.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold" style={{ color: ad.color }}>
              {ad.category}
            </p>
            <p className="truncate text-sm font-bold">{ad.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ad.body}</p>
          </div>
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-secondary"
            style={{ borderColor: `${ad.color}66`, color: ad.color }}
            onClick={() => alert("ダミー広告です(プロトタイプ)")}
          >
            {ad.cta}
          </button>
        </Card>
      ))}
    </div>
  );
}

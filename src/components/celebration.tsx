"use client";

/** 学習完了・クエスト完了・レベルアップ時のお祝い演出オーバーレイ */

import * as React from "react";
import { useGame } from "@/lib/game";

const CONFETTI_COLORS = ["#22d3ee", "#a78bfa", "#4ade80", "#fbbf24", "#f472b6"];

export function CelebrationOverlay() {
  const { celebration, dismissCelebration } = useGame();

  React.useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(dismissCelebration, celebration.levelUp ? 3200 : 2200);
    return () => clearTimeout(t);
  }, [celebration, dismissCelebration]);

  if (!celebration) return null;

  return (
    <div
      key={celebration.key}
      className="print-hidden pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      aria-live="polite"
    >
      {/* 紙吹雪 */}
      {celebration.levelUp &&
        Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="animate-confetti absolute top-0 block h-3 w-1.5 rounded-sm"
            style={{
              left: `${(i * 53) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 10) * 0.12}s`,
            }}
          />
        ))}

      <div className="animate-pop-in mx-4 max-w-sm rounded-2xl border border-primary/40 bg-card/95 p-6 text-center shadow-2xl glow-cyan">
        {celebration.levelUp ? (
          <>
            <div className="relative mx-auto mb-2 size-16">
              <span className="animate-level-burst absolute inset-0 rounded-full border-2 border-neon-amber" />
              <span className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-neon-amber to-neon-pink text-3xl">
                🎉
              </span>
            </div>
            <p className="text-2xl font-black tracking-widest text-neon-amber">LEVEL UP!</p>
            <p className="mt-1 text-lg font-bold">
              レベル <span className="text-3xl text-primary text-glow">{celebration.levelUp}</span> に到達!
            </p>
          </>
        ) : (
          <p className="text-3xl">✨</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{celebration.message}</p>
        <p className="animate-float-up mt-2 text-xl font-black text-neon-green">
          +{celebration.xp} XP
        </p>
      </div>
    </div>
  );
}

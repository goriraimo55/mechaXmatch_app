"use client";

import { Network } from "lucide-react";
import { SKILLS, skillLevel, skillLevelProgress } from "@/lib/data/skills";
import type { Skill } from "@/lib/types";
import { useGame } from "@/lib/game";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function SkillNode({ skill, xp }: { skill: Skill; xp: number }) {
  const level = skillLevel(xp);
  const prog = skillLevelProgress(xp);
  const unlocked = xp > 0;

  return (
    <Card
      className={cn(
        "relative transition-all hover:-translate-y-0.5",
        unlocked ? "border-primary/30" : "opacity-55"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl",
              unlocked && "animate-pulse-glow"
            )}
            style={{
              background: `${skill.color}1a`,
              border: `1.5px solid ${skill.color}${unlocked ? "88" : "33"}`,
            }}
          >
            {skill.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-black">{skill.name}</p>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-black"
                style={{ background: `${skill.color}22`, color: skill.color }}
              >
                Lv.{level}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{skill.description}</p>
          </div>
        </div>
        <Progress value={prog.percent} className="mt-3 h-2" />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>累計 {xp} XP</span>
          <span>
            次のLvまで {prog.next - prog.current} XP
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

const TIER_LABELS: Record<1 | 2 | 3, { title: string; note: string }> = {
  1: { title: "TIER 1 — 基礎スキル", note: "すべての技術者の土台。教材学習で伸ばしやすい" },
  2: { title: "TIER 2 — 応用スキル", note: "実務クエストで大きく成長する実践スキル" },
  3: { title: "TIER 3 — 総合スキル", note: "チームクエストや高難度案件で開花する上位スキル" },
};

export default function SkillsPage() {
  const { state, hydrated } = useGame();
  if (!hydrated) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Network className="size-6 text-primary" /> スキルツリー
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          教材の学習・クエストの達成で、対応するスキルの経験値が貯まりレベルが上がります。
        </p>
      </div>

      {( [1, 2, 3] as const ).map((tier) => (
        <section key={tier} className="relative">
          {tier > 1 && (
            <div className="absolute -top-6 left-8 h-6 w-px bg-gradient-to-b from-primary/60 to-transparent" />
          )}
          <div className="mb-3">
            <h2 className="text-sm font-black tracking-widest text-primary">
              {TIER_LABELS[tier].title}
            </h2>
            <p className="text-xs text-muted-foreground">{TIER_LABELS[tier].note}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SKILLS.filter((s) => s.tier === tier).map((s) => (
              <SkillNode key={s.id} skill={s} xp={state.skillXp[s.id] ?? 0} />
            ))}
          </div>
        </section>
      ))}

      <Card className="border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground">
          💡 <b className="text-foreground">スキルの伸ばし方:</b>{" "}
          教材を学習すると教材に紐づくスキルに、クエストを達成するとクエストの必要スキルに、それぞれ獲得経験値と同量のスキル経験値が加算されます。
        </CardContent>
      </Card>
    </div>
  );
}

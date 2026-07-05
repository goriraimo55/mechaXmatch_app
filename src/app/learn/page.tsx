"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, HelpCircle, Link2 } from "lucide-react";
import { MATERIALS, MATERIAL_CATEGORIES } from "@/lib/data/materials";
import type { Material } from "@/lib/types";
import { useGame } from "@/lib/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import { SkillChips } from "@/components/quest-parts";
import { AdBanner } from "@/components/ad-banner";
import { cn } from "@/lib/utils";

function MaterialCard({ material }: { material: Material }) {
  const { state, completeMaterial, questById } = useGame();
  const done = state.completedMaterials.includes(material.id);
  const [quizOpen, setQuizOpen] = React.useState(false);
  const [answer, setAnswer] = React.useState<number | null>(null);
  const correct = answer === material.quiz.answerIndex;

  return (
    <Card className={cn("flex h-full flex-col", done && "border-neon-green/40")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="purple">{material.category}</Badge>
          {done && (
            <Badge variant="success">
              <CheckCircle2 /> 学習済み
            </Badge>
          )}
        </div>
        <CardTitle className="text-base leading-snug">{material.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            難易度 <Stars value={material.difficulty} color="text-neon-pink" />
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> 約{material.minutes}分
          </span>
          <span className="font-bold text-neon-green">+{material.xp} XP</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{material.summary}</p>
        <SkillChips skillIds={material.skillIds} />

        {/* ミニクイズ */}
        <div className="rounded-lg border border-dashed p-3">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 text-left text-xs font-bold text-primary"
            onClick={() => setQuizOpen((o) => !o)}
          >
            <HelpCircle className="size-4" /> ミニクイズに挑戦 {quizOpen ? "▲" : "▼"}
          </button>
          {quizOpen && (
            <div className="mt-2 space-y-2">
              <p className="text-sm font-medium">{material.quiz.question}</p>
              <div className="space-y-1.5">
                {material.quiz.choices.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAnswer(i)}
                    className={cn(
                      "block w-full cursor-pointer rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                      answer === null && "hover:border-primary/60",
                      answer !== null && i === material.quiz.answerIndex &&
                        "border-neon-green bg-neon-green/10 text-neon-green",
                      answer === i && i !== material.quiz.answerIndex &&
                        "border-destructive bg-destructive/10 text-destructive"
                    )}
                  >
                    {["A", "B", "C", "D"][i]}. {c}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <p className={cn("text-xs leading-relaxed", correct ? "text-neon-green" : "text-neon-amber")}>
                  {correct ? "🎉 正解! " : "❌ 不正解… "}
                  {material.quiz.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 関連クエスト */}
        {material.relatedQuestIds.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p className="mb-1 flex items-center gap-1 font-bold">
              <Link2 className="size-3.5" /> 関連クエスト
            </p>
            <div className="flex flex-wrap gap-1.5">
              {material.relatedQuestIds.map((qid) => {
                const q = questById(qid);
                if (!q) return null;
                return (
                  <Link
                    key={qid}
                    href={`/quests/${qid}`}
                    className="rounded-full border px-2 py-0.5 transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    ⚔️ {q.title.length > 18 ? `${q.title.slice(0, 18)}…` : q.title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <Button
          className="mt-auto"
          variant={done ? "success" : "default"}
          disabled={done}
          onClick={() => completeMaterial(material.id)}
        >
          {done ? "✅ 学習完了済み" : `📖 学習完了する(+${material.xp} XP)`}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LearnPage() {
  const { hydrated, state } = useGame();
  const [category, setCategory] = React.useState<string>("すべて");

  const filtered =
    category === "すべて" ? MATERIALS : MATERIALS.filter((m) => m.category === category);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <BookOpen className="size-6 text-neon-purple" /> 機械設計 学習ライブラリ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          学習を完了すると経験値とスキルが伸び、挑戦できるクエストが広がります。
          学習済み: <b className="text-neon-green">{state.completedMaterials.length}</b> / {MATERIALS.length}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["すべて", ...MATERIAL_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
              category === c
                ? "border-neon-purple bg-neon-purple/15 text-neon-purple"
                : "border-border text-muted-foreground hover:border-neon-purple/50"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.slice(0, 6).map((m) => (
          <MaterialCard key={m.id} material={m} />
        ))}
      </div>

      {filtered.length > 6 && (
        <>
          <AdBanner index={5} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(6).map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        </>
      )}
      {filtered.length <= 6 && <AdBanner index={5} />}
    </div>
  );
}

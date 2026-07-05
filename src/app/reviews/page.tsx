"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { COMPANY_REVIEWS, STUDENT_REVIEWS } from "@/lib/data/reviews";
import { useGame } from "@/lib/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stars } from "@/components/stars";

function RatingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Stars value={value} />
    </div>
  );
}

export default function ReviewsPage() {
  const { hydrated } = useGame();
  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Star className="size-6 text-neon-amber" /> 企業 × 学生 相互評価
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          クエスト完了後は、企業と学生がお互いを評価します。
          評価はオープンに蓄積され、<b className="text-foreground">ブラック案件の防止</b>と
          <b className="text-foreground">がんばる学生の実績証明</b>の両方に役立ちます。
        </p>
      </div>

      <Tabs defaultValue="fromCompany">
        <TabsList>
          <TabsTrigger value="fromCompany">🏢 企業 → 学生の評価</TabsTrigger>
          <TabsTrigger value="fromStudent">🧑‍🔧 学生 → 企業の評価</TabsTrigger>
        </TabsList>

        <TabsContent value="fromCompany" className="space-y-4">
          {COMPANY_REVIEWS.map((r) => {
            const avg =
              (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-sm">{r.questTitle}</CardTitle>
                    <span className="flex items-center gap-1.5 text-sm font-black text-neon-amber">
                      <Stars value={avg} /> {avg.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">評価者: {r.company}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                    <RatingRow label="技術理解" value={r.techUnderstanding} />
                    <RatingRow label="納期遵守" value={r.deadlineCompliance} />
                    <RatingRow label="報告のわかりやすさ" value={r.reporting} />
                    <RatingRow label="成果物品質" value={r.quality} />
                    <RatingRow label="再依頼したい度" value={r.rehireIntent} />
                  </div>
                  <p className="rounded-md bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    💬 {r.comment}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="fromStudent" className="space-y-4">
          {STUDENT_REVIEWS.map((r) => {
            const avg =
              (r.clarity + r.responseSpeed + r.rewardFairness + r.learning + r.safetyCare + r.recommend) / 6;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-sm">{r.company}</CardTitle>
                    <span className="flex items-center gap-1.5 text-sm font-black text-neon-amber">
                      <Stars value={avg} /> {avg.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">対象クエスト: {r.questTitle}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                    <RatingRow label="依頼内容の明確さ" value={r.clarity} />
                    <RatingRow label="質問への回答の早さ" value={r.responseSpeed} />
                    <RatingRow label="報酬の妥当性" value={r.rewardFairness} />
                    <RatingRow label="学びの多さ" value={r.learning} />
                    <RatingRow label="安全配慮" value={r.safetyCare} />
                    <RatingRow label="おすすめ度" value={r.recommend} />
                  </div>
                  <p className="rounded-md bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    💬 {r.comment}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

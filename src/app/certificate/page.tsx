"use client";

import { Award, Printer } from "lucide-react";
import { useGame, playerLevel } from "@/lib/game";
import { SKILLS, skillLevel } from "@/lib/data/skills";
import { titleForLevel } from "@/lib/data/misc";
import { COMPANY_REVIEWS } from "@/lib/data/reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CertificatePage() {
  const { state, hydrated, allQuests, earnedBadges } = useGame();
  if (!hydrated) return null;

  const level = playerLevel(state.xp);
  const completedQuests = state.completedQuests
    .map((id) => allQuests.find((q) => q.id === id))
    .filter((q) => q !== undefined);
  const approvedQuests = completedQuests.filter((q) => q.approvalStatus === "approved");

  const topSkills = SKILLS.map((s) => ({ skill: s, xp: state.skillXp[s.id] ?? 0 }))
    .filter((x) => x.xp > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  const companyAvg =
    COMPANY_REVIEWS.reduce(
      (sum, r) =>
        sum + (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5,
      0
    ) / COMPANY_REVIEWS.length;

  const representative = completedQuests.slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Award className="size-6 text-neon-amber" /> スキル証明書
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            就活・インターン応募に使える実績証明です。「PDF出力」ボタンから印刷またはPDF保存できます。
          </p>
        </div>
        <Button size="lg" onClick={() => window.print()}>
          <Printer /> PDF出力(印刷)
        </Button>
      </div>

      {/* 証明書本体(印刷対象) */}
      <Card className="print-area border-2 border-neon-amber/40 bg-white text-slate-900 print:border-slate-300 print:shadow-none">
        <CardContent className="p-8 sm:p-10">
          <div className="text-center">
            <p className="text-xs tracking-[0.4em] text-slate-500">CERTIFICATE OF TECHNICAL SKILLS</p>
            <h2 className="mt-2 text-3xl font-black tracking-wide">技術スキル証明書</h2>
            <p className="mt-1 text-xs text-slate-500">
              MechaXMatch — 高専生 技術クエストプラットフォーム 発行
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">氏名</p>
            <p className="mt-1 text-2xl font-black">{state.userName}</p>
            <p className="mt-1 text-sm text-slate-600">
              {state.department} {state.grade} / 称号:{titleForLevel(level)}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              { label: "レベル", value: String(level) },
              { label: "総経験値", value: `${state.xp.toLocaleString()} XP` },
              { label: "完了クエスト", value: `${completedQuests.length} 件` },
              { label: "学習済み教材", value: `${state.completedMaterials.length} 本` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-500">{s.label}</p>
                <p className="mt-0.5 text-lg font-black text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="border-b border-slate-200 pb-1 text-sm font-black text-slate-700">
              ■ 得意スキル
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {topSkills.map(({ skill, xp }) => (
                <span
                  key={skill.id}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-700"
                >
                  {skill.icon} {skill.name} Lv.{skillLevel(xp)}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="border-b border-slate-200 pb-1 text-sm font-black text-slate-700">
              ■ 代表的な成果物(教員承認済み案件 {approvedQuests.length} 件を含む)
            </h3>
            <ul className="mt-3 space-y-2">
              {representative.map((q) => (
                <li key={q.id} className="text-sm text-slate-700">
                  <span className="font-bold">・{q.title}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {q.company} / 難易度{"★".repeat(q.difficulty)} / 教員承認済み
                  </span>
                </li>
              ))}
              {representative.length === 0 && (
                <li className="text-sm text-slate-500">(完了クエストなし)</li>
              )}
            </ul>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="border-b border-slate-200 pb-1 text-sm font-black text-slate-700">
                ■ 企業評価平均
              </h3>
              <p className="mt-2 text-2xl font-black text-slate-800">
                {companyAvg.toFixed(1)} <span className="text-sm font-normal text-slate-500">/ 5.0</span>
              </p>
              <p className="text-xs text-slate-500">{COMPANY_REVIEWS.length}件の企業評価に基づく</p>
            </div>
            <div>
              <h3 className="border-b border-slate-200 pb-1 text-sm font-black text-slate-700">
                ■ 獲得バッジ
              </h3>
              <p className="mt-2 text-lg">
                {earnedBadges.map((b) => (
                  <span key={b.id} title={b.name} className="mr-1">
                    {b.icon}
                  </span>
                ))}
              </p>
              <p className="text-xs text-slate-500">{earnedBadges.length}個のバッジを獲得</p>
            </div>
          </div>

          <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500">
              <p>発行日: {new Date().toLocaleDateString("ja-JP")}</p>
              <p className="mt-0.5">
                本証明書の実績はすべて教員による安全確認・承認プロセスを経た案件に基づきます。
              </p>
            </div>
            <div className="text-center">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-red-400 text-[10px] font-bold leading-tight text-red-400">
                Mecha
                <br />
                XMatch
                <br />
                認定
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="print-hidden text-center text-xs text-muted-foreground">
        ※ プロトタイプのため、ブラウザの印刷機能(window.print)によるPDF保存に対応しています
      </p>
    </div>
  );
}

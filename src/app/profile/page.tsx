"use client";

import Link from "next/link";
import { Award, BookOpen, Printer, Swords, Trophy, User } from "lucide-react";
import { useGame, playerLevel } from "@/lib/game";
import { MATERIAL_MAP } from "@/lib/data/materials";
import { SKILLS, skillLevel } from "@/lib/data/skills";
import { AVATARS, BADGES, TITLES, titleForLevel } from "@/lib/data/misc";
import { COMPANY_REVIEWS, STUDENT_REVIEWS } from "@/lib/data/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { state, hydrated, allQuests, earnedBadges, studentStatus, setAvatar } = useGame();
  if (!hydrated) return null;

  const level = playerLevel(state.xp);
  const completedQuests = state.completedQuests
    .map((id) => allQuests.find((q) => q.id === id))
    .filter((q) => q !== undefined);
  const completedMaterials = state.completedMaterials
    .map((id) => MATERIAL_MAP[id])
    .filter(Boolean);

  const topSkills = SKILLS.map((s) => ({ skill: s, xp: state.skillXp[s.id] ?? 0 }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 3);

  const companyAvg =
    COMPANY_REVIEWS.reduce(
      (sum, r) =>
        sum + (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5,
      0
    ) / COMPANY_REVIEWS.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <User className="size-6 text-primary" /> プロフィール & ポートフォリオ
        </h1>
        <Link href="/certificate" className={cn(buttonVariants({ variant: "default" }))}>
          <Printer className="size-4" /> スキル証明書PDF出力
        </Link>
      </div>

      {/* ギルドカード */}
      <Card className="overflow-hidden border-neon-cyan/40">
        <div className="h-1.5 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground">
            <span>GUILD MEMBER CARD</span>
            <span>No. MXM-2026-0042</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple text-4xl">
              {state.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black">{state.userName}</p>
              <p className="text-xs text-muted-foreground">
                {state.department} {state.grade} / Lv.{level} 「{titleForLevel(level)}」
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge variant={state.licenseIssued ? "success" : "warning"}>
                  {state.licenseIssued ? "🪪 見習い技術者ライセンス取得済み" : "🔒 ライセンス未取得"}
                </Badge>
                <Badge variant="purple">{studentStatus}</Badge>
              </div>
            </div>
          </div>
          {/* アバター選択 */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold text-muted-foreground">アバター:</span>
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-lg border text-xl transition-all",
                  state.avatar === a
                    ? "border-primary bg-primary/15 scale-110"
                    : "border-border hover:border-primary/50"
                )}
                aria-label={`アバター ${a}`}
              >
                {a}
              </button>
            ))}
          </div>
          {/* 称号コレクション */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold text-muted-foreground">解放済み称号:</span>
            {TITLES.filter((t) => level >= t.minLevel).map((t) => (
              <Badge key={t.title} variant="secondary">
                👑 {t.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ステータス */}
      <Card className="border-primary/30">
        <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">レベル</p>
            <p className="text-3xl font-black text-primary text-glow">{level}</p>
            <Badge variant="purple" className="mt-1">{titleForLevel(level)}</Badge>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">総経験値</p>
            <p className="text-3xl font-black text-neon-green">{state.xp.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">完了クエスト</p>
            <p className="text-3xl font-black text-neon-amber">{completedQuests.length}</p>
            <p className="text-xs text-muted-foreground">件</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">学習済み教材</p>
            <p className="text-3xl font-black text-neon-purple">{completedMaterials.length}</p>
            <p className="text-xs text-muted-foreground">本</p>
          </div>
        </CardContent>
      </Card>

      {/* 得意スキル + 企業評価 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">💪 得意スキル TOP3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSkills.map(({ skill, xp }, i) => (
              <div key={skill.id} className="flex items-center gap-3">
                <span className="w-5 text-center font-black text-neon-amber">{i + 1}</span>
                <span className="text-lg">{skill.icon}</span>
                <span className="flex-1 text-sm font-bold">{skill.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-black"
                  style={{ background: `${skill.color}22`, color: skill.color }}
                >
                  Lv.{skillLevel(xp)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🏢 企業からの評価</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Stars value={companyAvg} />
              <span className="text-2xl font-black text-neon-amber">{companyAvg.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({COMPANY_REVIEWS.length}件の評価)</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              「{COMPANY_REVIEWS[COMPANY_REVIEWS.length - 1].comment}」
            </p>
            <Link href="/reviews" className="mt-2 inline-block text-xs font-bold text-primary hover:underline">
              あなたが企業につけた評価も見る({STUDENT_REVIEWS.length}件) →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* バッジ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="size-4 text-neon-amber" /> 獲得バッジ({earnedBadges.length}/{BADGES.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const earned = earnedBadges.some((e) => e.id === b.id);
            return (
              <div
                key={b.id}
                className={cn(
                  "rounded-lg border p-3 text-center",
                  earned ? "border-neon-amber/40 bg-neon-amber/5" : "opacity-35 grayscale"
                )}
              >
                <p className="text-2xl">{b.icon}</p>
                <p className="mt-1 text-xs font-bold leading-tight">{b.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{b.rarity}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ポートフォリオ実績一覧 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Swords className="size-4 text-primary" /> ポートフォリオ実績(完了クエスト)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {completedQuests.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              まだ実績がありません。クエストに挑戦しよう!
            </p>
          )}
          {completedQuests.map((q) => (
            <Link
              key={q.id}
              href={`/quests/${q.id}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:border-primary/50"
            >
              <span>🏆</span>
              <span className="min-w-0 flex-1 font-bold">{q.title}</span>
              <span className="text-xs text-muted-foreground">{q.company}</span>
              <Badge variant="success">✅ 教員承認済み案件</Badge>
              <span className="text-xs font-bold text-neon-green">+{q.xp} XP</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* 学習済み教材 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="size-4 text-neon-purple" /> 学習済み教材
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {completedMaterials.map((m) => (
            <div key={m.id} className="rounded-lg border p-3 text-sm">
              <p className="font-bold leading-snug">📖 {m.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {m.category} ・ +{m.xp} XP
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-muted-foreground">
            <Award className="mr-1 inline size-4 text-neon-amber" />
            この実績は就活・インターン応募に使える<b className="text-foreground">スキル証明書</b>として出力できます
          </p>
          <Link href="/certificate" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            証明書プレビューへ →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

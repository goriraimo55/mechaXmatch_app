"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, CheckCircle2, Flame, Gift, Lock, Mail,
  ShieldCheck, Swords, Trophy,
} from "lucide-react";
import { useGame, playerLevel, levelProgress, qualificationSteps } from "@/lib/game";
import { MATERIALS } from "@/lib/data/materials";
import {
  BADGES, DAILY_QUESTS, LIMITED_EVENT, NATIONAL_RANKING, RANKING,
  SCOUTS, SKILL_RANKING, WEEKLY_MISSIONS, titleForLevel,
} from "@/lib/data/misc";
import type { RankingEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestCard } from "@/components/quest-parts";
import { AdBanner } from "@/components/ad-banner";
import { cn } from "@/lib/utils";

function SectionTitle({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-black tracking-wide">
        {icon} {title}
      </h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          すべて見る <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function RankingList({ entries, me }: { entries: RankingEntry[]; me?: RankingEntry }) {
  const list = [
    ...entries.map((r) => ({ ...r, isMe: false })),
    ...(me ? [{ ...me, isMe: true }] : []),
  ].sort((a, b) => b.weeklyXp - a.weeklyXp);
  return (
    <div>
      {list.map((r, i) => (
        <div
          key={r.name}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2",
            r.isMe && "bg-primary/10 ring-1 ring-primary/40"
          )}
        >
          <span
            className={cn(
              "w-7 text-center font-black",
              i === 0 && "text-xl text-neon-amber",
              i === 1 && "text-lg text-slate-300",
              i === 2 && "text-lg text-orange-400"
            )}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{r.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {r.department} ・ Lv.{r.level}
            </p>
          </div>
          <span className="text-sm font-black text-neon-green">
            {r.weeklyXp.toLocaleString()} XP
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { state, hydrated, allQuests, earnedBadges, completeDaily, completeWeekly, openChest } =
    useGame();
  const level = playerLevel(state.xp);
  const prog = levelProgress(state.xp);

  const recommendedQuests = allQuests
    .filter((q) => q.approvalStatus === "approved" && !state.completedQuests.includes(q.id))
    .sort((a, b) => (b.isRare ? 1 : 0) - (a.isRare ? 1 : 0))
    .slice(0, 3);

  const recommendedMaterials = MATERIALS.filter(
    (m) => !state.completedMaterials.includes(m.id)
  ).slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);
  const dailyDone = state.dailyMissionProgress.date === today ? state.dailyMissionProgress.done : [];
  const chestOpened = state.lastChestDate === today;

  const weeklyDone = state.weeklyMissionProgress.done;
  const weeklyMetric = (metric: string, target: number) => {
    const current =
      metric === "weeklyXp"
        ? state.weeklyXp
        : metric === "materials"
          ? state.completedMaterials.length
          : dailyDone.length;
    return { current: Math.min(current, target), reached: current >= target };
  };

  const me: RankingEntry = {
    name: `${state.userName}(あなた)`,
    department: state.department,
    grade: state.grade,
    weeklyXp: state.weeklyXp,
    level,
  };

  const steps = qualificationSteps(state);
  const currentStatusIndex = steps.reduce((acc, s, i) => (s.achieved ? i : acc), -1);

  if (!hydrated) {
    return <p className="py-20 text-center text-muted-foreground">ギルドホールに入場中…</p>;
  }

  return (
    <div className="space-y-8">
      {/* 初回:ライセンス未取得ならプロローグへの誘導を最上部に */}
      {!state.licenseIssued && (
        <Card className="animate-pop-in border-neon-amber/50 glow-amber">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <span className="text-5xl">🪪</span>
            <div className="flex-1">
              <h2 className="text-lg font-black text-neon-amber">
                ミッション:見習い技術者ライセンスを取得せよ
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                君は技術者ギルドの新人メンバー。企業クエストを受注するには、
                工学倫理・機密情報・安全管理の講習とミニテストの合格が必要だ。
                合格報酬 <b className="text-neon-green">+300 XP</b> +ライセンスバッジ。
              </p>
            </div>
            <Link href="/tutorial" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
              講習をはじめる <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ヒーローカード:プレイヤーステータス */}
      <Card className="relative overflow-hidden border-primary/30 glow-cyan">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-purple/10" />
        <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple text-4xl shadow-lg">
              {state.avatar}
            </div>
            <div>
              <Badge variant="purple" className="mb-1">
                称号:{titleForLevel(level)}
              </Badge>
              <h1 className="text-2xl font-black">{state.userName}</h1>
              <p className="text-xs text-muted-foreground">
                {state.department} {state.grade}
              </p>
            </div>
          </div>
          <div className="flex-1 sm:pl-4">
            <div className="flex items-end justify-between">
              <p className="text-sm text-muted-foreground">
                レベル <span className="text-3xl font-black text-primary text-glow">{level}</span>
              </p>
              <p className="text-sm font-bold text-neon-green">
                総経験値 {state.xp.toLocaleString()} XP
              </p>
            </div>
            <Progress value={prog.percent} className="mt-2 h-3" />
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>次のレベルまで {prog.next - prog.current} XP</span>
              <span className="flex items-center gap-1 font-bold text-neon-amber">
                <Flame className="size-4" /> {state.loginStreak}日連続で学習中!
              </span>
            </div>
            {prog.percent >= 80 && (
              <p className="mt-2 animate-pulse text-xs font-black text-neon-amber">
                ⚡ あと {prog.next - prog.current} XP でレベルアップ!教材1本で届くぞ!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 現在の受注資格 */}
      <section>
        <SectionTitle icon={<ShieldCheck className="size-5 text-neon-green" />} title="現在の受注資格" />
        <Card className={state.licenseIssued ? "border-neon-green/40" : "border-neon-amber/40"}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={state.licenseIssued ? "success" : "warning"} className="text-sm">
                {state.licenseIssued ? "🪪" : "🔒"} {steps[currentStatusIndex]?.label ?? "未登録"}
              </Badge>
              {state.licenseIssued && state.licenseIssuedAt && (
                <span className="text-xs text-muted-foreground">
                  ライセンス発行日: {new Date(state.licenseIssuedAt).toLocaleDateString("ja-JP")}
                  {state.tutorialQuizScore !== null && ` / 修了テスト ${state.tutorialQuizScore}点`}
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((s) => (
                <div
                  key={s.label}
                  className={cn(
                    "rounded-lg border p-3 text-xs",
                    s.achieved
                      ? "border-neon-green/40 bg-neon-green/5"
                      : "border-border opacity-60"
                  )}
                >
                  <p className="flex items-center gap-1.5 font-bold">
                    {s.achieved ? (
                      <CheckCircle2 className="size-3.5 text-neon-green" />
                    ) : (
                      <Lock className="size-3.5 text-muted-foreground" />
                    )}
                    {s.label}
                  </p>
                  {!s.achieved && <p className="mt-1 text-muted-foreground">{s.hint}</p>}
                </div>
              ))}
            </div>
            {!state.licenseIssued && (
              <Link
                href="/tutorial"
                className={cn(buttonVariants({ variant: "warning", size: "sm" }), "mt-4")}
              >
                🪪 ライセンス講習を受ける →
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ログインボーナス(宝箱+スタンプカード)+ 期間限定イベント */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-neon-amber/30">
          <CardContent className="flex items-center gap-4 p-5">
            <button
              type="button"
              onClick={openChest}
              disabled={chestOpened}
              className={cn(
                "flex size-16 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-4xl transition-transform",
                chestOpened
                  ? "bg-secondary opacity-60"
                  : "animate-pulse-glow bg-neon-amber/15 hover:scale-110"
              )}
              aria-label="ログインボーナスの宝箱"
            >
              {chestOpened ? "📭" : "🎁"}
            </button>
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-sm font-black">
                <Gift className="size-4 text-neon-amber" /> 連続ログインボーナス
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {chestOpened
                  ? `本日開封済み:「${state.lastChestReward?.name}」+${state.lastChestReward?.xp} XP`
                  : "宝箱をタップしてランダム報酬をゲット!"}
              </p>
              {/* スタンプカード */}
              <div className="mt-2 flex gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border text-xs",
                      i < state.loginStamps
                        ? "border-neon-amber bg-neon-amber/20"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {i < state.loginStamps ? "⚙️" : i + 1}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neon-pink/30">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="text-4xl">{LIMITED_EVENT.icon}</span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-black">
                <Badge variant="pink">期間限定イベント</Badge>
                {LIMITED_EVENT.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {LIMITED_EVENT.description}
              </p>
              <p className="mt-1 text-xs font-bold text-neon-pink">
                ⏰ {LIMITED_EVENT.until} まで
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 所持バッジ */}
      <section>
        <SectionTitle icon={<Trophy className="size-5 text-neon-amber" />} title="所持バッジ・実績" href="/profile" />
        <div className="flex gap-3 overflow-x-auto pb-1">
          {BADGES.map((b) => {
            const earned = earnedBadges.some((e) => e.id === b.id);
            return (
              <div
                key={b.id}
                title={b.description}
                className={cn(
                  "flex w-24 shrink-0 flex-col items-center gap-1 rounded-lg border p-3 text-center",
                  earned ? "border-neon-amber/40 bg-neon-amber/5" : "opacity-35 grayscale"
                )}
              >
                <span className="text-2xl">{b.icon}</span>
                <span className="text-[10px] font-bold leading-tight">{b.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* デイリー & ウィークリーミッション */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle icon={<CheckCircle2 className="size-5 text-neon-green" />} title="デイリーミッション" />
          <div className="space-y-3">
            {DAILY_QUESTS.map((d) => {
              const done = dailyDone.includes(d.id);
              return (
                <Card key={d.id} className={cn(done && "border-neon-green/40 bg-neon-green/5")}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="text-2xl">{d.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-snug">{d.title}</p>
                      <p className="text-xs text-neon-green">+{d.xp} XP</p>
                    </div>
                    <Button
                      size="sm"
                      variant={done ? "success" : "default"}
                      disabled={done}
                      onClick={() => completeDaily(d.id, d.xp)}
                    >
                      {done ? "達成" : "完了"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle icon={<CheckCircle2 className="size-5 text-neon-purple" />} title="ウィークリーミッション" />
          <div className="space-y-3">
            {WEEKLY_MISSIONS.map((w) => {
              const { current, reached } = weeklyMetric(w.metric, w.target);
              const done = weeklyDone.includes(w.id);
              return (
                <Card key={w.id} className={cn(done && "border-neon-purple/40 bg-neon-purple/5")}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="text-2xl">{w.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-snug">{w.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={(current / w.target) * 100} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">
                          {current}/{w.target}
                        </span>
                      </div>
                      <p className="text-xs text-neon-purple">報酬 +{w.xp} XP</p>
                    </div>
                    <Button
                      size="sm"
                      variant={done ? "success" : "secondary"}
                      disabled={done || !reached}
                      onClick={() => completeWeekly(w.id, w.xp)}
                    >
                      {done ? "達成" : reached ? "受取" : "挑戦中"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      {/* 企業からのスカウト */}
      <section>
        <SectionTitle icon={<Mail className="size-5 text-neon-pink" />} title="企業からのスカウト" />
        <div className="grid gap-3 sm:grid-cols-2">
          {SCOUTS.map((s) => (
            <Card key={s.id} className="border-neon-pink/30 transition-colors hover:border-neon-pink/60">
              <CardContent className="flex items-start gap-3 p-4">
                <span className="text-3xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-neon-pink">📨 スカウトが届いています</p>
                  <p className="mt-0.5 text-sm font-bold">{s.company}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.message}</p>
                  <Link
                    href={`/quests/${s.questId}`}
                    className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                  >
                    クエストを見る →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* おすすめクエスト */}
      <section>
        <SectionTitle icon={<Swords className="size-5 text-primary" />} title="今日のおすすめクエスト" href="/quests" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendedQuests.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      </section>

      {/* 広告枠 */}
      <AdBanner index={0} count={2} />

      {/* おすすめ学習 + ランキング */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle icon={<BookOpen className="size-5 text-neon-purple" />} title="おすすめ学習" href="/learn" />
          <div className="space-y-3">
            {recommendedMaterials.map((m) => (
              <Card key={m.id} className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neon-purple/15 text-lg">
                    📖
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href="/learn" className="text-sm font-bold leading-snug hover:text-primary">
                      {m.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {m.category} ・ 約{m.minutes}分 ・{" "}
                      <span className="font-bold text-neon-green">+{m.xp} XP</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={<Trophy className="size-5 text-neon-amber" />} title="今週のランキング" />
          <Card>
            <CardContent className="p-3">
              <Tabs defaultValue="class">
                <TabsList className="w-full">
                  <TabsTrigger value="class" className="flex-1">クラス内</TabsTrigger>
                  <TabsTrigger value="national" className="flex-1">全国高専</TabsTrigger>
                  <TabsTrigger value="skill" className="flex-1">スキル別</TabsTrigger>
                </TabsList>
                <TabsContent value="class" className="mt-2">
                  <RankingList entries={RANKING} me={me} />
                </TabsContent>
                <TabsContent value="national" className="mt-2">
                  <RankingList entries={NATIONAL_RANKING} me={me} />
                </TabsContent>
                <TabsContent value="skill" className="mt-2">
                  <p className="px-3 pb-1 text-xs font-bold text-muted-foreground">
                    🖥️ {SKILL_RANKING.skillName} 部門(週間スキルXP)
                  </p>
                  <RankingList entries={SKILL_RANKING.entries} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* コンセプト導線 */}
      <Card className="border-neon-purple/30">
        <CardHeader>
          <CardTitle className="text-base">🏰 MechaXMatch のあそびかた</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p>🪪 <b className="text-foreground">ライセンス講習</b>で倫理・安全・機密の心得を学ぶ</p>
          <p>⚔️ <b className="text-foreground">企業の技術課題</b>に挑むと経験値と報酬がもらえる</p>
          <p>✅ <b className="text-foreground">教員が安全性を確認</b>した案件だけが公開される</p>
          <p>🏆 実績は<b className="text-foreground">ポートフォリオと証明書</b>になり就活で使える</p>
        </CardContent>
      </Card>
    </div>
  );
}

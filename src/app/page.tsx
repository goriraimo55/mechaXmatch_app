"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Flame, Swords, Trophy } from "lucide-react";
import { useGame, playerLevel, levelProgress } from "@/lib/game";
import { MATERIALS } from "@/lib/data/materials";
import { BADGES, DAILY_QUESTS, RANKING, titleForLevel } from "@/lib/data/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

export default function HomePage() {
  const { state, hydrated, allQuests, earnedBadges, completeDaily } = useGame();
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
  const dailyDone = state.daily.date === today ? state.daily.done : [];

  const ranking = [
    ...RANKING.map((r) => ({ ...r, isMe: false })),
    {
      name: `${state.userName}(あなた)`,
      department: state.department,
      grade: state.grade,
      weeklyXp: state.weeklyXp,
      level,
      isMe: true,
    },
  ].sort((a, b) => b.weeklyXp - a.weeklyXp);

  if (!hydrated) {
    return <p className="py-20 text-center text-muted-foreground">ギルドホールに入場中…</p>;
  }

  return (
    <div className="space-y-8">
      {/* ヒーローカード:プレイヤーステータス */}
      <Card className="relative overflow-hidden border-primary/30 glow-cyan">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-purple/10" />
        <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple text-4xl shadow-lg">
              🧑‍🔧
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
                <Flame className="size-4" /> {state.streak}日連続で学習中!
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 所持バッジ */}
      <section>
        <SectionTitle icon={<Trophy className="size-5 text-neon-amber" />} title="所持バッジ" href="/profile" />
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

      {/* デイリークエスト */}
      <section>
        <SectionTitle icon={<CheckCircle2 className="size-5 text-neon-green" />} title="デイリークエスト" />
        <div className="grid gap-3 sm:grid-cols-3">
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

      {/* おすすめクエスト */}
      <section>
        <SectionTitle icon={<Swords className="size-5 text-primary" />} title="おすすめクエスト" href="/quests" />
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
            <CardContent className="p-2">
              {ranking.map((r, i) => (
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
          <p>📖 <b className="text-foreground">学ぶ</b>とスキルが伸びて、挑めるクエストが増える</p>
          <p>⚔️ <b className="text-foreground">企業の技術課題</b>に挑むと経験値と報酬がもらえる</p>
          <p>✅ <b className="text-foreground">教員が安全性を確認</b>した案件だけが公開される</p>
          <p>🏆 実績は<b className="text-foreground">ポートフォリオと証明書</b>になり就活で使える</p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import { Swords } from "lucide-react";
import { useGame } from "@/lib/game";
import { QuestCard } from "@/components/quest-parts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | "remote" | "onsite" | "rare" | "accepted" | "completed";

export default function QuestsPage() {
  const { state, hydrated, allQuests } = useGame();
  const [filter, setFilter] = React.useState<Filter>("all");

  // 学生には「却下」以外を表示(承認待ちはグレー表示で挑戦不可)
  const visible = allQuests.filter((q) => q.approvalStatus !== "rejected");

  const filtered = visible.filter((q) => {
    switch (filter) {
      case "remote": return q.remoteOk;
      case "onsite": return !q.remoteOk;
      case "rare": return !!q.isRare;
      case "accepted": return state.acceptedQuests.includes(q.id);
      case "completed": return state.completedQuests.includes(q.id);
      default: return true;
    }
  });

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Swords className="size-6 text-primary" /> クエストボード
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          企業から届いた技術課題。挑戦して経験値と報酬、そして実績を手に入れよう。
          <span className="text-neon-green">✅ 教員承認済み</span>のクエストだけが挑戦できます。
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">すべて ({visible.length})</TabsTrigger>
          <TabsTrigger value="remote">リモート可</TabsTrigger>
          <TabsTrigger value="onsite">現地あり</TabsTrigger>
          <TabsTrigger value="rare">✨レア</TabsTrigger>
          <TabsTrigger value="accepted">挑戦中 ({state.acceptedQuests.length})</TabsTrigger>
          <TabsTrigger value="completed">達成済み ({state.completedQuests.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((q) => (
          <QuestCard key={q.id} quest={q} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          該当するクエストがありません
        </p>
      )}
    </div>
  );
}

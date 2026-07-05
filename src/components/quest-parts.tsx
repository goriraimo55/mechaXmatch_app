"use client";

/** クエスト表示用の小さな共通パーツ群 */

import Link from "next/link";
import {
  AlertTriangle, Building2, CalendarDays, Coins, GraduationCap,
  MapPin, ShieldCheck, Sparkles, Users, Wifi,
} from "lucide-react";
import type { ApprovalStatus, DangerLabel, Quest } from "@/lib/types";
import { SKILL_MAP } from "@/lib/data/skills";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import { useGame } from "@/lib/game";
import { cn } from "@/lib/utils";

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, { label: string; variant: "success" | "warning" | "danger" | "purple" }> = {
    approved: { label: "✅ 教員承認済み", variant: "success" },
    pending: { label: "⏳ 教員承認待ち", variant: "warning" },
    returned: { label: "↩️ 差し戻し", variant: "purple" },
    rejected: { label: "🚫 却下", variant: "danger" },
  };
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

const DANGER_STYLE: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  "リモートのみ": "success",
  "学校設備使用": "secondary",
  "現場訪問あり": "warning",
  "工具使用あり": "warning",
  "回転体あり": "danger",
  "高温部品あり": "danger",
  "高電圧注意": "danger",
  "薬品使用あり": "danger",
  "重量物あり": "warning",
  "教員立会い推奨": "warning",
};

export function DangerLabels({ labels, className }: { labels: DangerLabel[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {labels.map((l) => (
        <Badge key={l} variant={DANGER_STYLE[l] ?? "secondary"}>
          {DANGER_STYLE[l] === "danger" && <AlertTriangle />}
          {l}
        </Badge>
      ))}
    </div>
  );
}

export function SkillChips({ skillIds }: { skillIds: Quest["requiredSkills"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skillIds.map((id) => {
        const s = SKILL_MAP[id];
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: `${s.color}1a`, color: s.color, border: `1px solid ${s.color}44` }}
          >
            {s.icon} {s.name}
          </span>
        );
      })}
    </div>
  );
}

/** クエスト一覧用カード */
export function QuestCard({ quest }: { quest: Quest }) {
  const { state, acceptQuest } = useGame();
  const accepted = state.acceptedQuests.includes(quest.id);
  const completed = state.completedQuests.includes(quest.id);
  const challengeable = quest.approvalStatus === "approved" && !completed;

  const inner = (
    <Card
      className={cn(
        "flex h-full flex-col transition-all hover:-translate-y-0.5 hover:border-primary/50",
        quest.isRare && "border-transparent"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {quest.isRare && (
            <Badge variant="warning" className="animate-pulse-glow">
              <Sparkles /> レアクエスト
            </Badge>
          )}
          {quest.isTeam && (
            <Badge variant="purple">
              <Users /> チーム
            </Badge>
          )}
          <ApprovalBadge status={quest.approvalStatus} />
        </div>
        <CardTitle className="text-base leading-snug">
          <Link href={`/quests/${quest.id}`} className="hover:text-primary">
            {quest.title}
          </Link>
        </CardTitle>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" /> {quest.company}
          <span className="text-border">|</span>
          <Stars value={quest.companyRating} />
          <span>({quest.companyRatingCount})</span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            難易度 <Stars value={quest.difficulty} color="text-neon-pink" />
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="size-3.5" /> {quest.recommendedGrade}
          </span>
          <span className="flex items-center gap-1 font-bold text-neon-amber">
            <Coins className="size-3.5" /> ¥{quest.reward.toLocaleString()}
          </span>
          <span className="font-bold text-neon-green">+{quest.xp} XP</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" /> 〆 {quest.deadline}
          </span>
          <span className="flex items-center gap-1">
            {quest.remoteOk ? (
              <>
                <Wifi className="size-3.5 text-neon-green" /> リモート可
              </>
            ) : (
              <>
                <MapPin className="size-3.5 text-neon-amber" /> 現地あり
              </>
            )}
          </span>
          <span className="col-span-2 flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> 安全レベル: {quest.safetyLevel}
            {quest.teacherCheckRequired && (
              <span className="text-neon-amber">/ 教員確認が必要</span>
            )}
          </span>
        </div>
        <SkillChips skillIds={quest.requiredSkills} />
        <DangerLabels labels={quest.dangerLabels} />
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href={`/quests/${quest.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
          >
            詳細を見る
          </Link>
          <Button
            size="sm"
            className="flex-1"
            disabled={!challengeable || accepted}
            onClick={() => acceptQuest(quest.id)}
          >
            {completed ? "達成済み" : accepted ? "挑戦中" : challengeable ? "⚔️ 挑戦する" : "承認待ち"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (quest.isRare) {
    return <div className="rare-quest-border h-full rounded-lg p-[1.5px]">{inner}</div>;
  }
  return inner;
}

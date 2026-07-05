"use client";

import * as React from "react";
import {
  Building2, CheckCircle2, Coins, GraduationCap, Lock, RotateCcw,
  ShieldCheck, Wrench, XCircle,
} from "lucide-react";
import type { Quest } from "@/lib/types";
import { useGame } from "@/lib/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ApprovalBadge, DangerLabels } from "@/components/quest-parts";
import { Stars } from "@/components/stars";

function PendingQuestCard({ quest }: { quest: Quest }) {
  const { setQuestStatus } = useGame();
  const [comment, setComment] = React.useState("");

  const act = (status: "approved" | "returned" | "rejected") =>
    setQuestStatus(quest.id, status, comment || undefined);

  return (
    <Card className="border-neon-amber/30">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <ApprovalBadge status={quest.approvalStatus} />
          {quest.ndaRequired && (
            <Badge variant="secondary">
              <Lock /> 秘密保持あり
            </Badge>
          )}
          {quest.teacherCheckRequired && (
            <Badge variant="warning">
              <ShieldCheck /> 教員確認の希望あり
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{quest.title}</CardTitle>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="size-4" /> {quest.company}({quest.industry})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-muted-foreground">依頼内容</p>
            <p className="mt-0.5 leading-relaxed">{quest.request}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground">学生にとって学べること</p>
            <p className="mt-0.5 leading-relaxed">{quest.learnPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-md bg-secondary/60 p-2.5">
            <p className="text-muted-foreground">報酬</p>
            <p className="flex items-center gap-1 font-bold text-neon-amber">
              <Coins className="size-3.5" />¥{quest.reward.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md bg-secondary/60 p-2.5">
            <p className="text-muted-foreground">推奨学年</p>
            <p className="flex items-center gap-1 font-bold">
              <GraduationCap className="size-3.5" />
              {quest.recommendedGrade}
            </p>
          </div>
          <div className="rounded-md bg-secondary/60 p-2.5">
            <p className="text-muted-foreground">難易度</p>
            <Stars value={quest.difficulty} color="text-neon-pink" />
          </div>
          <div className="rounded-md bg-secondary/60 p-2.5">
            <p className="text-muted-foreground">使用設備</p>
            <p className="flex items-center gap-1 font-bold">
              <Wrench className="size-3.5" />
              {quest.equipment[0] ?? "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-muted-foreground">危険度ラベル</p>
          <DangerLabels labels={quest.dangerLabels} />
        </div>

        {quest.cautions.length > 0 && (
          <div className="rounded-md border border-neon-amber/30 bg-neon-amber/5 p-3 text-xs">
            <p className="font-bold text-neon-amber">安全面の注意(企業記入)</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
              {quest.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">教員コメント(学生・企業に表示されます)</p>
          <Textarea
            rows={2}
            placeholder="例:現場訪問時は必ず引率教員に連絡すること。作業内容は3年生でも安全に実施可能と判断。"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="success" onClick={() => act("approved")}>
              <CheckCircle2 /> 承認する
            </Button>
            <Button variant="warning" onClick={() => act("returned")}>
              <RotateCcw /> 差し戻す
            </Button>
            <Button variant="destructive" onClick={() => act("rejected")}>
              <XCircle /> 却下する
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherPage() {
  const { hydrated, allQuests } = useGame();
  if (!hydrated) return null;

  const pending = allQuests.filter((q) => q.approvalStatus === "pending");
  const processed = allQuests.filter(
    (q) => q.teacherComment && q.approvalStatus !== "pending"
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <ShieldCheck className="size-6 text-neon-green" /> 教員承認画面
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          企業から投稿された案件の<b className="text-foreground">安全性・難易度・守秘義務</b>を確認してください。
          承認された案件だけが、学生のクエストボードで「挑戦可能」になります。
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-neon-amber/40 bg-neon-amber/10 p-4">
        <span className="text-2xl">⏳</span>
        <p className="text-sm">
          承認待ちのクエストが <b className="text-lg text-neon-amber">{pending.length}</b> 件あります
        </p>
      </div>

      <div className="space-y-5">
        {pending.map((q) => (
          <PendingQuestCard key={q.id} quest={q} />
        ))}
        {pending.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            🎉 承認待ちの案件はありません
          </p>
        )}
      </div>

      {processed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-black tracking-widest text-muted-foreground">
            処理済みの案件
          </h2>
          <div className="space-y-2">
            {processed.map((q) => (
              <Card key={q.id}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <ApprovalBadge status={q.approvalStatus} />
                  <span className="min-w-0 flex-1 truncate font-bold">{q.title}</span>
                  <span className="text-xs text-muted-foreground">{q.company}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

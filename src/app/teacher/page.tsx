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

/** 承認時チェックリスト(全項目確認で承認ボタンが有効化) */
const APPROVAL_CHECKLIST = [
  "教育効果があるか",
  "学生の学年・技能に合っているか",
  "安全上の問題がないか",
  "機密情報の扱いが明確か",
  "成果物が明確か",
  "報酬または学習価値が妥当か",
  "教員の監督負荷が過大でないか",
];

/** 差し戻し理由テンプレート */
const RETURN_TEMPLATES = [
  "危険度ラベルと作業内容が一致していません。実作業に含まれる危険源を追記のうえ再申請してください。",
  "推奨学年に対して難易度が高すぎます。作業範囲の縮小、または推奨学年の引き上げを検討してください。",
  "機密情報の共有範囲・保存方法が不明確です。「使ってよいデータ」と公開段階を具体化してください。",
  "成果物の定義が曖昧です。提出物の形式・数量・評価基準を明確にしてください。",
  "報酬と作業量のバランスが取れていません。作業時間の見積りとあわせて再検討をお願いします。",
];

function PendingQuestCard({ quest }: { quest: Quest }) {
  const { setQuestStatus } = useGame();
  const [comment, setComment] = React.useState("");
  const [checks, setChecks] = React.useState<boolean[]>(
    Array(APPROVAL_CHECKLIST.length).fill(false)
  );
  const allChecked = checks.every(Boolean);

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

        {/* 承認時チェックリスト */}
        <div className="rounded-lg border border-neon-green/30 bg-neon-green/5 p-3">
          <p className="mb-2 text-xs font-black text-neon-green">
            ✅ 承認時チェックリスト({checks.filter(Boolean).length}/{APPROVAL_CHECKLIST.length})
            — 全項目の確認で承認ボタンが有効になります
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {APPROVAL_CHECKLIST.map((item, i) => (
              <label key={item} className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) =>
                    setChecks((prev) => prev.map((c, ci) => (ci === i ? e.target.checked : c)))
                  }
                  className="size-3.5 accent-green-400"
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">教員コメント(学生・企業に表示されます)</p>
          <Textarea
            rows={2}
            placeholder="例:現場訪問時は必ず引率教員に連絡すること。作業内容は3年生でも安全に実施可能と判断。"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground">差し戻し理由テンプレ:</span>
            {RETURN_TEMPLATES.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setComment(t)}
                title={t}
                className="cursor-pointer rounded-full border border-neon-amber/40 px-2 py-0.5 text-[10px] text-neon-amber transition-colors hover:bg-neon-amber/10"
              >
                {["危険度不一致", "難易度過大", "機密範囲不明", "成果物曖昧", "報酬不均衡"][i]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              disabled={!allChecked}
              title={allChecked ? undefined : "チェックリストの全項目を確認してください"}
              onClick={() => act("approved")}
            >
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

/** 学生のライセンス状況一覧(自分以外はダミー) */
const CLASSMATE_STATUSES = [
  { name: "アオイ@機械5年", tutorial: true, license: true, score: 100 },
  { name: "リク@機械4年", tutorial: true, license: true, score: 83 },
  { name: "ソウタ@機械3年", tutorial: true, license: true, score: 83 },
  { name: "サクラ@物質2年", tutorial: false, license: false, score: null },
  { name: "カイト@情報2年", tutorial: false, license: false, score: null },
];

export default function TeacherPage() {
  const { state, hydrated, allQuests, studentStatus } = useGame();
  if (!hydrated) return null;

  const pending = allQuests.filter((q) => q.approvalStatus === "pending");
  const processed = allQuests.filter(
    (q) => q.teacherComment && q.approvalStatus !== "pending"
  );
  const highRisk = allQuests.filter(
    (q) => q.safetyLevel === "高" || q.dangerLabels.some((l) =>
      ["高電圧注意", "薬品使用あり", "回転体あり", "高温部品あり"].includes(l))
  );
  const ndaQuests = allQuests.filter((q) => q.ndaRequired);

  const students = [
    {
      name: `${state.userName}(本アカウント)`,
      tutorial: state.tutorialCompleted,
      license: state.licenseIssued,
      score: state.tutorialQuizScore,
      status: studentStatus,
    },
    ...CLASSMATE_STATUSES.map((c) => ({
      ...c,
      status: c.license ? "企業クエスト受注可能" : "ライセンス未取得",
    })),
  ];

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

      {/* 学生のチュートリアル・ライセンス状況 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">🪪 学生のチュートリアル・ライセンス取得状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {students.map((s) => (
            <div
              key={s.name}
              className="flex flex-wrap items-center gap-2 rounded-md border p-2.5 text-xs"
            >
              <span className="min-w-0 flex-1 truncate font-bold">{s.name}</span>
              <Badge variant={s.tutorial ? "success" : "warning"}>
                {s.tutorial ? "講習修了" : "講習未修了"}
              </Badge>
              <Badge variant={s.license ? "success" : "secondary"}>
                {s.license ? `ライセンス取得済み${s.score !== null ? `(${s.score}点)` : ""}` : "ライセンス未取得"}
              </Badge>
              <span className="text-muted-foreground">{s.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 要注意案件の一覧 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">⚠️ 危険度の高い案件({highRisk.length}件)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {highRisk.map((q) => (
              <div key={q.id} className="rounded-md border border-destructive/20 p-2">
                <p className="font-bold">{q.title}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {q.company} / 安全レベル: {q.safetyLevel} / {q.dangerLabels.join("・")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-neon-purple/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neon-purple">🔐 機密情報あり案件({ndaQuests.length}件)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {ndaQuests.map((q) => (
              <div key={q.id} className="rounded-md border border-neon-purple/20 p-2">
                <p className="font-bold">{q.title}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {q.company} / NDA必須 / {q.approvalStatus === "approved" ? "承認済み" : "承認待ち"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
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

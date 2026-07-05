"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Send } from "lucide-react";
import type { DangerLabel, SkillId } from "@/lib/types";
import { SKILLS } from "@/lib/data/skills";
import { useGame } from "@/lib/game";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DANGER_OPTIONS: DangerLabel[] = [
  "リモートのみ", "学校設備使用", "現場訪問あり", "工具使用あり", "回転体あり",
  "高温部品あり", "高電圧注意", "薬品使用あり", "重量物あり", "教員立会い推奨",
];

const INDUSTRIES = [
  "機械加工", "精密部品加工", "溶接・板金", "産業機械組立", "FA・自動化設備",
  "制御盤製作", "計測・検査", "試作・3Dプリント", "ロボット開発", "その他製造業",
];

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function PostQuestPage() {
  const router = useRouter();
  const { postQuest } = useGame();
  const [submitted, setSubmitted] = React.useState(false);

  const [form, setForm] = React.useState({
    title: "",
    company: "",
    industry: INDUSTRIES[0],
    problem: "",
    request: "",
    deliverables: "",
    allowedData: "",
    ndaRequired: false,
    requiredSkills: [] as SkillId[],
    recommendedGrade: "3年生以上",
    difficulty: 2,
    reward: 8000,
    deadline: "",
    remoteOk: true,
    usesSchoolEquipment: false,
    teacherCheckRequired: false,
    safetyNotes: "",
    dangerLabels: [] as DangerLabel[],
    teamOk: false,
    learnPoints: "",
    submissionFormat: "PDFレポート",
    criteria: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleSkill = (id: SkillId) =>
    set(
      "requiredSkills",
      form.requiredSkills.includes(id)
        ? form.requiredSkills.filter((s) => s !== id)
        : [...form.requiredSkills, id]
    );

  const toggleDanger = (l: DangerLabel) =>
    set(
      "dangerLabels",
      form.dangerLabels.includes(l)
        ? form.dangerLabels.filter((x) => x !== l)
        : [...form.dangerLabels, l]
    );

  const valid =
    form.title && form.company && form.problem && form.request && form.deadline &&
    form.learnPoints && form.requiredSkills.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    postQuest(form);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <CheckCircle2 className="mx-auto size-16 text-neon-green" />
        <h1 className="mt-4 text-2xl font-black">投稿を受け付けました</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          ご依頼は現在<b className="text-neon-amber">「教員承認待ち」</b>です。
          担当教員が安全性・難易度・守秘義務を確認したのち、
          学生のクエストボードで「挑戦可能」として公開されます。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            続けて投稿する
          </Button>
          <Button onClick={() => router.push("/quests")}>クエスト一覧を確認</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Building2 className="size-6 text-primary" /> 企業向け:仕事投稿テンプレート
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          このフォームに沿って入力するだけで、御社の「小さな技術課題」が高専生の「成長クエスト」になります。
          投稿後は<b className="text-foreground">教員が安全性・難易度・守秘義務を確認</b>してから学生に公開されるため、安心してご依頼いただけます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. 基本情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="依頼タイトル" required hint="例:古い図面を3D CAD化してほしい">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
            </div>
            <Field label="会社名" required>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="業種">
              <Select value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. 依頼内容</CardTitle>
            <CardDescription>学生が読んでイメージできる言葉でお書きください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="困っていること(背景)" required>
              <Textarea
                rows={3}
                placeholder="例:ベテランが残した紙図面が多く、設変のたびに探すのが大変…"
                value={form.problem}
                onChange={(e) => set("problem", e.target.value)}
              />
            </Field>
            <Field label="依頼したい作業" required>
              <Textarea
                rows={3}
                placeholder="例:スキャンした図面10枚を3D CADモデルにしてほしい"
                value={form.request}
                onChange={(e) => set("request", e.target.value)}
              />
            </Field>
            <Field label="成果物(1行に1つ)">
              <Textarea
                rows={2}
                placeholder={"3D CADデータ(STEP)\n作業メモ"}
                value={form.deliverables}
                onChange={(e) => set("deliverables", e.target.value)}
              />
            </Field>
            <Field label="使ってよいデータ">
              <Input
                placeholder="例:スキャン図面PDF(閲覧リンクで共有)"
                value={form.allowedData}
                onChange={(e) => set("allowedData", e.target.value)}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.ndaRequired}
                onChange={(e) => set("ndaRequired", e.target.checked)}
                className="size-4 accent-cyan-400"
              />
              秘密保持(NDA)が必要な案件
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. 求めるスキル・条件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="必要スキル(1つ以上)" required>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                      form.requiredSkills.includes(s.id)
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="推奨学年">
                <Select
                  value={form.recommendedGrade}
                  onChange={(e) => set("recommendedGrade", e.target.value)}
                >
                  {["1年生以上", "2年生以上", "3年生以上", "4年生以上", "5年生・専攻科"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              </Field>
              <Field label="難易度(1〜5)">
                <Select
                  value={String(form.difficulty)}
                  onChange={(e) => set("difficulty", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={d}>
                      {"★".repeat(d)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="報酬(円)">
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.reward}
                  onChange={(e) => set("reward", Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="締切" required>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </Field>
              <div className="space-y-2 pt-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.remoteOk}
                    onChange={(e) => set("remoteOk", e.target.checked)}
                    className="size-4 accent-cyan-400"
                  />
                  リモートで完結できる
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.usesSchoolEquipment}
                    onChange={(e) => set("usesSchoolEquipment", e.target.checked)}
                    className="size-4 accent-cyan-400"
                  />
                  学校設備の利用を想定している
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.teamOk}
                    onChange={(e) => set("teamOk", e.target.checked)}
                    className="size-4 accent-cyan-400"
                  />
                  チームでの受注も歓迎
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. 安全面の確認</CardTitle>
            <CardDescription>
              該当する危険度ラベルをすべて選択してください。教員承認の判断材料になります。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {DANGER_OPTIONS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleDanger(l)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                    form.dangerLabels.includes(l)
                      ? "border-neon-amber bg-neon-amber/15 text-neon-amber"
                      : "border-border text-muted-foreground hover:border-neon-amber/50"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <Field label="安全面の注意(自由記述)">
              <Textarea
                rows={2}
                placeholder="例:工場見学時は保護メガネ・安全靴を貸与します"
                value={form.safetyNotes}
                onChange={(e) => set("safetyNotes", e.target.value)}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.teacherCheckRequired}
                onChange={(e) => set("teacherCheckRequired", e.target.checked)}
                className="size-4 accent-cyan-400"
              />
              実施にあたり教員の確認・立会いを希望する
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. 学生への提示内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="学生にとって学べること"
              required
              hint="このクエストで学生がどう成長できるかを書くと、挑戦者が集まりやすくなります"
            >
              <Textarea
                rows={2}
                placeholder="例:実務図面の読み方と、図面からモデルを起こす実践力が身につきます"
                value={form.learnPoints}
                onChange={(e) => set("learnPoints", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="提出物の形式">
                <Input
                  placeholder="例:STEPデータ+PDFレポート"
                  value={form.submissionFormat}
                  onChange={(e) => set("submissionFormat", e.target.value)}
                />
              </Field>
            </div>
            <Field label="評価基準(1行に1つ)">
              <Textarea
                rows={2}
                placeholder={"寸法の正確さ\n報告のわかりやすさ"}
                value={form.criteria}
                onChange={(e) => set("criteria", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2 pb-8">
          <Button type="submit" size="lg" disabled={!valid} className="w-full sm:w-auto sm:px-12">
            <Send /> この内容でクエストを投稿する
          </Button>
          <p className="text-xs text-muted-foreground">
            投稿後は「教員承認待ち」となり、承認されると学生に公開されます
          </p>
        </div>
      </form>
    </div>
  );
}

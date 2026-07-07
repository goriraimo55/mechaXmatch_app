"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, BookOpen, Building2, CalendarDays, CheckCircle2,
  ClipboardList, Coins, FileText, GraduationCap, Lock, MapPin, ShieldCheck,
  Sparkles, Target, Wifi, Wrench,
} from "lucide-react";
import { useGame } from "@/lib/game";
import { MATERIAL_MAP } from "@/lib/data/materials";
import { TEMPLATE_MAP } from "@/lib/data/templates";
import { STUDENT_REVIEWS } from "@/lib/data/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Stars } from "@/components/stars";
import { ApprovalBadge, DangerLabels, SkillChips } from "@/components/quest-parts";
import { AdBanner } from "@/components/ad-banner";

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-black tracking-wide text-primary">
        {icon} {title}
      </h3>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((x) => (
        <li key={x} className="flex gap-2">
          <span className="text-primary">▸</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export default function QuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, hydrated, questById, acceptQuest, completeQuest } = useGame();
  const quest = questById(id);

  if (!hydrated) return null;
  if (!quest) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">クエストが見つかりませんでした</p>
        <Link href="/quests" className="mt-4 inline-block text-primary hover:underline">
          クエスト一覧へ戻る
        </Link>
      </div>
    );
  }

  const accepted = state.acceptedQuests.includes(quest.id);
  const completed = state.completedQuests.includes(quest.id);
  const approved = quest.approvalStatus === "approved";
  const template = TEMPLATE_MAP[quest.submissionTemplateId];
  const companyReviews = STUDENT_REVIEWS.filter((r) => r.company === quest.company);

  return (
    <div className="space-y-6">
      <Link
        href="/quests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> クエストボードへ戻る
      </Link>

      {/* ヘッダ */}
      <Card className={quest.isRare ? "border-neon-amber/50 glow-amber" : "border-primary/30"}>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {quest.isRare && (
              <Badge variant="warning" className="animate-pulse-glow">
                <Sparkles /> レアクエスト
              </Badge>
            )}
            <ApprovalBadge status={quest.approvalStatus} />
            {quest.ndaRequired && (
              <Badge variant="secondary">
                <Lock /> 秘密保持あり
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl sm:text-2xl">{quest.title}</CardTitle>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" /> {quest.company}({quest.industry})
            <span className="flex items-center gap-1">
              企業評価 <Stars value={quest.companyRating} />
              <b className="text-neon-amber">{quest.companyRating || "—"}</b>
              <span>({quest.companyRatingCount}件)</span>
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-[10px] text-muted-foreground">難易度</p>
              <Stars value={quest.difficulty} color="text-neon-pink" />
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-[10px] text-muted-foreground">報酬</p>
              <p className="flex items-center gap-1 font-black text-neon-amber">
                <Coins className="size-4" />¥{quest.reward.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-[10px] text-muted-foreground">獲得経験値</p>
              <p className="font-black text-neon-green">+{quest.xp} XP</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-[10px] text-muted-foreground">締切</p>
              <p className="flex items-center gap-1 font-bold">
                <CalendarDays className="size-4" />
                {quest.deadline}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-[10px] text-muted-foreground">実施形態</p>
              <p className="flex items-center gap-1 font-bold">
                {quest.remoteOk ? (
                  <>
                    <Wifi className="size-4 text-neon-green" /> リモート可
                  </>
                ) : (
                  <>
                    <MapPin className="size-4 text-neon-amber" /> 現地あり
                  </>
                )}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-[10px] text-muted-foreground">推奨学年</p>
              <p className="flex items-center gap-1 font-bold">
                <GraduationCap className="size-4" />
                {quest.recommendedGrade}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <ShieldCheck className="size-4" /> 安全レベル: {quest.safetyLevel}
              {quest.teacherCheckRequired && (
                <span className="text-neon-amber">/ 教員確認が必要な案件です</span>
              )}
            </p>
            <DangerLabels labels={quest.dangerLabels} />
          </div>
        </CardContent>
      </Card>

      {quest.teacherComment && (
        <Card className="border-neon-purple/40 bg-neon-purple/5">
          <CardContent className="p-4 text-sm">
            <b className="text-neon-purple">👨‍🏫 教員コメント:</b> {quest.teacherComment}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 本文 */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-6 p-6">
              <Section icon={<Building2 className="size-4" />} title="背景">
                {quest.background}
              </Section>
              <Separator />
              <Section icon={<Target className="size-4" />} title="依頼内容">
                {quest.request}
              </Section>
              <Separator />
              <Section icon={<FileText className="size-4" />} title="成果物">
                <BulletList items={quest.deliverables} />
              </Section>
              <Separator />
              <Section icon={<BookOpen className="size-4" />} title="必要な知識">
                <BulletList items={quest.knowledge.length ? quest.knowledge : ["特になし(挑戦しながら学べます)"]} />
              </Section>
              <Separator />
              <Section icon={<Wrench className="size-4" />} title="使用する設備">
                <BulletList items={quest.equipment} />
              </Section>
              <Separator />
              <Section icon={<AlertTriangle className="size-4" />} title="注意事項">
                <BulletList items={quest.cautions.length ? quest.cautions : ["特になし"]} />
              </Section>
              <Separator />
              <Section icon={<CheckCircle2 className="size-4" />} title="評価基準">
                <BulletList items={quest.criteria} />
              </Section>
            </CardContent>
          </Card>

          {/* このクエストで学べること */}
          <Card className="border-neon-green/30 bg-neon-green/5">
            <CardContent className="p-5 text-sm">
              <p className="mb-1 font-black text-neon-green">🌱 このクエストで成長できること</p>
              <p>{quest.learnPoints}</p>
              <div className="mt-3">
                <SkillChips skillIds={quest.requiredSkills} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  ↑ クエスト達成でこれらのスキル経験値が +{quest.xp} されます
                </p>
              </div>
            </CardContent>
          </Card>

          <AdBanner index={3} />
        </div>

        {/* サイド:アクション */}
        <div className="space-y-4">
          <Card className="border-primary/40">
            <CardContent className="space-y-3 p-5">
              {completed ? (
                <div className="rounded-lg bg-neon-green/10 p-4 text-center">
                  <p className="text-3xl">🏆</p>
                  <p className="font-black text-neon-green">クエスト達成済み!</p>
                  <p className="mt-1 text-xs text-muted-foreground">実績はプロフィールに記録されています</p>
                </div>
              ) : !approved ? (
                <div className="rounded-lg bg-neon-amber/10 p-4 text-center text-sm">
                  <p className="text-2xl">⏳</p>
                  <p className="font-bold text-neon-amber">教員の承認待ちです</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    安全性・難易度・守秘義務の確認が完了すると挑戦できます
                  </p>
                </div>
              ) : !state.licenseIssued ? (
                <div className="space-y-3 rounded-lg bg-neon-amber/10 p-4 text-center text-sm">
                  <p className="text-2xl">🔒</p>
                  <p className="font-bold text-neon-amber">ライセンス未取得</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    企業クエストの受注には「見習い技術者ライセンス」が必要です。
                    工学倫理・機密情報・安全管理の講習を修了しましょう。
                  </p>
                  <Link href="/tutorial" className={cn(buttonVariants({ variant: "warning" }), "w-full")}>
                    🪪 ライセンス講習を受ける
                  </Link>
                </div>
              ) : !accepted ? (
                <>
                  <Button size="lg" className="w-full" onClick={() => acceptQuest(quest.id)}>
                    ⚔️ このクエストに挑戦する
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    挑戦中クエストに追加されます
                  </p>
                </>
              ) : (
                <>
                  <p className="text-center text-sm font-bold text-primary">🔥 挑戦中のクエストです</p>
                  <Button
                    size="lg"
                    variant="success"
                    className="w-full"
                    onClick={() => completeQuest(quest.id)}
                  >
                    📤 成果物を提出して完了する
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    (プロトタイプでは提出と同時に完了・経験値獲得となります)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 提出テンプレート */}
          {template && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ClipboardList className="size-4 text-primary" /> 提出テンプレート
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-bold">
                  {template.icon} {template.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{template.purpose}</p>
                <Link
                  href="/templates"
                  className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                >
                  テンプレートを確認する →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 参考教材 */}
          {quest.referenceMaterialIds.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="size-4 text-neon-purple" /> 参考教材
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quest.referenceMaterialIds.map((mid) => {
                  const m = MATERIAL_MAP[mid];
                  if (!m) return null;
                  const done = state.completedMaterials.includes(mid);
                  return (
                    <Link
                      key={mid}
                      href="/learn"
                      className="block rounded-md border p-2.5 text-xs transition-colors hover:border-primary/50"
                    >
                      <p className="font-bold">
                        {done ? "✅ " : "📖 "}
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {m.category} ・ +{m.xp} XP
                      </p>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* 学生から見た企業評価 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🗣️ 先輩たちの企業評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {companyReviews.length === 0 && (
                <p className="text-xs text-muted-foreground">まだ評価がありません</p>
              )}
              {companyReviews.map((r) => (
                <div key={r.id} className="rounded-md border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <Stars value={r.recommend} />
                    <span className="text-muted-foreground">おすすめ度 {r.recommend}/5</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{r.comment}</p>
                </div>
              ))}
              <Link href="/reviews" className="block text-xs font-bold text-primary hover:underline">
                すべての相互評価を見る →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

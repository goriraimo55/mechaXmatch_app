"use client";

import { Network } from "lucide-react";
import { SKILLS, skillLevel, skillLevelProgress } from "@/lib/data/skills";
import type { Skill } from "@/lib/types";
import { useGame } from "@/lib/game";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function SkillNode({ skill, xp }: { skill: Skill; xp: number }) {
  const level = skillLevel(xp);
  const prog = skillLevelProgress(xp);
  const unlocked = xp > 0;

  return (
    <Card
      className={cn(
        "relative transition-all hover:-translate-y-0.5",
        unlocked ? "border-primary/30" : "opacity-55"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl",
              unlocked && "animate-pulse-glow"
            )}
            style={{
              background: `${skill.color}1a`,
              border: `1.5px solid ${skill.color}${unlocked ? "88" : "33"}`,
            }}
          >
            {skill.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-black">{skill.name}</p>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-black"
                style={{ background: `${skill.color}22`, color: skill.color }}
              >
                Lv.{level}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{skill.description}</p>
          </div>
        </div>
        <Progress value={prog.percent} className="mt-3 h-2" />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>累計 {xp} XP</span>
          <span>
            次のLvまで {prog.next - prog.current} XP
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

const TIER_LABELS: Record<1 | 2 | 3, { title: string; note: string }> = {
  1: { title: "TIER 1 — 基礎スキル", note: "すべての技術者の土台。教材学習で伸ばしやすい" },
  2: { title: "TIER 2 — 応用スキル", note: "実務クエストで大きく成長する実践スキル" },
  3: { title: "TIER 3 — 総合スキル", note: "チームクエストや高難度案件で開花する上位スキル" },
};

/** 最も伸びているスキルからタイプと進路を診断する */
const DIAGNOSIS_MAP: Record<string, { type: string; description: string; careers: string[] }> = {
  cad: { type: "設計エンジニア", description: "形にする力が強み。図面とモデルで意思を伝えられる、ものづくりの中核人材です。", careers: ["機械設計(装置・治具)", "CADオペレータ→設計者", "生産技術"] },
  materials: { type: "強度解析エンジニア", description: "壊れない設計を計算で裏付けられる、信頼性の要となるタイプです。", careers: ["構造解析(CAE)", "機械設計(強度担当)", "品質保証"] },
  drawing: { type: "図面マスター", description: "図面を正確に読み書きできる力は、あらゆる製造現場で通用します。", careers: ["生産技術", "検査・品質管理", "設計補助→設計者"] },
  machining: { type: "加工のプロフェッショナル", description: "「作れる設計」がわかる貴重なタイプ。現場と設計の橋渡し役です。", careers: ["生産技術", "加工技術者", "DFMコンサルタント"] },
  measurement: { type: "計測・評価エンジニア", description: "データで語れる実験屋。開発の信頼性を支える存在です。", careers: ["評価・実験エンジニア", "品質保証", "研究開発補助"] },
  electronics: { type: "エレキ系エンジニア", description: "回路とセンサに強く、メカトロ時代に引く手あまたのタイプです。", careers: ["回路設計", "組込みエンジニア", "制御盤設計"] },
  control: { type: "制御エンジニア", description: "動きを設計できるタイプ。FA・ロボット分野で活躍できます。", careers: ["PLCエンジニア", "ロボットSIer", "FA装置メーカー"] },
  aidx: { type: "DX推進エンジニア", description: "現場×ITの掛け算ができる、製造業DXの最前線タイプです。", careers: ["生産DX推進", "データエンジニア", "スマートファクトリー開発"] },
  report: { type: "テクニカルコミュニケータ", description: "伝える力は最強の汎用スキル。どの職種でもエースになれます。", careers: ["開発エンジニア", "技術営業", "プロジェクトリーダー"] },
  teamdev: { type: "チームリーダー", description: "協働で成果を出せるタイプ。将来のプロジェクトマネージャ候補です。", careers: ["プロジェクトマネージャ", "開発リーダー", "技術企画"] },
};

export default function SkillsPage() {
  const { state, hydrated } = useGame();

  const ranked = SKILLS.map((s) => ({ skill: s, xp: state.skillXp[s.id] ?? 0 })).sort(
    (a, b) => b.xp - a.xp
  );
  const top = ranked[0];
  const weakest = [...ranked].reverse().find((r) => r.xp < (top?.xp ?? 0)) ?? ranked[ranked.length - 1];
  const d = DIAGNOSIS_MAP[top.skill.id];
  const diagnosis = { ...d, nextSkill: weakest.skill };

  if (!hydrated) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Network className="size-6 text-primary" /> スキルツリー
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          教材の学習・クエストの達成で、対応するスキルの経験値が貯まりレベルが上がります。
        </p>
      </div>

      {( [1, 2, 3] as const ).map((tier) => (
        <section key={tier} className="relative">
          {tier > 1 && (
            <div className="absolute -top-6 left-8 h-6 w-px bg-gradient-to-b from-primary/60 to-transparent" />
          )}
          <div className="mb-3">
            <h2 className="text-sm font-black tracking-widest text-primary">
              {TIER_LABELS[tier].title}
            </h2>
            <p className="text-xs text-muted-foreground">{TIER_LABELS[tier].note}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SKILLS.filter((s) => s.tier === tier).map((s) => (
              <SkillNode key={s.id} skill={s} xp={state.skillXp[s.id] ?? 0} />
            ))}
          </div>
        </section>
      ))}

      {/* スキル診断 & おすすめ進路 */}
      <Card className="border-neon-cyan/30">
        <CardContent className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-black tracking-wide text-primary">
            🧭 スキル診断:あなたは「{diagnosis.type}」タイプ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{diagnosis.description}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-neon-green/30 bg-neon-green/5 p-3 text-xs">
              <p className="font-black text-neon-green">🎓 おすすめ進路</p>
              <ul className="mt-1.5 space-y-1 text-muted-foreground">
                {diagnosis.careers.map((c) => (
                  <li key={c}>▸ {c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-neon-amber/30 bg-neon-amber/5 p-3 text-xs">
              <p className="font-black text-neon-amber">💪 次に伸ばすと強いスキル</p>
              <p className="mt-1.5 text-muted-foreground">
                {diagnosis.nextSkill.icon} <b className="text-foreground">{diagnosis.nextSkill.name}</b> —{" "}
                {diagnosis.nextSkill.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground">
          💡 <b className="text-foreground">スキルの伸ばし方:</b>{" "}
          教材を学習すると教材に紐づくスキルに、クエストを達成するとクエストの必要スキルに、それぞれ獲得経験値と同量のスキル経験値が加算されます。
        </CardContent>
      </Card>
    </div>
  );
}

import type { Skill } from "@/lib/types";

/** スキル10種類。tierはスキルツリー上の段(1=基礎, 2=応用, 3=総合) */
export const SKILLS: Skill[] = [
  { id: "drawing", name: "図面読解", icon: "📐", color: "#22d3ee", tier: 1, description: "図面の投影法・寸法・記号を正しく読み取る力" },
  { id: "materials", name: "材料力学", icon: "🧱", color: "#fbbf24", tier: 1, description: "応力・ひずみ・強度計算などの基礎力学" },
  { id: "measurement", name: "実験・計測", icon: "🔬", color: "#4ade80", tier: 1, description: "ノギス・マイクロメータ等での計測とデータ整理" },
  { id: "electronics", name: "電子工作", icon: "🔌", color: "#f472b6", tier: 1, description: "回路の読解・はんだ付け・センサ活用" },
  { id: "cad", name: "CAD", icon: "🖥️", color: "#a78bfa", tier: 2, description: "3D CADでのモデリング・図面化・データ修正" },
  { id: "machining", name: "加工知識", icon: "⚙️", color: "#fb923c", tier: 2, description: "切削・板金・3Dプリンタなど加工法の選定力" },
  { id: "control", name: "制御", icon: "🎛️", color: "#38bdf8", tier: 2, description: "PLC・シーケンス制御・メカトロの基礎" },
  { id: "report", name: "レポート作成", icon: "📝", color: "#e2e8f0", tier: 2, description: "技術文書として伝わるレポートを書く力" },
  { id: "aidx", name: "AI/DX", icon: "🤖", color: "#c084fc", tier: 3, description: "AI活用・データ分析・現場のDX推進" },
  { id: "teamdev", name: "チーム開発", icon: "🤝", color: "#34d399", tier: 3, description: "役割分担・進捗共有・複数学科での協働" },
];

export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<
  Skill["id"],
  Skill
>;

/** スキルレベル計算: レベルnに必要な累計スキル経験値 = 60 * n * (n-1) / 2 */
export function skillLevel(xp: number): number {
  let level = 1;
  while (xp >= (60 * level * (level + 1)) / 2) level++;
  return level;
}

export function skillLevelProgress(xp: number): { current: number; next: number; percent: number } {
  const level = skillLevel(xp);
  const prevThreshold = (60 * (level - 1) * level) / 2;
  const nextThreshold = (60 * level * (level + 1)) / 2;
  const current = xp - prevThreshold;
  const next = nextThreshold - prevThreshold;
  return { current, next, percent: Math.round((current / next) * 100) };
}

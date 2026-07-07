import type { Ad, BadgeDef, RankingEntry } from "@/lib/types";

/** バッジ10種類 */
export const BADGES: BadgeDef[] = [
  { id: "b1", name: "ギルド入門", icon: "🎖️", rarity: "コモン", description: "MechaXMatchに登録して冒険を始めた" },
  { id: "b2", name: "はじまりの学び", icon: "📖", rarity: "コモン", description: "はじめて教材の学習を完了した" },
  { id: "b3", name: "初クエスト達成", icon: "⚔️", rarity: "コモン", description: "はじめてクエストを完了した" },
  { id: "b4", name: "3日連続ログイン", icon: "🔥", rarity: "コモン", description: "3日連続で学習・クエストに取り組んだ" },
  { id: "b5", name: "知識コレクター", icon: "📚", rarity: "レア", description: "教材を5個以上学習完了した" },
  { id: "b6", name: "クエストハンター", icon: "🏹", rarity: "レア", description: "クエストを3件以上完了した" },
  { id: "b7", name: "レベル5到達", icon: "⭐", rarity: "レア", description: "レベル5に到達した" },
  { id: "b8", name: "チームプレイヤー", icon: "🤝", rarity: "レア", description: "チームクエストに参加申請した" },
  { id: "b9", name: "教員承認済みの実績", icon: "✅", rarity: "エピック", description: "教員承認済みクエストを完了した(安全に配慮できる証)" },
  { id: "b10", name: "企業に選ばれし者", icon: "👑", rarity: "レジェンド", description: "企業評価バッジ:企業から高評価(平均4.5以上)を獲得した" },
  { id: "b11", name: "見習い技術者ライセンス", icon: "🪪", rarity: "レア", description: "工学倫理・機密情報・安全管理の講習を修了し、企業クエストの受注資格を得た" },
];

/** 称号(レベル帯で変化) */
export const TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: "見習いエンジニア" },
  { minLevel: 3, title: "ギルドの新星" },
  { minLevel: 5, title: "ジュニア技士" },
  { minLevel: 8, title: "熟練クラフター" },
  { minLevel: 12, title: "マスターエンジニア" },
  { minLevel: 16, title: "ギルドの重鎮" },
  { minLevel: 20, title: "伝説の技術者" },
];

export function titleForLevel(level: number): string {
  let title = TITLES[0].title;
  for (const t of TITLES) if (level >= t.minLevel) title = t.title;
  return title;
}

/** ダミー広告6件 */
export const ADS: Ad[] = [
  { id: "ad1", category: "CADソフト", icon: "🖥️", color: "#a78bfa", title: "Fusion CAD 学生版が無料", body: "高専生なら3D CADが無料で使い放題。クエストの武器を手に入れよう。", cta: "無料で始める" },
  { id: "ad2", category: "3Dプリンタ", icon: "🖨️", color: "#22d3ee", title: "学割3Dプリンタ MX-Mini", body: "寮の机に置けるコンパクト設計。試作クエストが捗る一台。", cta: "学割価格を見る" },
  { id: "ad3", category: "工具", icon: "🔧", color: "#fb923c", title: "エンジニア工具セット", body: "現役設計者が選んだ工具22点。最初の一式はこれで決まり。", cta: "セット内容を見る" },
  { id: "ad4", category: "技術書", icon: "📘", color: "#4ade80", title: "『機械設計の基礎と実務』", body: "教科書と現場のギャップを埋める一冊。クエスト攻略本としても◎。", cta: "試し読み" },
  { id: "ad5", category: "インターン", icon: "🏭", color: "#f472b6", title: "高専生向け夏インターン特集", body: "クエスト実績がそのまま応募資料になる企業を厳選しました。", cta: "特集を見る" },
  { id: "ad6", category: "資格講座", icon: "🎓", color: "#fbbf24", title: "機械設計技術者試験 対策講座", body: "3級合格でスキルツリーも一気に成長。今なら学割50%OFF。", cta: "講座の詳細" },
];

/** 今週のランキング8人分(自分を除くダミー学生) */
export const RANKING: RankingEntry[] = [
  { name: "アオイ@機械5年", department: "機械工学科", grade: "5年", weeklyXp: 1240, level: 14 },
  { name: "ハヤト@電気4年", department: "電気電子工学科", grade: "4年", weeklyXp: 1105, level: 12 },
  { name: "ミナミ@情報3年", department: "情報工学科", grade: "3年", weeklyXp: 980, level: 11 },
  { name: "リク@機械4年", department: "機械工学科", grade: "4年", weeklyXp: 870, level: 10 },
  { name: "サクラ@物質2年", department: "物質化学工学科", grade: "2年", weeklyXp: 760, level: 8 },
  { name: "ソウタ@機械3年", department: "機械工学科", grade: "3年", weeklyXp: 640, level: 9 },
  { name: "ユイ@電気5年", department: "電気電子工学科", grade: "5年", weeklyXp: 555, level: 13 },
  { name: "カイト@情報2年", department: "情報工学科", grade: "2年", weeklyXp: 430, level: 6 },
];

/** デイリーミッション定義(毎日3件) */
export const DAILY_QUESTS: { id: string; title: string; xp: number; icon: string }[] = [
  { id: "d1", title: "教材を1つ学習完了する", xp: 20, icon: "📖" },
  { id: "d2", title: "クエストを1件チェックする", xp: 10, icon: "🔍" },
  { id: "d3", title: "スキルツリーを確認して目標を決める", xp: 10, icon: "🌳" },
];

/** ウィークリーミッション(条件を満たすと報告してボーナスXP) */
export const WEEKLY_MISSIONS: {
  id: string;
  title: string;
  xp: number;
  icon: string;
  /** 進捗表示用: (state値) => {current, target} を各画面側で解決する */
  metric: "weeklyXp" | "materials" | "dailyAll";
  target: number;
}[] = [
  { id: "w1", title: "今週の獲得経験値 400 XP", xp: 80, icon: "⚡", metric: "weeklyXp", target: 400 },
  { id: "w2", title: "学習済み教材を累計 8 本にする", xp: 60, icon: "📚", metric: "materials", target: 8 },
  { id: "w3", title: "デイリーミッションを1日で全達成", xp: 50, icon: "🎯", metric: "dailyAll", target: 3 },
];

/** 全国高専ランキング(ダミー) */
export const NATIONAL_RANKING: RankingEntry[] = [
  { name: "レン@明石高専", department: "機械工学科", grade: "5年", weeklyXp: 2350, level: 21 },
  { name: "ツバサ@木更津高専", department: "電子制御工学科", grade: "4年", weeklyXp: 2210, level: 19 },
  { name: "ヒナタ@熊本高専", department: "情報通信エレクトロニクス工学科", grade: "5年", weeklyXp: 2080, level: 20 },
  { name: "イツキ@仙台高専", department: "総合工学科", grade: "3年", weeklyXp: 1930, level: 15 },
  { name: "アカリ@奈良高専", department: "機械工学科", grade: "4年", weeklyXp: 1820, level: 17 },
  { name: "ソラ@苫小牧高専", department: "創造工学科", grade: "5年", weeklyXp: 1700, level: 18 },
  { name: "ナギ@高知高専", department: "ソーシャルデザイン工学科", grade: "2年", weeklyXp: 1610, level: 11 },
  { name: "アオイ@機械5年", department: "機械工学科(あなたの高専)", grade: "5年", weeklyXp: 1240, level: 14 },
];

/** スキル別ランキング(CAD部門・ダミー) */
export const SKILL_RANKING: { skillName: string; entries: RankingEntry[] } = {
  skillName: "CAD",
  entries: [
    { name: "アオイ@機械5年", department: "機械工学科", grade: "5年", weeklyXp: 640, level: 8 },
    { name: "リク@機械4年", department: "機械工学科", grade: "4年", weeklyXp: 520, level: 7 },
    { name: "ミナミ@情報3年", department: "情報工学科", grade: "3年", weeklyXp: 410, level: 6 },
    { name: "ソウタ@機械3年", department: "機械工学科", grade: "3年", weeklyXp: 350, level: 5 },
    { name: "サクラ@物質2年", department: "物質化学工学科", grade: "2年", weeklyXp: 220, level: 4 },
  ],
};

/** 期間限定イベント(ダミー) */
export const LIMITED_EVENT = {
  title: "夏の実装フェス 2026",
  description: "期間中、学習教材の獲得XPが1.5倍!夏休みにスキルツリーを一気に伸ばそう。",
  until: "2026-08-31",
  icon: "🎆",
};

/** 企業からのスカウト風カード(ダミー) */
export const SCOUTS = [
  {
    id: "sc1",
    company: "未来ロボティクス株式会社",
    message: "レポート作成スキルLv.3以上のあなたに、評価実験クエストへの招待が届いています。",
    questId: "q11",
    icon: "🤖",
  },
  {
    id: "sc2",
    company: "株式会社タカハシ精機",
    message: "前回の図面CAD化の丁寧な仕事ぶりを見て、続編クエストのご指名です。",
    questId: "q7",
    icon: "🏭",
  },
];

/** アバター候補(プロフィールで選択) */
export const AVATARS = ["🧑‍🔧", "👩‍🔧", "🧑‍💻", "👩‍💻", "🧑‍🏭", "🦾", "🤖", "⚙️"];

/** ログインボーナスの宝箱報酬テーブル(ランダム報酬) */
export const CHEST_REWARDS: { name: string; xp: number; weight: number }[] = [
  { name: "ブロンズの歯車", xp: 15, weight: 50 },
  { name: "シルバーの歯車", xp: 30, weight: 30 },
  { name: "ゴールドの歯車", xp: 60, weight: 15 },
  { name: "✨レジェンドコア✨", xp: 120, weight: 5 },
];

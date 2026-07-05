import type { TeamQuest } from "@/lib/types";

/** チームクエスト5件(複数学科での協働案件) */
export const TEAM_QUESTS: TeamQuest[] = [
  {
    id: "tq1",
    title: "小型AGV(無人搬送車)の試作開発",
    company: "加賀オートメーション株式会社",
    description:
      "工場内の部品搬送を想定した小型AGVのプロトタイプを、機構・回路・制御・ソフトの分担で開発します。月1回の企業レビューあり。",
    reward: 120000,
    xp: 1200,
    deadline: "2026-12-20",
    approvalStatus: "approved",
    dangerLabels: ["学校設備使用", "工具使用あり", "回転体あり", "教員立会い推奨"],
    roles: [
      { name: "機械設計担当", requiredSkills: ["cad", "materials"], capacity: 2, members: ["リク@機械4年"] },
      { name: "電気回路担当", requiredSkills: ["electronics"], capacity: 2, members: ["ハヤト@電気4年"] },
      { name: "制御担当", requiredSkills: ["control"], capacity: 1, members: [] },
      { name: "ソフトウェア担当", requiredSkills: ["aidx"], capacity: 2, members: ["ミナミ@情報3年"] },
      { name: "レポート担当", requiredSkills: ["report"], capacity: 1, members: [] },
    ],
  },
  {
    id: "tq2",
    title: "工場向けIoT電力見える化システム",
    company: "白山機工株式会社",
    description:
      "工場設備の消費電力をセンサで収集し、ダッシュボードで見える化するシステムを構築。省エネ改善の提案までがゴールです。",
    reward: 80000,
    xp: 800,
    deadline: "2026-11-30",
    approvalStatus: "approved",
    dangerLabels: ["現場訪問あり", "高電圧注意", "教員立会い推奨"],
    roles: [
      { name: "電気回路担当", requiredSkills: ["electronics"], capacity: 2, members: ["ユイ@電気5年"] },
      { name: "ソフトウェア担当", requiredSkills: ["aidx"], capacity: 2, members: [] },
      { name: "実験・計測担当", requiredSkills: ["measurement"], capacity: 1, members: [] },
      { name: "プレゼン担当", requiredSkills: ["report", "teamdev"], capacity: 1, members: ["サクラ@物質2年"] },
    ],
  },
  {
    id: "tq3",
    title: "介護用ベッドサイド手すりの改良設計",
    company: "ホームテック株式会社",
    description:
      "利用者の声をもとに、既存手すりの強度・使いやすさを改良します。強度試験と人間工学的な評価をチームで実施します。",
    reward: 60000,
    xp: 600,
    deadline: "2026-11-15",
    approvalStatus: "approved",
    dangerLabels: ["学校設備使用", "重量物あり"],
    roles: [
      { name: "機械設計担当", requiredSkills: ["cad", "drawing"], capacity: 2, members: ["アオイ@機械5年"] },
      { name: "実験・計測担当", requiredSkills: ["measurement", "materials"], capacity: 2, members: [] },
      { name: "レポート担当", requiredSkills: ["report"], capacity: 1, members: [] },
    ],
  },
  {
    id: "tq4",
    title: "廃校プールを活用した水中ドローン実証実験",
    company: "未来ロボティクス株式会社",
    description:
      "開発中の水中点検ドローンの実証実験をチームで運営。実験計画の立案からデータ解析、報告会でのプレゼンまで担当します。",
    reward: 100000,
    xp: 1000,
    deadline: "2027-01-31",
    approvalStatus: "approved",
    dangerLabels: ["現場訪問あり", "教員立会い推奨"],
    roles: [
      { name: "制御担当", requiredSkills: ["control"], capacity: 1, members: [] },
      { name: "実験・計測担当", requiredSkills: ["measurement"], capacity: 2, members: ["ソウタ@機械3年"] },
      { name: "ソフトウェア担当", requiredSkills: ["aidx"], capacity: 1, members: [] },
      { name: "プレゼン担当", requiredSkills: ["report", "teamdev"], capacity: 1, members: [] },
    ],
  },
  {
    id: "tq5",
    title: "商店街のレトロ看板をLED化するプロジェクト",
    company: "北陸電機制御株式会社",
    description:
      "地元商店街の老朽化した看板をLED化。意匠を守りつつ、配線設計・制御・施工図面までをチームで手がける地域連携クエストです。",
    reward: 50000,
    xp: 500,
    deadline: "2026-10-31",
    approvalStatus: "approved",
    dangerLabels: ["現場訪問あり", "高電圧注意", "工具使用あり", "教員立会い推奨"],
    roles: [
      { name: "電気回路担当", requiredSkills: ["electronics"], capacity: 2, members: ["カイト@情報2年"] },
      { name: "機械設計担当", requiredSkills: ["cad", "machining"], capacity: 1, members: [] },
      { name: "制御担当", requiredSkills: ["control"], capacity: 1, members: [] },
      { name: "レポート担当", requiredSkills: ["report"], capacity: 1, members: [] },
    ],
  },
];

export const TEAM_QUEST_MAP = Object.fromEntries(TEAM_QUESTS.map((t) => [t.id, t]));

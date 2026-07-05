import type { CompanyToStudentReview, StudentToCompanyReview } from "@/lib/types";

/** 企業→学生の評価データ5件 */
export const COMPANY_REVIEWS: CompanyToStudentReview[] = [
  {
    id: "cr1",
    company: "エヌテック計測株式会社",
    questTitle: "機械部品の寸法測定レポート作成",
    techUnderstanding: 4, deadlineCompliance: 5, reporting: 5, quality: 4, rehireIntent: 5,
    comment: "測定条件まできちんと記録されており、社内の新人より丁寧でした。手順書への指摘も的確で助かりました。",
  },
  {
    id: "cr2",
    company: "株式会社タカハシ精機",
    questTitle: "古い手描き図面を3D CAD化する",
    techUnderstanding: 4, deadlineCompliance: 4, reporting: 4, quality: 5, rehireIntent: 5,
    comment: "不明寸法を推測せず質問してくれた姿勢が素晴らしい。モデルツリーも整理されていて即戦力レベルです。",
  },
  {
    id: "cr3",
    company: "株式会社プロトラボ金沢",
    questTitle: "3Dプリンタ用データの修正・最適化",
    techUnderstanding: 3, deadlineCompliance: 5, reporting: 4, quality: 4, rehireIntent: 4,
    comment: "納期より2日早い提出。修正メモがわかりやすく、そのまま社内ナレッジに使わせてもらいました。",
  },
  {
    id: "cr4",
    company: "白山機工株式会社",
    questTitle: "工場の作業手順を動画から手順書に整理",
    techUnderstanding: 4, deadlineCompliance: 3, reporting: 4, quality: 4, rehireIntent: 4,
    comment: "中間報告が1回遅れたのは残念でしたが、完成した手順書は現場でそのまま使える品質でした。",
  },
  {
    id: "cr5",
    company: "加賀オートメーション株式会社",
    questTitle: "搬送ユニットの簡易強度計算",
    techUnderstanding: 5, deadlineCompliance: 5, reporting: 5, quality: 5, rehireIntent: 5,
    comment: "前提条件の整理が的確で、計算書は設計部の様式に近い完成度。ぜひ次の案件もお願いしたいです。",
  },
];

/** 学生→企業の評価データ5件 */
export const STUDENT_REVIEWS: StudentToCompanyReview[] = [
  {
    id: "sr1",
    company: "エヌテック計測株式会社",
    questTitle: "機械部品の寸法測定レポート作成",
    clarity: 5, responseSpeed: 5, rewardFairness: 4, learning: 4, safetyCare: 5, recommend: 5,
    comment: "質問への返信が当日中で安心でした。測定の意味まで説明してもらえて勉強になりました。",
  },
  {
    id: "sr2",
    company: "株式会社タカハシ精機",
    questTitle: "古い手描き図面を3D CAD化する",
    clarity: 4, responseSpeed: 4, rewardFairness: 5, learning: 5, safetyCare: 5, recommend: 5,
    comment: "実物の図面を扱えるのが貴重な経験。作業量に対して報酬も妥当だと感じました。",
  },
  {
    id: "sr3",
    company: "北陸溶接工業株式会社",
    questTitle: "溶接治具の改善案を考える",
    clarity: 3, responseSpeed: 3, rewardFairness: 4, learning: 5, safetyCare: 5, recommend: 4,
    comment: "依頼範囲が途中で少し広がったのが大変でしたが、現場見学は最高に勉強になりました。保護具の準備も万全でした。",
  },
  {
    id: "sr4",
    company: "白山機工株式会社",
    questTitle: "ベアリング周辺の異音原因の調査整理",
    clarity: 4, responseSpeed: 3, rewardFairness: 4, learning: 4, safetyCare: 4, recommend: 4,
    comment: "資料が充実していて調査しやすかったです。返信は2〜3日かかることがありました。",
  },
  {
    id: "sr5",
    company: "未来ロボティクス株式会社",
    questTitle: "【レア】ロボットハンド試作機の評価実験",
    clarity: 5, responseSpeed: 5, rewardFairness: 5, learning: 5, safetyCare: 5, recommend: 5,
    comment: "実験計画のレビューを毎週してもらえて、研究室レベルの学びがありました。安全手順も徹底していました。",
  },
];

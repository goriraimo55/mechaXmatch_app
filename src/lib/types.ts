/** スキルID(10種類) */
export type SkillId =
  | "cad"
  | "materials"
  | "drawing"
  | "machining"
  | "measurement"
  | "electronics"
  | "control"
  | "aidx"
  | "report"
  | "teamdev";

export interface Skill {
  id: SkillId;
  name: string;
  icon: string;
  color: string;
  description: string;
  tier: 1 | 2 | 3; // スキルツリーの段(1=基礎, 2=応用, 3=総合)
}

/** クエストの教員承認ステータス */
export type ApprovalStatus = "approved" | "pending" | "returned" | "rejected";

/** 危険度ラベル */
export type DangerLabel =
  | "リモートのみ"
  | "学校設備使用"
  | "現場訪問あり"
  | "工具使用あり"
  | "回転体あり"
  | "高温部品あり"
  | "高電圧注意"
  | "薬品使用あり"
  | "重量物あり"
  | "教員立会い推奨";

export interface Quest {
  id: string;
  title: string;
  company: string;
  industry: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  recommendedGrade: string; // 例: "3年生以上"
  requiredSkills: SkillId[];
  reward: number; // 円
  xp: number;
  deadline: string; // YYYY-MM-DD
  remoteOk: boolean;
  safetyLevel: "低" | "中" | "高";
  dangerLabels: DangerLabel[];
  teacherCheckRequired: boolean;
  approvalStatus: ApprovalStatus;
  isTeam: boolean;
  isRare?: boolean;
  /** 詳細 */
  background: string;
  request: string;
  deliverables: string[];
  knowledge: string[];
  equipment: string[];
  cautions: string[];
  criteria: string[];
  referenceMaterialIds: string[]; // 参考教材
  companyRating: number; // 学生から見た企業評価(1-5)
  companyRatingCount: number;
  submissionTemplateId: string;
  learnPoints: string; // 学生にとって学べること
  ndaRequired: boolean;
  teacherComment?: string;
}

export interface QuizItem {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

export type MaterialCategory =
  | "材料力学"
  | "機械要素"
  | "ボルト・ナット"
  | "軸・ベアリング"
  | "公差・はめあい"
  | "板金設計"
  | "溶接設計"
  | "加工方法"
  | "図面の読み方"
  | "設計レビュー";

export interface Material {
  id: string;
  title: string;
  category: MaterialCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  minutes: number;
  xp: number;
  summary: string;
  quiz: QuizItem;
  relatedQuestIds: string[];
  skillIds: SkillId[];
}

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: "コモン" | "レア" | "エピック" | "レジェンド";
}

export interface Ad {
  id: string;
  category: string;
  title: string;
  body: string;
  cta: string;
  icon: string;
  color: string;
}

export interface RankingEntry {
  name: string;
  department: string;
  grade: string;
  weeklyXp: number;
  level: number;
}

export interface TeamRole {
  name: string;
  requiredSkills: SkillId[];
  capacity: number;
  members: string[]; // ダミーメンバー名
}

export interface TeamQuest {
  id: string;
  title: string;
  company: string;
  description: string;
  reward: number;
  xp: number;
  deadline: string;
  roles: TeamRole[];
  dangerLabels: DangerLabel[];
  approvalStatus: ApprovalStatus;
}

export interface SubmissionTemplate {
  id: string;
  name: string;
  icon: string;
  purpose: string;
  fields: string[];
  fileFormats: string[];
  evaluationPoints: string[];
  sampleEntry: string;
}

export interface CompanyToStudentReview {
  id: string;
  company: string;
  questTitle: string;
  techUnderstanding: number;
  deadlineCompliance: number;
  reporting: number;
  quality: number;
  rehireIntent: number;
  comment: string;
}

export interface StudentToCompanyReview {
  id: string;
  company: string;
  questTitle: string;
  clarity: number;
  responseSpeed: number;
  rewardFairness: number;
  learning: number;
  safetyCare: number;
  recommend: number;
  comment: string;
}

/** 企業投稿フォームの入力値 */
export interface QuestPostInput {
  title: string;
  company: string;
  industry: string;
  problem: string;
  request: string;
  deliverables: string;
  allowedData: string;
  ndaRequired: boolean;
  requiredSkills: SkillId[];
  recommendedGrade: string;
  difficulty: number;
  reward: number;
  deadline: string;
  remoteOk: boolean;
  usesSchoolEquipment: boolean;
  teacherCheckRequired: boolean;
  safetyNotes: string;
  dangerLabels: DangerLabel[];
  teamOk: boolean;
  learnPoints: string;
  submissionFormat: string;
  criteria: string;
}

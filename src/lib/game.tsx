"use client";

/**
 * ゲーム状態管理(経験値・レベル・クエスト・承認・ライセンス・localStorage永続化)
 * バックエンドなしのプロトタイプのため、すべての状態をここで一元管理する。
 */

import * as React from "react";
import type {
  ApprovalStatus,
  BadgeDef,
  Quest,
  QuestPostInput,
  SkillId,
  StudentStatus,
} from "@/lib/types";
import { QUESTS } from "@/lib/data/quests";
import { MATERIAL_MAP } from "@/lib/data/materials";
import { BADGES, CHEST_REWARDS, TITLES } from "@/lib/data/misc";
import { COMPANY_REVIEWS } from "@/lib/data/reviews";
import { TUTORIAL_PASS_XP } from "@/lib/data/tutorial";

/* ---------------- レベル計算 ---------------- */

/** レベルnに到達するのに必要な累計経験値 = 50 × (n-1) × n */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function playerLevel(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function levelProgress(xp: number): { current: number; next: number; percent: number } {
  const level = playerLevel(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    current: xp - cur,
    next: next - cur,
    percent: Math.round(((xp - cur) / (next - cur)) * 100),
  };
}

/* ---------------- 状態の型 ---------------- */

export interface GameState {
  userName: string;
  department: string;
  grade: string;
  avatar: string;
  xp: number;
  weeklyXp: number; // 今週獲得した経験値(ランキング用)
  skillXp: Record<SkillId, number>;
  loginStreak: number; // 連続学習日数
  lastActiveDate: string | null;
  completedMaterials: string[];
  acceptedQuests: string[];
  completedQuests: string[];
  customQuests: Quest[];
  statusOverrides: Record<string, { status: ApprovalStatus; teacherComment?: string }>;
  teamApplications: Record<string, string>; // teamQuestId -> 役割名
  dailyMissionProgress: { date: string; done: string[] };
  weeklyMissionProgress: { week: string; done: string[] };
  myStudentReviews: unknown[];
  /* --- チュートリアル / ライセンス --- */
  tutorialCompleted: boolean;
  licenseIssued: boolean;
  licenseIssuedAt: string | null;
  tutorialQuizScore: number | null; // 正答数/全問数(%)
  completedTutorialModules: string[];
  /* --- 実績・称号 --- */
  earnedBadges: string[]; // 獲得済みバッジID(演出済みの記録)
  unlockedTitles: string[];
  studentStatus: StudentStatus;
  /* --- ログインボーナス(宝箱・スタンプカード) --- */
  lastChestDate: string | null;
  loginStamps: number; // スタンプカード(7個で1周)
  lastChestReward: { name: string; xp: number } | null;
}

/** 初期状態:デモとして少し進んだ状態から始める(ライセンスは未取得) */
const SEED_STATE: GameState = {
  userName: "高専 太郎",
  department: "機械工学科",
  grade: "4年",
  avatar: "🧑‍🔧",
  xp: 880,
  weeklyXp: 320,
  skillXp: {
    cad: 220, materials: 300, drawing: 260, machining: 100, measurement: 165,
    electronics: 0, control: 0, aidx: 160, report: 290, teamdev: 60,
  },
  loginStreak: 5,
  lastActiveDate: null,
  completedMaterials: ["m1", "m3", "m6", "m13", "m14"],
  acceptedQuests: [],
  completedQuests: ["q1", "q3", "q4", "q5", "q6"],
  customQuests: [],
  statusOverrides: {},
  teamApplications: {},
  dailyMissionProgress: { date: "", done: [] },
  weeklyMissionProgress: { week: "", done: [] },
  myStudentReviews: [],
  tutorialCompleted: false,
  licenseIssued: false,
  licenseIssuedAt: null,
  tutorialQuizScore: null,
  completedTutorialModules: [],
  earnedBadges: [],
  unlockedTitles: [],
  studentStatus: "ライセンス未取得",
  lastChestDate: null,
  loginStamps: 2,
  lastChestReward: null,
};

const STORAGE_KEY = "mechaxmatch-state-v2";

/* ---------------- 受注資格ステータス ---------------- */

export function deriveStudentStatus(s: GameState): StudentStatus {
  if (!s.tutorialCompleted) {
    return s.completedTutorialModules.length > 0 ? "チュートリアル中" : "ライセンス未取得";
  }
  const level = playerLevel(s.xp);
  if (level >= 4) return "チームクエスト参加可能";
  if (level >= 3) return "教員承認付きクエスト受注可能";
  if (s.licenseIssued) return "企業クエスト受注可能";
  return "見習い技術者";
}

/** 受注資格の段階リスト(ホームの可視化用) */
export function qualificationSteps(s: GameState): { label: StudentStatus; achieved: boolean; hint: string }[] {
  const level = playerLevel(s.xp);
  return [
    { label: "チュートリアル中", achieved: s.completedTutorialModules.length > 0 || s.tutorialCompleted, hint: "ライセンス講習を開始する" },
    { label: "見習い技術者", achieved: s.licenseIssued, hint: "講習+ミニテスト合格でライセンス取得" },
    { label: "企業クエスト受注可能", achieved: s.licenseIssued, hint: "ライセンス取得で解放" },
    { label: "教員承認付きクエスト受注可能", achieved: s.licenseIssued && level >= 3, hint: "ライセンス + レベル3で解放" },
    { label: "チームクエスト参加可能", achieved: s.licenseIssued && level >= 4, hint: "ライセンス + レベル4で解放" },
  ];
}

/* ---------------- 演出(XP獲得・レベルアップ・バッジ・宝箱) ---------------- */

export interface Celebration {
  key: number;
  kind: "xp" | "levelup" | "badge" | "chest" | "license";
  message: string;
  xp: number;
  levelUp: number | null;
  badge?: BadgeDef;
  rewardName?: string;
}

/* ---------------- Context ---------------- */

interface GameContextValue {
  state: GameState;
  hydrated: boolean;
  celebration: Celebration | null;
  dismissCelebration: () => void;
  allQuests: Quest[];
  questById: (id: string) => Quest | undefined;
  earnedBadges: BadgeDef[];
  studentStatus: StudentStatus;
  completeMaterial: (id: string) => void;
  acceptQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  postQuest: (input: QuestPostInput) => Quest;
  setQuestStatus: (id: string, status: ApprovalStatus, comment?: string) => void;
  applyToTeam: (teamQuestId: string, role: string) => void;
  completeDaily: (dailyId: string, xp: number) => void;
  completeWeekly: (missionId: string, xp: number) => void;
  completeTutorialModule: (moduleId: string) => void;
  finishTutorial: (scorePercent: number) => void;
  openChest: () => void;
  setAvatar: (avatar: string) => void;
  resetAll: () => void;
}

const GameContext = React.createContext<GameContextValue | null>(null);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 週の識別子(年+ISO週番号の簡易版: 年+月+週目) */
function weekStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-w${Math.ceil(d.getDate() / 7)}`;
}

function nextStreak(state: GameState): { loginStreak: number; lastActiveDate: string } {
  const today = todayStr();
  if (state.lastActiveDate === today)
    return { loginStreak: state.loginStreak, lastActiveDate: today };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (state.lastActiveDate === yesterday || state.lastActiveDate === null) {
    return {
      loginStreak: state.loginStreak + (state.lastActiveDate === null ? 0 : 1),
      lastActiveDate: today,
    };
  }
  return { loginStreak: 1, lastActiveDate: today };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<GameState>(SEED_STATE);
  const [hydrated, setHydrated] = React.useState(false);
  const [celebration, setCelebration] = React.useState<Celebration | null>(null);

  // localStorageから復元(SSRとの差分を避けるため、マウント後に一度だけ実行する)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorageはクライアントでしか読めない
      if (raw) setState({ ...SEED_STATE, ...JSON.parse(raw) });
    } catch {
      // 壊れたデータは初期状態で上書き
    }
    setHydrated(true);
  }, []);

  // 変更をlocalStorageへ保存(studentStatus・unlockedTitlesは導出して同期)
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      const level = playerLevel(state.xp);
      const snapshot: GameState = {
        ...state,
        studentStatus: deriveStudentStatus(state),
        unlockedTitles: TITLES.filter((t) => level >= t.minLevel).map((t) => t.title),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ストレージ不可の環境では保存をあきらめる(動作は継続)
    }
  }, [state, hydrated]);

  /** 経験値を加算し、レベルアップ判定と演出をまとめて行う */
  const gainXp = React.useCallback(
    (amount: number, skillIds: SkillId[], message: string, kind: Celebration["kind"] = "xp") => {
      setState((prev) => {
        const levelBefore = playerLevel(prev.xp);
        const skillXp = { ...prev.skillXp };
        for (const s of skillIds) skillXp[s] = (skillXp[s] ?? 0) + amount;
        const xp = prev.xp + amount;
        const levelAfter = playerLevel(xp);
        setCelebration({
          key: Date.now(),
          kind: levelAfter > levelBefore ? "levelup" : kind,
          message,
          xp: amount,
          levelUp: levelAfter > levelBefore ? levelAfter : null,
        });
        return {
          ...prev,
          xp,
          weeklyXp: prev.weeklyXp + amount,
          skillXp,
          ...nextStreak(prev),
        };
      });
    },
    []
  );

  const completeMaterial = React.useCallback(
    (id: string) => {
      const m = MATERIAL_MAP[id];
      if (!m) return;
      setState((prev) =>
        prev.completedMaterials.includes(id)
          ? prev
          : { ...prev, completedMaterials: [...prev.completedMaterials, id] }
      );
      gainXp(m.xp, m.skillIds, `「${m.title}」を学習完了!`);
    },
    [gainXp]
  );

  const acceptQuest = React.useCallback((id: string) => {
    setState((prev) => {
      if (!prev.licenseIssued) return prev; // ライセンス未取得時は受注不可
      return prev.acceptedQuests.includes(id)
        ? prev
        : { ...prev, acceptedQuests: [...prev.acceptedQuests, id] };
    });
  }, []);

  const allQuests = React.useMemo<Quest[]>(() => {
    const merged = [...QUESTS, ...state.customQuests];
    return merged.map((q) => {
      const o = state.statusOverrides[q.id];
      return o ? { ...q, approvalStatus: o.status, teacherComment: o.teacherComment } : q;
    });
  }, [state.customQuests, state.statusOverrides]);

  const questById = React.useCallback(
    (id: string) => allQuests.find((q) => q.id === id),
    [allQuests]
  );

  const completeQuest = React.useCallback(
    (id: string) => {
      const q = allQuests.find((x) => x.id === id);
      if (!q) return;
      setState((prev) =>
        prev.completedQuests.includes(id)
          ? prev
          : {
              ...prev,
              completedQuests: [...prev.completedQuests, id],
              acceptedQuests: prev.acceptedQuests.filter((a) => a !== id),
            }
      );
      gainXp(q.xp, q.requiredSkills, `クエスト「${q.title}」達成!`);
    },
    [allQuests, gainXp]
  );

  const postQuest = React.useCallback((input: QuestPostInput): Quest => {
    const quest: Quest = {
      id: `c${Date.now()}`,
      title: input.title,
      company: input.company,
      industry: input.industry,
      difficulty: Math.min(5, Math.max(1, input.difficulty)) as Quest["difficulty"],
      recommendedGrade: input.recommendedGrade,
      requiredSkills: input.requiredSkills,
      reward: input.reward,
      xp: 60 + input.difficulty * 40, // 難易度に応じた自動算出
      deadline: input.deadline,
      remoteOk: input.remoteOk,
      safetyLevel: input.dangerLabels.some((l) =>
        ["高電圧注意", "薬品使用あり", "回転体あり", "高温部品あり"].includes(l)
      )
        ? "高"
        : input.dangerLabels.length > 1
          ? "中"
          : "低",
      dangerLabels: input.dangerLabels,
      teacherCheckRequired: input.teacherCheckRequired,
      approvalStatus: "pending", // 投稿直後は必ず教員承認待ち
      isTeam: input.teamOk,
      background: input.problem,
      request: input.request,
      deliverables: input.deliverables.split("\n").filter(Boolean),
      knowledge: [],
      equipment: input.usesSchoolEquipment ? ["学校設備を使用"] : ["自宅または学校のPC"],
      cautions: [
        ...(input.safetyNotes ? input.safetyNotes.split("\n").filter(Boolean) : []),
        `情報公開範囲: ${input.disclosureLevel}`,
      ],
      criteria: input.criteria.split("\n").filter(Boolean),
      referenceMaterialIds: [],
      companyRating: 0,
      companyRatingCount: 0,
      submissionTemplateId: "t8",
      learnPoints: input.learnPoints,
      ndaRequired: input.ndaRequired,
    };
    setState((prev) => ({ ...prev, customQuests: [...prev.customQuests, quest] }));
    return quest;
  }, []);

  const setQuestStatus = React.useCallback(
    (id: string, status: ApprovalStatus, comment?: string) => {
      setState((prev) => ({
        ...prev,
        statusOverrides: {
          ...prev.statusOverrides,
          [id]: { status, teacherComment: comment },
        },
      }));
    },
    []
  );

  const applyToTeam = React.useCallback(
    (teamQuestId: string, role: string) => {
      setState((prev) => ({
        ...prev,
        teamApplications: { ...prev.teamApplications, [teamQuestId]: role },
      }));
      gainXp(30, ["teamdev"], `チームクエストに「${role}」として参加申請!`);
    },
    [gainXp]
  );

  const completeDaily = React.useCallback(
    (dailyId: string, xp: number) => {
      const today = todayStr();
      setState((prev) => {
        const daily =
          prev.dailyMissionProgress.date === today
            ? prev.dailyMissionProgress
            : { date: today, done: [] as string[] };
        if (daily.done.includes(dailyId)) return prev;
        return { ...prev, dailyMissionProgress: { date: today, done: [...daily.done, dailyId] } };
      });
      gainXp(xp, [], "デイリーミッション達成!");
    },
    [gainXp]
  );

  const completeWeekly = React.useCallback(
    (missionId: string, xp: number) => {
      const week = weekStr();
      setState((prev) => {
        const weekly =
          prev.weeklyMissionProgress.week === week
            ? prev.weeklyMissionProgress
            : { week, done: [] as string[] };
        if (weekly.done.includes(missionId)) return prev;
        return { ...prev, weeklyMissionProgress: { week, done: [...weekly.done, missionId] } };
      });
      gainXp(xp, [], "ウィークリーミッション達成!");
    },
    [gainXp]
  );

  const completeTutorialModule = React.useCallback((moduleId: string) => {
    setState((prev) =>
      prev.completedTutorialModules.includes(moduleId)
        ? prev
        : { ...prev, completedTutorialModules: [...prev.completedTutorialModules, moduleId] }
    );
  }, []);

  const finishTutorial = React.useCallback(
    (scorePercent: number) => {
      setState((prev) => ({
        ...prev,
        tutorialCompleted: true,
        licenseIssued: true,
        licenseIssuedAt: new Date().toISOString(),
        tutorialQuizScore: scorePercent,
      }));
      gainXp(
        TUTORIAL_PASS_XP,
        [],
        "🪪 見習い技術者ライセンスを取得!企業クエストが受注可能になりました",
        "license"
      );
    },
    [gainXp]
  );

  /** ログインボーナス:1日1回宝箱を開けてランダム報酬 */
  const openChest = React.useCallback(() => {
    const today = todayStr();
    if (state.lastChestDate === today) return;
    const total = CHEST_REWARDS.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * total;
    let picked = CHEST_REWARDS[0];
    for (const r of CHEST_REWARDS) {
      roll -= r.weight;
      if (roll <= 0) {
        picked = r;
        break;
      }
    }
    const reward = { name: picked.name, xp: picked.xp };
    setState((prev) => ({
      ...prev,
      lastChestDate: today,
      loginStamps: (prev.loginStamps % 7) + 1,
      lastChestReward: reward,
    }));
    gainXp(reward.xp, [], `宝箱から「${reward.name}」を獲得!`, "chest");
  }, [gainXp, state.lastChestDate]);

  const setAvatar = React.useCallback((avatar: string) => {
    setState((prev) => ({ ...prev, avatar }));
  }, []);

  const resetAll = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(SEED_STATE);
  }, []);

  /* バッジ判定 */
  const earnedBadges = React.useMemo<BadgeDef[]>(() => {
    const level = playerLevel(state.xp);
    const completedApprovedWithCheck = state.completedQuests.some((id) => {
      const q = allQuests.find((x) => x.id === id);
      return q?.teacherCheckRequired && q?.approvalStatus === "approved";
    });
    const avgCompanyRating =
      COMPANY_REVIEWS.reduce(
        (sum, r) =>
          sum + (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5,
        0
      ) / COMPANY_REVIEWS.length;
    const checks: Record<string, boolean> = {
      b1: true,
      b2: state.completedMaterials.length > 0,
      b3: state.completedQuests.length > 0,
      b4: state.loginStreak >= 3,
      b5: state.completedMaterials.length >= 5,
      b6: state.completedQuests.length >= 3,
      b7: level >= 5,
      b8: Object.keys(state.teamApplications).length > 0,
      b9: completedApprovedWithCheck,
      b10: state.completedQuests.length >= 5 && avgCompanyRating >= 4.5,
      b11: state.licenseIssued,
    };
    return BADGES.filter((b) => checks[b.id]);
  }, [state, allQuests]);

  // 新しく獲得したバッジを永続化リストへ反映し、獲得演出を出す
  React.useEffect(() => {
    if (!hydrated) return;
    const ids = earnedBadges.map((b) => b.id);
    const newIds = ids.filter((id) => !state.earnedBadges.includes(id));
    if (newIds.length === 0) return;
    // 初回ロード時(記録が空)はまとめて記録だけ行い、演出は出さない
    const isFirstSync = state.earnedBadges.length === 0 && newIds.length > 1;
    if (!isFirstSync) {
      const badge = BADGES.find((b) => b.id === newIds[newIds.length - 1]);
      if (badge) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- バッジ獲得は状態の派生イベントで、演出は獲得検知時に一度だけ出す
        setCelebration({
          key: Date.now(),
          kind: "badge",
          message: `実績解除:「${badge.name}」`,
          xp: 0,
          levelUp: null,
          badge,
        });
      }
    }
    setState((prev) => ({ ...prev, earnedBadges: [...prev.earnedBadges, ...newIds] }));
  }, [earnedBadges, hydrated, state.earnedBadges]);

  const value: GameContextValue = {
    state,
    hydrated,
    celebration,
    dismissCelebration: () => setCelebration(null),
    allQuests,
    questById,
    earnedBadges,
    studentStatus: deriveStudentStatus(state),
    completeMaterial,
    acceptQuest,
    completeQuest,
    postQuest,
    setQuestStatus,
    applyToTeam,
    completeDaily,
    completeWeekly,
    completeTutorialModule,
    finishTutorial,
    openChest,
    setAvatar,
    resetAll,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = React.useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

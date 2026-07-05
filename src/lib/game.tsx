"use client";

/**
 * ゲーム状態管理(経験値・レベル・クエスト・承認・localStorage永続化)
 * バックエンドなしのプロトタイプのため、すべての状態をここで一元管理する。
 */

import * as React from "react";
import type {
  ApprovalStatus,
  BadgeDef,
  Quest,
  QuestPostInput,
  SkillId,
} from "@/lib/types";
import { QUESTS } from "@/lib/data/quests";
import { MATERIAL_MAP } from "@/lib/data/materials";
import { BADGES } from "@/lib/data/misc";
import { COMPANY_REVIEWS } from "@/lib/data/reviews";

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

export interface MyStudentReview {
  questId: string;
  clarity: number;
  responseSpeed: number;
  rewardFairness: number;
  learning: number;
  safetyCare: number;
  recommend: number;
  comment: string;
}

export interface GameState {
  userName: string;
  department: string;
  grade: string;
  xp: number;
  weeklyXp: number; // 今週獲得した経験値(ランキング用)
  skillXp: Record<SkillId, number>;
  streak: number;
  lastActiveDate: string | null;
  completedMaterials: string[];
  acceptedQuests: string[];
  completedQuests: string[];
  customQuests: Quest[];
  statusOverrides: Record<string, { status: ApprovalStatus; teacherComment?: string }>;
  teamApplications: Record<string, string>; // teamQuestId -> 役割名
  daily: { date: string; done: string[] };
  myStudentReviews: MyStudentReview[];
}

/** 初期状態:デモとして少し進んだ状態から始める */
const SEED_STATE: GameState = {
  userName: "高専 太郎",
  department: "機械工学科",
  grade: "4年",
  xp: 880,
  weeklyXp: 320,
  skillXp: {
    cad: 220, materials: 300, drawing: 260, machining: 100, measurement: 165,
    electronics: 0, control: 0, aidx: 160, report: 290, teamdev: 60,
  },
  streak: 5,
  lastActiveDate: null,
  completedMaterials: ["m1", "m3", "m6", "m13", "m14"],
  acceptedQuests: [],
  completedQuests: ["q1", "q3", "q4", "q5", "q6"],
  customQuests: [],
  statusOverrides: {},
  teamApplications: {},
  daily: { date: "", done: [] },
  myStudentReviews: [],
};

const STORAGE_KEY = "mechaxmatch-state-v1";

/* ---------------- 演出(XP獲得・レベルアップ) ---------------- */

export interface Celebration {
  key: number;
  message: string;
  xp: number;
  levelUp: number | null; // レベルアップした場合の新レベル
}

/* ---------------- Context ---------------- */

interface GameContextValue {
  state: GameState;
  hydrated: boolean;
  celebration: Celebration | null;
  dismissCelebration: () => void;
  /** ダミーデータ + 企業投稿クエスト(承認状態の上書きを反映済み) */
  allQuests: Quest[];
  questById: (id: string) => Quest | undefined;
  earnedBadges: BadgeDef[];
  completeMaterial: (id: string) => void;
  acceptQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  postQuest: (input: QuestPostInput) => Quest;
  setQuestStatus: (id: string, status: ApprovalStatus, comment?: string) => void;
  applyToTeam: (teamQuestId: string, role: string) => void;
  completeDaily: (dailyId: string, xp: number) => void;
  resetAll: () => void;
}

const GameContext = React.createContext<GameContextValue | null>(null);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextStreak(state: GameState): { streak: number; lastActiveDate: string } {
  const today = todayStr();
  if (state.lastActiveDate === today) return { streak: state.streak, lastActiveDate: today };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (state.lastActiveDate === yesterday || state.lastActiveDate === null) {
    return { streak: state.streak + (state.lastActiveDate === null ? 0 : 1), lastActiveDate: today };
  }
  return { streak: 1, lastActiveDate: today };
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

  // 変更をlocalStorageへ保存
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ストレージ不可の環境では保存をあきらめる(動作は継続)
    }
  }, [state, hydrated]);

  /** 経験値を加算し、レベルアップ判定と演出をまとめて行う */
  const gainXp = React.useCallback(
    (amount: number, skillIds: SkillId[], message: string) => {
      setState((prev) => {
        const levelBefore = playerLevel(prev.xp);
        const skillXp = { ...prev.skillXp };
        for (const s of skillIds) skillXp[s] = (skillXp[s] ?? 0) + amount;
        const xp = prev.xp + amount;
        const levelAfter = playerLevel(xp);
        setCelebration({
          key: Date.now(),
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
    setState((prev) =>
      prev.acceptedQuests.includes(id)
        ? prev
        : { ...prev, acceptedQuests: [...prev.acceptedQuests, id] }
    );
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
      cautions: input.safetyNotes ? input.safetyNotes.split("\n").filter(Boolean) : [],
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
          prev.daily.date === today ? prev.daily : { date: today, done: [] as string[] };
        if (daily.done.includes(dailyId)) return prev;
        return { ...prev, daily: { date: today, done: [...daily.done, dailyId] } };
      });
      gainXp(xp, [], "デイリークエスト達成!");
    },
    [gainXp]
  );

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
      b4: state.streak >= 3,
      b5: state.completedMaterials.length >= 5,
      b6: state.completedQuests.length >= 3,
      b7: level >= 5,
      b8: Object.keys(state.teamApplications).length > 0,
      b9: completedApprovedWithCheck,
      b10: state.completedQuests.length >= 5 && avgCompanyRating >= 4.5,
    };
    return BADGES.filter((b) => checks[b.id]);
  }, [state, allQuests]);

  const value: GameContextValue = {
    state,
    hydrated,
    celebration,
    dismissCelebration: () => setCelebration(null),
    allQuests,
    questById,
    earnedBadges,
    completeMaterial,
    acceptQuest,
    completeQuest,
    postQuest,
    setQuestStatus,
    applyToTeam,
    completeDaily,
    resetAll,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = React.useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

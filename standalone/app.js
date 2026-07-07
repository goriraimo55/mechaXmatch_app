/* ============================================================
 * MechaXMatch スタンドアロン版 — アプリ本体
 * 素のHTML/CSS/JavaScriptのみで動作(ビルド・サーバ不要)。
 * データは data.js(Next.js版と同一のダミーデータ)を使用。
 * ============================================================ */

"use strict";

/* ---------------- ユーティリティ ---------------- */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}
function stars(n, cls) {
  let h = `<span class="stars ${cls || ""}">`;
  for (let i = 1; i <= 5; i++) h += i <= Math.round(n) ? "★" : '<span class="off">★</span>';
  return h + "</span>";
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function weekStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-w${Math.ceil(d.getDate() / 7)}`;
}

/* ---------------- レベル計算 ---------------- */

function xpForLevel(level) { return 50 * (level - 1) * level; }
function playerLevel(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}
function levelProgress(xp) {
  const level = playerLevel(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { current: xp - cur, next: next - cur, percent: Math.round(((xp - cur) / (next - cur)) * 100) };
}

/* ---------------- 状態管理(localStorage) ---------------- */

const STORAGE_KEY = "mechaxmatch-standalone-v1";

const SEED_STATE = {
  userName: "高専 太郎",
  department: "機械工学科",
  grade: "4年",
  avatar: "🧑‍🔧",
  xp: 880,
  weeklyXp: 320,
  skillXp: { cad: 220, materials: 300, drawing: 260, machining: 100, measurement: 165, electronics: 0, control: 0, aidx: 160, report: 290, teamdev: 60 },
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

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(structuredClone(SEED_STATE), JSON.parse(raw));
  } catch (e) { /* 壊れたデータは初期状態で上書き */ }
  return structuredClone(SEED_STATE);
}

function saveState() {
  const level = playerLevel(state.xp);
  state.studentStatus = deriveStudentStatus();
  state.unlockedTitles = TITLES.filter((t) => level >= t.minLevel).map((t) => t.title);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 保存不可でも動作継続 */ }
}

function deriveStudentStatus() {
  if (!state.tutorialCompleted) {
    return state.completedTutorialModules.length > 0 ? "チュートリアル中" : "ライセンス未取得";
  }
  const level = playerLevel(state.xp);
  if (level >= 4) return "チームクエスト参加可能";
  if (level >= 3) return "教員承認付きクエスト受注可能";
  return "企業クエスト受注可能";
}

function qualificationSteps() {
  const level = playerLevel(state.xp);
  return [
    { label: "チュートリアル中", achieved: state.completedTutorialModules.length > 0 || state.tutorialCompleted, hint: "ライセンス講習を開始する" },
    { label: "見習い技術者", achieved: state.licenseIssued, hint: "講習+ミニテスト合格でライセンス取得" },
    { label: "企業クエスト受注可能", achieved: state.licenseIssued, hint: "ライセンス取得で解放" },
    { label: "教員承認付きクエスト受注可能", achieved: state.licenseIssued && level >= 3, hint: "ライセンス + レベル3で解放" },
    { label: "チームクエスト参加可能", achieved: state.licenseIssued && level >= 4, hint: "ライセンス + レベル4で解放" },
  ];
}

function allQuests() {
  return [...QUESTS, ...state.customQuests].map((q) => {
    const o = state.statusOverrides[q.id];
    return o ? Object.assign({}, q, { approvalStatus: o.status, teacherComment: o.teacherComment }) : q;
  });
}
function questById(id) { return allQuests().find((q) => q.id === id); }

/* ---------------- 演出(キュー付き) ---------------- */

const celebrationQueue = [];
let celebrating = false;

function celebrate(c) {
  celebrationQueue.push(c);
  if (!celebrating) nextCelebration();
}
function nextCelebration() {
  const c = celebrationQueue.shift();
  if (!c) { celebrating = false; return; }
  celebrating = true;
  const el = document.getElementById("celebration");
  const confetti = c.kind === "levelup" || c.kind === "license"
    ? Array.from({ length: 40 }, (_, i) =>
        `<span class="confetti" style="left:${(i * 53) % 100}%;background:${["#22d3ee","#a78bfa","#4ade80","#fbbf24","#f472b6"][i % 5]};animation-delay:${(i % 10) * 0.12}s"></span>`
      ).join("")
    : "";
  const head =
    c.kind === "levelup" ? `<div class="big">🎉</div><p class="headline c-amber">LEVEL UP!</p><p class="bold">レベル <span style="font-size:26px" class="c-cyan">${c.levelUp}</span> に到達!</p>`
    : c.kind === "license" ? `<div class="big">🪪</div><p class="headline c-green">LICENSE GET!</p>`
    : c.kind === "badge" ? `<div class="big">${c.badgeIcon || "🏅"}</div><p class="headline c-purple">実績解除!</p>`
    : c.kind === "chest" ? `<div class="big">🎁</div>`
    : `<div class="big">✨</div>`;
  el.innerHTML = `${confetti}<div class="box">${head}<p class="small muted mt">${esc(c.message)}</p>${c.xp ? `<p class="xp">+${c.xp} XP</p>` : ""}</div>`;
  el.classList.add("show");
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(nextCelebration, 250);
  }, c.kind === "levelup" || c.kind === "license" ? 2800 : 1900);
}

/* ---------------- XP・ストリーク・バッジ ---------------- */

function updateStreak() {
  const today = todayStr();
  if (state.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (state.lastActiveDate === yesterday) state.loginStreak += 1;
  else if (state.lastActiveDate !== null) state.loginStreak = 1;
  state.lastActiveDate = today;
}

function gainXp(amount, skillIds, message, kind) {
  const before = playerLevel(state.xp);
  state.xp += amount;
  state.weeklyXp += amount;
  (skillIds || []).forEach((s) => { state.skillXp[s] = (state.skillXp[s] || 0) + amount; });
  updateStreak();
  const after = playerLevel(state.xp);
  celebrate(
    after > before
      ? { kind: "levelup", message, xp: amount, levelUp: after }
      : { kind: kind || "xp", message, xp: amount }
  );
  saveState();
  checkBadges();
}

function computeEarnedBadgeIds() {
  const level = playerLevel(state.xp);
  const qs = allQuests();
  const withCheck = state.completedQuests.some((id) => {
    const q = qs.find((x) => x.id === id);
    return q && q.teacherCheckRequired && q.approvalStatus === "approved";
  });
  const avg = COMPANY_REVIEWS.reduce((s, r) =>
    s + (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5, 0) / COMPANY_REVIEWS.length;
  const checks = {
    b1: true,
    b2: state.completedMaterials.length > 0,
    b3: state.completedQuests.length > 0,
    b4: state.loginStreak >= 3,
    b5: state.completedMaterials.length >= 5,
    b6: state.completedQuests.length >= 3,
    b7: level >= 5,
    b8: Object.keys(state.teamApplications).length > 0,
    b9: withCheck,
    b10: state.completedQuests.length >= 5 && avg >= 4.5,
    b11: state.licenseIssued,
  };
  return BADGES.filter((b) => checks[b.id]).map((b) => b.id);
}

function checkBadges() {
  const ids = computeEarnedBadgeIds();
  const newIds = ids.filter((id) => !state.earnedBadges.includes(id));
  if (newIds.length === 0) return;
  const firstSync = state.earnedBadges.length === 0 && newIds.length > 1;
  state.earnedBadges = state.earnedBadges.concat(newIds);
  saveState();
  if (!firstSync) {
    const badge = BADGES.find((b) => b.id === newIds[newIds.length - 1]);
    if (badge) celebrate({ kind: "badge", message: `実績解除:「${badge.name}」`, badgeIcon: badge.icon });
  }
}

/* ---------------- 画面ごとの一時UI状態 ---------------- */

const ui = {
  questFilter: "all",
  learnCategory: "すべて",
  materialQuiz: {},        // materialId -> { open, answer }
  rankTab: "class",
  reviewTab: "fromCompany",
  openTemplate: (typeof TEMPLATES !== "undefined" && TEMPLATES[0]) ? TEMPLATES[0].id : null,
  tutorialStep: 0,
  quizAnswers: Array(TUTORIAL_QUIZ.length).fill(null),
  quizSubmitted: false,
  teacherChecks: {},        // questId -> [bool x7]
  teacherComments: {},      // questId -> string
  postSubmitted: false,
  postForm: null,
};

/* ---------------- 共通パーツ ---------------- */

const APPROVAL_LABEL = {
  approved: '<span class="badge green">✅ 教員承認済み</span>',
  pending: '<span class="badge amber">⏳ 教員承認待ち</span>',
  returned: '<span class="badge purple">↩️ 差し戻し</span>',
  rejected: '<span class="badge red">🚫 却下</span>',
};
const DANGER_CLASS = {
  "リモートのみ": "green", "学校設備使用": "", "現場訪問あり": "amber", "工具使用あり": "amber",
  "回転体あり": "red", "高温部品あり": "red", "高電圧注意": "red", "薬品使用あり": "red",
  "重量物あり": "amber", "教員立会い推奨": "amber",
};
function dangerLabels(labels) {
  return `<div class="labels">${labels.map((l) =>
    `<span class="badge ${DANGER_CLASS[l] || ""}">${DANGER_CLASS[l] === "red" ? "⚠️ " : ""}${esc(l)}</span>`).join("")}</div>`;
}
function skillChips(ids) {
  return `<div class="labels">${ids.map((id) => {
    const s = SKILL_MAP[id];
    return `<span class="badge" style="background:${s.color}1a;color:${s.color};border-color:${s.color}44">${s.icon} ${s.name}</span>`;
  }).join("")}</div>`;
}

function questCardHtml(q) {
  const accepted = state.acceptedQuests.includes(q.id);
  const completed = state.completedQuests.includes(q.id);
  const challengeable = q.approvalStatus === "approved" && !completed;
  let actionBtn;
  if (!state.licenseIssued && !completed) {
    actionBtn = `<button class="btn warning sm" onclick="App.go('tutorial')" title="チュートリアルを完了すると受注できます">🔒 ライセンス未取得</button>`;
  } else if (completed) {
    actionBtn = `<button class="btn sm" disabled>達成済み</button>`;
  } else if (accepted) {
    actionBtn = `<button class="btn sm" disabled>挑戦中</button>`;
  } else if (challengeable) {
    actionBtn = `<button class="btn sm" onclick="App.acceptQuest('${q.id}')">⚔️ 挑戦する</button>`;
  } else {
    actionBtn = `<button class="btn sm" disabled>承認待ち</button>`;
  }
  const card = `
  <div class="card quest-card">
    <div class="labels">
      ${q.isRare ? '<span class="badge amber pulse-glow">✨ レアクエスト</span>' : ""}
      ${q.isUrgent ? '<span class="badge red">🚨 緊急クエスト</span>' : ""}
      ${q.isPopular ? '<span class="badge pink">🔥 今週人気</span>' : ""}
      ${q.isTeam ? '<span class="badge purple">👥 チーム</span>' : ""}
      ${APPROVAL_LABEL[q.approvalStatus]}
    </div>
    <div class="title"><a href="#/quest/${q.id}">${esc(q.title)}</a></div>
    <div class="xs muted">🏢 ${esc(q.company)} | ${stars(q.companyRating)} (${q.companyRatingCount})</div>
    <div class="meta">
      <span>難易度 ${stars(q.difficulty, "pink")}</span>
      <span>🎓 ${esc(q.recommendedGrade)}</span>
      <span class="bold c-amber">💰 ¥${q.reward.toLocaleString()}</span>
      <span class="bold c-green">+${q.xp} XP</span>
      <span>📅 〆 ${q.deadline}</span>
      <span>${q.remoteOk ? '<span class="c-green">📶 リモート可</span>' : '<span class="c-amber">📍 現地あり</span>'}</span>
      <span style="grid-column:1/-1">🛡️ 安全レベル: ${q.safetyLevel}${q.teacherCheckRequired ? ' <span class="c-amber">/ 教員確認が必要</span>' : ""}</span>
    </div>
    ${skillChips(q.requiredSkills)}
    ${dangerLabels(q.dangerLabels)}
    ${q.classmatesChallenging ? `<p class="xs bold c-amber">👀 同級生${q.classmatesChallenging}人が挑戦中</p>` : ""}
    <div class="actions">
      <a class="btn outline sm" href="#/quest/${q.id}" style="text-decoration:none">詳細を見る</a>
      ${actionBtn}
    </div>
  </div>`;
  return q.isRare ? `<div class="rare-border">${card}</div>` : card;
}

function rankingListHtml(entries, includeMe) {
  const level = playerLevel(state.xp);
  const list = entries.map((r) => Object.assign({}, r, { isMe: false }));
  if (includeMe) {
    list.push({ name: `${state.userName}(あなた)`, department: state.department, grade: state.grade, weeklyXp: state.weeklyXp, level, isMe: true });
  }
  list.sort((a, b) => b.weeklyXp - a.weeklyXp);
  return list.map((r, i) => `
    <div class="rank-row ${r.isMe ? "me" : ""}">
      <span class="pos ${i === 0 ? "p1" : i === 1 ? "p2" : i === 2 ? "p3" : ""}">${i + 1}</span>
      <div style="flex:1;min-width:0">
        <div class="small bold">${esc(r.name)}</div>
        <div class="xs muted">${esc(r.department)} ・ Lv.${r.level}</div>
      </div>
      <span class="small black c-green">${r.weeklyXp.toLocaleString()} XP</span>
    </div>`).join("");
}

function adBannerHtml(index, count) {
  const items = Array.from({ length: count || 1 }, (_, i) => ADS[(index + i) % ADS.length]);
  return `<div class="grid ${count > 1 ? "grid-2" : ""}">${items.map((ad) => `
    <div class="card tight" style="border-style:dashed;position:relative;margin-bottom:0">
      <span class="xs muted" style="position:absolute;top:8px;right:10px;background:var(--secondary);border-radius:4px;padding:1px 6px;font-weight:700">PR</span>
      <div class="row">
        <div style="width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:${ad.color}22;border:1px solid ${ad.color}55">${ad.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="xs bold" style="color:${ad.color}">${esc(ad.category)}</div>
          <div class="small bold">${esc(ad.title)}</div>
          <div class="xs muted">${esc(ad.body)}</div>
        </div>
        <button class="btn outline sm" style="color:${ad.color};border-color:${ad.color}66" onclick="alert('ダミー広告です(プロトタイプ)')">${esc(ad.cta)}</button>
      </div>
    </div>`).join("")}</div>`;
}

/* ---------------- 各画面 ---------------- */

function viewHome() {
  const level = playerLevel(state.xp);
  const prog = levelProgress(state.xp);
  const today = todayStr();
  const dailyDone = state.dailyMissionProgress.date === today ? state.dailyMissionProgress.done : [];
  const chestOpened = state.lastChestDate === today;
  const earned = computeEarnedBadgeIds();
  const steps = qualificationSteps();
  const currentIdx = steps.reduce((a, s, i) => (s.achieved ? i : a), -1);
  const recQuests = allQuests()
    .filter((q) => q.approvalStatus === "approved" && !state.completedQuests.includes(q.id))
    .sort((a, b) => (b.isRare ? 1 : 0) - (a.isRare ? 1 : 0)).slice(0, 3);
  const recMats = MATERIALS.filter((m) => !state.completedMaterials.includes(m.id)).slice(0, 3);

  const weeklyMetric = (metric, target) => {
    const cur = metric === "weeklyXp" ? state.weeklyXp
      : metric === "materials" ? state.completedMaterials.length
      : dailyDone.length;
    return { current: Math.min(cur, target), reached: cur >= target };
  };

  return `
  ${!state.licenseIssued ? `
  <div class="card glow-amber animate-pop" style="border-color:rgba(251,191,36,.5)">
    <div class="row">
      <span style="font-size:42px">🪪</span>
      <div style="flex:1;min-width:220px">
        <div class="bold c-amber" style="font-size:16px">ミッション:見習い技術者ライセンスを取得せよ</div>
        <p class="small muted">君は技術者ギルドの新人メンバー。企業クエストを受注するには、工学倫理・機密情報・安全管理の講習とミニテストの合格が必要だ。合格報酬 <b class="c-green">+300 XP</b> +ライセンスバッジ。</p>
      </div>
      <a class="btn lg" href="#/tutorial" style="text-decoration:none">講習をはじめる →</a>
    </div>
  </div>` : ""}

  <div class="card glow-cyan" style="border-color:rgba(34,211,238,.3)">
    <div class="row">
      <div style="width:76px;height:76px;border-radius:18px;display:grid;place-items:center;font-size:38px;background:linear-gradient(135deg,var(--cyan),var(--purple))">${state.avatar}</div>
      <div>
        <span class="badge purple">称号:${titleForLevel(level)}</span>
        <h1 style="font-size:22px;font-weight:900">${esc(state.userName)}</h1>
        <div class="xs muted">${esc(state.department)} ${esc(state.grade)}</div>
      </div>
      <div style="flex:1;min-width:240px">
        <div class="row between">
          <span class="small muted">レベル <b class="c-cyan" style="font-size:26px;text-shadow:0 0 12px rgba(34,211,238,.6)">${level}</b></span>
          <span class="small bold c-green">総経験値 ${state.xp.toLocaleString()} XP</span>
        </div>
        <div class="progress mt"><i style="width:${prog.percent}%"></i></div>
        <div class="row between xs muted" style="margin-top:5px">
          <span>次のレベルまで ${prog.next - prog.current} XP</span>
          <span class="bold c-amber">🔥 ${state.loginStreak}日連続で学習中!</span>
        </div>
        ${prog.percent >= 80 ? `<p class="xs black c-amber mt">⚡ あと ${prog.next - prog.current} XP でレベルアップ!教材1本で届くぞ!</p>` : ""}
      </div>
    </div>
  </div>

  <div class="section-title">🛡️ 現在の受注資格</div>
  <div class="card" style="border-color:${state.licenseIssued ? "rgba(74,222,128,.4)" : "rgba(251,191,36,.4)"}">
    <div class="row">
      <span class="badge ${state.licenseIssued ? "green" : "amber"}" style="font-size:13px">${state.licenseIssued ? "🪪" : "🔒"} ${steps[currentIdx] ? steps[currentIdx].label : "未登録"}</span>
      ${state.licenseIssued && state.licenseIssuedAt ? `<span class="xs muted">ライセンス発行日: ${new Date(state.licenseIssuedAt).toLocaleDateString("ja-JP")}${state.tutorialQuizScore !== null ? ` / 修了テスト ${state.tutorialQuizScore}点` : ""}</span>` : ""}
    </div>
    <div class="grid mt" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      ${steps.map((s) => `
        <div class="card tight" style="margin-bottom:0;${s.achieved ? "border-color:rgba(74,222,128,.4);background:rgba(74,222,128,.05)" : "opacity:.6"}">
          <div class="xs bold">${s.achieved ? "✅" : "🔒"} ${s.label}</div>
          ${!s.achieved ? `<div class="xs muted">${s.hint}</div>` : ""}
        </div>`).join("")}
    </div>
    ${!state.licenseIssued ? `<a class="btn warning sm mt" href="#/tutorial" style="text-decoration:none;display:inline-flex">🪪 ライセンス講習を受ける →</a>` : ""}
  </div>

  <div class="grid grid-2">
    <div class="card" style="border-color:rgba(251,191,36,.3);margin-bottom:0">
      <div class="row">
        <button class="chest-btn" onclick="App.openChest()" ${chestOpened ? "disabled" : ""}>${chestOpened ? "📭" : "🎁"}</button>
        <div style="flex:1">
          <div class="small black">🎁 連続ログインボーナス</div>
          <div class="xs muted">${chestOpened ? `本日開封済み:「${esc(state.lastChestReward ? state.lastChestReward.name : "")}」+${state.lastChestReward ? state.lastChestReward.xp : 0} XP` : "宝箱をタップしてランダム報酬をゲット!"}</div>
          <div class="stamps">${Array.from({ length: 7 }, (_, i) => `<span class="stamp ${i < state.loginStamps ? "on" : ""}">${i < state.loginStamps ? "⚙️" : i + 1}</span>`).join("")}</div>
        </div>
      </div>
    </div>
    <div class="card" style="border-color:rgba(244,114,182,.3);margin-bottom:0">
      <div class="row">
        <span style="font-size:36px">${LIMITED_EVENT.icon}</span>
        <div>
          <div class="small black"><span class="badge pink">期間限定イベント</span> ${esc(LIMITED_EVENT.title)}</div>
          <div class="xs muted">${esc(LIMITED_EVENT.description)}</div>
          <div class="xs bold c-pink">⏰ ${LIMITED_EVENT.until} まで</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">🏆 所持バッジ・実績 <a href="#/profile">すべて見る →</a></div>
  <div class="badge-shelf">
    ${BADGES.map((b) => `
      <div class="badge-tile ${earned.includes(b.id) ? "earned" : "locked"}" title="${esc(b.description)}">
        <div class="ic">${b.icon}</div>${esc(b.name)}
      </div>`).join("")}
  </div>

  <div class="grid grid-2 mt">
    <div>
      <div class="section-title" style="margin-top:0">✅ デイリーミッション</div>
      ${DAILY_QUESTS.map((d) => {
        const done = dailyDone.includes(d.id);
        return `
        <div class="card tight" ${done ? 'style="border-color:rgba(74,222,128,.4);background:rgba(74,222,128,.05)"' : ""}>
          <div class="row">
            <span style="font-size:22px">${d.icon}</span>
            <div style="flex:1"><div class="small bold">${esc(d.title)}</div><div class="xs c-green">+${d.xp} XP</div></div>
            <button class="btn sm ${done ? "success" : ""}" ${done ? "disabled" : ""} onclick="App.completeDaily('${d.id}',${d.xp})">${done ? "達成" : "完了"}</button>
          </div>
        </div>`;
      }).join("")}
    </div>
    <div>
      <div class="section-title" style="margin-top:0">🎯 ウィークリーミッション</div>
      ${WEEKLY_MISSIONS.map((w) => {
        const m = weeklyMetric(w.metric, w.target);
        const done = state.weeklyMissionProgress.done.includes(w.id);
        return `
        <div class="card tight" ${done ? 'style="border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.05)"' : ""}>
          <div class="row">
            <span style="font-size:22px">${w.icon}</span>
            <div style="flex:1">
              <div class="small bold">${esc(w.title)}</div>
              <div class="row"><div class="progress thin" style="flex:1"><i style="width:${(m.current / w.target) * 100}%"></i></div><span class="xs muted">${m.current}/${w.target}</span></div>
              <div class="xs c-purple">報酬 +${w.xp} XP</div>
            </div>
            <button class="btn sm ${done ? "success" : "outline"}" ${done || !m.reached ? "disabled" : ""} onclick="App.completeWeekly('${w.id}',${w.xp})">${done ? "達成" : m.reached ? "受取" : "挑戦中"}</button>
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>

  <div class="section-title">📨 企業からのスカウト</div>
  <div class="grid grid-2">
    ${SCOUTS.map((s) => `
    <div class="card tight" style="border-color:rgba(244,114,182,.3);margin-bottom:0">
      <div class="row" style="align-items:flex-start">
        <span style="font-size:28px">${s.icon}</span>
        <div style="flex:1">
          <div class="xs bold c-pink">📨 スカウトが届いています</div>
          <div class="small bold">${esc(s.company)}</div>
          <div class="xs muted">${esc(s.message)}</div>
          <a class="xs bold" href="#/quest/${s.questId}">クエストを見る →</a>
        </div>
      </div>
    </div>`).join("")}
  </div>

  <div class="section-title">⚔️ 今日のおすすめクエスト <a href="#/quests">すべて見る →</a></div>
  <div class="grid grid-3">${recQuests.map(questCardHtml).join("")}</div>

  <div class="mt">${adBannerHtml(0, 2)}</div>

  <div class="grid grid-2 mt">
    <div>
      <div class="section-title" style="margin-top:0">📖 おすすめ学習 <a href="#/learn">すべて見る →</a></div>
      ${recMats.map((m) => `
        <div class="card tight">
          <div class="row">
            <span style="width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:rgba(167,139,250,.15)">📖</span>
            <div style="flex:1">
              <a class="small bold" href="#/learn" style="color:var(--fg)">${esc(m.title)}</a>
              <div class="xs muted">${m.category} ・ 約${m.minutes}分 ・ <b class="c-green">+${m.xp} XP</b></div>
            </div>
          </div>
        </div>`).join("")}
    </div>
    <div>
      <div class="section-title" style="margin-top:0">🏆 今週のランキング</div>
      <div class="card tight">
        <div class="tabs mb" style="width:100%">
          ${[["class", "クラス内"], ["national", "全国高専"], ["skill", "スキル別"]].map(([k, l]) =>
            `<button class="tab ${ui.rankTab === k ? "active" : ""}" style="flex:1" onclick="App.setRankTab('${k}')">${l}</button>`).join("")}
        </div>
        ${ui.rankTab === "class" ? rankingListHtml(RANKING, true)
          : ui.rankTab === "national" ? rankingListHtml(NATIONAL_RANKING, true)
          : `<p class="xs bold muted" style="padding:0 10px 4px">🖥️ ${SKILL_RANKING.skillName} 部門(週間スキルXP)</p>` + rankingListHtml(SKILL_RANKING.entries, false)}
      </div>
    </div>
  </div>

  <div class="card" style="border-color:rgba(167,139,250,.3)">
    <div class="small black mb">🏰 MechaXMatch のあそびかた</div>
    <div class="grid grid-2 small muted">
      <p>🪪 <b style="color:var(--fg)">ライセンス講習</b>で倫理・安全・機密の心得を学ぶ</p>
      <p>⚔️ <b style="color:var(--fg)">企業の技術課題</b>に挑むと経験値と報酬がもらえる</p>
      <p>✅ <b style="color:var(--fg)">教員が安全性を確認</b>した案件だけが公開される</p>
      <p>🏆 実績は<b style="color:var(--fg)">ポートフォリオと証明書</b>になり就活で使える</p>
    </div>
  </div>`;
}

function viewTutorial() {
  const TOTAL = TUTORIAL_MODULES.length + 3;
  const step = state.tutorialCompleted ? TOTAL - 1 : ui.tutorialStep;
  const correctCount = ui.quizAnswers.filter((a, i) => a === TUTORIAL_QUIZ[i].answerIndex).length;
  const scorePercent = Math.round((correctCount / TUTORIAL_QUIZ.length) * 100);
  const passed = correctCount / TUTORIAL_QUIZ.length >= TUTORIAL_PASS_RATE;
  const allAnswered = ui.quizAnswers.every((a) => a !== null);

  let body = "";
  if (step === 0) {
    body = `
    <div class="card glow-cyan animate-pop center" style="border-color:rgba(34,211,238,.4);padding:32px">
      <div style="font-size:52px">🏰</div>
      <h1 style="font-size:22px;font-weight:900;margin:10px 0">ようこそ、<span class="c-cyan" style="text-shadow:0 0 12px rgba(34,211,238,.6)">技術者ギルド</span>へ。</h1>
      <div class="small muted" style="max-width:520px;margin:0 auto;text-align:left">
        <p>${esc(state.userName)} — 君は今日から、このギルドの<b style="color:var(--fg)">新人メンバー</b>だ。</p>
        <p class="mt">ここには、実在する企業から届いた「本物の技術課題」がクエストとして集まっている。挑めば経験値と報酬、そして就活で使える実績が手に入る。</p>
        <p class="mt">ただし——企業クエストを受けるには、まず<b class="c-amber">「見習い技術者ライセンス」</b>の取得が必要だ。</p>
        <p class="mt">工学倫理・機密情報・安全管理・報告の基本。プロの世界に踏み込む前に、5つの心得を身につけよう。</p>
      </div>
      <div class="labels mt" style="justify-content:center">${TUTORIAL_MODULES.map((m) => `<span class="badge">${m.icon} ${m.title}</span>`).join("")}</div>
      <button class="btn lg mt" onclick="App.tutorialGo(1)">講習をはじめる →</button>
      <p class="xs muted mt">修了ミニテストに合格すると +${TUTORIAL_PASS_XP} XP とライセンスバッジを獲得</p>
    </div>`;
  } else if (step >= 1 && step <= TUTORIAL_MODULES.length) {
    const mod = TUTORIAL_MODULES[step - 1];
    const done = state.completedTutorialModules.includes(mod.id);
    body = `
    <div class="card animate-pop" style="border-color:${mod.color}55;padding:26px">
      <div class="row">
        <div style="width:54px;height:54px;border-radius:14px;display:grid;place-items:center;font-size:28px;background:${mod.color}1a;border:1.5px solid ${mod.color}66">${mod.icon}</div>
        <div style="flex:1">
          <div class="xs bold muted">心得 その${step} / ${TUTORIAL_MODULES.length}</div>
          <h2 style="font-size:19px;font-weight:900;color:${mod.color}">${mod.title}</h2>
        </div>
        ${done ? '<span class="badge green">✅ 学習済み</span>' : ""}
      </div>
      <p class="small muted mt">${esc(mod.intro)}</p>
      <div class="mt">
        ${mod.points.map((p) => `
          <div class="row" style="align-items:flex-start;border:1px solid var(--border);border-radius:10px;background:rgba(30,41,59,.4);padding:10px 12px;margin-bottom:8px">
            <span style="color:${mod.color};font-weight:900">✔</span>
            <span class="small">${esc(p)}</span>
          </div>`).join("")}
      </div>
      <div class="row between mt">
        <button class="btn ghost" onclick="App.tutorialGo(${step - 1})">← 戻る</button>
        <button class="btn" onclick="App.tutorialModuleDone('${mod.id}',${step + 1})">理解した!次へ →</button>
      </div>
    </div>`;
  } else if (step === TUTORIAL_MODULES.length + 1) {
    body = `
    <div class="card animate-pop" style="border-color:rgba(251,191,36,.4);padding:26px">
      <div class="center">
        <div style="font-size:36px">📝</div>
        <h2 style="font-size:19px;font-weight:900">修了ミニテスト</h2>
        <p class="small muted">全${TUTORIAL_QUIZ.length}問・${Math.round(TUTORIAL_PASS_RATE * 100)}%以上の正解で合格。不合格の場合は復習からやり直しになります。</p>
      </div>
      ${TUTORIAL_QUIZ.map((q, qi) => `
      <div class="mt">
        <p class="small bold">Q${qi + 1}. ${esc(q.question)}</p>
        <div class="mt">
          ${q.choices.map((c, ci) => {
            const chosen = ui.quizAnswers[qi] === ci;
            let cls = "";
            if (ui.quizSubmitted) {
              if (ci === q.answerIndex) cls = "correct";
              else if (chosen) cls = "wrong";
            } else if (chosen) cls = "chosen";
            return `<button class="quiz-choice ${cls}" ${ui.quizSubmitted ? "disabled" : ""} onclick="App.quizAnswer(${qi},${ci})">${["A", "B", "C", "D"][ci]}. ${esc(c)}</button>`;
          }).join("")}
        </div>
        ${ui.quizSubmitted ? `<p class="xs ${ui.quizAnswers[qi] === q.answerIndex ? "c-green" : "c-amber"}">${ui.quizAnswers[qi] === q.answerIndex ? "🎉 正解! " : "❌ 不正解… "}${esc(q.explanation)}</p>` : ""}
      </div>`).join("")}
      ${!ui.quizSubmitted
        ? `<button class="btn lg block mt" ${allAnswered ? "" : "disabled"} onclick="App.quizSubmit()">回答を提出する(${ui.quizAnswers.filter((a) => a !== null).length}/${TUTORIAL_QUIZ.length}問回答済み)</button>`
        : !passed
          ? `<div class="card center mt" style="border-color:rgba(248,113,113,.4);background:rgba(248,113,113,.08);margin-bottom:0">
              <p class="black c-red" style="font-size:16px">不合格… 正解 ${correctCount}/${TUTORIAL_QUIZ.length}問(${scorePercent}%)</p>
              <p class="small muted">合格ライン${Math.round(TUTORIAL_PASS_RATE * 100)}%に届きませんでした。解説を読んで、心得の復習からもう一度挑戦しよう。</p>
              <button class="btn warning mt" onclick="App.quizRetry()">🔄 復習ページへ戻る</button>
            </div>`
          : ""}
    </div>`;
  } else {
    const score = state.tutorialQuizScore !== null ? state.tutorialQuizScore : scorePercent;
    body = `
    <div class="card glow-cyan animate-pop center" style="border-color:rgba(74,222,128,.5);padding:30px">
      <div style="font-size:52px">🪪</div>
      <h2 style="font-size:22px;font-weight:900" class="c-green">見習い技術者ライセンス 発行!</h2>
      <p class="small muted" style="max-width:480px;margin:8px auto">おめでとう、${esc(state.userName)}。君は工学倫理・機密情報・安全管理・企業コミュニケーション・成果物品質の心得を修了した。今日から<b style="color:var(--fg)">企業クエストの受注が可能</b>だ。</p>
      <div style="max-width:340px;margin:14px auto;text-align:left;border:1px solid rgba(34,211,238,.4);border-radius:14px;background:linear-gradient(135deg,var(--secondary),var(--card));padding:18px">
        <div class="row between xs muted" style="letter-spacing:.25em"><span>ENGINEER LICENSE</span><span>MechaXMatch GUILD</span></div>
        <div class="row mt">
          <span style="width:52px;height:52px;border-radius:12px;display:grid;place-items:center;font-size:28px;background:linear-gradient(135deg,var(--cyan),var(--purple))">${state.avatar}</span>
          <div>
            <div class="bold" style="font-size:16px">${esc(state.userName)}</div>
            <div class="xs muted">${esc(state.department)} ${esc(state.grade)} / Lv.${playerLevel(state.xp)}</div>
          </div>
        </div>
        <div class="grid grid-2 mt" style="gap:8px">
          <div style="background:rgba(11,15,26,.5);border-radius:8px;padding:8px"><div class="xs muted">資格</div><div class="xs bold c-green">見習い技術者</div></div>
          <div style="background:rgba(11,15,26,.5);border-radius:8px;padding:8px"><div class="xs muted">テストスコア</div><div class="xs bold">${score}%</div></div>
          <div style="grid-column:1/-1;background:rgba(11,15,26,.5);border-radius:8px;padding:8px"><div class="xs muted">発行日</div><div class="xs bold">${state.licenseIssuedAt ? new Date(state.licenseIssuedAt).toLocaleDateString("ja-JP") : new Date().toLocaleDateString("ja-JP")}</div></div>
        </div>
        <p class="xs muted mt">✅ 工学倫理・機密情報・安全管理・報告基礎 修了済み</p>
      </div>
      <div class="row" style="justify-content:center">
        <a class="btn lg" href="#/quests" style="text-decoration:none">⚔️ さっそくクエストボードへ</a>
        <a class="btn outline lg" href="#/home" style="text-decoration:none">ホームに戻る</a>
      </div>
    </div>
    <div class="card tight" style="border-style:dashed"><p class="small muted">🎓 講習内容はいつでもこのページで復習できます。迷ったら「心得」に立ち返ろう。</p></div>`;
  }

  return `
  <div style="max-width:640px;margin:0 auto">
    <div class="row between xs muted">
      <span class="black c-cyan" style="letter-spacing:.15em">🪪 見習い技術者ライセンス講習</span>
      <span>STEP ${Math.min(step + 1, TOTAL)} / ${TOTAL}</span>
    </div>
    <div class="progress mt mb"><i style="width:${((step + 1) / TOTAL) * 100}%"></i></div>
    ${body}
  </div>`;
}

function viewQuests() {
  const visible = allQuests().filter((q) => q.approvalStatus !== "rejected");
  const f = ui.questFilter;
  const filtered = visible.filter((q) => {
    if (f === "remote") return q.remoteOk;
    if (f === "onsite") return !q.remoteOk;
    if (f === "rare") return !!q.isRare;
    if (f === "accepted") return state.acceptedQuests.includes(q.id);
    if (f === "completed") return state.completedQuests.includes(q.id);
    return true;
  });
  const tabs = [
    ["all", `すべて (${visible.length})`], ["remote", "リモート可"], ["onsite", "現地あり"],
    ["rare", "✨レア"], ["accepted", `挑戦中 (${state.acceptedQuests.length})`],
    ["completed", `達成済み (${state.completedQuests.length})`],
  ];
  return `
  <h1 class="page-title">⚔️ クエストボード</h1>
  <p class="page-sub">企業から届いた技術課題。挑戦して経験値と報酬、そして実績を手に入れよう。<span class="c-green">✅ 教員承認済み</span>のクエストだけが挑戦できます。</p>
  <div class="tabs mb">${tabs.map(([k, l]) => `<button class="tab ${f === k ? "active" : ""}" onclick="App.setQuestFilter('${k}')">${l}</button>`).join("")}</div>
  <div class="grid grid-3">${filtered.map(questCardHtml).join("")}</div>
  ${filtered.length === 0 ? '<p class="center muted" style="padding:50px 0">該当するクエストがありません</p>' : ""}`;
}

function viewQuestDetail(id) {
  const q = questById(id);
  if (!q) return `<p class="center muted" style="padding:60px 0">クエストが見つかりませんでした<br><a href="#/quests">クエスト一覧へ戻る</a></p>`;
  const accepted = state.acceptedQuests.includes(q.id);
  const completed = state.completedQuests.includes(q.id);
  const approved = q.approvalStatus === "approved";
  const template = TEMPLATE_MAP[q.submissionTemplateId];
  const reviews = STUDENT_REVIEWS.filter((r) => r.company === q.company);
  const section = (icon, title, inner) =>
    `<div class="mb"><div class="xs black c-cyan" style="letter-spacing:.08em;margin-bottom:5px">${icon} ${title}</div><div class="small">${inner}</div></div>`;
  const bullets = (items) => `<ul style="list-style:none">${items.map((x) => `<li>▸ ${esc(x)}</li>`).join("")}</ul>`;

  let action;
  if (completed) {
    action = `<div class="center" style="background:rgba(74,222,128,.1);border-radius:10px;padding:16px"><div style="font-size:28px">🏆</div><div class="black c-green">クエスト達成済み!</div><div class="xs muted">実績はプロフィールに記録されています</div></div>`;
  } else if (!approved) {
    action = `<div class="center small" style="background:rgba(251,191,36,.1);border-radius:10px;padding:16px"><div style="font-size:22px">⏳</div><div class="bold c-amber">教員の承認待ちです</div><div class="xs muted">安全性・難易度・守秘義務の確認が完了すると挑戦できます</div></div>`;
  } else if (!state.licenseIssued) {
    action = `<div class="center small" style="background:rgba(251,191,36,.1);border-radius:10px;padding:16px">
      <div style="font-size:22px">🔒</div><div class="bold c-amber">ライセンス未取得</div>
      <div class="xs muted">企業クエストの受注には「見習い技術者ライセンス」が必要です。</div>
      <a class="btn warning block mt" href="#/tutorial" style="text-decoration:none">🪪 ライセンス講習を受ける</a></div>`;
  } else if (!accepted) {
    action = `<button class="btn lg block" onclick="App.acceptQuest('${q.id}')">⚔️ このクエストに挑戦する</button><p class="center xs muted mt">挑戦中クエストに追加されます</p>`;
  } else {
    action = `<p class="center small bold c-cyan">🔥 挑戦中のクエストです</p>
      <button class="btn success lg block mt" onclick="App.completeQuest('${q.id}')">📤 成果物を提出して完了する</button>
      <p class="center xs muted mt">(プロトタイプでは提出と同時に完了・経験値獲得となります)</p>`;
  }

  return `
  <a class="small muted" href="#/quests">← クエストボードへ戻る</a>
  <div class="card mt ${q.isRare ? "glow-amber" : ""}" style="border-color:${q.isRare ? "rgba(251,191,36,.5)" : "rgba(34,211,238,.3)"}">
    <div class="labels">
      ${q.isRare ? '<span class="badge amber pulse-glow">✨ レアクエスト</span>' : ""}
      ${q.isUrgent ? '<span class="badge red">🚨 緊急クエスト</span>' : ""}
      ${APPROVAL_LABEL[q.approvalStatus]}
      ${q.ndaRequired ? '<span class="badge">🔐 秘密保持あり</span>' : ""}
    </div>
    <h1 style="font-size:20px;font-weight:900;margin:6px 0">${esc(q.title)}</h1>
    <div class="small muted">🏢 ${esc(q.company)}(${esc(q.industry)}) 企業評価 ${stars(q.companyRating)} <b class="c-amber">${q.companyRating || "—"}</b>(${q.companyRatingCount}件)</div>
    <div class="grid mt" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">
      ${[["難易度", stars(q.difficulty, "pink")],
        ["報酬", `<b class="c-amber">💰 ¥${q.reward.toLocaleString()}</b>`],
        ["獲得経験値", `<b class="c-green">+${q.xp} XP</b>`],
        ["締切", `<b>📅 ${q.deadline}</b>`],
        ["実施形態", q.remoteOk ? '<b class="c-green">📶 リモート可</b>' : '<b class="c-amber">📍 現地あり</b>'],
        ["推奨学年", `<b>🎓 ${esc(q.recommendedGrade)}</b>`]]
        .map(([l, v]) => `<div style="background:rgba(30,41,59,.6);border-radius:10px;padding:10px"><div class="xs muted">${l}</div><div class="small">${v}</div></div>`).join("")}
    </div>
    <div class="mt xs bold muted">🛡️ 安全レベル: ${q.safetyLevel}${q.teacherCheckRequired ? ' <span class="c-amber">/ 教員確認が必要な案件です</span>' : ""}</div>
    ${dangerLabels(q.dangerLabels)}
  </div>
  ${q.teacherComment ? `<div class="card tight" style="border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.05)"><span class="bold c-purple">👨‍🏫 教員コメント:</span> ${esc(q.teacherComment)}</div>` : ""}

  <div class="grid" style="grid-template-columns:2fr 1fr">
    <div>
      <div class="card">
        ${section("🏢", "背景", esc(q.background))}
        ${section("🎯", "依頼内容", esc(q.request))}
        ${section("📦", "成果物", bullets(q.deliverables))}
        ${section("📖", "必要な知識", bullets(q.knowledge.length ? q.knowledge : ["特になし(挑戦しながら学べます)"]))}
        ${section("🔧", "使用する設備", bullets(q.equipment))}
        ${section("⚠️", "注意事項", bullets(q.cautions.length ? q.cautions : ["特になし"]))}
        ${section("✅", "評価基準", bullets(q.criteria))}
      </div>
      <div class="card" style="border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.05)">
        <div class="small black c-green mb">🌱 このクエストで成長できること</div>
        <p class="small">${esc(q.learnPoints)}</p>
        ${skillChips(q.requiredSkills)}
        <p class="xs muted">↑ クエスト達成でこれらのスキル経験値が +${q.xp} されます</p>
      </div>
      ${adBannerHtml(3, 1)}
    </div>
    <div>
      <div class="card" style="border-color:rgba(34,211,238,.4)">${action}</div>
      ${template ? `
      <div class="card tight">
        <div class="small bold mb">📋 提出テンプレート</div>
        <div class="small bold">${template.icon} ${esc(template.name)}</div>
        <div class="xs muted">${esc(template.purpose)}</div>
        <a class="xs bold" href="#/templates">テンプレートを確認する →</a>
      </div>` : ""}
      ${q.referenceMaterialIds.length ? `
      <div class="card tight">
        <div class="small bold mb">📖 参考教材</div>
        ${q.referenceMaterialIds.map((mid) => {
          const m = MATERIAL_MAP[mid];
          if (!m) return "";
          const done = state.completedMaterials.includes(mid);
          return `<a href="#/learn" style="display:block;border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:6px;color:var(--fg);text-decoration:none">
            <div class="xs bold">${done ? "✅" : "📖"} ${esc(m.title)}</div>
            <div class="xs muted">${m.category} ・ +${m.xp} XP</div></a>`;
        }).join("")}
      </div>` : ""}
      <div class="card tight">
        <div class="small bold mb">🗣️ 先輩たちの企業評価</div>
        ${reviews.length === 0 ? '<p class="xs muted">まだ評価がありません</p>' : reviews.map((r) => `
          <div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px">
            <div class="row between xs">${stars(r.recommend)}<span class="muted">おすすめ度 ${r.recommend}/5</span></div>
            <p class="xs muted">${esc(r.comment)}</p>
          </div>`).join("")}
        <a class="xs bold" href="#/reviews">すべての相互評価を見る →</a>
      </div>
    </div>
  </div>`;
}

function viewPost() {
  if (ui.postSubmitted) {
    return `
    <div class="center" style="max-width:520px;margin:60px auto">
      <div style="font-size:56px">✅</div>
      <h1 class="page-title mt">投稿を受け付けました</h1>
      <p class="small muted">ご依頼は現在<b class="c-amber">「教員承認待ち」</b>です。担当教員が安全性・難易度・守秘義務を確認したのち、学生のクエストボードで「挑戦可能」として公開されます。</p>
      <div class="row mt" style="justify-content:center">
        <button class="btn outline" onclick="App.postAgain()">続けて投稿する</button>
        <a class="btn" href="#/quests" style="text-decoration:none">クエスト一覧を確認</a>
      </div>
    </div>`;
  }
  const DANGERS = ["リモートのみ", "学校設備使用", "現場訪問あり", "工具使用あり", "回転体あり", "高温部品あり", "高電圧注意", "薬品使用あり", "重量物あり", "教員立会い推奨"];
  const INDUSTRIES = ["機械加工", "精密部品加工", "溶接・板金", "産業機械組立", "FA・自動化設備", "制御盤製作", "計測・検査", "試作・3Dプリント", "ロボット開発", "その他製造業"];
  return `
  <div style="max-width:760px;margin:0 auto">
    <h1 class="page-title">🏢 企業向け:仕事投稿テンプレート</h1>
    <p class="page-sub">このフォームに沿って入力するだけで、御社の「小さな技術課題」が高専生の「成長クエスト」になります。投稿後は<b style="color:var(--fg)">教員が安全性・難易度・守秘義務を確認</b>してから学生に公開されます。</p>

    <div class="card" style="border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.05)">
      <div class="small black c-green mb">🛡️ 安心してご依頼いただくために</div>
      <div class="grid grid-2 xs muted" style="gap:6px">
        <p>🪪 学生は<b style="color:var(--fg)">チュートリアル修了後でないと受注できません</b></p>
        <p>📚 受注学生は<b style="color:var(--fg)">工学倫理・機密情報・安全管理を学習済み</b>です</p>
        <p>✅ すべての案件に<b style="color:var(--fg)">教員承認フロー</b>があります</p>
        <p>⚠️ <b style="color:var(--fg)">危険度ラベル</b>で作業リスクを事前共有できます</p>
        <p>📋 <b style="color:var(--fg)">成果物テンプレート</b>で品質のばらつきを防ぎます</p>
        <p>⭐ 企業と学生の<b style="color:var(--fg)">相互評価</b>で健全な取引を守ります</p>
        <p>🔐 機密情報を扱う案件は<b style="color:var(--fg)">受注学生を制限</b>できます</p>
        <p>🎚️ 学生に公開する情報は<b style="color:var(--fg)">段階的に設定</b>できます</p>
      </div>
    </div>

    <form id="postForm" onsubmit="App.submitPost(event)">
      <div class="card">
        <div class="small black mb">1. 基本情報</div>
        <label class="field"><span>依頼タイトル <b class="req">*</b></span><input type="text" name="title" required placeholder="例:古い図面を3D CAD化してほしい"></label>
        <div class="grid grid-2">
          <label class="field"><span>会社名 <b class="req">*</b></span><input type="text" name="company" required></label>
          <label class="field"><span>業種</span><select name="industry">${INDUSTRIES.map((i) => `<option>${i}</option>`).join("")}</select></label>
        </div>
      </div>
      <div class="card">
        <div class="small black mb">2. 依頼内容</div>
        <label class="field"><span>困っていること(背景)<b class="req">*</b></span><textarea name="problem" rows="3" required placeholder="例:ベテランが残した紙図面が多く、設変のたびに探すのが大変…"></textarea></label>
        <label class="field"><span>依頼したい作業 <b class="req">*</b></span><textarea name="request" rows="3" required placeholder="例:スキャンした図面10枚を3D CADモデルにしてほしい"></textarea></label>
        <label class="field"><span>成果物(1行に1つ)</span><textarea name="deliverables" rows="2" placeholder="3D CADデータ(STEP)&#10;作業メモ"></textarea></label>
        <label class="field"><span>使ってよいデータ</span><input type="text" name="allowedData" placeholder="例:スキャン図面PDF(閲覧リンクで共有)"></label>
        <label class="check"><input type="checkbox" name="ndaRequired"> 秘密保持(NDA)が必要な案件</label>
        <label class="field"><span>学生に公開する情報の段階</span>
          <select name="disclosureLevel">
            <option>応募前から全情報を公開</option>
            <option>応募前は概要のみ・受注確定後に詳細を公開</option>
            <option>NDA締結後に図面・データを公開</option>
            <option>教員経由でのみ機密資料を共有</option>
          </select>
          <div class="hint">機密情報を扱う案件は、公開範囲を段階的に制限できます</div>
        </label>
      </div>
      <div class="card">
        <div class="small black mb">3. 求めるスキル・条件</div>
        <div class="field"><span class="small bold">必要スキル(1つ以上)<b class="req">*</b></span>
          <div class="labels mt" id="skillChips">
            ${SKILLS.map((s) => `<button type="button" class="chip" data-skill="${s.id}" onclick="this.classList.toggle('on')">${s.icon} ${s.name}</button>`).join("")}
          </div>
        </div>
        <div class="grid grid-3 mt">
          <label class="field"><span>推奨学年</span><select name="recommendedGrade">${["1年生以上", "2年生以上", "3年生以上", "4年生以上", "5年生・専攻科"].map((g) => `<option ${g === "3年生以上" ? "selected" : ""}>${g}</option>`).join("")}</select></label>
          <label class="field"><span>難易度(1〜5)</span><select name="difficulty">${[1, 2, 3, 4, 5].map((d) => `<option value="${d}" ${d === 2 ? "selected" : ""}>${"★".repeat(d)}</option>`).join("")}</select></label>
          <label class="field"><span>報酬(円)</span><input type="number" name="reward" value="8000" min="0" step="1000"></label>
        </div>
        <div class="grid grid-2">
          <label class="field"><span>締切 <b class="req">*</b></span><input type="date" name="deadline" required></label>
          <div>
            <label class="check"><input type="checkbox" name="remoteOk" checked> リモートで完結できる</label>
            <label class="check"><input type="checkbox" name="usesSchoolEquipment"> 学校設備の利用を想定している</label>
            <label class="check"><input type="checkbox" name="teamOk"> チームでの受注も歓迎</label>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="small black mb">4. 安全面の確認</div>
        <p class="xs muted mb">該当する危険度ラベルをすべて選択してください。教員承認の判断材料になります。</p>
        <div class="labels" id="dangerChips">
          ${DANGERS.map((l) => `<button type="button" class="chip" data-danger="${l}" onclick="this.classList.toggle('on-amber')">${l}</button>`).join("")}
        </div>
        <label class="field mt"><span>安全面の注意(自由記述)</span><textarea name="safetyNotes" rows="2" placeholder="例:工場見学時は保護メガネ・安全靴を貸与します"></textarea></label>
        <label class="check"><input type="checkbox" name="teacherCheckRequired"> 実施にあたり教員の確認・立会いを希望する</label>
      </div>
      <div class="card">
        <div class="small black mb">5. 学生への提示内容</div>
        <label class="field"><span>学生にとって学べること <b class="req">*</b></span>
          <textarea name="learnPoints" rows="2" required placeholder="例:実務図面の読み方と、図面からモデルを起こす実践力が身につきます"></textarea>
          <div class="hint">このクエストで学生がどう成長できるかを書くと、挑戦者が集まりやすくなります</div>
        </label>
        <label class="field"><span>提出物の形式</span><input type="text" name="submissionFormat" value="PDFレポート"></label>
        <label class="field"><span>評価基準(1行に1つ)</span><textarea name="criteria" rows="2" placeholder="寸法の正確さ&#10;報告のわかりやすさ"></textarea></label>
      </div>
      <div class="center" style="padding-bottom:30px">
        <button type="submit" class="btn lg">📤 この内容でクエストを投稿する</button>
        <p class="xs muted mt">投稿後は「教員承認待ち」となり、承認されると学生に公開されます</p>
      </div>
    </form>
  </div>`;
}

function viewLearn() {
  const cats = ["すべて"].concat(MATERIAL_CATEGORIES);
  const filtered = ui.learnCategory === "すべて" ? MATERIALS : MATERIALS.filter((m) => m.category === ui.learnCategory);

  const materialCard = (m) => {
    const done = state.completedMaterials.includes(m.id);
    const mq = ui.materialQuiz[m.id] || { open: false, answer: null };
    return `
    <div class="card quest-card" ${done ? 'style="border-color:rgba(74,222,128,.4)"' : ""}>
      <div class="row between">
        <span class="badge purple">${m.category}</span>
        ${done ? '<span class="badge green">✅ 学習済み</span>' : ""}
      </div>
      <div class="title">${esc(m.title)}</div>
      <div class="xs muted">難易度 ${stars(m.difficulty, "pink")} ・ ⏱ 約${m.minutes}分 ・ <b class="c-green">+${m.xp} XP</b></div>
      <p class="small muted mt">${esc(m.summary)}</p>
      ${skillChips(m.skillIds)}
      <div style="border:1px dashed var(--border);border-radius:10px;padding:10px;margin:8px 0">
        <button class="btn ghost sm" style="padding:0;color:var(--cyan)" onclick="App.toggleQuiz('${m.id}')">❓ ミニクイズに挑戦 ${mq.open ? "▲" : "▼"}</button>
        ${mq.open ? `
          <p class="small bold mt">${esc(m.quiz.question)}</p>
          <div class="mt">${m.quiz.choices.map((c, i) => {
            let cls = "";
            if (mq.answer !== null) {
              if (i === m.quiz.answerIndex) cls = "correct";
              else if (i === mq.answer) cls = "wrong";
            }
            return `<button class="quiz-choice ${cls}" onclick="App.answerQuiz('${m.id}',${i})">${["A", "B", "C", "D"][i]}. ${esc(c)}</button>`;
          }).join("")}</div>
          ${mq.answer !== null ? `<p class="xs ${mq.answer === m.quiz.answerIndex ? "c-green" : "c-amber"}">${mq.answer === m.quiz.answerIndex ? "🎉 正解! " : "❌ 不正解… "}${esc(m.quiz.explanation)}</p>` : ""}` : ""}
      </div>
      ${m.relatedQuestIds.length ? `
      <div class="xs muted"><span class="bold">🔗 関連クエスト</span>
        <div class="labels">${m.relatedQuestIds.map((qid) => {
          const q = questById(qid);
          return q ? `<a class="badge" href="#/quest/${qid}" style="text-decoration:none">⚔️ ${esc(q.title.length > 16 ? q.title.slice(0, 16) + "…" : q.title)}</a>` : "";
        }).join("")}</div>
      </div>` : ""}
      <div class="actions">
        <button class="btn ${done ? "success" : ""}" ${done ? "disabled" : ""} onclick="App.completeMaterial('${m.id}')">${done ? "✅ 学習完了済み" : `📖 学習完了する(+${m.xp} XP)`}</button>
      </div>
    </div>`;
  };

  return `
  <h1 class="page-title">📖 機械設計 学習ライブラリ</h1>
  <p class="page-sub">学習を完了すると経験値とスキルが伸び、挑戦できるクエストが広がります。学習済み: <b class="c-green">${state.completedMaterials.length}</b> / ${MATERIALS.length}</p>
  <div class="labels mb">${cats.map((c) => `<button class="chip ${ui.learnCategory === c ? "on-purple" : ""}" onclick="App.setLearnCategory('${c}')">${c}</button>`).join("")}</div>
  <div class="grid grid-3">${filtered.slice(0, 6).map(materialCard).join("")}</div>
  <div class="mt">${adBannerHtml(5, 1)}</div>
  ${filtered.length > 6 ? `<div class="grid grid-3 mt">${filtered.slice(6).map(materialCard).join("")}</div>` : ""}`;
}

function viewSkills() {
  const ranked = SKILLS.map((s) => ({ skill: s, xp: state.skillXp[s.id] || 0 })).sort((a, b) => b.xp - a.xp);
  const top = ranked[0];
  const weakest = [...ranked].reverse().find((r) => r.xp < top.xp) || ranked[ranked.length - 1];
  const DIAG = {
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
  const d = DIAG[top.skill.id];
  const TIERS = {
    1: ["TIER 1 — 基礎スキル", "すべての技術者の土台。教材学習で伸ばしやすい"],
    2: ["TIER 2 — 応用スキル", "実務クエストで大きく成長する実践スキル"],
    3: ["TIER 3 — 総合スキル", "チームクエストや高難度案件で開花する上位スキル"],
  };
  const node = (s) => {
    const xp = state.skillXp[s.id] || 0;
    const level = skillLevel(xp);
    const prog = skillLevelProgress(xp);
    return `
    <div class="card skill-node ${xp > 0 ? "" : "locked"}">
      <div class="row">
        <div class="ic ${xp > 0 ? "pulse-glow" : ""}" style="background:${s.color}1a;border:1.5px solid ${s.color}${xp > 0 ? "88" : "33"}">${s.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="row between"><span class="black">${s.name}</span><span class="badge" style="background:${s.color}22;color:${s.color};border-color:transparent">Lv.${level}</span></div>
          <div class="xs muted">${esc(s.description)}</div>
        </div>
      </div>
      <div class="progress thin mt"><i style="width:${prog.percent}%"></i></div>
      <div class="row between xs muted" style="margin-top:4px"><span>累計 ${xp} XP</span><span>次のLvまで ${prog.next - prog.current} XP</span></div>
    </div>`;
  };
  return `
  <h1 class="page-title">🌳 スキルツリー</h1>
  <p class="page-sub">教材の学習・クエストの達成で、対応するスキルの経験値が貯まりレベルが上がります。</p>
  ${[1, 2, 3].map((tier) => `
    <div class="mb">
      <div class="xs black c-cyan" style="letter-spacing:.15em">${TIERS[tier][0]}</div>
      <div class="xs muted mb">${TIERS[tier][1]}</div>
      <div class="grid grid-3">${SKILLS.filter((s) => s.tier === tier).map(node).join("")}</div>
    </div>`).join("")}
  <div class="card" style="border-color:rgba(34,211,238,.3)">
    <div class="small black c-cyan mb">🧭 スキル診断:あなたは「${d.type}」タイプ</div>
    <p class="small muted">${d.description}</p>
    <div class="grid grid-2 mt">
      <div class="card tight" style="border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.05);margin-bottom:0">
        <div class="xs black c-green">🎓 おすすめ進路</div>
        <ul class="xs muted" style="list-style:none;margin-top:5px">${d.careers.map((c) => `<li>▸ ${c}</li>`).join("")}</ul>
      </div>
      <div class="card tight" style="border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.05);margin-bottom:0">
        <div class="xs black c-amber">💪 次に伸ばすと強いスキル</div>
        <p class="xs muted mt">${weakest.skill.icon} <b style="color:var(--fg)">${weakest.skill.name}</b> — ${esc(weakest.skill.description)}</p>
      </div>
    </div>
  </div>
  <div class="card tight" style="border-style:dashed"><p class="small muted">💡 <b style="color:var(--fg)">スキルの伸ばし方:</b> 教材を学習すると教材に紐づくスキルに、クエストを達成するとクエストの必要スキルに、それぞれ獲得経験値と同量のスキル経験値が加算されます。</p></div>`;
}

function viewTeam() {
  return `
  <h1 class="page-title">👥 チームクエスト</h1>
  <p class="page-sub">機械・電気・情報…学科の壁を越えてパーティを組み、ひとりでは挑めない大型案件に挑戦しよう。参加申請すると<b class="c-green">チーム開発スキル +30 XP</b>。</p>
  ${TEAM_QUESTS.map((tq) => {
    const appliedRole = state.teamApplications[tq.id];
    const totalCap = tq.roles.reduce((s, r) => s + r.capacity, 0);
    const totalMem = tq.roles.reduce((s, r) => s + r.members.length, 0);
    return `
    <div class="card" style="border-color:rgba(167,139,250,.3)">
      <div class="labels">
        <span class="badge purple">👥 チームクエスト</span>
        <span class="badge green">✅ 教員承認済み</span>
        ${appliedRole ? `<span class="badge amber">申請中:${esc(appliedRole)}</span>` : ""}
      </div>
      <div class="title" style="font-size:16px;font-weight:800;margin:6px 0">${esc(tq.title)}</div>
      <div class="xs muted">🏢 ${esc(tq.company)} ・ <b class="c-amber">💰 チーム報酬 ¥${tq.reward.toLocaleString()}</b> ・ <b class="c-green">チーム経験値 +${tq.xp} XP</b> ・ 📅 〆 ${tq.deadline}</div>
      <p class="small muted mt">${esc(tq.description)}</p>
      ${dangerLabels(tq.dangerLabels)}
      <div class="row between xs muted mt"><span class="bold">募集中の役割</span><span>メンバー <b style="color:var(--fg)">${totalMem}</b> / ${totalCap} 人</span></div>
      <div class="grid grid-2 mt">
        ${tq.roles.map((role) => {
          const full = role.members.length >= role.capacity;
          const isApplied = appliedRole === role.name;
          let btn;
          if (!state.licenseIssued) btn = `<a class="btn warning sm block mt" href="#/tutorial" style="text-decoration:none">🔒 ライセンス未取得</a>`;
          else if (isApplied) btn = `<button class="btn success sm block mt" disabled>✅ 申請済み</button>`;
          else if (full) btn = `<button class="btn sm block mt" disabled>満員</button>`;
          else if (appliedRole) btn = `<button class="btn sm block mt" disabled>他の役割に申請中</button>`;
          else btn = `<button class="btn sm block mt" onclick="App.applyTeam('${tq.id}','${esc(role.name)}')">🙋 参加申請する</button>`;
          return `
          <div class="card tight" style="margin-bottom:0;${isApplied ? "border-color:rgba(74,222,128,.6);background:rgba(74,222,128,.05)" : full ? "opacity:.6" : ""}">
            <div class="row between"><span class="small bold">${esc(role.name)}</span><span class="xs muted">${role.members.length}/${role.capacity}人</span></div>
            ${skillChips(role.requiredSkills)}
            ${role.members.length ? `<div class="xs muted">参加中: ${role.members.map(esc).join("、")}</div>` : ""}
            ${btn}
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("")}`;
}

function viewTemplates() {
  return `
  <div style="max-width:760px;margin:0 auto">
    <h1 class="page-title">📋 成果物 提出テンプレート</h1>
    <p class="page-sub">「何をどう出せばいいか」で迷わないための公式テンプレート。テンプレに沿って提出すれば、企業からの評価も上がりやすくなります。</p>
    ${TEMPLATES.map((t) => {
      const open = ui.openTemplate === t.id;
      return `
      <div class="card" ${open ? 'style="border-color:rgba(34,211,238,.4)"' : ""}>
        <div class="row between" style="cursor:pointer" onclick="App.toggleTemplate('${t.id}')">
          <span class="small black">${t.icon} ${esc(t.name)}</span><span class="muted">${open ? "▲" : "▼"}</span>
        </div>
        ${open ? `
        <div class="mt">
          <div class="xs black c-cyan">使用目的</div>
          <p class="small muted">${esc(t.purpose)}</p>
          <div class="grid grid-2 mt">
            <div>
              <div class="xs black c-cyan">記入項目</div>
              <ul class="small muted" style="list-style:none">${t.fields.map((f) => `<li>▸ ${esc(f)}</li>`).join("")}</ul>
            </div>
            <div>
              <div class="xs black c-cyan">提出ファイル形式</div>
              <div class="labels">${t.fileFormats.map((f) => `<span class="badge">${esc(f)}</span>`).join("")}</div>
              <div class="xs black c-cyan mt">評価ポイント</div>
              <ul class="small muted" style="list-style:none">${t.evaluationPoints.map((p) => `<li><span class="c-green">✓</span> ${esc(p)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="mt" style="border:1px dashed var(--border);border-radius:10px;background:rgba(30,41,59,.4);padding:10px">
            <div class="xs black c-amber">📝 サンプル記入例</div>
            <p class="xs muted">${esc(t.sampleEntry)}</p>
          </div>
        </div>` : ""}
      </div>`;
    }).join("")}
  </div>`;
}

function viewReviews() {
  const ratingRow = (label, v) => `<div class="row between xs"><span class="muted">${label}</span>${stars(v)}</div>`;
  const fromCompany = COMPANY_REVIEWS.map((r) => {
    const avg = (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5;
    return `
    <div class="card">
      <div class="row between"><span class="small bold">${esc(r.questTitle)}</span><span class="small black c-amber">${stars(avg)} ${avg.toFixed(1)}</span></div>
      <div class="xs muted mb">評価者: ${esc(r.company)}</div>
      <div class="grid grid-2" style="gap:4px 30px">
        ${ratingRow("技術理解", r.techUnderstanding)}${ratingRow("納期遵守", r.deadlineCompliance)}
        ${ratingRow("報告のわかりやすさ", r.reporting)}${ratingRow("成果物品質", r.quality)}
        ${ratingRow("再依頼したい度", r.rehireIntent)}
      </div>
      <p class="xs muted mt" style="background:rgba(30,41,59,.5);border-radius:8px;padding:10px">💬 ${esc(r.comment)}</p>
    </div>`;
  }).join("");
  const fromStudent = STUDENT_REVIEWS.map((r) => {
    const avg = (r.clarity + r.responseSpeed + r.rewardFairness + r.learning + r.safetyCare + r.recommend) / 6;
    return `
    <div class="card">
      <div class="row between"><span class="small bold">${esc(r.company)}</span><span class="small black c-amber">${stars(avg)} ${avg.toFixed(1)}</span></div>
      <div class="xs muted mb">対象クエスト: ${esc(r.questTitle)}</div>
      <div class="grid grid-2" style="gap:4px 30px">
        ${ratingRow("依頼内容の明確さ", r.clarity)}${ratingRow("質問への回答の早さ", r.responseSpeed)}
        ${ratingRow("報酬の妥当性", r.rewardFairness)}${ratingRow("学びの多さ", r.learning)}
        ${ratingRow("安全配慮", r.safetyCare)}${ratingRow("おすすめ度", r.recommend)}
      </div>
      <p class="xs muted mt" style="background:rgba(30,41,59,.5);border-radius:8px;padding:10px">💬 ${esc(r.comment)}</p>
    </div>`;
  }).join("");
  return `
  <div style="max-width:860px;margin:0 auto">
    <h1 class="page-title">⭐ 企業 × 学生 相互評価</h1>
    <p class="page-sub">クエスト完了後は、企業と学生がお互いを評価します。評価はオープンに蓄積され、<b style="color:var(--fg)">ブラック案件の防止</b>と<b style="color:var(--fg)">がんばる学生の実績証明</b>の両方に役立ちます。</p>
    <div class="tabs mb">
      <button class="tab ${ui.reviewTab === "fromCompany" ? "active" : ""}" onclick="App.setReviewTab('fromCompany')">🏢 企業 → 学生の評価</button>
      <button class="tab ${ui.reviewTab === "fromStudent" ? "active" : ""}" onclick="App.setReviewTab('fromStudent')">🧑‍🔧 学生 → 企業の評価</button>
    </div>
    ${ui.reviewTab === "fromCompany" ? fromCompany : fromStudent}
  </div>`;
}

function viewProfile() {
  const level = playerLevel(state.xp);
  const qs = allQuests();
  const completedQuests = state.completedQuests.map((id) => qs.find((q) => q.id === id)).filter(Boolean);
  const completedMats = state.completedMaterials.map((id) => MATERIAL_MAP[id]).filter(Boolean);
  const earned = computeEarnedBadgeIds();
  const topSkills = SKILLS.map((s) => ({ s, xp: state.skillXp[s.id] || 0 })).sort((a, b) => b.xp - a.xp).slice(0, 3);
  const companyAvg = COMPANY_REVIEWS.reduce((sum, r) =>
    sum + (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5, 0) / COMPANY_REVIEWS.length;
  const AVATAR_LIST = AVATARS;
  return `
  <div style="max-width:860px;margin:0 auto">
    <div class="row between mb">
      <h1 class="page-title" style="margin:0">👤 プロフィール & ポートフォリオ</h1>
      <a class="btn" href="#/certificate" style="text-decoration:none">🖨 スキル証明書PDF出力</a>
    </div>

    <div class="card" style="border-color:rgba(34,211,238,.4);overflow:hidden;position:relative">
      <div style="position:absolute;inset:0 0 auto 0;height:5px;background:linear-gradient(90deg,var(--cyan),var(--purple),var(--pink))"></div>
      <div class="row between xs muted" style="letter-spacing:.25em;margin-top:4px"><span>GUILD MEMBER CARD</span><span>No. MXM-2026-0042</span></div>
      <div class="row mt">
        <span style="width:62px;height:62px;border-radius:16px;display:grid;place-items:center;font-size:32px;background:linear-gradient(135deg,var(--cyan),var(--purple))">${state.avatar}</span>
        <div style="flex:1;min-width:200px">
          <div class="black" style="font-size:18px">${esc(state.userName)}</div>
          <div class="xs muted">${esc(state.department)} ${esc(state.grade)} / Lv.${level} 「${titleForLevel(level)}」</div>
          <div class="labels mt">
            <span class="badge ${state.licenseIssued ? "green" : "amber"}">${state.licenseIssued ? "🪪 見習い技術者ライセンス取得済み" : "🔒 ライセンス未取得"}</span>
            <span class="badge purple">${deriveStudentStatus()}</span>
          </div>
        </div>
      </div>
      <div class="row mt"><span class="xs bold muted">アバター:</span>
        ${AVATAR_LIST.map((a) => `<button class="chip ${state.avatar === a ? "on" : ""}" style="font-size:17px;padding:4px 9px" onclick="App.setAvatar('${a}')">${a}</button>`).join("")}
      </div>
      <div class="row mt"><span class="xs bold muted">解放済み称号:</span>
        ${TITLES.filter((t) => level >= t.minLevel).map((t) => `<span class="badge">👑 ${t.title}</span>`).join("")}
      </div>
    </div>

    <div class="card">
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">
        ${[["レベル", level, "c-cyan"], ["総経験値", state.xp.toLocaleString(), "c-green"], ["完了クエスト", completedQuests.length, "c-amber"], ["学習済み教材", completedMats.length, "c-purple"]]
          .map(([l, v, c]) => `<div class="center"><div class="xs muted">${l}</div><div class="black ${c}" style="font-size:26px">${v}</div></div>`).join("")}
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card" style="margin-bottom:0">
        <div class="small bold mb">💪 得意スキル TOP3</div>
        ${topSkills.map(({ s, xp }, i) => `
          <div class="row" style="margin-bottom:6px">
            <span class="black c-amber" style="width:18px;text-align:center">${i + 1}</span>
            <span style="font-size:17px">${s.icon}</span>
            <span class="small bold" style="flex:1">${s.name}</span>
            <span class="badge" style="background:${s.color}22;color:${s.color};border-color:transparent">Lv.${skillLevel(xp)}</span>
          </div>`).join("")}
      </div>
      <div class="card" style="margin-bottom:0">
        <div class="small bold mb">🏢 企業からの評価</div>
        <div class="row">${stars(companyAvg)}<span class="black c-amber" style="font-size:22px">${companyAvg.toFixed(1)}</span><span class="xs muted">(${COMPANY_REVIEWS.length}件の評価)</span></div>
        <p class="xs muted mt">「${esc(COMPANY_REVIEWS[COMPANY_REVIEWS.length - 1].comment)}」</p>
        <a class="xs bold" href="#/reviews">あなたが企業につけた評価も見る(${STUDENT_REVIEWS.length}件) →</a>
      </div>
    </div>

    <div class="card mt">
      <div class="small bold mb">🏆 獲得バッジ(${earned.length}/${BADGES.length})</div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
        ${BADGES.map((b) => `
          <div class="badge-tile ${earned.includes(b.id) ? "earned" : "locked"}" style="width:auto">
            <div class="ic">${b.icon}</div>${esc(b.name)}<div class="xs muted">${b.rarity}</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="card">
      <div class="small bold mb">⚔️ ポートフォリオ実績(完了クエスト)</div>
      ${completedQuests.length === 0 ? '<p class="center small muted" style="padding:20px">まだ実績がありません。クエストに挑戦しよう!</p>' : ""}
      ${completedQuests.map((q) => `
        <a href="#/quest/${q.id}" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;color:var(--fg);text-decoration:none">
          <span>🏆</span><span class="small bold" style="flex:1;min-width:160px">${esc(q.title)}</span>
          <span class="xs muted">${esc(q.company)}</span>
          <span class="badge green">✅ 教員承認済み案件</span>
          <span class="xs bold c-green">+${q.xp} XP</span>
        </a>`).join("")}
    </div>

    <div class="card">
      <div class="small bold mb">📖 学習済み教材</div>
      <div class="grid grid-2">
        ${completedMats.map((m) => `
          <div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px">
            <div class="small bold">📖 ${esc(m.title)}</div>
            <div class="xs muted">${m.category} ・ +${m.xp} XP</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="card tight" style="border-style:dashed">
      <div class="row between">
        <p class="small muted">🏅 この実績は就活・インターン応募に使える<b style="color:var(--fg)">スキル証明書</b>として出力できます</p>
        <a class="btn outline sm" href="#/certificate" style="text-decoration:none">証明書プレビューへ →</a>
      </div>
    </div>
  </div>`;
}

function viewTeacher() {
  const qs = allQuests();
  const pending = qs.filter((q) => q.approvalStatus === "pending");
  const processed = qs.filter((q) => q.teacherComment && q.approvalStatus !== "pending");
  const highRisk = qs.filter((q) => q.safetyLevel === "高" || q.dangerLabels.some((l) => ["高電圧注意", "薬品使用あり", "回転体あり", "高温部品あり"].includes(l)));
  const nda = qs.filter((q) => q.ndaRequired);
  const CHECKLIST = ["教育効果があるか", "学生の学年・技能に合っているか", "安全上の問題がないか", "機密情報の扱いが明確か", "成果物が明確か", "報酬または学習価値が妥当か", "教員の監督負荷が過大でないか"];
  const RETURN_TPL = [
    ["危険度不一致", "危険度ラベルと作業内容が一致していません。実作業に含まれる危険源を追記のうえ再申請してください。"],
    ["難易度過大", "推奨学年に対して難易度が高すぎます。作業範囲の縮小、または推奨学年の引き上げを検討してください。"],
    ["機密範囲不明", "機密情報の共有範囲・保存方法が不明確です。「使ってよいデータ」と公開段階を具体化してください。"],
    ["成果物曖昧", "成果物の定義が曖昧です。提出物の形式・数量・評価基準を明確にしてください。"],
    ["報酬不均衡", "報酬と作業量のバランスが取れていません。作業時間の見積りとあわせて再検討をお願いします。"],
  ];
  const students = [
    { name: `${state.userName}(本アカウント)`, tutorial: state.tutorialCompleted, license: state.licenseIssued, score: state.tutorialQuizScore, status: deriveStudentStatus() },
    { name: "アオイ@機械5年", tutorial: true, license: true, score: 100, status: "企業クエスト受注可能" },
    { name: "リク@機械4年", tutorial: true, license: true, score: 83, status: "企業クエスト受注可能" },
    { name: "ソウタ@機械3年", tutorial: true, license: true, score: 83, status: "企業クエスト受注可能" },
    { name: "サクラ@物質2年", tutorial: false, license: false, score: null, status: "ライセンス未取得" },
    { name: "カイト@情報2年", tutorial: false, license: false, score: null, status: "ライセンス未取得" },
  ];

  const pendingCard = (q) => {
    const checks = ui.teacherChecks[q.id] || Array(7).fill(false);
    const allChecked = checks.every(Boolean);
    const comment = ui.teacherComments[q.id] || "";
    return `
    <div class="card" style="border-color:rgba(251,191,36,.3)">
      <div class="labels">
        ${APPROVAL_LABEL[q.approvalStatus]}
        ${q.ndaRequired ? '<span class="badge">🔐 秘密保持あり</span>' : ""}
        ${q.teacherCheckRequired ? '<span class="badge amber">🛡️ 教員確認の希望あり</span>' : ""}
      </div>
      <div class="title" style="font-size:16px;font-weight:800;margin:6px 0">${esc(q.title)}</div>
      <div class="xs muted mb">🏢 ${esc(q.company)}(${esc(q.industry)})</div>
      <div class="grid grid-2">
        <div><div class="xs bold muted">依頼内容</div><p class="small">${esc(q.request)}</p></div>
        <div><div class="xs bold muted">学生にとって学べること</div><p class="small">${esc(q.learnPoints)}</p></div>
      </div>
      <div class="grid mt" style="grid-template-columns:repeat(4,1fr);gap:8px">
        ${[["報酬", `<b class="c-amber">¥${q.reward.toLocaleString()}</b>`], ["推奨学年", `<b>${esc(q.recommendedGrade)}</b>`], ["難易度", stars(q.difficulty, "pink")], ["使用設備", `<b>${esc(q.equipment[0] || "—")}</b>`]]
          .map(([l, v]) => `<div style="background:rgba(30,41,59,.6);border-radius:8px;padding:8px"><div class="xs muted">${l}</div><div class="xs">${v}</div></div>`).join("")}
      </div>
      <div class="mt"><div class="xs bold muted mb">危険度ラベル</div>${dangerLabels(q.dangerLabels)}</div>
      ${q.cautions.length ? `
      <div class="mt" style="border:1px solid rgba(251,191,36,.3);background:rgba(251,191,36,.05);border-radius:10px;padding:10px">
        <div class="xs bold c-amber">安全面の注意(企業記入)</div>
        <ul class="xs muted" style="list-style:disc inside">${q.cautions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </div>` : ""}
      <div class="mt" style="border:1px solid rgba(74,222,128,.3);background:rgba(74,222,128,.05);border-radius:10px;padding:10px">
        <div class="xs black c-green mb">✅ 承認時チェックリスト(${checks.filter(Boolean).length}/7)— 全項目の確認で承認ボタンが有効になります</div>
        <div class="grid grid-2" style="gap:4px">
          ${CHECKLIST.map((item, i) => `
            <label class="check xs" style="margin:2px 0"><input type="checkbox" ${checks[i] ? "checked" : ""} onchange="App.teacherCheck('${q.id}',${i},this.checked)"> ${item}</label>`).join("")}
        </div>
      </div>
      <div class="mt">
        <div class="xs bold muted mb">教員コメント(学生・企業に表示されます)</div>
        <textarea rows="2" id="comment-${q.id}" placeholder="例:現場訪問時は必ず引率教員に連絡すること。">${esc(comment)}</textarea>
        <div class="labels mt"><span class="xs bold muted">差し戻し理由テンプレ:</span>
          ${RETURN_TPL.map(([label, text]) => `<button class="chip on-amber" style="font-size:10px;padding:2px 8px" title="${esc(text)}" onclick="App.teacherTemplate('${q.id}',${RETURN_TPL.findIndex(([l]) => l === label)})">${label}</button>`).join("")}
        </div>
        <div class="row mt">
          <button class="btn success" ${allChecked ? "" : 'disabled title="チェックリストの全項目を確認してください"'} onclick="App.teacherAct('${q.id}','approved')">✅ 承認する</button>
          <button class="btn warning" onclick="App.teacherAct('${q.id}','returned')">↩️ 差し戻す</button>
          <button class="btn danger" onclick="App.teacherAct('${q.id}','rejected')">🚫 却下する</button>
        </div>
      </div>
    </div>`;
  };

  return `
  <div style="max-width:760px;margin:0 auto">
    <h1 class="page-title">🛡️ 教員承認画面</h1>
    <p class="page-sub">企業から投稿された案件の<b style="color:var(--fg)">安全性・難易度・守秘義務</b>を確認してください。承認された案件だけが、学生のクエストボードで「挑戦可能」になります。</p>

    <div class="card tight row" style="border-color:rgba(251,191,36,.4);background:rgba(251,191,36,.1)">
      <span style="font-size:22px">⏳</span>
      <span class="small">承認待ちのクエストが <b class="c-amber" style="font-size:17px">${pending.length}</b> 件あります</span>
    </div>

    <div class="card">
      <div class="small bold mb">🪪 学生のチュートリアル・ライセンス取得状況</div>
      ${students.map((s) => `
        <div class="row" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:6px">
          <span class="xs bold" style="flex:1;min-width:140px">${esc(s.name)}</span>
          <span class="badge ${s.tutorial ? "green" : "amber"}">${s.tutorial ? "講習修了" : "講習未修了"}</span>
          <span class="badge ${s.license ? "green" : ""}">${s.license ? `ライセンス取得済み${s.score !== null ? `(${s.score}点)` : ""}` : "ライセンス未取得"}</span>
          <span class="xs muted">${s.status}</span>
        </div>`).join("")}
    </div>

    <div class="grid grid-2">
      <div class="card" style="border-color:rgba(248,113,113,.3);margin-bottom:0">
        <div class="small bold c-red mb">⚠️ 危険度の高い案件(${highRisk.length}件)</div>
        ${highRisk.map((q) => `
          <div style="border:1px solid rgba(248,113,113,.2);border-radius:8px;padding:8px;margin-bottom:6px">
            <div class="xs bold">${esc(q.title)}</div>
            <div class="xs muted">${esc(q.company)} / 安全レベル: ${q.safetyLevel} / ${q.dangerLabels.join("・")}</div>
          </div>`).join("")}
      </div>
      <div class="card" style="border-color:rgba(167,139,250,.3);margin-bottom:0">
        <div class="small bold c-purple mb">🔐 機密情報あり案件(${nda.length}件)</div>
        ${nda.map((q) => `
          <div style="border:1px solid rgba(167,139,250,.2);border-radius:8px;padding:8px;margin-bottom:6px">
            <div class="xs bold">${esc(q.title)}</div>
            <div class="xs muted">${esc(q.company)} / NDA必須 / ${q.approvalStatus === "approved" ? "承認済み" : "承認待ち"}</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="mt">${pending.map(pendingCard).join("")}</div>
    ${pending.length === 0 ? '<p class="center small muted" style="padding:30px">🎉 承認待ちの案件はありません</p>' : ""}

    ${processed.length ? `
    <div class="xs black muted" style="letter-spacing:.15em;margin:16px 0 8px">処理済みの案件</div>
    ${processed.map((q) => `
      <div class="card tight row">
        ${APPROVAL_LABEL[q.approvalStatus]}
        <span class="small bold" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(q.title)}</span>
        <span class="xs muted">${esc(q.company)}</span>
      </div>`).join("")}` : ""}
  </div>`;
}

function viewCertificate() {
  const level = playerLevel(state.xp);
  const qs = allQuests();
  const completedQuests = state.completedQuests.map((id) => qs.find((q) => q.id === id)).filter(Boolean);
  const approvedQuests = completedQuests.filter((q) => q.approvalStatus === "approved");
  const earned = computeEarnedBadgeIds().map((id) => BADGES.find((b) => b.id === id));
  const topSkills = SKILLS.map((s) => ({ s, xp: state.skillXp[s.id] || 0 })).filter((x) => x.xp > 0).sort((a, b) => b.xp - a.xp).slice(0, 5);
  const companyAvg = COMPANY_REVIEWS.reduce((sum, r) =>
    sum + (r.techUnderstanding + r.deadlineCompliance + r.reporting + r.quality + r.rehireIntent) / 5, 0) / COMPANY_REVIEWS.length;
  return `
  <div style="max-width:760px;margin:0 auto">
    <div class="row between mb print-hidden">
      <div>
        <h1 class="page-title" style="margin:0">🏅 スキル証明書</h1>
        <p class="small muted">就活・インターン応募に使える実績証明です。「PDF出力」ボタンから印刷またはPDF保存できます。</p>
      </div>
      <button class="btn lg" onclick="window.print()">🖨 PDF出力(印刷)</button>
    </div>
    <div class="certificate">
      <div class="center">
        <div class="xs" style="letter-spacing:.4em;color:#64748b">CERTIFICATE OF TECHNICAL SKILLS</div>
        <h2 class="mt">技術スキル証明書</h2>
        <div class="xs" style="color:#64748b">MechaXMatch — 高専生 技術クエストプラットフォーム 発行</div>
      </div>
      <div class="center" style="margin-top:26px">
        <div class="small" style="color:#64748b">氏名</div>
        <div class="black" style="font-size:22px">${esc(state.userName)}</div>
        <div class="small" style="color:#475569">${esc(state.department)} ${esc(state.grade)} / 称号:${titleForLevel(level)}</div>
        ${state.licenseIssued ? `<div class="license-chip">🪪 見習い技術者ライセンス取得済み(工学倫理・機密情報・安全管理 講習修了${state.tutorialQuizScore !== null ? ` / 修了テスト ${state.tutorialQuizScore}点` : ""})</div>` : ""}
      </div>
      <div class="grid mt" style="grid-template-columns:repeat(4,1fr);gap:10px;margin-top:24px">
        ${[["レベル", level], ["総経験値", `${state.xp.toLocaleString()} XP`], ["完了クエスト", `${completedQuests.length} 件`], ["学習済み教材", `${state.completedMaterials.length} 本`]]
          .map(([l, v]) => `<div class="stat"><div class="xs" style="color:#64748b">${l}</div><b>${v}</b></div>`).join("")}
      </div>
      <div class="sec">■ 得意スキル</div>
      <div class="labels mt">${topSkills.map(({ s, xp }) => `<span style="border:1px solid #cbd5e1;background:#f8fafc;color:#334155;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700">${s.icon} ${s.name} Lv.${skillLevel(xp)}</span>`).join("")}</div>
      <div class="sec">■ 代表的な成果物(教員承認済み案件 ${approvedQuests.length} 件を含む)</div>
      <ul style="list-style:none;margin-top:10px">
        ${completedQuests.slice(0, 3).map((q) => `<li class="small" style="color:#334155;margin-bottom:6px"><b>・${esc(q.title)}</b> <span class="xs" style="color:#64748b">${esc(q.company)} / 難易度${"★".repeat(q.difficulty)} / 教員承認済み</span></li>`).join("")}
        ${completedQuests.length === 0 ? '<li class="small" style="color:#64748b">(完了クエストなし)</li>' : ""}
      </ul>
      <div class="grid grid-2 mt">
        <div>
          <div class="sec">■ 企業評価平均</div>
          <div class="black mt" style="font-size:22px;color:#1e293b">${companyAvg.toFixed(1)} <span class="small" style="color:#64748b;font-weight:400">/ 5.0</span></div>
          <div class="xs" style="color:#64748b">${COMPANY_REVIEWS.length}件の企業評価に基づく</div>
        </div>
        <div>
          <div class="sec">■ 獲得バッジ</div>
          <div class="mt" style="font-size:17px">${earned.map((b) => `<span title="${esc(b.name)}" style="margin-right:4px">${b.icon}</span>`).join("")}</div>
          <div class="xs" style="color:#64748b">${earned.length}個のバッジを獲得</div>
        </div>
      </div>
      <div class="row between mt" style="border-top:1px solid #e2e8f0;padding-top:14px;align-items:flex-end">
        <div class="xs" style="color:#64748b">
          <div>発行日: ${new Date().toLocaleDateString("ja-JP")}</div>
          <div>本証明書の実績はすべて教員による安全確認・承認プロセスを経た案件に基づきます。</div>
        </div>
        <div class="cert-seal">Mecha<br>XMatch<br>認定</div>
      </div>
    </div>
    <p class="center xs muted print-hidden mt">※ プロトタイプのため、ブラウザの印刷機能(window.print)によるPDF保存に対応しています</p>
  </div>`;
}

/* ---------------- ルーター & ナビ ---------------- */

const ROUTES = [
  { path: "home", label: "ホーム", icon: "🏠", group: "学生メニュー", view: viewHome },
  { path: "tutorial", label: "ライセンス講習", icon: "🪪", group: "学生メニュー", view: viewTutorial },
  { path: "quests", label: "クエスト", icon: "⚔️", group: "学生メニュー", view: viewQuests },
  { path: "learn", label: "学習", icon: "📖", group: "学生メニュー", view: viewLearn },
  { path: "skills", label: "スキルツリー", icon: "🌳", group: "学生メニュー", view: viewSkills },
  { path: "team", label: "チームクエスト", icon: "👥", group: "学生メニュー", view: viewTeam },
  { path: "templates", label: "提出テンプレ", icon: "📋", group: "学生メニュー", view: viewTemplates },
  { path: "reviews", label: "相互評価", icon: "⭐", group: "学生メニュー", view: viewReviews },
  { path: "profile", label: "プロフィール", icon: "👤", group: "学生メニュー", view: viewProfile },
  { path: "certificate", label: "スキル証明書", icon: "🏅", group: "学生メニュー", view: viewCertificate },
  { path: "post", label: "仕事を投稿", icon: "🏢", group: "企業メニュー", view: viewPost },
  { path: "teacher", label: "承認管理", icon: "🛡️", group: "教員メニュー", view: viewTeacher },
];

function currentRoute() {
  const hash = location.hash.replace(/^#\//, "") || "home";
  const [path, param] = hash.split("/");
  return { path: path || "home", param };
}

function navHtml(activePath, compact) {
  const groups = {};
  ROUTES.forEach((r) => { (groups[r.group] = groups[r.group] || []).push(r); });
  if (compact) {
    return ROUTES.map((r) =>
      `<a class="nav-link ${r.path === activePath ? "active" : ""}" href="#/${r.path}">${r.icon} ${r.label}</a>`).join("");
  }
  return Object.entries(groups).map(([g, items]) => `
    <div class="nav-group">
      <p>${g}</p>
      ${items.map((r) => `<a class="nav-link ${r.path === activePath ? "active" : ""}" href="#/${r.path}">${r.icon} ${r.label}</a>`).join("")}
    </div>`).join("");
}

function render() {
  const { path, param } = currentRoute();
  const route = ROUTES.find((r) => r.path === (path === "quest" ? "quests" : path));
  const level = playerLevel(state.xp);
  const prog = levelProgress(state.xp);

  document.getElementById("sidebar-nav").innerHTML = navHtml(route ? route.path : "home");
  document.getElementById("mobile-nav").innerHTML = navHtml(route ? route.path : "home", true);
  document.getElementById("player-mini").innerHTML = `
    <div class="row">
      <span class="lv">${level}</span>
      <div style="min-width:0"><div class="bold" style="font-size:13px">${esc(state.userName)}</div><div class="xs muted">${state.xp.toLocaleString()} XP</div></div>
    </div>
    <div class="progress thin mt"><i style="width:${prog.percent}%"></i></div>
    <div class="xs muted" style="text-align:right;margin-top:3px">次のLvまで ${prog.next - prog.current} XP</div>`;
  document.getElementById("mobile-xp").textContent = `Lv.${level} | ${state.xp.toLocaleString()} XP`;

  const app = document.getElementById("app");
  if (path === "quest" && param) app.innerHTML = viewQuestDetail(param);
  else if (route) app.innerHTML = route.view();
  else app.innerHTML = viewHome();
  window.scrollTo(0, 0);
}

/* ---------------- アクション(グローバルAPI) ---------------- */

const App = {
  go(path) { location.hash = `#/${path}`; },

  acceptQuest(id) {
    if (!state.licenseIssued) { location.hash = "#/tutorial"; return; }
    if (!state.acceptedQuests.includes(id)) state.acceptedQuests.push(id);
    saveState(); render();
  },
  completeQuest(id) {
    const q = questById(id);
    if (!q || state.completedQuests.includes(id)) return;
    state.completedQuests.push(id);
    state.acceptedQuests = state.acceptedQuests.filter((a) => a !== id);
    gainXp(q.xp, q.requiredSkills, `クエスト「${q.title}」達成!`);
    render();
  },
  completeMaterial(id) {
    const m = MATERIAL_MAP[id];
    if (!m || state.completedMaterials.includes(id)) return;
    state.completedMaterials.push(id);
    gainXp(m.xp, m.skillIds, `「${m.title}」を学習完了!`);
    render();
  },
  completeDaily(id, xp) {
    const today = todayStr();
    if (state.dailyMissionProgress.date !== today) state.dailyMissionProgress = { date: today, done: [] };
    if (state.dailyMissionProgress.done.includes(id)) return;
    state.dailyMissionProgress.done.push(id);
    gainXp(xp, [], "デイリーミッション達成!");
    render();
  },
  completeWeekly(id, xp) {
    const week = weekStr();
    if (state.weeklyMissionProgress.week !== week) state.weeklyMissionProgress = { week, done: [] };
    if (state.weeklyMissionProgress.done.includes(id)) return;
    state.weeklyMissionProgress.done.push(id);
    gainXp(xp, [], "ウィークリーミッション達成!");
    render();
  },
  openChest() {
    const today = todayStr();
    if (state.lastChestDate === today) return;
    const total = CHEST_REWARDS.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * total;
    let picked = CHEST_REWARDS[0];
    for (const r of CHEST_REWARDS) { roll -= r.weight; if (roll <= 0) { picked = r; break; } }
    state.lastChestDate = today;
    state.loginStamps = (state.loginStamps % 7) + 1;
    state.lastChestReward = { name: picked.name, xp: picked.xp };
    gainXp(picked.xp, [], `宝箱から「${picked.name}」を獲得!`, "chest");
    render();
  },
  applyTeam(teamId, role) {
    if (!state.licenseIssued) { location.hash = "#/tutorial"; return; }
    state.teamApplications[teamId] = role;
    gainXp(30, ["teamdev"], `チームクエストに「${role}」として参加申請!`);
    render();
  },
  setAvatar(a) { state.avatar = a; saveState(); render(); },

  /* --- チュートリアル --- */
  tutorialGo(step) { ui.tutorialStep = step; render(); },
  tutorialModuleDone(moduleId, nextStep) {
    if (!state.completedTutorialModules.includes(moduleId)) state.completedTutorialModules.push(moduleId);
    saveState();
    ui.tutorialStep = nextStep;
    render();
  },
  quizAnswer(qi, ci) { ui.quizAnswers[qi] = ci; render(); },
  quizSubmit() {
    ui.quizSubmitted = true;
    const correct = ui.quizAnswers.filter((a, i) => a === TUTORIAL_QUIZ[i].answerIndex).length;
    const percent = Math.round((correct / TUTORIAL_QUIZ.length) * 100);
    if (correct / TUTORIAL_QUIZ.length >= TUTORIAL_PASS_RATE && !state.tutorialCompleted) {
      state.tutorialCompleted = true;
      state.licenseIssued = true;
      state.licenseIssuedAt = new Date().toISOString();
      state.tutorialQuizScore = percent;
      ui.tutorialStep = TUTORIAL_MODULES.length + 2;
      gainXp(TUTORIAL_PASS_XP, [], "🪪 見習い技術者ライセンスを取得!企業クエストが受注可能になりました", "license");
    }
    render();
  },
  quizRetry() {
    ui.quizAnswers = Array(TUTORIAL_QUIZ.length).fill(null);
    ui.quizSubmitted = false;
    ui.tutorialStep = 1;
    render();
  },

  /* --- フィルタ・タブ --- */
  setQuestFilter(f) { ui.questFilter = f; render(); },
  setLearnCategory(c) { ui.learnCategory = c; render(); },
  setRankTab(t) { ui.rankTab = t; render(); },
  setReviewTab(t) { ui.reviewTab = t; render(); },
  toggleTemplate(id) { ui.openTemplate = ui.openTemplate === id ? null : id; render(); },
  toggleQuiz(id) {
    const mq = ui.materialQuiz[id] || { open: false, answer: null };
    mq.open = !mq.open;
    ui.materialQuiz[id] = mq;
    render();
  },
  answerQuiz(id, i) {
    const mq = ui.materialQuiz[id] || { open: true, answer: null };
    if (mq.answer === null) mq.answer = i;
    ui.materialQuiz[id] = mq;
    render();
  },

  /* --- 企業投稿 --- */
  submitPost(e) {
    e.preventDefault();
    const f = e.target;
    const skills = [...document.querySelectorAll("#skillChips .chip.on")].map((el) => el.dataset.skill);
    if (skills.length === 0) { alert("必要スキルを1つ以上選択してください"); return; }
    const dangers = [...document.querySelectorAll("#dangerChips .chip.on-amber")].map((el) => el.dataset.danger);
    const g = (name) => f.elements[name] ? f.elements[name].value : "";
    const c = (name) => f.elements[name] ? f.elements[name].checked : false;
    const difficulty = Number(g("difficulty")) || 2;
    const quest = {
      id: `c${Date.now()}`,
      title: g("title"), company: g("company"), industry: g("industry"),
      difficulty,
      recommendedGrade: g("recommendedGrade"),
      requiredSkills: skills,
      reward: Number(g("reward")) || 0,
      xp: 60 + difficulty * 40,
      deadline: g("deadline"),
      remoteOk: c("remoteOk"),
      safetyLevel: dangers.some((l) => ["高電圧注意", "薬品使用あり", "回転体あり", "高温部品あり"].includes(l)) ? "高" : dangers.length > 1 ? "中" : "低",
      dangerLabels: dangers,
      teacherCheckRequired: c("teacherCheckRequired"),
      approvalStatus: "pending", // 投稿直後は必ず教員承認待ち
      isTeam: c("teamOk"),
      background: g("problem"), request: g("request"),
      deliverables: g("deliverables").split("\n").filter(Boolean),
      knowledge: [],
      equipment: c("usesSchoolEquipment") ? ["学校設備を使用"] : ["自宅または学校のPC"],
      cautions: g("safetyNotes").split("\n").filter(Boolean).concat([`情報公開範囲: ${g("disclosureLevel")}`]),
      criteria: g("criteria").split("\n").filter(Boolean),
      referenceMaterialIds: [],
      companyRating: 0, companyRatingCount: 0,
      submissionTemplateId: "t8",
      learnPoints: g("learnPoints"),
      ndaRequired: c("ndaRequired"),
    };
    state.customQuests.push(quest);
    saveState();
    ui.postSubmitted = true;
    render();
  },
  postAgain() { ui.postSubmitted = false; render(); },

  /* --- 教員 --- */
  teacherCheck(questId, i, checked) {
    const checks = ui.teacherChecks[questId] || Array(7).fill(false);
    checks[i] = checked;
    ui.teacherChecks[questId] = checks;
    ui.teacherComments[questId] = document.getElementById(`comment-${questId}`).value;
    render();
  },
  teacherTemplate(questId, i) {
    const templates = [
      "危険度ラベルと作業内容が一致していません。実作業に含まれる危険源を追記のうえ再申請してください。",
      "推奨学年に対して難易度が高すぎます。作業範囲の縮小、または推奨学年の引き上げを検討してください。",
      "機密情報の共有範囲・保存方法が不明確です。「使ってよいデータ」と公開段階を具体化してください。",
      "成果物の定義が曖昧です。提出物の形式・数量・評価基準を明確にしてください。",
      "報酬と作業量のバランスが取れていません。作業時間の見積りとあわせて再検討をお願いします。",
    ];
    document.getElementById(`comment-${questId}`).value = templates[i];
    ui.teacherComments[questId] = templates[i];
  },
  teacherAct(questId, status) {
    const comment = document.getElementById(`comment-${questId}`).value;
    state.statusOverrides[questId] = { status, teacherComment: comment || undefined };
    saveState();
    delete ui.teacherChecks[questId];
    delete ui.teacherComments[questId];
    render();
  },

  resetAll() {
    if (!confirm("進行状況をすべてリセットしますか?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    Object.assign(ui, { tutorialStep: 0, quizAnswers: Array(TUTORIAL_QUIZ.length).fill(null), quizSubmitted: false });
    render();
  },
};

window.App = App;

/* ---------------- 起動 ---------------- */

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  saveState();
  checkBadges();
  render();
});

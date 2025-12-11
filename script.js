// ==== 定数・状態 ==========================
const STORAGE_KEY = "studyTrackerStats_v1";

const phaseLabel = {
  idle: "待機中",
  focus: "勉強中",
  break: "休憩中",
};

const stats = {
  totalFocusMs: 0,
  sessionCount: 0,
};

let timerState = {
  phase: "idle", // idle | focus | break
  remainingMs: 0,
  focusMs: 25 * 60 * 1000,
  breakMs: 5 * 60 * 1000,
  timerId: null,
};

// ==== DOM取得 ==========================
const focusInput = document.getElementById("focusMinutes");
const breakInput = document.getElementById("breakMinutes");

const phaseEl = document.getElementById("timerPhase");
const timeEl = document.getElementById("timerTime");

const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnResume = document.getElementById("btnResume");
const btnEnd = document.getElementById("btnEnd");

const statSessionsEl = document.getElementById("statSessions");
const statMinutesEl = document.getElementById("statMinutes");
const statLevelEl = document.getElementById("statLevel");
const statToNextEl = document.getElementById("statToNext");
const progressBarEl = document.getElementById("progressBar");

// ==== ローカルストレージ =================

function loadStats() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    stats.totalFocusMs = data.totalFocusMs ?? 0;
    stats.sessionCount = data.sessionCount ?? 0;
  } catch {
    // 壊れてたら諦める
  }
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// ==== 表示更新 ==========================
function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// レベル設計：合計勉強「1時間」でレベル1アップ
// 例：0〜59分 → Lv1, 60〜119分 → Lv2 みたいな感じ
function updateStatsView() {
  statSessionsEl.textContent = stats.sessionCount;
  const totalMinutes = Math.floor(stats.totalFocusMs / 60000);
  statMinutesEl.textContent = totalMinutes;

  const levelBase = 60; // 1レベルあたり60分
  const level = Math.floor(totalMinutes / levelBase) + 1;
  const usedMinutes = (level - 1) * levelBase;
  const toNext = levelBase - (totalMinutes - usedMinutes);

  statLevelEl.textContent = level;
  statToNextEl.textContent = toNext > 0 ? toNext : 0;

  // 進捗バー
  const progress =
    ((totalMinutes - usedMinutes) / levelBase) * 100;
  progressBarEl.style.width = `${Math.min(
    100,
    Math.max(0, progress)
  )}%`;
}

function updateTimerView() {
  phaseEl.textContent = phaseLabel[timerState.phase];
  timeEl.textContent = formatTime(timerState.remainingMs);
}

// ==== タイマー処理 =======================
function clearTimer() {
  if (timerState.timerId !== null) {
    clearInterval(timerState.timerId);
    timerState.timerId = null;
  }
}

function startFocus() {
  const focusMin = Number(focusInput.value) || 25;
  const breakMin = Number(breakInput.value) || 5;

  timerState.focusMs = focusMin * 60 * 1000;
  timerState.breakMs = breakMin * 60 * 1000;
  timerState.phase = "focus";
  timerState.remainingMs = timerState.focusMs;

  clearTimer();
  timerState.timerId = setInterval(tick, 1000);
  updateTimerView();
}

function startBreak() {
  timerState.phase = "break";
  timerState.remainingMs = timerState.breakMs;

  clearTimer();
  timerState.timerId = setInterval(tick, 1000);
  updateTimerView();
}

function tick() {
  timerState.remainingMs -= 1000;
  if (timerState.remainingMs <= 0) {
    // 終了処理
    if (timerState.phase === "focus") {
      // 勉強1セット完了
      stats.totalFocusMs += timerState.focusMs;
      stats.sessionCount += 1;
      saveStats();
      updateStatsView();

      // 自動で休憩に移行
      startBreak();
    } else if (timerState.phase === "break") {
      // 休憩終わったら待機に戻る
      timerState.phase = "idle";
      timerState.remainingMs = 0;
      clearTimer();
      updateTimerView();
    }
  } else {
    updateTimerView();
  }
}

// ==== ボタン操作 ========================
btnStart.addEventListener("click", () => {
  if (timerState.phase === "focus" && timerState.timerId) {
    // すでに勉強中なら無視
    return;
  }
  startFocus();
});

btnPause.addEventListener("click", () => {
  if (timerState.timerId === null) return;
  clearTimer();
  // phase は維持したまま「一時停止」
  phaseEl.textContent = phaseLabel[timerState.phase] + "（一時停止中）";
});

btnResume.addEventListener("click", () => {
  if (timerState.timerId !== null) return;
  if (timerState.phase === "idle") return;
  // 再開
  timerState.timerId = setInterval(tick, 1000);
  updateTimerView();
});

btnEnd.addEventListener("click", () => {
  clearTimer();
  timerState.phase = "idle";
  timerState.remainingMs = 0;
  updateTimerView();
});

// ==== 初期化 ============================
loadStats();
updateStatsView();

// 初期タイマー表示（とりあえず勉強時間でセット）
timerState.remainingMs = Number(focusInput.value || 25) * 60 * 1000;
updateTimerView();

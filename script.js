// ====== localStorage 用のキー ======
const STORAGE_KEYS = {
  LOGS: "studyLogs",
  MEMOS: "studyMemos",
};

// ====== 共通：localStorage 読み書き ======
const loadFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("load error", e);
    return [];
  }
};

const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ====== タブ切り替え ======
const setupTabs = () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab; // "log" or "memo"

      // ボタンの active 付け替え
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // パネルの active 切り替え
      tabPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === `tab-${targetId}`);
      });
    });
  });
};

// ====== 学習ログ ======
let logs = [];

const renderLogs = () => {
  const listEl = document.getElementById("log-list");
  const emptyEl = document.getElementById("log-empty");
  const totalEl = document.getElementById("total-minutes");

  listEl.innerHTML = "";

  if (!logs.length) {
    emptyEl.style.display = "block";
    totalEl.textContent = "0";
    return;
  }

  emptyEl.style.display = "none";

  let total = 0;

  logs.forEach((log, index) => {
    total += Number(log.minutes) || 0;

    const li = document.createElement("li");
    li.className = "item";

    const top = document.createElement("div");
    top.className = "item-top";

    const main = document.createElement("div");
    main.className = "item-main";
    main.textContent = `${log.date} ／ ${log.topic}`;

    const minutes = document.createElement("div");
    minutes.className = "item-sub";
    minutes.textContent = `${log.minutes} 分`;

    top.appendChild(main);
    top.appendChild(minutes);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const delBtn = document.createElement("button");
    delBtn.className = "item-delete";
    delBtn.textContent = "削除";
    delBtn.addEventListener("click", () => {
      logs.splice(index, 1);
      saveToStorage(STORAGE_KEYS.LOGS, logs);
      renderLogs();
    });

    actions.appendChild(delBtn);

    li.appendChild(top);
    li.appendChild(actions);

    listEl.appendChild(li);
  });

  totalEl.textContent = total.toString();
};

const setupLogForm = () => {
  const form = document.getElementById("log-form");
  const dateInput = document.getElementById("log-date");
  const topicInput = document.getElementById("log-topic");
  const minutesInput = document.getElementById("log-minutes");
  const clearButton = document.getElementById("clear-log");

  // デフォルト日付を今日に
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = dateInput.value;
    const topic = topicInput.value.trim();
    const minutes = minutesInput.value;

    if (!date || !topic || !minutes) return;

    logs.push({ date, topic, minutes });
    saveToStorage(STORAGE_KEYS.LOGS, logs);
    renderLogs();

    topicInput.value = "";
    minutesInput.value = "";
    topicInput.focus();
  });

  clearButton.addEventListener("click", () => {
    if (!logs.length) return;
    if (!window.confirm("学習ログをすべて削除しますか？")) return;
    logs = [];
    saveToStorage(STORAGE_KEYS.LOGS, logs);
    renderLogs();
  });
};

// ====== 用語メモ ======
let memos = [];

const renderMemos = () => {
  const listEl = document.getElementById("memo-list");
  const emptyEl = document.getElementById("memo-empty");

  listEl.innerHTML = "";

  if (!memos.length) {
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";

  memos.forEach((memo, index) => {
    const li = document.createElement("li");
    li.className = "item";

    const top = document.createElement("div");
    top.className = "item-top";

    const term = document.createElement("div");
    term.className = "item-main";
    term.textContent = memo.term;

    const date = document.createElement("div");
    date.className = "item-sub";
    date.textContent = memo.date;

    top.appendChild(term);
    top.appendChild(date);

    const note = document.createElement("div");
    note.className = "item-sub";
    note.textContent = memo.note;

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const delBtn = document.createElement("button");
    delBtn.className = "item-delete";
    delBtn.textContent = "削除";
    delBtn.addEventListener("click", () => {
      memos.splice(index, 1);
      saveToStorage(STORAGE_KEYS.MEMOS, memos);
      renderMemos();
    });

    actions.appendChild(delBtn);

    li.appendChild(top);
    li.appendChild(note);
    li.appendChild(actions);

    listEl.appendChild(li);
  });
};

const setupMemoForm = () => {
  const form = document.getElementById("memo-form");
  const termInput = document.getElementById("memo-term");
  const noteInput = document.getElementById("memo-note");
  const clearButton = document.getElementById("clear-memo");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const term = termInput.value.trim();
    const note = noteInput.value.trim();

    if (!term || !note) return;

    const today = new Date().toISOString().slice(0, 10);

    memos.push({ term, note, date: today });
    saveToStorage(STORAGE_KEYS.MEMOS, memos);
    renderMemos();

    termInput.value = "";
    noteInput.value = "";
    termInput.focus();
  });

  clearButton.addEventListener("click", () => {
    if (!memos.length) return;
    if (!window.confirm("用語メモをすべて削除しますか？")) return;
    memos = [];
    saveToStorage(STORAGE_KEYS.MEMOS, memos);
    renderMemos();
  });
};

// ====== 初期化 ======
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();

  logs = loadFromStorage(STORAGE_KEYS.LOGS);
  memos = loadFromStorage(STORAGE_KEYS.MEMOS);

  setupLogForm();
  setupMemoForm();

  renderLogs();
  renderMemos();
});

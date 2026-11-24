/* Состояние обучения (прогресс в localStorage), темы и общие помощники.
   Один источник правды для React-компонентов и для модулей схем/модели. */
export const TOPICS = [
  { id: "41-overview", n: "Обзор и функции органов дыхания", th: "4.1" },
  { id: "41-nose", n: "Нос и придаточные пазухи", th: "4.1" },
  { id: "41-pharynx", n: "Носоглотка", th: "4.1" },
  { id: "41-larynx", n: "Гортань", th: "4.1" },
  { id: "41-trachea", n: "Трахея", th: "4.1" },
  { id: "41-bronchi", n: "Бронхи и бронхиальное дерево", th: "4.1" },
  { id: "41-age", n: "Возрастные особенности", th: "4.1" },
  { id: "42-lungs", n: "Лёгкие и их границы", th: "4.2" },
  { id: "42-pleura", n: "Плевра и средостение", th: "4.2" },
  { id: "42-pneumo", n: "Пневмоторакс", th: "4.2" },
  { id: "42-stages", n: "Этапы дыхания, состав воздуха", th: "4.2" },
  { id: "42-cycle", n: "Дыхательный цикл, первый вдох", th: "4.2" },
  { id: "42-gas", n: "Газообмен и транспорт газов", th: "4.2" },
  { id: "42-reg", n: "Регуляция дыхания", th: "4.2" },
  { id: "42-volumes", n: "Лёгочные объёмы", th: "4.2" },
];
export const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
const KEY = "resp-v1";

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  timer: '<path d="M10 2h4"/><path d="m12 14 3-3"/><circle cx="12" cy="14" r="8"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  cube: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  fork: '<circle cx="12" cy="19" r="2.5"/><circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M6 7.5V9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7.5"/><path d="M12 12v4.5"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  dict: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/>',
  cards: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  list: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  flame: '<path d="M12 22c4.4 0 7-3 7-7 0-4.5-3.5-7-4.5-10.5-1.5 2-2 3.5-2 5.5-1.5-1-2.5-2.5-2.5-4.5C7 8 5 11 5 15c0 4 2.6 7 7 7Z"/>',
  download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
};
export const icon = (n, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
export const ICON_PATHS = ICONS;

/* ---------- хранилище ---------- */
function blank() {
  return { notes: {}, cards: {}, quiz: {}, drills: {}, tickets: {}, history: [], totals: {}, days: {} };
}
let state = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = Object.assign(blank(), JSON.parse(raw));
} catch (e) { /* без сохранения */ }
const listeners = new Set();
let version = 0;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getVersion() { return version; }
function emit() { version++; listeners.forEach((fn) => fn()); }
const pad = (n) => String(n).padStart(2, "0");
/** Дата по местному времени: 2026-11-24 */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dayKey();
function touchDay() { state.days[today()] = (state.days[today()] || 0) + 1; }
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  emit();
}
export function reset() { state = blank(); save(); }

const countBy = (list) => { const c = {}; (list || []).forEach((x) => (c[x.t] = (c[x.t] || 0) + 1)); return c; };
export function setTotals(cards, quiz) {
  state.totals = { cards: countBy(cards), quiz: countBy(quiz) };
}
function totalFor(kind, t) {
  const per = state.totals[kind];
  return per && per[t] != null ? per[t] : 8;
}
export function topicMastery(t) {
  const notes = state.notes[t] ? 1 : 0;
  let known = 0, ok = 0;
  for (const id in state.cards) if (state.cards[id].t === t && state.cards[id].box >= 2) known++;
  for (const id in state.quiz) if (state.quiz[id].t === t && state.quiz[id].last) ok++;
  const cards = Math.min(1, known / Math.max(1, totalFor("cards", t)));
  const quiz = Math.min(1, ok / Math.max(1, totalFor("quiz", t)));
  return { notes, cards, quiz, total: notes * 0.2 + cards * 0.4 + quiz * 0.4, known, ok };
}
export function overall() { return TOPICS.reduce((s, t) => s + topicMastery(t.id).total, 0) / TOPICS.length; }
export function streak() {
  let n = 0;
  const d = new Date();
  if (!state.days[dayKey(d)]) d.setDate(d.getDate() - 1); // сегодня ещё не занимались — считаем со вчера
  while (state.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export const studiedToday = () => !!state.days[today()];

/* ---------- помощники ---------- */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е").replace(/[‐-―−]/g, "-").replace(/,/g, ".").replace(/\s+/g, "").replace(/(см|мм|мл|л|%|ребро|ребра|года|лет|раз|г)$/g, "");
export const pct = (x) => Math.round(x * 100) + "%";
export const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
export const toast = (msg) => window.dispatchEvent(new CustomEvent("app:toast", { detail: msg }));
export const notesLink = (t) => `notes#s-${t}`;
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const isDark = () => {
  const set = document.documentElement.dataset.theme;
  if (set) return set === "dark";
  return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
};
export const reduceMotion = () =>
  document.documentElement.dataset.motion === "reduce" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

/* ---------- объект в стиле старого window.App: им пользуются модули схем и модели ---------- */
export const App = {
  TOPICS, TOPIC, icon, esc, shuffle, norm, pct, plural, toast, notesLink, cssVar, isDark, save, reset, topicMastery, overall,
  get state() { return state; },
  get reduce() { return reduceMotion(); },
  topicName: (t) => (TOPIC[t] ? TOPIC[t].n : t),
  isNote: (t) => !!state.notes[t],
  setNote(t, v) { if (v) { state.notes[t] = Date.now(); touchDay(); } else delete state.notes[t]; save(); },
  card: (id) => state.cards[id] || { box: 0, seen: 0 },
  setCard(id, t, box) {
    const c = state.cards[id] || { box: 0, seen: 0 };
    state.cards[id] = { t, box: Math.max(0, Math.min(3, box)), seen: c.seen + 1, at: Date.now() };
    touchDay();
    save();
  },
  recordQuiz(id, t, ok) {
    const q = state.quiz[id] || { ok: 0, bad: 0 };
    state.quiz[id] = { t, ok: q.ok + (ok ? 1 : 0), bad: q.bad + (ok ? 0 : 1), last: !!ok, at: Date.now() };
  },
  pushHistory(entry) { state.history.push(entry); if (state.history.length > 60) state.history.shift(); touchDay(); save(); },
  setDrill(id, score) { const prev = state.drills[id] || 0; if (score > prev) state.drills[id] = score; touchDay(); save(); },
  setTicket(id, grade) { state.tickets[id] = grade; touchDay(); save(); },
};
export default App;

/* Общий код всех страниц: тема, меню, хранение прогресса, темы конспекта */
(function () {
  const TOPICS = [
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
  const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const KEY = "resp-v1";
  const DEFAULT_TOTALS = { cards: 110, quiz: 140 };

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
  };
  const icon = (n, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;

  /* ---------- storage ---------- */
  function blank() {
    return { notes: {}, cards: {}, quiz: {}, drills: {}, tickets: {}, history: [], totals: {} };
  }
  let state = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* хранилище недоступно: работаем без сохранения */ }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    refreshRail();
  }
  function reset() { state = blank(); save(); }

  function countBy(list) {
    const c = {};
    (list || []).forEach((x) => { c[x.t] = (c[x.t] || 0) + 1; });
    return c;
  }
  // запомнить, сколько карточек/вопросов в каждой теме, чтобы считать прогресс на любой странице
  function syncTotals() {
    let changed = false;
    if (window.CARDS) { state.totals.cards = countBy(window.CARDS); changed = true; }
    if (window.QUIZ) { state.totals.quiz = countBy(window.QUIZ); changed = true; }
    if (changed) save();
  }
  function totalFor(kind, t) {
    const per = state.totals[kind];
    if (per && per[t] != null) return per[t];
    return Math.round(DEFAULT_TOTALS[kind] / TOPICS.length);
  }

  function topicMastery(t) {
    const notes = state.notes[t] ? 1 : 0;
    let known = 0, ok = 0;
    for (const id in state.cards) if (state.cards[id].t === t && state.cards[id].box >= 2) known++;
    for (const id in state.quiz) if (state.quiz[id].t === t && state.quiz[id].last) ok++;
    const cards = Math.min(1, known / Math.max(1, totalFor("cards", t)));
    const quiz = Math.min(1, ok / Math.max(1, totalFor("quiz", t)));
    const total = notes * 0.2 + cards * 0.4 + quiz * 0.4;
    return { notes, cards, quiz, total, known, ok };
  }
  function overall() {
    return TOPICS.reduce((s, t) => s + topicMastery(t.id).total, 0) / TOPICS.length;
  }

  const api = {
    TOPICS, TOPIC, icon,
    topicName: (t) => (TOPIC[t] ? TOPIC[t].n : t),
    get state() { return state; },
    save, reset, syncTotals, topicMastery, overall, totalFor,
    setNote(t, v) { if (v) state.notes[t] = Date.now(); else delete state.notes[t]; save(); },
    isNote: (t) => !!state.notes[t],
    card: (id) => state.cards[id] || { box: 0, seen: 0 },
    setCard(id, t, box) {
      const c = state.cards[id] || { box: 0, seen: 0 };
      state.cards[id] = { t, box: Math.max(0, Math.min(3, box)), seen: c.seen + 1, at: Date.now() };
      save();
    },
    recordQuiz(id, t, ok) {
      const q = state.quiz[id] || { ok: 0, bad: 0 };
      state.quiz[id] = { t, ok: q.ok + (ok ? 1 : 0), bad: q.bad + (ok ? 0 : 1), last: !!ok, at: Date.now() };
    },
    pushHistory(entry) { state.history.push(entry); if (state.history.length > 60) state.history.shift(); save(); },
    setDrill(id, score) { const prev = state.drills[id] || 0; if (score > prev) state.drills[id] = score; save(); },
    setTicket(id, grade) { state.tickets[id] = grade; save(); },
  };

  /* ---------- helpers ---------- */
  api.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  api.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  api.norm = (s) => String(s).toLowerCase().replace(/ё/g, "е").replace(/[‐-―−]/g, "-").replace(/,/g, ".").replace(/\s+/g, "").replace(/(см|мм|мл|л|%|ребро|ребра|года|лет|раз|г)$/g, "");
  api.pct = (x) => Math.round(x * 100) + "%";
  api.plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  let toastTimer;
  api.toast = (msg) => {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  };
  api.notesLink = (t) => `notes.html#s-${t}`;

  /* ---------- theme ---------- */
  function effectiveTheme() {
    const set = document.documentElement.dataset.theme;
    if (set) return set;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function paintThemeButtons() {
    const dark = effectiveTheme() === "dark";
    document.querySelectorAll("[data-theme-label]").forEach((el) => (el.textContent = dark ? "Светлая тема" : "Тёмная тема"));
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      const svg = b.querySelector("svg");
      if (svg) svg.outerHTML = icon(dark ? "sun" : "moon");
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-toggle]");
    if (!b) return;
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("resp-theme", next); } catch (err) {}
    paintThemeButtons();
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  });
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    paintThemeButtons();
    window.dispatchEvent(new CustomEvent("themechange"));
  });
  api.isDark = () => effectiveTheme() === "dark";
  api.cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ---------- mobile menu ---------- */
  const rail = document.querySelector(".rail");
  const scrim = document.querySelector("[data-scrim]");
  function setMenu(open) {
    rail && rail.classList.toggle("open", open);
    scrim && scrim.classList.toggle("open", open);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-menu]")) setMenu(true);
    else if (e.target.closest("[data-scrim]")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- rail progress ---------- */
  function refreshRail() {
    const o = overall();
    document.querySelectorAll("[data-overall]").forEach((el) => (el.textContent = api.pct(o)));
    document.querySelectorAll("[data-overall-bar]").forEach((el) => (el.style.width = api.pct(o)));
    const read = Object.keys(state.notes).length;
    const nc = document.querySelector('[data-nav-count="notes"]');
    if (nc) nc.textContent = read ? `${read}/${TOPICS.length}` : "";
    let known = 0; for (const id in state.cards) if (state.cards[id].box >= 2) known++;
    const cc = document.querySelector('[data-nav-count="cards"]');
    if (cc) cc.textContent = known ? String(known) : "";
  }

  window.App = api;
  syncTotals();
  paintThemeButtons();
  refreshRail();
})();

/* ---------- настройки, iOS и работа без интернета ---------- */
(function () {
  const A = window.App;
  const root = document.documentElement;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  A.reduce = (mq && mq.matches) || root.dataset.motion === "reduce";
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = root.classList.contains("standalone");

  function paintThemeColor() {
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim() || "#0B0D18";
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.setAttribute("content", bg); m.removeAttribute("media"); });
  }
  function setTheme(v) {
    if (v === "auto") { delete root.dataset.theme; store.set("resp-theme", null); }
    else { root.dataset.theme = v; store.set("resp-theme", v); }
    paintThemeColor();
    window.dispatchEvent(new CustomEvent("themechange"));
  }
  function setGlass(on) {
    if (on) root.dataset.glass = "on"; else delete root.dataset.glass;
    store.set("resp-glass", on ? "on" : null);
  }
  function setMotion(v) {
    if (v === "reduce") root.dataset.motion = "reduce"; else delete root.dataset.motion;
    store.set("resp-motion", v === "reduce" ? "reduce" : null);
  }

  /* ---------- окно настроек ---------- */
  let sheet, scrim, lastFocus, installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvt = e;
    const b = sheet && sheet.querySelector("[data-install]");
    if (b) b.hidden = false;
  });
  function build() {
    scrim = document.createElement("div");
    scrim.className = "sheet-scrim";
    sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-labelledby", "sheet-title");
    const nativeSwitch = "switch" in HTMLInputElement.prototype;
    const installTxt = isIOS
      ? "Откройте сайт в Safari, нажмите «Поделиться» и выберите «На экран „Домой“». Сайт откроется как приложение, без адресной строки."
      : "В Chrome или Edge нажмите «Установить» в адресной строке или кнопку справа. На iPhone: Safari → «Поделиться» → «На экран „Домой“».";
    sheet.innerHTML = `
      <div class="sheet-grab" aria-hidden="true"></div>
      <div class="sheet-head"><h3 id="sheet-title">Настройки</h3><button class="icon-btn sheet-x" type="button" aria-label="Закрыть" data-sheet-close>${A.icon("x")}</button></div>
      <div class="set-group">
        <div class="set-row"><div class="set-txt"><b>Тема</b></div>
          <div class="seg" role="group" aria-label="Тема"><button type="button" data-set-theme="auto">Авто</button><button type="button" data-set-theme="light">Светлая</button><button type="button" data-set-theme="dark">Тёмная</button></div></div>
        <label class="set-row" for="set-glass"><div class="set-txt"><b>Жидкое стекло</b><small>Полупрозрачные панели и кнопки с размытием и бликами, как в iOS 26</small></div>
          <input id="set-glass" class="switch${nativeSwitch ? " native" : ""}" type="checkbox"${nativeSwitch ? " switch" : ""}></label>
        <div class="set-row"><div class="set-txt"><b>Анимации</b><small>«Меньше» убирает движение, конфетти и автоповорот модели</small></div>
          <div class="seg" role="group" aria-label="Анимации"><button type="button" data-set-motion="auto">Как в системе</button><button type="button" data-set-motion="reduce">Меньше</button></div></div>
      </div>
      <div class="set-group">
        <div class="set-row"><div class="set-txt"><b>${isIOS ? "Установить на iPhone" : "Установить как приложение"}</b><small>${installTxt}</small></div>
          ${standalone ? `<span class="tag accent">Установлено</span>` : `<button class="btn sm" type="button" data-install${installEvt ? "" : " hidden"}>Установить</button>`}</div>
        <div class="set-row"><div class="set-txt"><b>Без интернета</b><small data-offline>Проверяю…</small></div></div>
      </div>
      <div class="set-group"><a class="set-row link" href="progress.html"><div class="set-txt"><b>Прогресс и сброс</b><small>Что выучено и что повторить</small></div>${A.icon("right")}</a></div>`;
    document.body.append(scrim, sheet);
    scrim.addEventListener("click", close);
    sheet.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-sheet-close]")) return close();
      const th = t.closest("[data-set-theme]");
      if (th) { setTheme(th.dataset.setTheme); return paint(); }
      const mo = t.closest("[data-set-motion]");
      if (mo) { setMotion(mo.dataset.setMotion); A.toast(mo.dataset.setMotion === "reduce" ? "Анимаций будет меньше. Полностью — после перехода на другую страницу" : "Анимации как в системе"); return paint(); }
      if (t.closest("[data-install]") && installEvt) { installEvt.prompt(); installEvt = null; t.closest("[data-install]").hidden = true; }
    });
    sheet.querySelector("#set-glass").addEventListener("change", (e) => { setGlass(e.target.checked); A.toast(e.target.checked ? "Жидкое стекло включено" : "Жидкое стекло выключено"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) close(); });
  }
  function paint() {
    const t = root.dataset.theme || "auto";
    sheet.querySelectorAll("[data-set-theme]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.setTheme === t));
    const m = root.dataset.motion === "reduce" ? "reduce" : "auto";
    sheet.querySelectorAll("[data-set-motion]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.setMotion === m));
    sheet.querySelector("#set-glass").checked = root.dataset.glass === "on";
    const off = sheet.querySelector("[data-offline]");
    if (!("serviceWorker" in navigator) || location.protocol === "file:") off.textContent = "Работает, когда сайт открыт по ссылке, а не как файл";
    else navigator.serviceWorker.getRegistration().then((r) => {
      off.textContent = r && r.active ? "Готово: после первого открытия сайт работает и без сети" : "Сохраняю файлы для работы без сети…";
    });
  }
  function open() {
    if (!sheet) build();
    paint();
    lastFocus = document.activeElement;
    scrim.classList.add("open");
    sheet.classList.add("open");
    setTimeout(() => sheet.querySelector("[data-sheet-close]").focus(), 60);
  }
  function close() {
    sheet.classList.remove("open");
    scrim.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-settings]")) { e.preventDefault(); open(); } });
  A.openSettings = open;

  /* ---------- линза активной вкладки ---------- */
  const bar = document.querySelector(".tabbar");
  if (bar) {
    const lens = bar.querySelector(".tab-lens");
    const tabs = [...bar.querySelectorAll(".tab")];
    const cur = tabs.findIndex((t) => t.getAttribute("aria-current") === "page");
    const place = (i, anim) => {
      const t = tabs[i];
      if (!t || !t.offsetWidth) return;
      lens.style.transition = anim ? "" : "none";
      lens.style.width = `${t.offsetWidth}px`;
      lens.style.transform = `translateX(${t.offsetLeft}px)`;
      lens.style.opacity = "1";
    };
    let prev = -1;
    try { prev = parseInt(sessionStorage.getItem("resp-tab") || "-1", 10); } catch (e) {}
    requestAnimationFrame(() => {
      if (prev >= 0 && prev !== cur && !A.reduce) { place(prev, false); requestAnimationFrame(() => requestAnimationFrame(() => place(cur, true))); }
      else place(cur, false);
    });
    try { sessionStorage.setItem("resp-tab", String(cur)); } catch (e) {}
    window.addEventListener("resize", () => place(cur, false));
    tabs.forEach((t, i) => t.addEventListener("click", () => { if (t.tagName === "A" && i !== cur) place(i, true); }));
  }

  /* ---------- подсказка об установке на iPhone ---------- */
  if (isIOS && !standalone && !store.get("resp-ios-hint")) {
    const hint = document.createElement("div");
    hint.className = "ios-hint";
    hint.setAttribute("role", "note");
    hint.innerHTML = `<img class="ios-hint-ico" src="icons/apple-touch-icon.png" alt="" width="40" height="40"><span class="ios-hint-txt"><b>Установите как приложение</b><span>Safari → «Поделиться» → «На экран „Домой“». Будет работать без интернета</span></span><button type="button" class="icon-btn" aria-label="Скрыть подсказку">${A.icon("x")}</button>`;
    document.body.appendChild(hint);
    setTimeout(() => hint.classList.add("show"), 1500);
    hint.querySelector("button").addEventListener("click", () => { hint.classList.remove("show"); store.set("resp-ios-hint", "1"); setTimeout(() => hint.remove(), 400); });
  }

  /* ---------- работа без интернета ---------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
  paintThemeColor();
})();

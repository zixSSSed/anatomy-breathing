(function () {
  const A = window.App;
  const T = window.TICKETS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const box = $("[data-ticket]");
  const GROUPS = [
    { n: "Дыхательные пути", f: (t) => t.t.startsWith("41") },
    { n: "Лёгкие, плевра, пневмоторакс", f: (t) => ["42-lungs", "42-pleura", "42-pneumo"].includes(t.t) },
    { n: "Физиология дыхания", f: (t) => ["42-stages", "42-cycle", "42-gas", "42-reg", "42-volumes"].includes(t.t) },
  ];
  let ticket = null, revealed = new Set(), no = 1;
  const GRADES = [["0", "Не ответил"], ["1", "Частично"], ["2", "Ответил"]];

  function newTicket(single) {
    revealed = new Set();
    if (single) { ticket = [single]; no = null; }
    else {
      ticket = GROUPS.map((g) => {
        const pool = T.filter(g.f);
        // реже показываем то, что уже отвечено на «ответил»
        const weighted = A.shuffle(pool).sort((a, b) => (A.state.tickets[a.id] || 0) - (A.state.tickets[b.id] || 0));
        return weighted[Math.floor(Math.random() * Math.min(weighted.length, 4))];
      }).filter(Boolean);
      no = 1 + Math.floor(Math.random() * 30);
    }
    render();
    resetTimer();
  }
  function render() {
    box.innerHTML = `
      <div class="ticket-head"><div><div class="small muted">${no ? "Экзаменационный билет" : "Отдельный вопрос"}</div><div class="no">${no ? `Билет № ${no}` : "Тренировка"}</div></div>
        <div class="row"><button class="btn sm" type="button" data-reveal-all>Показать все планы</button><button class="btn primary sm" type="button" data-new>Новый билет</button></div></div>
      ${ticket.map((q, i) => {
        const open = revealed.has(q.id);
        const g = A.state.tickets[q.id];
        return `<div class="tq">
          <div class="qn">Вопрос ${i + 1}. ${A.esc(A.topicName(q.t))}</div>
          <div class="qt">${A.esc(q.q)}</div>
          <div class="row" style="gap:8px">
            <button class="btn sm ${open ? "" : "ghost"}" type="button" data-reveal="${q.id}" aria-expanded="${open}">${open ? "Скрыть план ответа" : "Показать план ответа"}</button>
            <a class="btn sm ghost" href="${A.notesLink(q.t)}">Конспект</a>
          </div>
          ${open ? `<ul>${q.plan.map((p) => `<li>${A.esc(p)}</li>`).join("")}</ul>
            <div class="row" style="margin-top:12px;gap:8px"><span class="small muted">Как ответили?</span>${GRADES.map(([v, n]) => `<button class="chip" type="button" aria-pressed="${g != null && String(g) === v}" data-grade="${q.id}:${v}">${n}</button>`).join("")}</div>` : ""}
        </div>`;
      }).join("")}`;
  }
  box.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) return newTicket();
    if (t.closest("[data-reveal-all]")) { ticket.forEach((q) => revealed.add(q.id)); return render(); }
    const r = t.closest("[data-reveal]");
    if (r) { const id = r.dataset.reveal; revealed.has(id) ? revealed.delete(id) : revealed.add(id); return render(); }
    const g = t.closest("[data-grade]");
    if (g) { const [id, v] = g.dataset.grade.split(":"); A.setTicket(id, +v); renderList(); return render(); }
  });

  /* ---------- list ---------- */
  const list = $("[data-ticket-list]");
  function renderList() {
    list.innerHTML = T.map((q) => {
      const g = A.state.tickets[q.id];
      const dot = g == null ? "var(--surface-2)" : g === 2 ? "var(--good)" : g === 1 ? "var(--warn)" : "var(--bad)";
      return `<button class="btn ghost sm" type="button" data-one="${q.id}" style="justify-content:flex-start;height:auto;min-height:34px;padding:6px 8px;white-space:normal;text-align:left;font-weight:400"><span class="dot" style="background:${dot}"></span><span>${A.esc(q.q)}</span></button>`;
    }).join("");
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-one]");
    if (!b) return;
    newTicket(T.find((q) => q.id === b.dataset.one));
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- timer ---------- */
  const tEl = $("[data-timer]"), startBtn = $("[data-timer-start]");
  let minutes = 10, left = 600, tick = null;
  const show = () => { tEl.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`; tEl.classList.toggle("low", left <= 60); };
  function stop() { clearInterval(tick); tick = null; startBtn.textContent = left < minutes * 60 && left > 0 ? "Продолжить" : "Старт"; }
  function resetTimer() { stop(); left = minutes * 60; show(); startBtn.textContent = "Старт"; }
  startBtn.addEventListener("click", () => {
    if (tick) return stop();
    if (left <= 0) left = minutes * 60;
    startBtn.textContent = "Пауза";
    tick = setInterval(() => {
      left--; show();
      if (left <= 0) { stop(); startBtn.textContent = "Старт"; A.toast("Время вышло. Откройте планы ответов и оцените себя"); }
    }, 1000);
  });
  $("[data-timer-reset]").addEventListener("click", resetTimer);
  $$("[data-min]").forEach((b) => b.addEventListener("click", () => {
    minutes = +b.dataset.min;
    $$("[data-min]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    resetTimer();
  }));

  renderList();
  newTicket();
})();

(function () {
  const A = window.App;
  const Q = window.QUIZ || [];
  const byId = Object.fromEntries(Q.map((q) => [q.id, q]));
  const root = document.querySelector("[data-quiz]");
  const KEYS = ["А", "Б", "В", "Г", "Д"];
  const counts = {};
  Q.forEach((q) => (counts[q.t] = (counts[q.t] || 0) + 1));
  const setup = { topics: new Set(A.TOPICS.map((t) => t.id)), count: 20, mode: "learn" };
  let run = null;

  const mistakes = () => Object.keys(A.state.quiz).filter((id) => byId[id] && A.state.quiz[id].last === false);

  /* ---------- setup ---------- */
  function renderSetup() {
    const mis = mistakes().length;
    const avail = Q.filter((q) => setup.topics.has(q.t)).length;
    root.innerHTML = `
      <div class="setup-grid">
        <div class="panel">
          <div class="row between" style="margin-bottom:8px"><h3>Темы</h3>
            <div class="row" style="gap:4px"><button class="btn sm ghost" type="button" data-all="41">Тема 4.1</button><button class="btn sm ghost" type="button" data-all="42">Тема 4.2</button><button class="btn sm ghost" type="button" data-all="all">Все</button><button class="btn sm ghost" type="button" data-all="none">Снять</button></div>
          </div>
          <div class="topic-list">
            ${A.TOPICS.map((t) => `<label class="check"><input type="checkbox" value="${t.id}" ${setup.topics.has(t.id) ? "checked" : ""}><span>${t.n}</span><span class="n">${counts[t.id] || 0}</span></label>`).join("")}
          </div>
        </div>
        <div class="stack">
          <div class="panel stack" style="gap:20px">
            <div class="field"><span class="lbl">Сколько вопросов</span>
              <div class="seg" role="group" aria-label="Количество вопросов">${[10, 20, 30, 0].map((n) => `<button type="button" aria-pressed="${setup.count === n}" data-count="${n}">${n || "Все"}</button>`).join("")}</div>
            </div>
            <div class="field"><span class="lbl">Режим</span>
              <div class="seg" role="group" aria-label="Режим теста">
                <button type="button" aria-pressed="${setup.mode === "learn"}" data-mode="learn">Обучение</button>
                <button type="button" aria-pressed="${setup.mode === "exam"}" data-mode="exam">Контрольная</button>
              </div>
              <p class="small muted">${setup.mode === "learn" ? "Правильный ответ и пояснение сразу после каждого вопроса." : "Ответы и пояснения — только в конце, как на настоящей контрольной."}</p>
            </div>
            <div class="row">
              <button class="btn primary" type="button" data-start ${avail ? "" : "disabled"}>Начать тест</button>
              <span class="small muted">${avail ? `Доступно ${avail} ${A.plural(avail, "вопрос", "вопроса", "вопросов")}` : "Выберите хотя бы одну тему"}</span>
            </div>
          </div>
          <div class="panel">
            <h4>Работа над ошибками</h4>
            <p class="small muted" style="margin:6px 0 12px">${mis ? `Вопросов, на которые вы ответили неверно в последний раз: ${mis}.` : "Ошибок пока нет. Они появятся здесь после теста."}</p>
            <button class="btn sm" type="button" data-mistakes ${mis ? "" : "disabled"}>Пройти ошибки</button>
          </div>
        </div>
      </div>`;
  }
  root.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      e.target.checked ? setup.topics.add(e.target.value) : setup.topics.delete(e.target.value);
      renderSetup();
    }
  });

  /* ---------- run ---------- */
  function start(ids, label) {
    const items = ids.map((id) => {
      const q = byId[id];
      const perm = A.shuffle(q.o.map((_, i) => i));
      if (q.o.length === 2 && /^(Верно|Неверно)$/.test(q.o[0])) perm.sort(); // «Верно/Неверно» не перемешиваем
      return { id, perm, pick: null };
    });
    run = { items, i: 0, mode: setup.mode, label, done: false };
    renderQ();
    window.scrollTo({ top: root.offsetTop - 80 });
  }
  function startFromSetup() {
    let ids = A.shuffle(Q.filter((q) => setup.topics.has(q.t)).map((q) => q.id));
    if (setup.count) ids = ids.slice(0, setup.count);
    start(ids, "Тест");
  }
  function renderQ() {
    const it = run.items[run.i];
    const q = byId[it.id];
    const answered = it.pick !== null;
    const reveal = answered && run.mode === "learn";
    const correctPos = it.perm.indexOf(q.a);
    const opts = it.perm.map((oi, pos) => {
      let cls = "option";
      if (reveal) { if (oi === q.a) cls += " right"; else if (pos === it.pick) cls += " wrong"; }
      else if (answered && pos === it.pick) cls += " picked";
      return `<button class="${cls}" type="button" data-opt="${pos}" ${reveal ? "disabled" : ""}><span class="key">${KEYS[pos]}</span><span>${A.esc(q.o[oi])}</span></button>`;
    }).join("");
    const ok = it.pick === correctPos;
    root.innerHTML = `
      <div class="quiz-card">
        <div class="q-progress"><span>${run.label}: вопрос ${run.i + 1} из ${run.items.length}</span><span>${A.esc(A.topicName(q.t))}</span></div>
        <div class="bar"><i style="width:${(run.i / run.items.length) * 100}%"></i></div>
        <h2 class="q-text">${A.esc(q.q)}</h2>
        <div class="options">${opts}</div>
        ${reveal ? `<div class="explain"><b style="color:var(${ok ? "--good" : "--bad"})">${ok ? "Верно." : "Неверно."}</b> ${A.esc(q.e)} <a href="${A.notesLink(q.t)}">Раздел конспекта</a></div>` : ""}
        <div class="row between" style="margin-top:20px">
          <button class="btn ghost sm" type="button" data-quit>Завершить</button>
          <div class="row">
            ${run.i > 0 && run.mode === "exam" ? `<button class="btn sm" type="button" data-back>${A.icon("left")}Назад</button>` : ""}
            <button class="btn primary" type="button" data-next ${answered ? "" : "disabled"}>${run.i === run.items.length - 1 ? "Результат" : "Дальше"}</button>
          </div>
        </div>
        <p class="small muted" style="margin-top:12px">Клавиши <span class="kbd">1</span>–<span class="kbd">4</span> выбирают ответ, <span class="kbd">Enter</span> — дальше</p>
      </div>`;
  }
  function pick(pos) {
    const it = run.items[run.i];
    if (run.mode === "learn" && it.pick !== null) return;
    it.pick = pos;
    renderQ();
  }
  function next() {
    const it = run.items[run.i];
    if (it.pick === null) return;
    if (run.i < run.items.length - 1) { run.i++; renderQ(); }
    else finish();
  }
  function finish() {
    run.done = true;
    let score = 0;
    const byTopic = {};
    run.items.forEach((it) => {
      const q = byId[it.id];
      const ok = it.pick === it.perm.indexOf(q.a);
      if (it.pick !== null) A.recordQuiz(it.id, q.t, ok);
      if (ok) score++;
      const bt = (byTopic[q.t] = byTopic[q.t] || { ok: 0, all: 0 });
      bt.all++; if (ok) bt.ok++;
    });
    const answered = run.items.filter((it) => it.pick !== null).length;
    A.pushHistory({ at: Date.now(), score, total: run.items.length, label: run.label, mode: run.mode });
    const pct = run.items.length ? score / run.items.length : 0;
    const verdict = pct >= 0.9 ? "Отлично" : pct >= 0.75 ? "Хорошо" : pct >= 0.6 ? "Удовлетворительно" : "Нужно повторить";
    const wrong = run.items.filter((it) => it.pick !== it.perm.indexOf(byId[it.id].a));
    root.innerHTML = `
      <div class="split" style="align-items:start">
        <div class="panel">
          <div class="k muted small">${run.label} завершён${answered < run.items.length ? `, без ответа: ${run.items.length - answered}` : ""}</div>
          <div class="row" style="align-items:baseline;gap:16px;margin:8px 0 4px"><span class="score-big">${score}<span class="muted" style="font-size:.45em"> из ${run.items.length}</span></span><span class="tag ${pct >= 0.75 ? "accent" : ""}">${verdict}, ${A.pct(pct)}</span></div>
          <div class="row" style="margin-top:16px">
            ${wrong.length ? `<button class="btn primary" type="button" data-redo>Ещё раз только ошибки (${wrong.length})</button>` : ""}
            <button class="btn" type="button" data-new>Новый тест</button>
          </div>
          ${wrong.length ? `<h3 style="margin-top:28px">Разбор ошибок</h3>` : `<p style="margin-top:20px">Ошибок нет.</p>`}
          ${wrong.map((it) => {
            const q = byId[it.id];
            return `<div class="review-item"><div class="q">${A.esc(q.q)}</div><div class="a">${it.pick !== null ? `<span class="no">${A.esc(q.o[it.perm[it.pick]])}</span><br>` : "<span class=\"muted\">Без ответа</span><br>"}<span class="ok">${A.esc(q.o[q.a])}</span></div><p class="small muted" style="margin-top:6px">${A.esc(q.e)} <a href="${A.notesLink(q.t)}">Конспект</a></p></div>`;
          }).join("")}
        </div>
        <div class="panel">
          <h4 style="margin-bottom:8px">По темам</h4>
          ${Object.entries(byTopic).map(([t, v]) => `<div class="topic-bar" style="grid-template-columns:minmax(0,1fr) 80px 48px"><span class="tb-name">${A.esc(A.topicName(t))}</span><span class="bar ${v.ok === v.all ? "good" : ""}"><i style="width:${(v.ok / v.all) * 100}%"></i></span><span class="pct">${v.ok}/${v.all}</span></div>`).join("")}
        </div>
      </div>`;
    run.wrongIds = wrong.map((it) => it.id);
  }

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-start]")) return startFromSetup();
    if (t.closest("[data-mistakes]")) { setup.mode = "learn"; return start(A.shuffle(mistakes()), "Работа над ошибками"); }
    if (t.closest("[data-count]")) { setup.count = +t.closest("[data-count]").dataset.count; return renderSetup(); }
    if (t.closest("[data-mode]")) { setup.mode = t.closest("[data-mode]").dataset.mode; return renderSetup(); }
    if (t.closest("[data-all]")) {
      const v = t.closest("[data-all]").dataset.all;
      setup.topics = new Set(v === "none" ? [] : A.TOPICS.filter((x) => v === "all" || x.id.startsWith(v)).map((x) => x.id));
      return renderSetup();
    }
    if (!run) return;
    if (t.closest("[data-opt]")) return pick(+t.closest("[data-opt]").dataset.opt);
    if (t.closest("[data-next]")) return next();
    if (t.closest("[data-back]")) { run.i = Math.max(0, run.i - 1); return renderQ(); }
    if (t.closest("[data-quit]")) return finish();
    if (t.closest("[data-redo]")) { setup.mode = "learn"; return start(A.shuffle(run.wrongIds), "Работа над ошибками"); }
    if (t.closest("[data-new]")) { run = null; A.save(); return renderSetup(); }
  });
  document.addEventListener("keydown", (e) => {
    if (!run || run.done || e.target.matches("input,textarea,select")) return;
    const n = parseInt(e.key, 10);
    const it = run.items[run.i];
    if (n >= 1 && n <= it.perm.length) { e.preventDefault(); pick(n - 1); }
    else if (e.key === "Enter" && !e.target.closest("button")) { e.preventDefault(); next(); }
  });

  if (location.hash === "#mistakes" && mistakes().length) { setup.mode = "learn"; start(A.shuffle(mistakes()), "Работа над ошибками"); }
  else renderSetup();
})();

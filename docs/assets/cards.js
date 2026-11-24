(function () {
  const A = window.App;
  const CARDS = window.CARDS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wrap = $("[data-flash]");
  let topic = "all", mode = "due", order = [], idx = 0, flipped = false;

  const counts = {};
  CARDS.forEach((c) => (counts[c.t] = (counts[c.t] || 0) + 1));
  $("[data-card-topics]").innerHTML =
    `<button class="chip" type="button" aria-pressed="true" data-ct="all">Все темы <span class="n">${CARDS.length}</span></button>` +
    A.TOPICS.filter((t) => counts[t.id]).map((t) => `<button class="chip" type="button" aria-pressed="false" data-ct="${t.id}">${t.n} <span class="n">${counts[t.id]}</span></button>`).join("");

  function pool() {
    let list = CARDS.filter((c) => topic === "all" || c.t === topic);
    if (mode === "known") list = list.filter((c) => A.card(c.id).box >= 2);
    if (mode === "due") {
      list = A.shuffle(list).sort((a, b) => {
        const ca = A.card(a.id), cb = A.card(b.id);
        return ca.box - cb.box || (ca.at || 0) - (cb.at || 0);
      });
    }
    return list.map((c) => c.id);
  }
  function rebuild(shuffle) {
    order = pool();
    if (shuffle) order = A.shuffle(order);
    idx = 0; flipped = false;
    render();
  }
  const byId = Object.fromEntries(CARDS.map((c) => [c.id, c]));

  function render(anim) {
    const inFilter = CARDS.filter((c) => topic === "all" || c.t === topic);
    const known = inFilter.filter((c) => A.card(c.id).box >= 2).length;
    if (!order.length) {
      wrap.innerHTML = `<div class="empty">${mode === "known" ? "Выученных карточек в этой теме пока нет. Переключитесь на «Сначала невыученные»." : "В этой теме нет карточек."}</div>`;
      return;
    }
    if (idx >= order.length) {
      wrap.innerHTML = `<div class="panel" style="text-align:center"><h3>Круг пройден</h3><p class="muted" style="margin:8px 0 16px">Выучено ${known} из ${inFilter.length} в выбранной теме.</p><div class="row" style="justify-content:center"><button class="btn primary" type="button" data-again>Ещё круг</button><a class="btn" href="quiz.html">Пройти тест</a></div></div>`;
      if (known === inFilter.length && window.FX) FX.confetti();
      return;
    }
    const c = byId[order[idx]];
    const st = A.card(c.id);
    const boxes = [0, 1, 2].map((i) => `<i class="${st.box > i ? "on" : ""}"></i>`).join("");
    const head = `<div class="k"><span>${A.esc(A.topicName(c.t))}</span><span class="boxes" title="Ступень ${st.box} из 3">${boxes}</span></div>`;
    wrap.innerHTML = `
      <div class="flip${flipped ? " flipped" : ""}${anim ? " slide-in" : ""}" role="button" tabindex="0" aria-label="Карточка: ${A.esc(c.f)}. Нажмите, чтобы перевернуть" data-card>
        <div class="flip-inner">
          <div class="flip-face front">
            ${head}
            <div class="front-q">${A.esc(c.f)}${c.lat ? ` <span class="lat">${A.esc(c.lat)}</span>` : ""}</div>
            <div class="hint">Вспомните ответ и нажмите на карточку</div>
          </div>
          <div class="flip-face back" aria-hidden="${!flipped}">
            ${head}
            <div class="ans">${A.esc(c.b)}</div>
          </div>
        </div>
      </div>
      <div class="flash-actions" data-actions></div>
      <div class="flash-meta">
        <button class="btn sm ghost" type="button" data-prev ${idx === 0 ? "disabled" : ""}>${A.icon("left")}Назад</button>
        <span class="tnum">Карточка ${idx + 1} из ${order.length}, выучено ${known} из ${inFilter.length}</span>
        <button class="btn sm ghost" type="button" data-next>Пропустить${A.icon("right")}</button>
      </div>`;
    paintActions();
  }
  function paintActions() {
    const box = $("[data-actions]", wrap);
    if (!box) return;
    box.innerHTML = flipped
      ? `<button class="btn bad" type="button" data-grade="0">${A.icon("x")}Не знал</button><button class="btn good" type="button" data-grade="1">${A.icon("check")}Знал</button>`
      : `<button class="btn primary" type="button" data-flip>Показать ответ</button>`;
  }
  function flip() {
    const card = $("[data-card]", wrap);
    if (!card) return;
    flipped = !flipped;
    card.classList.toggle("flipped", flipped);
    const back = card.querySelector(".flip-face.back");
    if (back) back.setAttribute("aria-hidden", !flipped);
    paintActions();
  }
  function go(delta) {
    idx = Math.max(0, Math.min(order.length, idx + delta));
    flipped = false;
    render(true);
  }
  function grade(ok) {
    const c = byId[order[idx]];
    const st = A.card(c.id);
    A.setCard(c.id, c.t, ok ? st.box + 1 : 0);
    if (!ok && mode === "due") order.splice(Math.min(order.length, idx + 4), 0, c.id); // вернётся через несколько карточек
    go(1);
  }
  wrap.addEventListener("click", (e) => {
    if (e.target.closest("[data-grade]")) return grade(e.target.closest("[data-grade]").dataset.grade === "1");
    if (e.target.closest("[data-flip]") || e.target.closest("[data-card]")) return flip();
    if (e.target.closest("[data-prev]")) return go(-1);
    if (e.target.closest("[data-next]")) return go(1);
    if (e.target.closest("[data-again]")) return rebuild(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea,select")) return;
    if (e.key === " " || e.key === "Enter") { if (e.target.closest("button") && e.key === "Enter") return; e.preventDefault(); flip(); }
    else if (e.key === "1" && flipped) grade(false);
    else if (e.key === "2" && flipped) grade(true);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  });
  $("[data-card-topics]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ct]");
    if (!b) return;
    topic = b.dataset.ct;
    $$("[data-ct]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    rebuild(false);
  });
  $$("[data-cmode]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.cmode;
    $$("[data-cmode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    rebuild(false);
  }));
  const sh = $("[data-shuffle]");
  sh.querySelector("svg").outerHTML = A.icon("shuffle");
  sh.addEventListener("click", () => rebuild(true));
  const h = location.hash.slice(1);
  if (counts[h]) { topic = h; $$("[data-ct]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.ct === h)); }
  rebuild(false);
})();

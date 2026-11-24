(function () {
  const A = window.App;
  const Q = window.QUIZ || [], C = window.CARDS || [];
  const byQ = Object.fromEntries(Q.map((q) => [q.id, q]));
  const $ = (s) => document.querySelector(s);
  function draw() {
    const st = A.state;
    const read = Object.keys(st.notes).length;
    const known = Object.values(st.cards).filter((c) => c.box >= 2).length;
    const ok = Object.values(st.quiz).filter((q) => q.last).length;
    const hist = st.history || [];
    const avg = hist.length ? hist.reduce((s, h) => s + h.score / Math.max(1, h.total), 0) / hist.length : 0;
    $("[data-stats]").innerHTML = [
      ["Общий прогресс", A.pct(A.overall()), "по всем 15 темам"],
      ["Конспект", `${read} из 15`, "разделов прочитано"],
      ["Карточки", `${known} из ${C.length}`, "выучено (ступень 2 и выше)"],
      ["Тест", `${ok} из ${Q.length}`, hist.length ? `средний результат ${A.pct(avg)}` : "тестов ещё не было"],
    ].map(([l, v, d]) => `<div class="stat"><span class="l">${l}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join("");

    $("[data-topic-table]").innerHTML = `<thead><tr><th>Тема</th><th>Конспект</th><th class="num">Карточки</th><th class="num">Тест</th><th style="width:180px">Освоено</th><th></th></tr></thead><tbody>` +
      A.TOPICS.map((t) => {
        const m = A.topicMastery(t.id);
        const cTot = C.filter((c) => c.t === t.id).length, qTot = Q.filter((q) => q.t === t.id).length;
        return `<tr><td><span class="muted tnum">${t.th}</span> ${t.n}</td><td>${m.notes ? `<span style="color:var(--good)">прочитано</span>` : `<a href="${A.notesLink(t.id)}">читать</a>`}</td><td class="num">${m.known}/${cTot}</td><td class="num">${m.ok}/${qTot}</td><td><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="bar good" style="flex:1;margin:0"><i style="width:${A.pct(m.total)}"></i></span><span class="tnum small" style="width:40px;text-align:right">${A.pct(m.total)}</span></div></td><td><a class="small" href="cards.html#${t.id}">карточки</a></td></tr>`;
      }).join("") + "</tbody>";

    const weak = Object.entries(st.quiz).filter(([id, v]) => v.last === false && byQ[id]);
    $("[data-weak]").innerHTML = weak.length
      ? `<div class="panel">${weak.slice(0, 30).map(([id]) => { const q = byQ[id]; return `<div class="review-item"><div class="q">${A.esc(q.q)}</div><div class="a">Правильно: <span class="ok">${A.esc(q.o[q.a])}</span></div><p class="small muted" style="margin-top:4px">${A.esc(A.topicName(q.t))}, <a href="${A.notesLink(q.t)}">раздел конспекта</a></p></div>`; }).join("")}${weak.length > 30 ? `<p class="small muted" style="margin-top:12px">И ещё ${weak.length - 30}.</p>` : ""}</div>`
      : `<div class="empty">Ошибок нет: либо тестов ещё не было, либо всё верно. <a href="quiz.html">Пройти тест</a></div>`;

    $("[data-history]").innerHTML = hist.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Когда</th><th>Что</th><th>Режим</th><th class="num">Результат</th></tr></thead><tbody>${hist.slice().reverse().slice(0, 15).map((h) => `<tr><td class="tnum">${new Date(h.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>${A.esc(h.label)}</td><td>${h.mode === "exam" ? "контрольная" : "обучение"}</td><td class="num">${h.score} из ${h.total} (${A.pct(h.score / Math.max(1, h.total))})</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty">Здесь появятся результаты тестов.</div>`;
  }
  const zone = $("[data-reset-zone]");
  zone.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset-ask]")) {
      zone.innerHTML = `<div class="confirm"><span>Удалить весь прогресс в этом браузере? Отменить это нельзя.</span><button class="btn bad sm" type="button" data-reset-yes>Удалить прогресс</button><button class="btn sm" type="button" data-reset-no>Оставить</button></div>`;
    } else if (e.target.closest("[data-reset-yes]")) {
      A.reset(); A.syncTotals(); draw();
      zone.innerHTML = `<button class="btn bad" type="button" data-reset-ask>Сбросить весь прогресс</button>`;
      A.toast("Прогресс удалён");
    } else if (e.target.closest("[data-reset-no]")) {
      zone.innerHTML = `<button class="btn bad" type="button" data-reset-ask>Сбросить весь прогресс</button>`;
    }
  });
  draw();
})();

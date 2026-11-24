(function () {
  const A = window.App;
  const D = window.DRILLS || { match: [], numbers: [], order: [], sort: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $("[data-drill]");
  let tab = "match";
  const cur = { match: 0, order: 0, sort: 0 };

  function setPicker(list, active) {
    return `<div class="chips" style="margin-bottom:20px">${list.map((s, i) => `<button class="chip" type="button" aria-pressed="${i === active}" data-set="${i}">${A.esc(s.title)}${A.state.drills[s.id] != null ? ` <span class="n">${A.state.drills[s.id]}%</span>` : ""}</button>`).join("")}</div>`;
  }

  /* ---------------- match ---------------- */
  let M = null;
  function initMatch() {
    const set = D.match[cur.match];
    M = { set, left: A.shuffle(set.pairs.map((p, i) => ({ i, t: p[0] }))), right: A.shuffle(set.pairs.map((p, i) => ({ i, t: p[1] }))), sel: null, done: new Set(), errors: 0, err: null };
    renderMatch();
  }
  function renderMatch() {
    const { set } = M;
    const finished = M.done.size === set.pairs.length;
    const item = (side, x) => {
      const key = `${side}${x.i}`;
      const cls = ["m-item", M.done.has(x.i) ? "done" : "", M.sel === key ? "sel" : "", M.err && M.err.includes(key) ? "err" : ""].join(" ");
      return `<button class="${cls}" type="button" data-m="${key}" ${M.done.has(x.i) ? "disabled" : ""}>${A.esc(x.t)}</button>`;
    };
    root.innerHTML = setPicker(D.match, cur.match) + `
      <div class="panel">
        <div class="row between" style="margin-bottom:16px"><h3>${A.esc(set.title)}</h3><span class="small muted tnum">Пар: ${M.done.size} из ${set.pairs.length}, ошибок: ${M.errors}</span></div>
        <p class="small muted" style="margin-bottom:16px">Нажмите на элемент слева, затем на подходящий справа.</p>
        <div class="match-grid">${M.left.map((l, k) => item("L", l) + item("R", M.right[k])).join("")}</div>
        ${finished ? `<div class="explain" style="margin-top:20px"><b>Готово.</b> Ошибок: ${M.errors}. <button class="btn sm" type="button" data-again style="margin-left:8px">Ещё раз</button> <button class="btn sm primary" type="button" data-nextset>Следующий набор</button></div>` : ""}
      </div>`;
  }
  function clickMatch(key) {
    if (!M.sel) { M.sel = key; M.err = null; return renderMatch(); }
    if (M.sel === key) { M.sel = null; return renderMatch(); }
    if (M.sel[0] === key[0]) { M.sel = key; return renderMatch(); }
    const a = +M.sel.slice(1), b = +key.slice(1);
    if (a === b) { M.done.add(a); M.err = null; }
    else { M.errors++; M.err = [M.sel, key]; }
    M.sel = null;
    if (M.done.size === M.set.pairs.length) A.setDrill(M.set.id, Math.round((M.set.pairs.length / (M.set.pairs.length + M.errors)) * 100));
    renderMatch();
  }

  /* ---------------- numbers ---------------- */
  let N = null;
  const numTopics = [...new Set(D.numbers.map((n) => n.t))];
  function initNumbers(topic = N ? N.topic : "all") {
    const list = D.numbers.filter((n) => topic === "all" || n.t === topic);
    N = { topic, items: A.shuffle(list).slice(0, 10), res: {} };
    renderNumbers();
  }
  function checkNum(n, val) {
    const v = A.norm(val);
    if (!v) return null;
    return n.accept.concat([n.a]).some((x) => A.norm(x) === v);
  }
  function renderNumbers() {
    const ok = Object.values(N.res).filter((r) => r === true).length;
    root.innerHTML = `
      <div class="chips" style="margin-bottom:20px">
        <button class="chip" type="button" aria-pressed="${N.topic === "all"}" data-nt="all">Все темы</button>
        ${numTopics.map((t) => `<button class="chip" type="button" aria-pressed="${N.topic === t}" data-nt="${t}">${A.esc(A.topicName(t))}</button>`).join("")}
      </div>
      <div class="panel">
        <div class="row between" style="margin-bottom:8px"><h3>Числа, которые спрашивают</h3><span class="small muted tnum">Верно ${ok} из ${N.items.length}</span></div>
        <p class="small muted">Диапазон пишите через дефис: 16-20. Дробь можно с запятой. Римские позвонки можно арабскими цифрами.</p>
        <div>${N.items.map((n, i) => {
          const r = N.res[n.id];
          return `<div class="num-row"><div class="q">${A.esc(n.q)}</div>
            <div class="inwrap"><input class="input" id="num-${n.id}" data-num="${i}" inputmode="text" autocomplete="off" aria-label="${A.esc(n.q)}" ${r === true ? "disabled" : ""}><span class="unit">${A.esc(n.unit || "")}</span></div>
            <div class="res ${r === true ? "ok" : r === false ? "no" : ""}">${r === true ? `${A.icon("check")} ${A.esc(n.a)}` : r === false ? `Ответ: ${A.esc(n.a)}` : ""}</div></div>`;
        }).join("")}</div>
        <div class="row" style="margin-top:20px"><button class="btn primary" type="button" data-checkall>Проверить все</button><button class="btn" type="button" data-newbatch>Новая десятка</button></div>
      </div>`;
  }
  function checkRow(i) {
    const n = N.items[i];
    const inp = $(`#num-${n.id}`);
    const r = checkNum(n, inp.value);
    if (r === null) return;
    N.res[n.id] = r;
  }

  /* ---------------- order ---------------- */
  let O = null;
  function initOrder() {
    const set = D.order[cur.order];
    let items = A.shuffle(set.items.map((t, i) => ({ t, i })));
    if (items.every((x, k) => x.i === k)) items = items.reverse();
    O = { set, items, checked: false };
    renderOrder();
  }
  function renderOrder() {
    const allOk = O.checked && O.items.every((x, k) => x.i === k);
    root.innerHTML = setPicker(D.order, cur.order) + `
      <div class="panel">
        <div class="row between" style="margin-bottom:8px"><h3>${A.esc(O.set.title)}</h3></div>
        <p class="small muted" style="margin-bottom:16px">Расставьте по порядку кнопками со стрелками, затем проверьте.</p>
        <ol class="order-list">${O.items.map((x, k) => `<li class="${O.checked ? (x.i === k ? "ok" : "no") : ""}"><span class="pos tnum">${k + 1}</span><span class="txt">${A.esc(x.t)}</span>
          <button class="mv" type="button" data-up="${k}" aria-label="Поднять" ${k === 0 ? "disabled" : ""}>${A.icon("up")}</button><button class="mv" type="button" data-down="${k}" aria-label="Опустить" ${k === O.items.length - 1 ? "disabled" : ""}>${A.icon("down")}</button></li>`).join("")}</ol>
        <div class="row" style="margin-top:20px">
          <button class="btn primary" type="button" data-ocheck>Проверить</button>
          <button class="btn" type="button" data-oshow>Показать правильный порядок</button>
          <button class="btn ghost" type="button" data-again>Перемешать</button>
        </div>
        ${allOk ? `<div class="explain" style="margin-top:16px"><b>Всё верно.</b> <button class="btn sm primary" type="button" data-nextset style="margin-left:8px">Следующая последовательность</button></div>` : O.checked ? `<p class="small" style="margin-top:12px;color:var(--bad)">Красные строки стоят не на своём месте.</p>` : ""}
      </div>`;
  }
  function move(k, d) {
    const j = k + d;
    if (j < 0 || j >= O.items.length) return;
    [O.items[k], O.items[j]] = [O.items[j], O.items[k]];
    O.checked = false;
    renderOrder();
    const btn = root.querySelector(d < 0 ? `[data-up="${j}"]` : `[data-down="${j}"]`) || root.querySelector(`[data-up="${j}"],[data-down="${j}"]`);
    btn && btn.focus();
  }

  /* ---------------- sort ---------------- */
  let S = null;
  function initSort() {
    const set = D.sort[cur.sort];
    S = { set, place: set.items.map(() => -1), order: A.shuffle(set.items.map((_, i) => i)), sel: null, checked: false };
    renderSort();
  }
  function renderSort() {
    const tok = (i) => {
      const placed = S.place[i];
      const cls = ["token", S.sel === i ? "sel" : "", S.checked && placed >= 0 ? (placed === S.set.items[i][1] ? "ok" : "no") : ""].join(" ");
      return `<button class="${cls}" type="button" data-tok="${i}">${A.esc(S.set.items[i][0])}</button>`;
    };
    const inPool = S.order.filter((i) => S.place[i] === -1);
    const allOk = S.checked && S.place.every((p, i) => p === S.set.items[i][1]);
    root.innerHTML = setPicker(D.sort, cur.sort) + `
      <div class="panel">
        <h3 style="margin-bottom:8px">${A.esc(S.set.title)}</h3>
        <p class="small muted" style="margin-bottom:16px">Выберите карточку, затем нажмите на группу. Карточку в группе можно нажать ещё раз, чтобы вернуть.</p>
        <div class="pool" data-pool>${inPool.length ? inPool.map(tok).join("") : `<span class="small muted">Все карточки разложены</span>`}</div>
        <div class="sort-bins" style="margin-top:12px;grid-template-columns:repeat(${S.set.groups.length},minmax(0,1fr))">
          ${S.set.groups.map((g, gi) => `<div class="bin" data-bin="${gi}" role="button" tabindex="0" aria-label="Положить в группу ${A.esc(g)}"><h4>${A.esc(g)}</h4><div class="items">${S.order.filter((i) => S.place[i] === gi).map(tok).join("")}</div></div>`).join("")}
        </div>
        <div class="row" style="margin-top:20px"><button class="btn primary" type="button" data-scheck ${inPool.length ? "disabled" : ""}>Проверить</button><button class="btn ghost" type="button" data-again>Начать заново</button></div>
        ${allOk ? `<div class="explain" style="margin-top:16px"><b>Всё разложено верно.</b> <button class="btn sm primary" type="button" data-nextset style="margin-left:8px">Следующий набор</button></div>` : S.checked ? `<p class="small" style="margin-top:12px;color:var(--bad)">Красные карточки лежат не в своей группе — перенесите их.</p>` : ""}
      </div>`;
  }

  /* ---------------- events ---------------- */
  function render() {
    if (tab === "match") initMatch();
    else if (tab === "numbers") initNumbers();
    else if (tab === "order") initOrder();
    else initSort();
  }
  $$("[data-dtab]").forEach((b) => b.addEventListener("click", () => {
    tab = b.dataset.dtab;
    $$("[data-dtab]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  }));
  root.addEventListener("click", (e) => {
    const t = e.target;
    const set = t.closest("[data-set]");
    if (set) { cur[tab] = +set.dataset.set; return render(); }
    if (t.closest("[data-again]")) return render();
    if (t.closest("[data-nextset]")) { const list = D[tab]; cur[tab] = (cur[tab] + 1) % list.length; return render(); }
    if (tab === "match" && t.closest("[data-m]")) return clickMatch(t.closest("[data-m]").dataset.m);
    if (tab === "numbers") {
      if (t.closest("[data-nt]")) return initNumbers(t.closest("[data-nt]").dataset.nt);
      if (t.closest("[data-checkall]")) {
        N.items.forEach((_, i) => checkRow(i));
        const done = Object.keys(N.res).length;
        if (done === N.items.length) A.setDrill("numbers", Math.round((Object.values(N.res).filter(Boolean).length / N.items.length) * 100));
        return renderNumbers();
      }
      if (t.closest("[data-newbatch]")) return initNumbers();
    }
    if (tab === "order") {
      if (t.closest("[data-up]")) return move(+t.closest("[data-up]").dataset.up, -1);
      if (t.closest("[data-down]")) return move(+t.closest("[data-down]").dataset.down, 1);
      if (t.closest("[data-ocheck]")) {
        O.checked = true;
        const ok = O.items.filter((x, k) => x.i === k).length;
        A.setDrill(O.set.id, Math.round((ok / O.items.length) * 100));
        return renderOrder();
      }
      if (t.closest("[data-oshow]")) { O.items.sort((a, b) => a.i - b.i); O.checked = true; return renderOrder(); }
    }
    if (tab === "sort") {
      const tk = t.closest("[data-tok]");
      if (tk) {
        const i = +tk.dataset.tok;
        if (S.place[i] >= 0 && S.sel === null) { S.place[i] = -1; S.checked = false; }
        else S.sel = S.sel === i ? null : i;
        return renderSort();
      }
      const bin = t.closest("[data-bin]");
      if (bin && S.sel !== null) { S.place[S.sel] = +bin.dataset.bin; S.sel = null; S.checked = false; return renderSort(); }
      if (t.closest("[data-scheck]")) {
        S.checked = true;
        const ok = S.place.filter((p, i) => p === S.set.items[i][1]).length;
        A.setDrill(S.set.id, Math.round((ok / S.place.length) * 100));
        return renderSort();
      }
    }
  });
  root.addEventListener("keydown", (e) => {
    if (tab === "numbers" && e.key === "Enter" && e.target.matches("[data-num]")) {
      e.preventDefault();
      const i = +e.target.dataset.num;
      checkRow(i);
      renderNumbers();
      const nextInp = root.querySelector(`[data-num="${i + 1}"]`);
      nextInp && !nextInp.disabled && nextInp.focus();
    }
    if (tab === "sort" && (e.key === "Enter" || e.key === " ") && e.target.matches("[data-bin]")) { e.preventDefault(); e.target.click(); }
  });
  const h = location.hash.slice(1);
  if (["match", "numbers", "order", "sort"].includes(h)) { tab = h; $$("[data-dtab]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.dtab === h)); }
  render();
})();

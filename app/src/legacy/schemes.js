import A from "../lib/app.js";

export function initSchemes(root) {
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  function detail(el, k, title, body) {
    el.innerHTML = `<div class="k">${k}</div><h3>${title}</h3>${body}`;
  }
  const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

  /* =================== NOSE =================== */
  const NOSE = {
    "m-sup": { k: "Носовой ход", t: "Верхний носовой ход", open: ["ethm", "sphen"], b: ul(["Лежит под верхней раковиной", "Открываются: <b>задние ячейки решётчатой кости</b> и <b>пазуха клиновидной кости</b>", "Рядом — обонятельная область"]) },
    "m-mid": { k: "Носовой ход", t: "Средний носовой ход", open: ["max", "front", "ethm"], b: ul(["Лежит под средней раковиной", "Открываются: <b>гайморова пазуха</b>, <b>лобная пазуха</b>, <b>передние и средние ячейки решётчатой кости</b>"]) },
    "m-inf": { k: "Носовой ход", t: "Нижний носовой ход", open: ["nlc"], b: ul(["Лежит под нижней раковиной", "Открывается <b>носослёзный канал</b> — по нему из слёзных путей в полость носа поступает слеза"]) },
    front: { k: "Придаточная пазуха", t: "Лобная пазуха", open: ["m-mid"], b: ul(["Открывается в <b>средний</b> носовой ход", "Воспаление — <b>фронтит</b>", "Появляется на 2-м году жизни, к 5 годам размером с горошину"]) },
    max: { k: "Придаточная пазуха", t: "Гайморова (верхнечелюстная) пазуха", open: ["m-mid"], b: ul(["Открывается в <b>средний</b> носовой ход", "Воспаление — <b>гайморит</b>", "Единственная пазуха, которая есть у новорождённого, но развита слабо"]) },
    sphen: { k: "Придаточная пазуха", t: "Клиновидная пазуха", open: ["m-sup"], b: ul(["Открывается в <b>верхний</b> носовой ход", "Воспаление — <b>сфеноидит</b>", "Появляется к 3 годам, к 6–8 годам 2–3 мм"]) },
    ethm: { k: "Придаточные пазухи", t: "Ячейки решётчатой кости", open: ["m-sup", "m-mid"], b: ul(["<b>Задние</b> ячейки открываются в верхний ход", "<b>Передние и средние</b> — в средний ход", "Воспаление — <b>этмоидит</b>", "Появляются к 3–6 годам, к 14 годам как у взрослого"]) },
    "c-sup": { k: "Носовая раковина", t: "Верхняя носовая раковина", open: ["m-sup", "olf"], b: ul(["Вырост решётчатой кости", "На её уровне — обонятельная область", "Под ней верхний носовой ход"]) },
    "c-mid": { k: "Носовая раковина", t: "Средняя носовая раковина", open: ["m-mid"], b: ul(["Вырост решётчатой кости", "Относится к респираторной области", "Под ней средний носовой ход"]) },
    "c-inf": { k: "Носовая раковина", t: "Нижняя носовая раковина", open: ["m-inf"], b: ul(["Самостоятельная кость лицевого черепа", "Относится к респираторной области", "Под ней нижний носовой ход"]) },
    nlc: { k: "Канал", t: "Носослёзный канал", open: ["m-inf"], b: ul(["Открывается в <b>нижний</b> носовой ход", "Проводит слезу из слёзных путей в полость носа"]) },
    olf: { k: "Область слизистой", t: "Обонятельная область", open: ["c-sup"], b: ul(["Верхняя часть полости носа, уровень верхней раковины", "Обонятельные клетки контролируют вдыхаемый воздух", "Ниже — респираторная область: механическая обработка и проведение воздуха"]) },
    vest: { k: "Отдел полости носа", t: "Преддверие носа", open: [], b: ul(["Покрыто кожей", "Сальные и потовые железы", "Жёсткие волосы — вибриссы"]) },
    choana: { k: "Отверстия", t: "Хоаны", open: [], b: ul(["Задние отверстия полости носа", "Через них очищенный, согретый и увлажнённый воздух поступает в носоглотку"]) },
  };
  const noseSvg = $("[data-nose]");
  const noseDetail = $("[data-nose-detail]");
  let noseMode = "learn", noseQ = null, noseScore = { ok: 0, all: 0 };
  const NOSE_TEST = [
    { q: "Нажмите на ход, в который открывается лобная пазуха", a: ["m-mid"] },
    { q: "Нажмите на ход, в который открывается клиновидная пазуха", a: ["m-sup"] },
    { q: "Нажмите на ход, куда открывается носослёзный канал", a: ["m-inf"] },
    { q: "Нажмите на ход, в который открывается гайморова пазуха", a: ["m-mid"] },
    { q: "Нажмите на верхнюю носовую раковину", a: ["c-sup"] },
    { q: "Нажмите на нижнюю носовую раковину — самостоятельную кость черепа", a: ["c-inf"] },
    { q: "Нажмите на пазуху, воспаление которой называется сфеноидит", a: ["sphen"] },
    { q: "Нажмите на пазуху, воспаление которой называется фронтит", a: ["front"] },
    { q: "Нажмите на обонятельную область", a: ["olf"] },
    { q: "Нажмите на отдел, где растут вибриссы", a: ["vest"] },
    { q: "Нажмите на отверстия, ведущие в носоглотку", a: ["choana"] },
    { q: "Нажмите на ячейки решётчатой кости", a: ["ethm"] },
  ];
  // устья пазух: откуда тянуть линию и куда она приходит в носовом ходе
  const OSTIA = {
    front: [[190, 62, 236, 202]], max: [[310, 222, 312, 206]], ethm: [[286, 136, 276, 203], [372, 132, 372, 150]],
    sphen: [[500, 140, 446, 146]], nlc: [],
  };
  const LINKS = { "m-sup": [["ethm", 1], ["sphen", 0]], "m-mid": [["front", 0], ["max", 0], ["ethm", 0]], "m-inf": [] };
  function drawOstia(part) {
    const g = $("[data-openings]", noseSvg);
    let pairs = [];
    if (LINKS[part]) pairs = LINKS[part];
    else if (OSTIA[part]) pairs = OSTIA[part].map((_, i) => [part, i]);
    g.innerHTML = pairs.map(([k, i]) => {
      const [x1, y1, x2, y2] = OSTIA[k][i];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/><circle cx="${x2}" cy="${y2}" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`;
    }).join("");
  }
  function noseSelect(part) {
    const d = NOSE[part];
    if (!d) return;
    const keep = new Set([part, ...d.open]);
    $$(".hot", noseSvg).forEach((g) => { g.classList.toggle("dim", !keep.has(g.dataset.part)); g.classList.toggle("on", g.dataset.part === part); });
    drawOstia(part);
    detail(noseDetail, d.k, d.t, d.b);
  }
  function noseReset() {
    $$(".hot", noseSvg).forEach((g) => { g.classList.toggle("dim", false); g.classList.toggle("on", false); });
    drawOstia(null);
  }
  function noseAsk() {
    noseQ = NOSE_TEST[Math.floor(Math.random() * NOSE_TEST.length)];
    noseReset();
    detail(noseDetail, `Проверка: ${noseScore.ok} из ${noseScore.all}`, noseQ.q, `<p class="muted">Подписи скрыты. Нажмите на нужную часть схемы.</p>`);
  }
  noseSvg.addEventListener("click", (e) => {
    const g = e.target.closest(".hot");
    if (!g) return;
    const part = g.dataset.part;
    if (noseMode === "learn") return noseSelect(part);
    if (!noseQ) return;
    noseScore.all++;
    const ok = noseQ.a.includes(part);
    if (ok) noseScore.ok++;
    const right = NOSE[noseQ.a[0]];
    $$(".hot", noseSvg).forEach((x) => x.classList.toggle("dim", !noseQ.a.includes(x.dataset.part)));
    detail(noseDetail, `Проверка: ${noseScore.ok} из ${noseScore.all}`, ok ? "Верно" : "Не совсем",
      `<p>${ok ? "" : `Правильный ответ: <b>${right.t}</b>. `}${noseQ.q.replace("Нажмите на", "Вопрос был:")}</p><div class="row" style="margin-top:12px"><button class="btn primary sm" type="button" data-nose-next>Следующий вопрос</button></div>`);
    noseQ = null;
  });
  noseSvg.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".hot")) { e.preventDefault(); e.target.closest(".hot").dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  noseDetail.addEventListener("click", (e) => { if (e.target.closest("[data-nose-next]")) noseAsk(); });
  $$("[data-nose-mode]").forEach((b) => b.addEventListener("click", () => {
    noseMode = b.dataset.noseMode;
    $$("[data-nose-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    $("[data-labels]", noseSvg).style.display = noseMode === "test" ? "none" : "";
    $$(".hot text", noseSvg).forEach((t) => (t.style.display = noseMode === "test" ? "none" : ""));
    if (noseMode === "test") { noseScore = { ok: 0, all: 0 }; noseAsk(); }
    else { noseReset(); detail(noseDetail, "Подсказка", "Выберите носовой ход", "<p>Нажмите на верхний, средний или нижний носовой ход: подсветятся пазухи, которые в него открываются.</p>"); }
  }));

  /* =================== LARYNX =================== */
  const LAR = {
    hyoid: { k: "Кость", t: "Подъязычная кость", b: ul(["К ней гортань подвешена связками", "Щитоподъязычная мембрана — к щитовидному хрящу", "Подъязычно-надгортанная связка — к надгортаннику", "При глотании гортань смещается вместе с ней"]) },
    epi: { k: "Непарный хрящ", t: "Надгортанник", b: ul(["Внутренние мышцы поднимают и опускают надгортанник", "У новорождённого стоит выше корня языка — можно дышать и глотать одновременно", "В старости не обызвествляется, в отличие от других хрящей"]) },
    thm: { k: "Связка", t: "Щитоподъязычная мембрана", b: ul(["Соединяет подъязычную кость и щитовидный хрящ"]) },
    thyroid: { k: "Непарный хрящ", t: "Щитовидный хрящ", b: ul(["Самый крупный хрящ гортани", "К углу щитовидного хряща крепится голосовая связка", "Выступ у мальчиков становится заметным в 10–12 лет — кадык"]) },
    cricoid: { k: "Непарный хрящ", t: "Перстневидный хрящ", b: ul(["Основание скелета гортани", "Ниже гортань переходит в трахею (уровень VI–VII шейных позвонков)"]) },
    aryt: { k: "Парный хрящ", t: "Черпаловидные хрящи", b: ul(["Голосовая связка натянута между голосовым отростком черпаловидного хряща и углом щитовидного", "Лежат сзади, на схеме пунктиром"]) },
    corn: { k: "Парный хрящ", t: "Рожковидные хрящи", b: ul(["Маленькие парные хрящи на верхушках черпаловидных", "Другие парные: черпаловидные, клиновидные, зерновидные"]) },
    trach: { k: "Ниже гортани", t: "Трахея", b: ul(["16–20 хрящевых полуколец", "Длина 9–13 см, диаметр 15–18 мм", "Задняя стенка перепончатая"]) },
    vestib: { k: "Отдел полости", t: "Преддверие гортани", b: ul(["Верхний отдел песочных часов", "Сообщается с глоткой через вход в гортань", "Слизистая чувствительна к пыли — рефлекторный кашель"]) },
    falsef: { k: "Складки", t: "Преддверные (ложные) складки", b: ul(["Верхняя пара складок слизистой", "Ниже них — желудочки гортани"]) },
    ventr: { k: "Углубления", t: "Желудочки гортани", b: ul(["Слепые углубления на боковых стенках между ложными и истинными складками", "Выполняют роль резонаторов"]) },
    truef: { k: "Складки", t: "Голосовые (истинные) складки", b: ul(["В толще — голосовые мышцы и голосовые связки", "Мерцательного эпителия в области истинных связок нет", "Колебания связок на выдохе создают звук"]) },
    glottis: { k: "Щель", t: "Голосовая щель", b: ul(["Между голосовыми связками; части — межперепончатая и межхрящевая", "Длина: мужчины 20–24 мм, женщины 16–19 мм, новорождённые 6,5 мм", "Спокойное дыхание — 5 мм, голосообразование — 15 мм", "Самое узкое место гортани"]) },
    subgl: { k: "Отдел полости", t: "Подголосовая полость", b: ul(["Нижний отдел песочных часов", "Переходит в трахею"]) },
  };
  const larDetail = $("[data-larynx-detail]");
  [$("[data-larynx]"), $("[data-cavity]")].forEach((svg) => {
    svg.addEventListener("click", (e) => {
      const g = e.target.closest(".hot");
      if (!g) return;
      const d = LAR[g.dataset.part];
      $$(".hot", svg).forEach((x) => x.classList.toggle("dim", x !== g));
      detail(larDetail, d.k, d.t, d.b);
    });
    svg.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".hot")) { e.preventDefault(); e.target.closest(".hot").dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  });

  /* =================== TREE =================== */
  const LADDER = [
    { g: 0, o: "", n: "Трахея", s: "16–20 полуколец, бифуркация на уровне IV–V грудных позвонков", c: "1", z: "cond" },
    { g: 1, o: "I", n: "Главные бронхи", s: "Расходятся под углом 70°. Правый короче и шире", c: "2", z: "cond" },
    { g: 2, o: "II", n: "Долевые бронхи", s: "По числу долей", c: "3 + 2", z: "cond" },
    { g: 3, o: "III", n: "Сегментарные бронхи", s: "Хрящи распадаются на пластинки", c: "10 + 10", z: "cond" },
    { g: 4, o: "IV–VII", n: "Субсегментарные бронхи", s: "", c: "", z: "cond" },
    { g: 5, o: "VIII", n: "Дольковые бронхи", s: "До 800 в лёгком", c: "", z: "cond" },
    { g: 6, o: "", n: "Конечные бронхиолы", s: "Хрящей нет, есть мышечные волокна", c: "12–18 на дольку", z: "cond" },
    { g: 7, o: "1–3", n: "Дыхательные бронхиолы", s: "Начало ацинуса", c: "", z: "resp" },
    { g: 8, o: "", n: "Альвеолярные ходы и альвеолы", s: "Альвеолы 0,2–0,3 мм, до 500 млн", c: "", z: "resp" },
  ];
  const ladder = $("[data-ladder]");
  ladder.innerHTML = LADDER.map((r) => `<div class="rung" role="button" tabindex="0" data-g="${r.g}"><div class="ord">${r.o || "—"}</div><div class="nm">${r.n}${r.s ? `<small>${r.s}</small>` : ""}</div><div class="ct"><span class="zone ${r.z}">${r.c || (r.z === "resp" ? "ацинус" : "")}</span></div></div>`).join("");
  const treeSvg = $("[data-tree-svg]");
  // процедурное 2D-дерево
  (function drawTree() {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const segs = [];
    function seg(x1, y1, x2, y2, w, g) { segs.push({ x1, y1, x2, y2, w, g }); }
    const top = { x: 260, y: 18 }, bif = { x: 260, y: 120 };
    seg(top.x, top.y, bif.x, bif.y, 16, 0);
    function grow(x, y, ang, len, w, g) {
      const x2 = x + Math.sin(ang) * len, y2 = y + Math.cos(ang) * len;
      seg(x, y, x2, y2, w, Math.min(g, 8));
      if (g >= 8) {
        segs.push({ alv: true, x: x2, y: y2, g: 8 });
        return;
      }
      const n = g === 6 ? 2 : 2;
      for (let i = 0; i < n; i++) {
        const spread = g < 3 ? 0.55 : 0.5 + rnd() * 0.25;
        grow(x2, y2, ang + (i ? spread : -spread) * (0.8 + rnd() * 0.4), len * (g < 3 ? 0.72 : 0.74), Math.max(0.8, w * 0.7), g + 1);
      }
    }
    // правый главный (слева на схеме): короче, вертикальнее; левый — длиннее, положе
    const R = { x: bif.x - Math.sin(0.44) * 52, y: bif.y + Math.cos(0.44) * 52 };
    const L = { x: bif.x + Math.sin(0.78) * 86, y: bif.y + Math.cos(0.78) * 86 };
    seg(bif.x, bif.y, R.x, R.y, 12, 1);
    seg(bif.x, bif.y, L.x, L.y, 10, 1);
    // долевые: справа 3, слева 2
    [[-2.4, 56], [-0.9, 60], [-0.15, 74]].forEach(([a, l]) => growLobar(R, a, l));
    [[1.8, 60], [0.35, 74]].forEach(([a, l]) => growLobar(L, a, l));
    function growLobar(p, a, l) {
      const x2 = p.x + Math.sin(a) * l, y2 = p.y + Math.cos(a) * l * (a < -2 || a > 1.6 ? -0.2 : 1);
      seg(p.x, p.y, x2, y2, 7, 2);
      const base = Math.atan2(x2 - p.x, y2 - p.y);
      for (let i = 0; i < 2; i++) grow(x2, y2, base + (i ? 0.45 : -0.45), 42, 4.5, 3);
    }
    const col = (g) => (g >= 7 ? "var(--bad)" : "var(--ink-3)");
    treeSvg.innerHTML = segs.map((s) => s.alv
      ? `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="2.6" fill="var(--lobe-1)" data-g="8"/>`
      : `<line x1="${s.x1.toFixed(1)}" y1="${s.y1.toFixed(1)}" x2="${s.x2.toFixed(1)}" y2="${s.y2.toFixed(1)}" stroke="${col(s.g)}" stroke-width="${s.w.toFixed(1)}" stroke-linecap="round" data-g="${s.g}"/>`).join("")
      + `<text class="svg-muted" x="40" y="430">правое лёгкое</text><text class="svg-muted" x="480" y="430" text-anchor="end">левое лёгкое</text>`;
  })();
  function treeSelect(g) {
    $$(".rung", ladder).forEach((r) => r.classList.toggle("on", +r.dataset.g === g));
    $$("[data-g]", treeSvg).forEach((el) => {
      const eg = +el.dataset.g;
      const match = g === 4 ? eg >= 4 && eg <= 4 : eg === g;
      el.style.opacity = match ? 1 : 0.18;
      if (match && el.tagName === "line") el.style.stroke = "var(--accent)";
      else if (el.tagName === "line") el.style.stroke = "";
    });
    const r = LADDER.find((x) => x.g === g);
    $("[data-tree-cap]").textContent = `${r.n}${r.o ? `, ${r.o} порядок` : ""}${r.c ? `: ${r.c}` : ""}. ${r.z === "resp" ? "Входит в ацинус — здесь идёт газообмен." : "Часть бронхиального дерева — проводит воздух."}`;
  }
  ladder.addEventListener("click", (e) => { const r = e.target.closest(".rung"); if (r) treeSelect(+r.dataset.g); });
  ladder.addEventListener("keydown", (e) => { const r = e.target.closest(".rung"); if (r && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); treeSelect(+r.dataset.g); } });

  /* =================== BORDERS =================== */
  const LINES = ["Среднеключичная", "Передняя подмышечная", "Средняя подмышечная", "Задняя подмышечная", "Лопаточная", "Околопозвоночная"];
  const bSvg = $("[data-borders]");
  const show = { lung: true, pleura: true };
  let hideNums = false;
  function drawBorders() {
    const W = 640, H = 380, l = 60, r = 24, t = 20, b = 70;
    const x = (i) => l + (i * (W - l - r)) / (LINES.length - 1);
    const y = (rib) => t + ((rib - 5) * (H - t - b)) / 8; // рёбра 5..13
    let s = "";
    for (let rib = 5; rib <= 13; rib++) {
      s += `<line class="svg-grid" x1="${l}" x2="${W - r}" y1="${y(rib)}" y2="${y(rib)}"/>`;
      if (rib <= 12) s += `<text class="svg-muted" x="${l - 12}" y="${y(rib) + 4}" text-anchor="end">${rib}</text>`;
    }
    s += `<text class="svg-muted" x="12" y="${t + 4}" transform="rotate(-90 12 ${t + 4})" text-anchor="end">ребро</text>`;
    LINES.forEach((name, i) => {
      s += `<line class="svg-grid" x1="${x(i)}" x2="${x(i)}" y1="${t}" y2="${H - b}"/>`;
      const words = name.split(" ");
      words.forEach((w, k) => (s += `<text class="svg-muted" x="${x(i)}" y="${H - b + 20 + k * 14}" text-anchor="middle">${w}</text>`));
    });
    const series = [
      { key: "lung", color: "var(--lobe-1)", ribs: [6, 7, 8, 9, 10, 11], name: "лёгкое" },
      { key: "pleura", color: "var(--accent)", ribs: [7, 8, 9, 10, 11, 12], name: "плевра" },
    ];
    series.forEach((sr) => {
      if (!show[sr.key]) return;
      s += `<polyline fill="none" stroke="${sr.color}" stroke-width="3" stroke-linejoin="round" points="${sr.ribs.map((rb, i) => `${x(i)},${y(rb)}`).join(" ")}"/>`;
      sr.ribs.forEach((rb, i) => {
        s += `<g class="hot" data-reveal tabindex="0" role="button" aria-label="${LINES[i]}, ${sr.name}: ${rb} ребро"><circle cx="${x(i)}" cy="${y(rb)}" r="13" fill="var(--surface)" stroke="${sr.color}" stroke-width="2.5"/><text x="${x(i)}" y="${y(rb) + 4.5}" text-anchor="middle" class="svg-text" style="font-weight:600" ${hideNums ? 'visibility="hidden"' : ""}>${rb}</text></g>`;
      });
    });
    bSvg.innerHTML = s;
  }
  bSvg.addEventListener("click", (e) => {
    const g = e.target.closest("[data-reveal]");
    if (g) { const t = g.querySelector("text"); t.setAttribute("visibility", t.getAttribute("visibility") === "hidden" ? "visible" : "hidden"); }
  });
  $$("[data-show]").forEach((b) => b.addEventListener("click", () => {
    show[b.dataset.show] = !show[b.dataset.show];
    b.setAttribute("aria-pressed", show[b.dataset.show]);
    drawBorders();
  }));
  $("[data-hide-nums]").addEventListener("click", (e) => {
    hideNums = !hideNums;
    e.currentTarget.setAttribute("aria-pressed", hideNums);
    e.currentTarget.textContent = hideNums ? "Показать цифры" : "Скрыть цифры";
    drawBorders();
    if (hideNums) A.toast("Нажимайте на кружки, чтобы проверить себя");
  });
  drawBorders();

  /* =================== AGE =================== */
  const ORG = { nose: "Нос", lar: "Гортань", tr: "Трахея и бронхи", lung: "Лёгкие" };
  const AGE = [
    ["Новорождённый", [
      ["nose", "Полость носа узкая и низкая (17,5 мм), ходы развиты слабо, дыхание через общий носовой ход; хоаны низко, раковины толстые; из пазух есть только слабо развитая верхнечелюстная"],
      ["lar", "Короткая, широкая, воронкообразная, на уровне II–IV шейных позвонков; можно дышать и глотать одновременно; голосовая щель 6,5 мм; половых различий нет"],
      ["tr", "Трахея 3,2–4,5 см, просвет около 0,8 см; слизистая нежная, хрящи мягкие, задняя стенка широкая"],
      ["lung", "Масса обоих лёгких 57 г, объём 67 см³; бронхиальное дерево в основном сформировано; в ацинусах мало мелких альвеол"],
    ]],
    ["6 месяцев", [["nose", "Высота полости носа 22 мм, формируется средний носовой ход"], ["tr", "Заканчивается период быстрого роста трахеи"]]],
    ["1-й год", [["tr", "Главные бронхи быстро растут"], ["lung", "Главные бронхи увеличиваются в 1,5 раза, долевые — в 2 раза"]]],
    ["2 года", [["nose", "Появляется лобная пазуха (на 2-м году); к 2 годам — нижний носовой ход, после 2 лет — верхний"], ["lung", "Со 2-го года ацинус растёт: новые альвеолярные ходы и альвеолы, размеры удваиваются"]]],
    ["3–6 лет", [["nose", "К 3 годам — клиновидная пазуха; к 3–6 годам — ячейки решётчатой кости"]]],
    ["4 года", [["lar", "Заканчивается быстрый рост гортани первых лет, голосовая щель увеличилась"]]],
    ["5 лет", [["nose", "Лобная пазуха размером с горошину"]]],
    ["6–8 лет", [["nose", "Клиновидная пазуха достигает 2–3 мм"]]],
    ["10–12 лет", [["nose", "К 10 годам полость носа длиннее в 1,5 раза"], ["lar", "У мальчиков заметен кадык; гортань у них растёт быстрее"]]],
    ["14 лет", [["nose", "Ячейки решётчатой кости как у взрослого"]]],
    ["Половое созревание", [["tr", "Снова ускоряется рост трахеи и главных бронхов"], ["lung", "Усиливается рост бронхиального дерева"]]],
    ["15–20 лет", [["lung", "Завершается формирование паренхимы лёгких"]]],
    ["20 лет", [["nose", "Полость носа длиннее в 2 раза, чем у новорождённого"], ["lar", "Гортань занимает положение, как у взрослого"], ["lung", "Бронхиальное дерево больше в 3,5–4 раза"]]],
    ["20–25 лет", [["tr", "Длина трахеи увеличилась в 3 раза"], ["lar", "Активный рост гортани заканчивается: у женщин к 22–23 годам, у мужчин к 25"]]],
    ["40–45 лет", [["lung", "Бронхиальное дерево наибольшее; после 40 лет начинается старение: альвеолы крупнее, часть перегородок исчезает"]]],
    ["После 50 лет", [["lung", "Сегментарные бронхи уменьшаются, появляются чёткообразные выпячивания стенок"]]],
    ["60–70 лет и старше", [["tr", "Хрящи трахеи плотные и хрупкие, при сдавливании ломаются"], ["lar", "В хрящах гортани (кроме надгортанника) откладываются соли кальция, они окостеневают"]]],
  ];
  const tl = $("[data-timeline]");
  function drawAge(org) {
    tl.innerHTML = AGE.map(([age, items]) => {
      const its = items.filter(([o]) => org === "all" || o === org);
      if (!its.length) return "";
      return `<div class="tl-item"><div class="age">${age}</div><ul>${its.map(([o, t]) => `<li><span class="tag">${ORG[o]}</span><span>${t}</span></li>`).join("")}</ul></div>`;
    }).join("");
  }
  $("[data-age-filter]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-org]");
    if (!b) return;
    $$("[data-org]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    drawAge(b.dataset.org);
  });
  drawAge("all");
  return () => {};
}

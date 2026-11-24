(function () {
  const A = window.App;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = (window.App && App.reduce) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const fmt = (n, d = 0) => n.toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* =================== AIR =================== */
  (function air() {
    const svg = $("[data-air]");
    const rows = [
      { n: "Атмосферный", o2: [20.94], co2: [0.03], c: "var(--ink-3)" },
      { n: "Выдыхаемый", o2: [16.3], co2: [4], c: "var(--accent)" },
      { n: "Альвеолярный", o2: [14.2, 14.6], co2: [5.5, 5.7], c: "var(--lobe-3)" },
    ];
    const panels = [
      { key: "o2", title: "O₂, %", max: 25, ticks: [0, 5, 10, 15, 20, 25], x0: 110, w: 200 },
      { key: "co2", title: "CO₂, %", max: 6, ticks: [0, 2, 4, 6], x0: 420, w: 200 },
    ];
    let s = "";
    const y0 = 50, bh = 34, gap = 30;
    rows.forEach((r, i) => (s += `<text class="svg-text" x="0" y="${y0 + i * (bh + gap) + bh / 2 + 5}">${r.n}</text>`));
    panels.forEach((p) => {
      const X = (v) => p.x0 + (v / p.max) * p.w;
      s += `<text class="svg-text" x="${p.x0}" y="22" style="font-weight:600">${p.title}</text>`;
      p.ticks.forEach((t) => {
        s += `<line class="svg-grid" x1="${X(t)}" x2="${X(t)}" y1="34" y2="${y0 + 3 * (bh + gap) - gap + 6}"/>`;
        s += `<text class="svg-muted" x="${X(t)}" y="${y0 + 3 * (bh + gap) - gap + 22}" text-anchor="middle">${t}</text>`;
      });
      rows.forEach((r, i) => {
        const v = r[p.key];
        const val = v.length > 1 ? (v[0] + v[1]) / 2 : v[0];
        const y = y0 + i * (bh + gap);
        s += `<rect x="${p.x0}" y="${y}" width="${Math.max(2, X(val) - p.x0)}" height="${bh}" rx="4" fill="${r.c}"/>`;
        const label = v.length > 1 ? `${fmt(v[0], 1)}–${fmt(v[1], 1)}` : fmt(v[0], v[0] < 1 ? 2 : v[0] % 1 ? (String(v[0]).split(".")[1].length) : 0);
        s += `<text class="svg-text tnum" x="${X(val) + 8}" y="${y + bh / 2 + 5}">${label}</text>`;
      });
    });
    svg.innerHTML = s;
  })();

  /* =================== CYCLE =================== */
  (function cycle() {
    const svg = $("[data-cycle]");
    const range = $("[data-cycle-range]");
    const out = $("[data-cycle-out]");
    const btn = $("[data-cycle-play]");
    const nameEl = $("[data-phase-name]"), timeEl = $("[data-phase-time]"), stepsEl = $("[data-phase-steps]");
    const STEPS = {
      in: ["Дыхательный центр посылает импульсы", "Сокращаются наружные межрёберные мышцы и диафрагма", "Рёбра поднимаются и отходят в стороны, купол диафрагмы опускается", "Объём грудной клетки увеличивается, лёгкие пассивно расширяются", "Давление в лёгких ниже атмосферного — воздух входит"],
      out: ["Мышцы расслабляются", "Рёбра опускаются, купол диафрагмы поднимается", "Объём грудной клетки и лёгких уменьшается, помогает эластическая тяга лёгких", "Давление в лёгких выше атмосферного — воздух выходит"],
    };
    let phaseKey = null;
    // t: 0..1 по циклу; вдох — первые 40%
    const fill = (v) => A.cssVar(v);
    function lungPath(cx, dir, p) {
      const w = 74 + 16 * p, top = 92 - 4 * p, bot = 238 + 26 * p;
      const o = (dx) => cx + dir * dx;
      return `M${o(4)},${top} C${o(w * 0.75)},${top + 6} ${o(w * 1.08)},${bot - 70} ${o(w)},${bot - 6} Q${o(w * 0.55)},${bot - 34 + 10 * p} ${o(4)},${bot - 10} C${o(-10)},${bot - 60} ${o(-12)},${top + 60} ${o(4)},${top} Z`;
    }
    function draw(t) {
      const inh = t < 0.4;
      const p = inh ? 0.5 - 0.5 * Math.cos((t / 0.4) * Math.PI) : 0.5 + 0.5 * Math.cos(((t - 0.4) / 0.6) * Math.PI);
      const flow = inh ? Math.sin((t / 0.4) * Math.PI) : -Math.sin(((t - 0.4) / 0.6) * Math.PI);
      const domeY = 214 - 4 + 44 * p; // купол опускается на вдохе
      const ribLift = -10 * p, ribSpread = 10 * p;
      let s = "";
      // грудная клетка
      for (let i = 0; i < 6; i++) {
        const y = 108 + i * 30;
        const dy = ribLift * (1 - i * 0.12);
        const sx = ribSpread * (0.4 + i * 0.12);
        s += `<path d="M206,${y - 8} C150,${y - 18 + dy} ${66 - sx},${y + dy} ${70 - sx},${y + 26 + dy}" fill="none" stroke="var(--bone)" stroke-width="8" stroke-linecap="round"/>`;
        s += `<path d="M214,${y - 8} C270,${y - 18 + dy} ${354 + sx},${y + dy} ${350 + sx},${y + 26 + dy}" fill="none" stroke="var(--bone)" stroke-width="8" stroke-linecap="round"/>`;
      }
      s += `<rect x="202" y="96" width="16" height="180" rx="4" fill="var(--bone)"/>`;
      // лёгкие
      s += `<path d="${lungPath(196, -1, p)}" fill="var(--lobe-1)" fill-opacity=".85" stroke="color-mix(in srgb,var(--lobe-1) 65%,var(--ink))"/>`;
      s += `<path d="${lungPath(224, 1, p)}" fill="var(--lobe-2)" fill-opacity=".85" stroke="color-mix(in srgb,var(--lobe-2) 65%,var(--ink))"/>`;
      // трахея и бронхи
      s += `<path d="M210,14 L210,110 M210,110 L182,142 M210,110 L242,140" stroke="var(--cartilage)" stroke-width="12" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M210,14 L210,110 M210,110 L182,142 M210,110 L242,140" stroke="color-mix(in srgb,var(--cartilage) 55%,var(--ink))" stroke-width="1" stroke-dasharray="2 5" fill="none"/>`;
      // диафрагма
      s += `<path d="M48,${domeY + 54} C80,${domeY - 22} 180,${domeY - 30} 210,${domeY + 4} C240,${domeY - 26} 340,${domeY - 18} 372,${domeY + 56}" fill="none" stroke="var(--muscle)" stroke-width="7" stroke-linecap="round"/>`;
      s += `<text class="svg-muted" x="372" y="${domeY + 76}" text-anchor="end">диафрагма</text>`;
      // поток воздуха
      const a = Math.abs(flow);
      if (a > 0.05) {
        const down = flow > 0;
        const yA = down ? 20 + 26 * ((t / 0.4) % 1) : 70 - 26 * (((t - 0.4) / 0.6) % 1);
        s += `<g opacity="${(0.25 + 0.75 * a).toFixed(2)}"><path d="M236,${yA} L236,${yA + 30}" stroke="var(--air)" stroke-width="3" stroke-linecap="round"/>`;
        s += down ? `<path d="M229,${yA + 22} L236,${yA + 32} L243,${yA + 22}" fill="none" stroke="var(--air)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
                  : `<path d="M229,${yA + 8} L236,${yA - 2} L243,${yA + 8}" fill="none" stroke="var(--air)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += `<text class="svg-muted" x="250" y="${yA + 20}">${down ? "воздух входит" : "воздух выходит"}</text></g>`;
      }
      // давление
      const pr = flow; // знак давления противоположен потоку
      s += `<g transform="translate(20,20)"><text class="svg-muted" x="0" y="0">давление в лёгких</text>`;
      s += `<rect x="0" y="8" width="120" height="8" rx="4" fill="var(--surface-2)"/><line x1="60" x2="60" y1="4" y2="20" stroke="var(--ink-3)"/>`;
      s += `<rect x="${pr > 0 ? 60 - 56 * a : 60}" y="8" width="${56 * a}" height="8" rx="4" fill="${pr > 0 ? "var(--accent)" : "var(--warn)"}"/>`;
      s += `<text class="svg-muted" x="0" y="34">${a < 0.05 ? "равно атмосферному" : pr > 0 ? "ниже атмосферного" : "выше атмосферного"}</text></g>`;
      svg.innerHTML = s;

      const key = inh ? "in" : "out";
      out.textContent = inh ? "вдох" : "выдох";
      if (key !== phaseKey) {
        phaseKey = key;
        nameEl.textContent = inh ? "Вдох (инспирация)" : "Выдох (экспирация)";
        timeEl.textContent = inh ? "0,9–4,7 с" : "1,2–6 с";
        stepsEl.innerHTML = STEPS[key].map((x) => `<li>${x}</li>`).join("");
      }
    }
    let playing = false, t = 0, last = 0;
    const PERIOD = 5000;
    function frame(ts) {
      if (!playing) return;
      if (last) t = (t + (ts - last) / PERIOD) % 1;
      last = ts;
      range.value = Math.round(t * 1000);
      draw(t);
      requestAnimationFrame(frame);
    }
    function setPlay(on) {
      playing = on;
      last = 0;
      btn.innerHTML = `${A.icon(on ? "pause" : "play")}<span>${on ? "Пауза" : "Запустить"}</span>`;
      if (on) requestAnimationFrame(frame);
    }
    btn.addEventListener("click", () => setPlay(!playing));
    range.addEventListener("input", () => { setPlay(false); t = range.value / 1000; draw(t); });
    window.addEventListener("themechange", () => draw(t));
    btn.innerHTML = `${A.icon("play")}<span>Запустить</span>`;
    draw(0.999);
    t = 0.999;
    if (reduce) btn.title = "Анимация включается только по кнопке";
  })();

  /* =================== BARRIER =================== */
  (function barrier() {
    const svg = $("[data-barrier]");
    const det = $("[data-barrier-detail]");
    const L = [
      { n: "Сурфактант", h: 14, c: "var(--warn-soft)", d: "Тонкая плёнка фосфолипида на внутренней поверхности альвеол. Препятствует слипанию альвеол при выдохе, снижает поверхностное натяжение." },
      { n: "Эпителий альвеолы", h: 30, c: "var(--lobe-1)", d: "Однослойный плоский эпителий стенки альвеол, лежит на сети эластических волокон." },
      { n: "Соединительная ткань", h: 26, c: "var(--bone)", d: "Придаёт альвеолам эластичность." },
      { n: "Эндотелий капилляра", h: 30, c: "var(--mucosa)", d: "Стенка лёгочного капилляра. Капилляры густой сетью оплетают альвеолы." },
      { n: "Плазма", h: 22, c: "color-mix(in srgb,var(--artery) 18%,var(--surface))", d: "Слой плазмы крови до эритроцита. Небольшая часть O₂ растворяется в плазме, 5% CO₂ переносится растворённым в ней." },
    ];
    let s = `<rect x="0" y="0" width="560" height="80" rx="10" fill="var(--accent-soft)"/><text class="svg-text" x="16" y="30" style="font-weight:600">Альвеола</text><text class="svg-muted" x="16" y="50">воздух: O₂ выше, CO₂ ниже</text>`;
    let y = 88;
    L.forEach((l, i) => {
      s += `<g class="hot" data-layer="${i}" tabindex="0" role="button" aria-label="${l.n}"><rect x="0" y="${y}" width="560" height="${l.h}" rx="4" fill="${l.c}"/><text class="svg-text" x="16" y="${y + l.h / 2 + 4.5}" style="font-size:12.5px">${i + 1}. ${l.n}</text></g>`;
      y += l.h + 4;
    });
    s += `<rect x="0" y="${y + 4}" width="560" height="${330 - y - 4}" rx="10" fill="color-mix(in srgb,var(--artery) 14%,var(--surface))"/>`;
    s += `<ellipse cx="300" cy="${y + 40}" rx="56" ry="18" fill="var(--artery)" fill-opacity=".85"/><text class="svg-text" x="380" y="${y + 45}">эритроцит в капилляре</text>`;
    // стрелки
    s += `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--warn)"/></marker></defs>`;
    s += `<line x1="250" y1="44" x2="250" y2="${y + 20}" stroke="var(--accent)" stroke-width="3" marker-end="url(#ah)"/><text class="svg-text" x="260" y="64" style="font-weight:600;fill:var(--accent)">O₂</text>`;
    s += `<line x1="470" y1="${y + 30}" x2="470" y2="40" stroke="var(--warn)" stroke-width="3" marker-end="url(#ah2)"/><text class="svg-text" x="480" y="64" style="font-weight:600;fill:var(--warn)">CO₂</text>`;
    svg.innerHTML = s;
    svg.addEventListener("click", (e) => {
      const g = e.target.closest("[data-layer]");
      if (!g) return;
      const l = L[+g.dataset.layer];
      $$("[data-layer]", svg).forEach((x) => x.classList.toggle("dim", x !== g));
      det.innerHTML = `<div class="k">Слой ${+g.dataset.layer + 1} из 5</div><h3>${l.n}</h3><p>${l.d}</p>`;
    });
    svg.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-layer]")) { e.preventDefault(); e.target.closest("[data-layer]").dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  })();

  /* =================== TRANSPORT =================== */
  (function transport() {
    const bar = (svg, parts, note) => {
      let x = 0, s = "";
      const W = 520;
      parts.forEach((p) => {
        const w = (p.v / 100) * W;
        s += `<rect x="${x}" y="20" width="${w - 2}" height="44" rx="6" fill="${p.c}"/>`;
        s += `<text class="svg-text tnum" x="${x + 8}" y="47" style="font-weight:600;${p.dark ? "fill:#fff" : ""}">${p.lbl}</text>`;
        s += `<text class="svg-muted" x="${x + 2}" y="88">${p.n}</text>`;
        if (p.n2) s += `<text class="svg-muted" x="${x + 2}" y="104">${p.n2}</text>`;
        x += w;
      });
      if (note) s += `<text class="svg-muted" x="0" y="136">${note}</text>`;
      svg.innerHTML = s;
    };
    bar($("[data-co2]"), [
      { v: 7, c: "var(--surface-2)", lbl: "5%", n: "в плазме" },
      { v: 28, c: "var(--vein)", lbl: "25–30%", n: "HbCO₂", n2: "карбгемоглобин", dark: true },
      { v: 65, c: "color-mix(in srgb,var(--vein) 45%,var(--surface))", lbl: "остальное", n: "H₂CO₃ → HCO₃⁻", n2: "NaHCO₃, KHCO₃" },
    ], "Всего связано 95% CO₂");
    bar($("[data-o2]"), [
      { v: 10, c: "var(--surface-2)", lbl: "", n: "немного", n2: "в плазме" },
      { v: 90, c: "var(--artery)", lbl: "большая часть", n: "HbO₂ — оксигемоглобин", dark: true },
    ], "Точных долей в конспекте нет, важна сама идея");
  })();

  /* =================== LEVELS =================== */
  (function levels() {
    const svg = $("[data-levels]");
    const L = [
      { n: "3 уровень", t: "Мост, гипоталамус, кора конечного мозга", d: "Приспосабливают дыхание к меняющимся условиям среды", c: "var(--accent-soft)" },
      { n: "2 уровень", t: "Продолговатый мозг — дыхательный центр", d: "Чередование вдоха и выдоха, управление мотонейронами", c: "color-mix(in srgb,var(--accent) 30%,var(--surface))" },
      { n: "1 уровень", t: "Спинной мозг", d: "Центры диафрагмальных и межрёберных нервов", c: "color-mix(in srgb,var(--accent) 48%,var(--surface))" },
    ];
    let s = "";
    L.forEach((l, i) => {
      const y = 10 + i * 100, inset = i * 26;
      s += `<rect x="${inset}" y="${y}" width="${520 - inset * 2}" height="84" rx="12" fill="${l.c}"/>`;
      s += `<text class="svg-muted" x="${inset + 18}" y="${y + 26}">${l.n}</text>`;
      s += `<text class="svg-text" x="${inset + 18}" y="${y + 48}" style="font-weight:600;font-size:15px">${l.t}</text>`;
      s += `<text class="svg-text" x="${inset + 18}" y="${y + 68}" style="font-size:13px">${l.d}</text>`;
      if (i < 2) s += `<path d="M260,${y + 86} L260,${y + 98}" stroke="var(--ink-3)" stroke-width="1.5"/>`;
    });
    svg.innerHTML = s;
  })();

  /* =================== SPIROGRAM + CALC =================== */
  (function spiro() {
    const svg = $("[data-spiro]");
    const cap = $("[data-spiro-cap]");
    const D = { do: 500, rovd: 1500, rovyd: 1500, ool: 1200, chdd: 16 };
    const v = Object.assign({}, D);
    const DEF = {
      do: ["ДО — дыхательный объём", "Воздух, который вдыхают и выдыхают при спокойном дыхании. Норма 400–500 мл."],
      rovd: ["РОВд — резервный объём вдоха", "Сколько можно дополнительно вдохнуть после спокойного вдоха. Около 1500 мл."],
      rovyd: ["РОВыд — резервный объём выдоха", "Сколько можно дополнительно выдохнуть после спокойного выдоха. Около 1500 мл."],
      ool: ["ООЛ — остаточный объём", "Воздух, который остаётся в лёгких после максимального выдоха. Около 1200 мл. Спирометром не выдыхается."],
      zhel: ["ЖЕЛ — жизненная ёмкость лёгких", "ДО + РОВд + РОВыд. Самое глубокое дыхание. Норма 3500–4700 мл."],
      oel: ["ОЕЛ — общая ёмкость лёгких", "ЖЕЛ + ООЛ. Максимум воздуха в лёгких. Норма 4500–6000 мл."],
    };
    let sel = null;
    function draw() {
      const W = 680, H = 380, l = 52, r = 236, t = 34, b = 30;
      const MAXV = Math.max(6000, Math.ceil((v.ool + v.rovyd + v.do + v.rovd + 400) / 1000) * 1000);
      const X = (x) => l + x * (W - l - r);
      const Y = (ml) => H - b - (ml / MAXV) * (H - t - b);
      const frc = v.ool + v.rovyd, tidalTop = frc + v.do, oel = frc + v.do + v.rovd;
      let s = "";
      for (let m = 0; m <= MAXV; m += 1000) {
        s += `<line class="svg-grid" x1="${l}" x2="${W - r + 10}" y1="${Y(m)}" y2="${Y(m)}"/><text class="svg-muted" x="${l - 8}" y="${Y(m) + 4}" text-anchor="end">${m}</text>`;
      }
      s += `<text class="svg-muted" x="${l - 44}" y="14">объём, мл</text>`;
      // кривая
      const pts = [];
      const N = 420;
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        let val;
        if (x < 0.42) val = frc + v.do * (0.5 - 0.5 * Math.cos(((x / 0.42) * 4) * 2 * Math.PI));
        else if (x < 0.52) { const k = (x - 0.42) / 0.1; val = frc + (oel - frc) * Math.sin((k * Math.PI) / 2); }
        else if (x < 0.66) { const k = (x - 0.52) / 0.14; val = oel - (oel - v.ool) * (0.5 - 0.5 * Math.cos(k * Math.PI)); }
        else if (x < 0.74) { const k = (x - 0.66) / 0.08; val = v.ool + (frc - v.ool) * (0.5 - 0.5 * Math.cos(k * Math.PI)); }
        else val = frc + v.do * (0.5 - 0.5 * Math.cos((((x - 0.74) / 0.26) * 2.5) * 2 * Math.PI));
        pts.push(`${X(x).toFixed(1)},${Y(val).toFixed(1)}`);
      }
      s += `<polyline fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" points="${pts.join(" ")}"/>`;
      // уровни
      [frc, tidalTop, oel, v.ool].forEach((m) => (s += `<line x1="${l}" x2="${W - r + 16}" y1="${Y(m)}" y2="${Y(m)}" stroke="var(--ink-3)" stroke-dasharray="3 4"/>`));
      // скобки
      const br = [
        { k: "do", a: frc, b: tidalTop, col: 0, c: "var(--accent)" },
        { k: "rovd", a: tidalTop, b: oel, col: 0, c: "var(--lobe-3)" },
        { k: "rovyd", a: v.ool, b: frc, col: 0, c: "var(--warn)" },
        { k: "ool", a: 0, b: v.ool, col: 0, c: "var(--ink-3)" },
        { k: "zhel", a: v.ool, b: oel, col: 1, c: "var(--ink-2)" },
        { k: "oel", a: 0, b: oel, col: 2, c: "var(--ink)" },
      ];
      const short = { do: "ДО", rovd: "РОВд", rovyd: "РОВыд", ool: "ООЛ", zhel: "ЖЕЛ", oel: "ОЕЛ" };
      br.forEach((q) => {
        const x = W - r + 26 + q.col * 72;
        const y1 = Y(q.b) + 2, y2 = Y(q.a) - 2;
        const on = sel === q.k;
        s += `<g class="hot${sel && !on ? " dim" : ""}" data-br="${q.k}" tabindex="0" role="button" aria-label="${DEF[q.k][0]}">`;
        s += `<rect x="${x - 6}" y="${y1}" width="68" height="${Math.max(4, y2 - y1)}" fill="transparent"/>`;
        s += `<path d="M${x + 6},${y1} L${x},${y1} L${x},${y2} L${x + 6},${y2}" fill="none" stroke="${q.c}" stroke-width="${on ? 3 : 2}"/>`;
        const small = y2 - y1 < 34;
        s += `<text class="svg-text" x="${x + 10}" y="${(y1 + y2) / 2 + (small ? 5 : -2)}" style="font-weight:600;font-size:15px">${short[q.k]}</text>`;
        if (!small) s += `<text class="svg-muted tnum" x="${x + 10}" y="${(y1 + y2) / 2 + 15}" style="font-size:13px">${fmt(q.b - q.a)}</text>`;
        s += `</g>`;
        if (on) s += `<rect x="${l}" y="${Y(q.b)}" width="${W - r + 10 - l}" height="${Y(q.a) - Y(q.b)}" fill="${q.c}" opacity=".12"/>`;
      });
      svg.innerHTML = s;
    }
    svg.addEventListener("click", (e) => {
      const g = e.target.closest("[data-br]");
      if (!g) return;
      sel = sel === g.dataset.br ? null : g.dataset.br;
      cap.innerHTML = sel ? `<b>${DEF[sel][0]}.</b> ${DEF[sel][1]}` : "Нажмите на скобку справа, чтобы увидеть определение объёма.";
      draw();
    });
    svg.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-br]")) { e.preventDefault(); e.target.closest("[data-br]").dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
    function norm(val, lo, hi) {
      if (val < lo) return `<span style="color:var(--warn)">ниже нормы ${fmt(lo)}–${fmt(hi)}</span>`;
      if (val > hi) return `<span style="color:var(--warn)">выше нормы ${fmt(lo)}–${fmt(hi)}</span>`;
      return `<span style="color:var(--good)">норма ${fmt(lo)}–${fmt(hi)}</span>`;
    }
    function calc() {
      $$("[data-v]").forEach((i) => (v[i.dataset.v] = +i.value));
      $$("[data-out]").forEach((o) => (o.textContent = o.dataset.out === "chdd" ? v.chdd : `${fmt(v[o.dataset.out])} мл`));
      const zhel = v.do + v.rovd + v.rovyd, oel = zhel + v.ool, mod = (v.do * v.chdd) / 1000;
      $('[data-res="zhel"]').textContent = fmt(zhel);
      $('[data-res="oel"]').textContent = fmt(oel);
      $('[data-res="mod"]').textContent = fmt(mod, 1);
      $('[data-res="alv"]').textContent = fmt(Math.max(0, v.do - 140));
      $('[data-norm="zhel"]').innerHTML = norm(zhel, 3500, 4700);
      $('[data-norm="oel"]').innerHTML = norm(oel, 4500, 6000);
      $('[data-norm="mod"]').innerHTML = mod < 6 ? `<span style="color:var(--warn)">в покое 6–8</span>` : mod <= 8 ? `<span style="color:var(--good)">как в покое, 6–8</span>` : mod < 80 ? "больше, чем в покое" : "как при мышечной работе";
      draw();
    }
    $$("[data-v]").forEach((i) => i.addEventListener("input", calc));
    $("[data-v-reset]").addEventListener("click", () => { $$("[data-v]").forEach((i) => (i.value = D[i.dataset.v])); calc(); });
    window.addEventListener("themechange", draw);
    calc();
  })();
})();

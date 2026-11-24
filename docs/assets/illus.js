/* Иллюстрации сайта: иконки органов, анимированная альвеола, дыхательная кривая в шапке.
   Цвета берутся из темы: индиго (--accent/--vein) и коралл (--coral/--artery). */
(function () {
  const A = "var(--accent)", C = "var(--coral)", CS = "var(--coral)", T = "var(--lobe-2)";
  const st = (w = 2.4) => `fill="none" stroke="${A}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const lungL = (o = 1) => `<path d="M20.5 15c-6.5 0-11 8.5-11 17.5 0 5.2 3.2 8.5 7.4 8.5 4.6 0 6.6-3.6 6.6-9.5V17.5c0-1.6-1.3-2.5-3-2.5z" fill="${C}" opacity="${o}"/>`;
  const lungR = (o = .75) => `<path d="M27.5 15c6.5 0 11 8.5 11 17.5 0 5.2-3.2 8.5-7.4 8.5-4.6 0-6.6-3.6-6.6-9.5V17.5c0-1.6 1.3-2.5 3-2.5z" fill="${C}" opacity="${o}"/>`;
  const airway = `<path d="M24 5v15M24 20l-5.5 5M24 20l5.5 5" ${st(2.6)}/>`;
  const svg = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;

  const ICONS = {
    overview: svg(lungL() + lungR() + airway),
    lungs: svg(lungL(.9) + lungR(.7) + airway + `<path d="M12.5 26.5c3 .5 6 2 8 4.5M35 24.5c-3 1-5.5 3-7 5.5M36.5 31.5c-3-.3-6 .3-8.5 1.5" stroke="var(--surface)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),
    nose: svg(`<path d="M17 5c1 7-1 14-6.5 21.5-1.4 2 0 4 2.4 4.3l4.6.5c1.2 2.8 3.2 4.2 6 4.4" ${st(2.6)}/><ellipse cx="17.5" cy="29.5" rx="2.6" ry="1.6" fill="${A}"/>` +
      `<path d="M41 19c-6 0-10 2.5-14 7" fill="none" stroke="${C}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 4"/><path d="M42 27c-5 0-8.5 1.2-12 3.6" fill="none" stroke="${C}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 4"/><path d="M27.5 23.5l-1.5 3.4 3.6.4" fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
    pharynx: svg(`<path d="M22 4c-6 1-11 6-12 13l-3 7 3 1v6c0 3 2 5 5 5h4v8" ${st(2.4)}/>` +
      `<path d="M13 21h9c5 0 8 3 8 8v15" fill="none" stroke="${C}" stroke-width="5" stroke-linecap="round" opacity=".85"/><circle cx="34" cy="16" r="3" fill="${A}" opacity=".35"/><path d="M30 26l6-4" ${st(1.8)}/>`),
    larynx: svg(`<path d="M13 9c7 3 15 3 22 0" fill="none" stroke="var(--bone)" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M14 14h7.5l2.5 3 2.5-3H34l-2.4 12.5c-1.5 5.5-13.7 5.5-15.2 0z" fill="${A}" fill-opacity=".18" stroke="${A}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M17.5 33.5c4 2 9 2 13 0" fill="none" stroke="${A}" stroke-width="3" stroke-linecap="round"/><path d="M19 38.5h10M19 43h10" ${st(3)}/><path d="M22 6c1-3 3-3 4 0" fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round"/>`),
    trachea: svg(`<rect x="18" y="4" width="12" height="40" rx="6" fill="${C}" opacity=".35"/>` +
      [8, 13.5, 19, 24.5, 30, 35.5, 41].map((y) => `<path d="M16 ${y}h16" ${st(3)}/>`).join("")),
    bronchi: svg(`<path d="M24 4v14M24 18l-9 9v12M24 18l11 7v14M15 27l-6 7M35 25l6 6" ${st(3)}/>` +
      `<circle cx="15" cy="40" r="2.6" fill="${C}"/><circle cx="9" cy="35" r="2.6" fill="${C}"/><circle cx="35" cy="40" r="2.6" fill="${C}"/><circle cx="41" cy="32" r="2.6" fill="${C}"/><circle cx="24" cy="18" r="3" fill="${A}"/>`),
    tree: svg(`<path d="M24 4v12M24 16l-8 7M24 16l9 6M16 23l-6 4M16 23l1 8M33 22l6 4M33 22l0 8M10 27l-3 6M10 27l4 6M17 31l-3 6M17 31l4 5M39 26l3 6M39 26l-3 6M33 30l-3 6M33 30l4 6" fill="none" stroke="${A}" stroke-width="2" stroke-linecap="round"/>` +
      [[7, 33], [14, 33], [14, 37], [21, 36], [42, 32], [36, 32], [30, 36], [37, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y + 2.5}" r="2.4" fill="${C}"/>`).join("")),
    acinus: svg(`<path d="M6 8c6 2 10 6 12 12" ${st(2.4)}/>` +
      [[22, 24, 7], [33, 20, 6.5], [34, 33, 7], [23, 37, 6.5], [13, 31, 5.5], [41, 26, 4.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C}" fill-opacity=".3" stroke="${C}" stroke-width="1.8"/>`).join("")),
    gas: svg(`<circle cx="21" cy="21" r="15" fill="${C}" fill-opacity=".18" stroke="${C}" stroke-width="2.2"/>` +
      `<path d="M4 42c10 0 18-3 24-9s9-11 16-13" fill="none" stroke="url(#ringGrad)" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="17" cy="17" r="3" fill="${C}"/><circle cx="25" cy="23" r="3" fill="${C}"/><circle cx="31" cy="11" r="2.6" fill="${A}"/>` +
      `<path d="M25 23l3.5 5" stroke="${C}" stroke-width="1.6" stroke-linecap="round"/>`),
    age: svg(`<g transform="translate(-3 14) scale(.55)">${lungL(.7)}${lungR(.55)}<path d="M24 8v12M24 20l-5 4M24 20l5 4" ${st(3.4)}/></g>` +
      `<g transform="translate(14 0) scale(.85)">${lungL(.95)}${lungR(.75)}${airway}</g><path d="M6 44h36" stroke="${A}" stroke-width="1.6" stroke-dasharray="2 3"/>`),
    pleura: svg(`<path d="M20.5 15c-6.5 0-11 8.5-11 17.5 0 5.2 3.2 8.5 7.4 8.5 4.6 0 6.6-3.6 6.6-9.5V17.5c0-1.6-1.3-2.5-3-2.5z" fill="${C}" opacity=".8" transform="translate(5 -1)"/>` +
      `<path d="M25.5 10C17 10 9 20 9 32c0 7 4.5 11.5 11 11.5 7 0 10.5-5 10.5-13V14c0-2.5-2-4-5-4z" fill="none" stroke="${A}" stroke-width="2.2" stroke-dasharray="3.5 3"/>` +
      `<path d="M34 16l6-4M35 24h7" ${st(1.8)}/>`),
    pneumo: svg(`<path d="M25.5 9C17 9 9 19 9 31c0 7 4.5 12 11 12 7 0 10.5-5 10.5-13V13c0-2.5-2-4-5-4z" fill="${A}" fill-opacity=".12" stroke="${A}" stroke-width="2.2" stroke-dasharray="3.5 3"/>` +
      `<path d="M25 21c-3 0-5.5 4-5.5 8.5 0 2.8 1.6 4.5 3.6 4.5 2.4 0 3.4-1.8 3.4-4.8V22c0-.6-.6-1-1.5-1z" fill="${C}"/>` +
      `<path d="M43 20l-8 3M43 20l-2.5 5.5M43 20l-6-1.5" ${st(2.2)}/>`),
    stages: svg(`<circle cx="9" cy="24" r="6" fill="${A}" fill-opacity=".2" stroke="${A}" stroke-width="2.2"/>` +
      `<path d="M24 17c3 4 5 7 5 9.5a5 5 0 0 1-10 0c0-2.5 2-5.5 5-9.5z" fill="${C}"/>` +
      `<circle cx="40" cy="24" r="6" fill="none" stroke="${A}" stroke-width="2.2"/><circle cx="40" cy="24" r="2" fill="${A}"/>` +
      `<path d="M16 24h2M31 24h2" ${st(2.4)}/>`),
    cycle: svg(`<g transform="translate(0 2) scale(.82) translate(5 0)">${lungL(.85)}${lungR(.65)}${airway}</g>` +
      `<path d="M4 18v14M1 21l3-3 3 3" ${st(2.2)}/><path d="M44 30V16M41 27l3 3 3-3" fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
    reg: svg(`<path d="M24 8c-7 0-13 4.5-13 11 0 2.5 1 4.5 2.5 6-.5 4 2 7.5 6 7.5h1.5v7h6v-7h2c5 0 8.5-3.5 8.5-8 0-1.2-.3-2.3-.8-3.3.5-1 .8-2 .8-3.2C37.5 12 31.5 8 24 8z" fill="${A}" fill-opacity=".15" stroke="${A}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M14 21h5l2.5-5 3.5 10 3-6 2 3h5" fill="none" stroke="${C}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`),
    volumes: svg(`<path d="M5 6v36h38" ${st(2)}/>` +
      `<path d="M8 30c2-4 4-4 6 0s4 4 6 0c2-12 4-20 6-20s4 22 6 26c1.5 3 3 0 4-4s3-4 5 0" fill="none" stroke="${C}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M5 30h38" stroke="${A}" stroke-width="1.2" stroke-dasharray="2 3" opacity=".6"/>`),
  };
  const TOPIC_ICON = {
    "41-overview": "overview", "41-nose": "nose", "41-pharynx": "pharynx", "41-larynx": "larynx", "41-trachea": "trachea",
    "41-bronchi": "bronchi", "41-age": "age", "42-lungs": "lungs", "42-pleura": "pleura", "42-pneumo": "pneumo",
    "42-stages": "stages", "42-cycle": "cycle", "42-gas": "gas", "42-reg": "reg", "42-volumes": "volumes",
  };
  function paintIcons(root = document) {
    root.querySelectorAll("[data-ico]").forEach((el) => {
      if (el.dataset.painted) return;
      const k = TOPIC_ICON[el.dataset.ico] || el.dataset.ico;
      if (ICONS[k]) { el.innerHTML = ICONS[k]; el.dataset.painted = "1"; }
    });
  }

  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function hexRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
  function whenVisible(el, cb) {
    if (!("IntersectionObserver" in window)) return cb(true);
    new IntersectionObserver((en) => cb(en[0].isIntersecting)).observe(el);
  }

  /* ---------- альвеола ---------- */
  function mountAlveolus(host) {
    const NS = "http://www.w3.org/2000/svg";
    const cx = 250, cy = 182, R = 122;
    host.innerHTML = `
      <svg viewBox="0 0 640 400" role="img" aria-label="Анимация газообмена: кислород переходит из альвеолы в кровь капилляра, углекислый газ — из крови в альвеолу; эритроциты из венозных становятся артериальными">
        <defs>
          <radialGradient id="alvFill" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="var(--air)" stop-opacity=".16"/><stop offset=".8" stop-color="var(--lobe-1)" stop-opacity=".16"/><stop offset="1" stop-color="var(--lobe-1)" stop-opacity=".45"/></radialGradient>
          <linearGradient id="capGrad" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="420" y2="0"><stop offset="0" stop-color="var(--vein)"/><stop offset=".5" stop-color="#9B53C9"/><stop offset="1" stop-color="var(--artery)"/></linearGradient>
        </defs>
        <g opacity=".5">
          <circle cx="92" cy="76" r="62" fill="url(#alvFill)" stroke="var(--lobe-1)" stroke-width="4"/>
          <circle cx="410" cy="60" r="56" fill="url(#alvFill)" stroke="var(--lobe-1)" stroke-width="4"/>
          <circle cx="88" cy="238" r="58" fill="url(#alvFill)" stroke="var(--lobe-1)" stroke-width="4"/>
        </g>
        <path d="M150 20 C 190 60, 205 70, 215 70" fill="none" stroke="var(--lobe-1)" stroke-width="14" stroke-linecap="round" opacity=".55"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#alvFill)" stroke="var(--lobe-1)" stroke-width="6"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 7}" fill="none" stroke="var(--warn)" stroke-width="2" stroke-dasharray="2 6" opacity=".7"/>
        <path id="capPath" d="M -20 372 C 60 362, 120 334, 160 312 A 147 147 0 0 0 386 240 C 430 192, 520 168, 660 166" fill="none" stroke="url(#capGrad)" stroke-width="40" stroke-linecap="round" opacity=".9"/>
        <path d="M -20 372 C 60 362, 120 334, 160 312 A 147 147 0 0 0 386 240 C 430 192, 520 168, 660 166" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="40" stroke-linecap="round" stroke-dasharray="1 9"/>
        <g data-cells></g>
        <g data-parts></g>
        <g font-family="Golos Text, system-ui, sans-serif" font-size="14" fill="var(--stage-ink)">
          <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-weight="600" font-size="16">Альвеола</text>
          <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="var(--stage-ink-2)" font-size="12.5">воздух: O₂ выше, CO₂ ниже</text>
          <text x="18" y="350" fill="var(--stage-ink-2)" font-size="12.5">венозная кровь</text>
          <text x="622" y="146" text-anchor="end" fill="var(--stage-ink-2)" font-size="12.5">артериальная кровь</text>
          <text x="512" y="232" font-size="12.5" fill="var(--stage-ink-2)">капилляр</text>
          <path d="M432 290 L 372 262" stroke="var(--stage-ink-2)" stroke-width="1"/>
          <text x="438" y="296" font-size="12.5" fill="var(--stage-ink-2)">барьер 0,5–1 мкм</text>
        </g>
      </svg>
      <div class="alv-legend"><span><i style="background:var(--artery)"></i>O₂</span><span><i style="background:var(--vein)"></i>CO₂</span><span><i style="background:linear-gradient(90deg,var(--vein),var(--artery));border-radius:3px;width:16px"></i>эритроцит насыщается кислородом</span></div>
      <button class="v-btn alv-ctrl" type="button" data-alv-toggle aria-pressed="true">Пауза</button>`;
    const svgEl = host.querySelector("svg");
    const path = svgEl.querySelector("#capPath");
    const cellsG = svgEl.querySelector("[data-cells]");
    const partsG = svgEl.querySelector("[data-parts]");
    const L = path.getTotalLength();
    // где на капилляре начинается и кончается контакт с альвеолой
    let sA = 0, sB = L;
    for (let s = 0; s < L; s += 4) { const p = path.getPointAtLength(s); if (p.x > 160) { sA = s; break; } }
    for (let s = sA; s < L; s += 4) { const p = path.getPointAtLength(s); if (p.x > 386) { sB = s; break; } }
    let vein = hexRgb(css("--vein") || "#4350D6"), art = hexRgb(css("--artery") || "#E8513E");
    window.addEventListener("themechange", () => { vein = hexRgb(css("--vein")); art = hexRgb(css("--artery")); });
    const N = 10;
    const cells = Array.from({ length: N }, (_, i) => {
      const e = document.createElementNS(NS, "ellipse");
      e.setAttribute("rx", 12); e.setAttribute("ry", 7.5);
      e.setAttribute("stroke", "rgba(255,255,255,.35)"); e.setAttribute("stroke-width", "1.2");
      cellsG.appendChild(e);
      return { e, s: (i / N) * L };
    });
    const rnd = (a, b) => a + Math.random() * (b - a);
    function wallPoint() { const a = rnd(0.55, 2.2); return { x: cx + 147 * Math.cos(a), y: cy + 147 * Math.sin(a) }; }
    function inner() { const a = rnd(0, Math.PI * 2), r = rnd(20, 85); return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; }
    const parts = Array.from({ length: 16 }, (_, i) => {
      const o2 = i % 2 === 0;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", o2 ? 6 : 5.5);
      partsG.appendChild(c);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("font-size", "9"); t.setAttribute("text-anchor", "middle"); t.setAttribute("fill", "#fff"); t.setAttribute("font-family", "Golos Text, sans-serif");
      partsG.appendChild(t);
      const p = { o2, c, t, k: Math.random() };
      reset(p);
      return p;
    });
    function reset(p) {
      const a = inner(), b = wallPoint();
      p.from = p.o2 ? a : b; p.to = p.o2 ? b : a;
      p.speed = rnd(0.12, 0.22);
    }
    function frame(dt) {
      cells.forEach((c) => {
        c.s = (c.s + dt * 60) % L;
        const p = path.getPointAtLength(c.s), q = path.getPointAtLength(Math.min(L, c.s + 2));
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        const f = Math.max(0, Math.min(1, (c.s - sA) / (sB - sA)));
        c.e.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
        c.e.setAttribute("fill", mix(vein, art, f));
      });
      parts.forEach((p) => {
        p.k += dt * p.speed;
        if (p.k >= 1) { p.k = 0; reset(p); }
        const e = p.k < 0.5 ? 2 * p.k * p.k : 1 - Math.pow(-2 * p.k + 2, 2) / 2;
        const x = p.from.x + (p.to.x - p.from.x) * e, y = p.from.y + (p.to.y - p.from.y) * e;
        const op = Math.min(1, p.k * 6, (1 - p.k) * 6);
        const col = p.o2 ? `rgb(${art.join(",")})` : `rgb(${vein.join(",")})`;
        p.c.setAttribute("cx", x.toFixed(1)); p.c.setAttribute("cy", y.toFixed(1));
        p.c.setAttribute("fill", col); p.c.setAttribute("opacity", op.toFixed(2));
        p.t.setAttribute("x", x.toFixed(1)); p.t.setAttribute("y", (y - 9).toFixed(1));
        p.t.setAttribute("opacity", (op * 0.9).toFixed(2));
        p.t.setAttribute("fill", col);
        p.t.textContent = p.o2 ? "O₂" : "CO₂";
      });
    }
    let playing = !reduce, visible = true, last = 0;
    frame(0);
    if (reduce) { parts.forEach((p, i) => (p.k = (i + 1) / (parts.length + 2))); frame(0.0001); }
    const btn = host.querySelector("[data-alv-toggle]");
    const paintBtn = () => { btn.textContent = playing ? "Пауза" : "Запустить"; btn.setAttribute("aria-pressed", playing); };
    paintBtn();
    btn.addEventListener("click", () => { playing = !playing; paintBtn(); last = 0; });
    whenVisible(host, (v) => { visible = v; last = 0; });
    (function loop(ts) {
      requestAnimationFrame(loop);
      if (!playing || !visible) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      frame(dt);
    })(0);
  }

  /* ---------- дыхательная кривая в шапке ---------- */
  function mountTrace(host) {
    // спокойное дыхание, глубокий вдох, глубокий выдох, снова спокойное
    const pts = [];
    const base = 44, amp = 9;
    for (let x = 0; x <= 460; x += 4) {
      let y;
      if (x < 180) y = base - amp * (0.5 - 0.5 * Math.cos((x / 45) * Math.PI * 2));
      else if (x < 230) y = base - amp - 26 * Math.sin(((x - 180) / 50) * (Math.PI / 2));
      else if (x < 300) y = base - amp - 26 + (26 + amp + 14) * (0.5 - 0.5 * Math.cos(((x - 230) / 70) * Math.PI));
      else if (x < 330) y = base + 14 - 14 * (0.5 - 0.5 * Math.cos(((x - 300) / 30) * Math.PI));
      else y = base - amp * (0.5 - 0.5 * Math.cos(((x - 330) / 45) * Math.PI * 2));
      pts.push(`${x},${y.toFixed(1)}`);
    }
    host.innerHTML = `<svg class="hero-trace" viewBox="0 0 460 76" aria-hidden="true">
      <line class="tr-base" x1="0" x2="460" y1="44" y2="44"/>
      <polyline class="tr-line" points="${pts.join(" ")}"/>
      <circle class="tr-dot" r="4.5" cx="0" cy="44"/>
      <text x="0" y="72">спокойное дыхание</text><text x="182" y="10">глубокий вдох</text><text x="262" y="72">глубокий выдох</text>
    </svg>`;
    const line = host.querySelector(".tr-line"), dot = host.querySelector(".tr-dot");
    if (reduce) { line.style.strokeDashoffset = 0; dot.setAttribute("cx", 460); return; }
    const L = line.getTotalLength();
    let s = 0, last = 0, visible = true;
    whenVisible(host, (v) => { visible = v; last = 0; });
    (function loop(ts) {
      requestAnimationFrame(loop);
      if (!visible) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      s = (s + dt * 70) % L;
      const p = line.getPointAtLength(s);
      dot.setAttribute("cx", p.x.toFixed(1)); dot.setAttribute("cy", p.y.toFixed(1));
    })(0);
  }

  window.Illus = { ICONS, TOPIC_ICON, paintIcons, mountAlveolus, mountTrace };
  paintIcons();
  document.querySelectorAll("[data-alveolus]").forEach(mountAlveolus);
  document.querySelectorAll("[data-trace]").forEach(mountTrace);
})();

/* Анимации: появление блоков при прокрутке, увеличение рисунков, конфетти, счётчики, кольца прогресса.
   Всё отключается при «уменьшить движение» в системе. */
import { reduceMotion } from "../lib/app.js";

  const reduce0 = () => reduceMotion();

  /* ---------- появление при прокрутке ---------- */
  function reveal(root = document) {
    if (reduce0() || !("IntersectionObserver" in window)) return () => {};
    const sel = ".section-head, .panel, .figure, .atlas, .topic-card, .step, .note-section, .stat, .route a, .lec-file, .alv-split, .tl-item, .tbl-wrap";
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    const vh = window.innerHeight;
    root.querySelectorAll(sel).forEach((el) => {
      if (el.classList.contains("reveal") || (el.parentElement && el.parentElement.closest(".reveal"))) return;
      if (el.getBoundingClientRect().top < vh * 0.92) return; // что видно сразу — показываем без анимации
      el.classList.add("reveal");
      const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.matches(sel)) : [];
      const i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }

  /* ---------- счётчики ---------- */
  function countUp(el, to, ms = 1100, fmt = (v) => Math.round(v)) {
    if (reduce0()) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(to * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- кольца прогресса ---------- */
  function ring(pct, label) {
    const r = 18, c = 2 * Math.PI * r;
    return `<span class="ring-wrap"><svg class="ring" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="${r}"/><circle class="fg" cx="22" cy="22" r="${r}" stroke="url(#ringGrad)" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-pct="${pct}"/></svg><span>${label != null ? label : Math.round(pct * 100)}</span></span>`;
  }
  function animateRings(root = document) {
    const all = [...root.querySelectorAll(".ring .fg[data-pct]")];
    const go = (el) => {
      const c = parseFloat(el.getAttribute("stroke-dasharray"));
      el.style.strokeDashoffset = (c * (1 - parseFloat(el.dataset.pct))).toFixed(1);
    };
    if (reduce0() || !("IntersectionObserver" in window)) return all.forEach(go);
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { setTimeout(() => go(e.target), 120); io.unobserve(e.target); } }));
    all.forEach((el) => io.observe(el));
  }

  /* ---------- конфетти ---------- */
  function confetti(n = 140) {
    if (reduce0()) return;
    const cv = document.createElement("canvas");
    cv.className = "confetti";
    document.body.appendChild(cv);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const ctx = cv.getContext("2d");
    const cs = getComputedStyle(document.documentElement);
    const cols = ["--vein", "--artery", "--coral", "--good", "--warn", "--lobe-2"].map((v) => cs.getPropertyValue(v).trim() || "#888");
    const P = Array.from({ length: n }, () => ({
      x: W * (0.2 + Math.random() * 0.6), y: H * 0.35, vx: (Math.random() - 0.5) * 18 * dpr, vy: (-Math.random() * 16 - 6) * dpr,
      w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: cols[Math.floor(Math.random() * cols.length)],
    }));
    const t0 = performance.now();
    (function step(t) {
      const age = (t - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      P.forEach((p) => {
        p.vy += 0.5 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - age / 2.6);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      });
      if (age < 2.6) requestAnimationFrame(step); else cv.remove();
    })(t0);
  }

  /* ---------- увеличение рисунков ---------- */
  function installLightbox() { document.addEventListener("click", (e) => {
    const a = e.target.closest("a.zoom");
    if (!a) return;
    e.preventDefault();
    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Рисунок");
    const fig = document.createElement("figure");
    const img = document.createElement("img");
    img.src = a.getAttribute("href"); img.alt = a.dataset.caption || ""; img.referrerPolicy = "no-referrer";
    const cap = document.createElement("p");
    cap.textContent = a.dataset.caption || "";
    fig.append(img, cap);
    const close = document.createElement("button");
    close.type = "button"; close.setAttribute("aria-label", "Закрыть"); close.textContent = "×";
    box.append(fig, close);
    document.body.appendChild(box);
    close.focus();
    const done = () => { box.remove(); document.removeEventListener("keydown", onKey); a.focus(); };
    const onKey = (ev) => { if (ev.key === "Escape") done(); };
    box.addEventListener("click", (ev) => { if (ev.target === box || ev.target === close) done(); });
    document.addEventListener("keydown", onKey);
  }); }

export { reveal, countUp, ring, animateRings, confetti, installLightbox };

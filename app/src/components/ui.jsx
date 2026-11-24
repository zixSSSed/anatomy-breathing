import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ICON_PATHS, subscribe, getVersion, reduceMotion } from "../lib/app.js";
import { ICONS as ORGANS, TOPIC_ICON, paintIcons } from "../legacy/illus.js";
import { reveal } from "../legacy/fx.js";
import { scrollToHash } from "../lib/router.jsx";

/** Перерисовка при любом изменении прогресса */
export const useProgress = () => useSyncExternalStore(subscribe, getVersion);

export const ease = [0.22, 0.8, 0.2, 1];
export const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 };

export function Icon({ name, className = "icon", size }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" style={size ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }} />
  );
}

/** Иконка органа/темы: 41-nose, nose, lungs… */
export function OrganIcon({ name, className }) {
  const k = TOPIC_ICON[name] || name;
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ORGANS[k] || "" }} />;
}

/** Кольцо прогресса с плавным заполнением, когда попадает в поле зрения */
export function Ring({ value, label, size = 44 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const r = 18, c = 2 * Math.PI * r;
  const target = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <span className="ring-wrap" ref={ref} style={{ width: size, height: size }}>
      <svg className="ring" viewBox="0 0 44 44" style={{ width: size, height: size }}>
        <circle className="bg" cx="22" cy="22" r={r} />
        <motion.circle className="fg" cx="22" cy="22" r={r} stroke="url(#ringGrad)" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: inView ? target : c }}
          transition={reduceMotion() ? { duration: 0 } : { duration: 1.3, ease }} />
      </svg>
      <span>{label != null ? label : Math.round(value * 100)}</span>
    </span>
  );
}

/** Число, которое досчитывает до значения */
export function CountUp({ to, duration = 900, format = (v) => Math.round(v) }) {
  const [v, setV] = useState(reduceMotion() ? to : 0);
  useEffect(() => {
    if (reduceMotion()) { setV(to); return; }
    let raf, t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / duration);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{format(v)}</>;
}

export function PageHead({ crumb, title, lead, children }) {
  return (
    <div className="page-head">
      {crumb && <div className="crumb">{crumb}</div>}
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </div>
  );
}

/** Страница с готовым HTML (конспект, схемы, физиология, лекции) и подключаемым поведением */
export function HtmlPage({ html, init }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const root = ref.current;
    paintIcons(root);
    const cleanups = [];
    const c = init && init(root);
    if (typeof c === "function") cleanups.push(c);
    else if (Array.isArray(c)) cleanups.push(...c.filter(Boolean));
    if (window.location.hash) requestAnimationFrame(() => scrollToHash());
    const r = reveal(root);
    if (r) cleanups.push(r);
    return () => cleanups.forEach((f) => f());
  }, [html, init]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Всплывающие уведомления */
export function Toaster() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    const on = (e) => { setMsg({ text: e.detail, id: Date.now() }); clearTimeout(t); t = setTimeout(() => setMsg(null), 2400); };
    window.addEventListener("app:toast", on);
    return () => { window.removeEventListener("app:toast", on); clearTimeout(t); };
  }, []);
  return (
    <div className="toast-host" role="status" aria-live="polite">
      <AnimatePresence>
        {msg && (
          <motion.div key={msg.id} className="toast show" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={spring}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Подключает «появление при прокрутке» к уже отрисованным блокам страницы */
export function useReveal(ref, deps = []) {
  useEffect(() => {
    if (!ref.current) return;
    const id = requestAnimationFrame(() => { cleanup = reveal(ref.current); });
    let cleanup = null;
    return () => { cancelAnimationFrame(id); if (cleanup) cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

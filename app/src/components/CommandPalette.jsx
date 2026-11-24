import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "../lib/router.jsx";
import { Icon, spring } from "./ui.jsx";
import { NAV } from "./Layout.jsx";

const n = (s) => String(s).toLowerCase().replace(/ё/g, "е");
let INDEX = null;

async function buildIndex() {
  if (INDEX) return INDEX;
  const [{ CONTENT }, { GLOSSARY, CARDS }] = await Promise.all([import("../generated/content.js"), import("../generated/study.js")]);
  const items = [];
  NAV.forEach((g) => g.items.forEach(([to, title, ic]) => items.push({ kind: "Раздел", title, to, ic })));
  items.push({ kind: "Раздел", title: "Прогресс", to: "/progress", ic: "chart" });
  const parse = (html) => new DOMParser().parseFromString(html, "text/html");
  const notes = parse(CONTENT.notes);
  notes.querySelectorAll(".note-section[id]").forEach((s) => {
    const h = s.querySelector("h2");
    if (!h) return;
    const title = h.textContent.replace(/\s+/g, " ").trim();
    items.push({ kind: "Конспект", title, text: s.textContent.replace(/\s+/g, " "), to: `/notes#${s.id}`, ic: "book" });
    s.querySelectorAll("h3,h4").forEach((x) => {
      const sub = x.textContent.replace(/\s+/g, " ").trim();
      if (sub.length > 2 && !/^Запомни|^Клиника/.test(sub)) items.push({ kind: "Конспект", title: sub, sub: title, to: `/notes#${s.id}`, ic: "book" });
    });
  });
  [["schemes", "Схемы", "fork"], ["physiology", "Физиология", "wind"]].forEach(([slug, kind, ic]) => {
    parse(CONTENT[slug]).querySelectorAll("section[id]").forEach((s) => {
      const h = s.querySelector("h2");
      if (h) items.push({ kind, title: h.textContent.trim(), text: (s.querySelector(".section-head p") || {}).textContent || "", to: `/${slug}#${s.id}`, ic });
    });
  });
  parse(CONTENT.lectures).querySelectorAll(".lec-sec[id], li[id]").forEach((s) => {
    items.push({ kind: "Лекции", title: s.textContent.replace(/\s+/g, " ").trim().slice(0, 90), to: `/lectures#${s.id}`, ic: "file" });
  });
  GLOSSARY.forEach((g) => items.push({ kind: "Словарь", title: g.term, sub: g.def, text: g.lat, to: `/glossary?q=${encodeURIComponent(g.term)}`, ic: "dict" }));
  CARDS.forEach((c) => items.push({ kind: "Карточки", title: c.f, sub: c.b.replace(/\n/g, "; "), to: `/cards#${c.t}`, ic: "cards" }));
  items.forEach((it) => { it._t = n(it.title); it._s = n((it.sub || "") + " " + (it.text || "")); });
  INDEX = items;
  return items;
}

function search(items, q) {
  const words = n(q).split(/\s+/).filter(Boolean);
  if (!words.length) return items.filter((i) => i.kind === "Раздел");
  const out = [];
  for (const it of items) {
    let score = 0, all = true;
    for (const w of words) {
      if (it._t.includes(w)) score += it._t.startsWith(w) ? 5 : 3;
      else if (it._s.includes(w)) score += 1;
      else { all = false; break; }
    }
    if (all) out.push([score + (it.kind === "Раздел" ? 2 : 0) + (it.kind === "Словарь" ? 1 : 0), it]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 40).map((x) => x[1]);
}

function Highlight({ text, q }) {
  const words = n(q).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return text;
  const low = n(text);
  let i = -1, w = "";
  for (const x of words) { const k = low.indexOf(x); if (k >= 0 && (i < 0 || k < i)) { i = k; w = x; } }
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + w.length)}</mark>{text.slice(i + w.length)}</>;
}

function snippet(s, q) {
  if (!s) return "";
  const words = n(q).split(/\s+/).filter(Boolean);
  const low = n(s);
  let i = words.length ? low.indexOf(words[0]) : -1;
  if (i < 0) return s.slice(0, 120) + (s.length > 120 ? "…" : "");
  const a = Math.max(0, i - 40);
  return (a ? "…" : "") + s.slice(a, a + 140) + (a + 140 < s.length ? "…" : "");
}

export function CommandPalette({ open, onClose }) {
  const { navigate } = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState(INDEX);
  const [sel, setSel] = useState(0);
  const input = useRef(null);
  const list = useRef(null);
  useEffect(() => {
    if (!open) return;
    setQ(""); setSel(0);
    if (!items) buildIndex().then(setItems);
    const t = setTimeout(() => input.current && input.current.focus(), 40);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => (items ? search(items, q) : []), [items, q]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    const el = list.current && list.current.querySelector(`[data-i="${sel}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [sel]);
  const go = (it) => { onClose(); navigate(it.to.startsWith("/") ? (import.meta.env.BASE_URL + it.to.slice(1)) : it.to); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter" && results[sel]) { e.preventDefault(); go(results[sel]); }
    else if (e.key === "Escape") onClose();
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="cmdk-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="cmdk" role="dialog" aria-modal="true" aria-label="Поиск по сайту" onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={spring}>
            <div className="cmdk-input">
              <Icon name="search" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Термин, раздел, вопрос: сурфактант, гортань, ЖЕЛ…" aria-label="Что найти" aria-controls="cmdk-list" autoComplete="off" />
              <kbd className="kbd">Esc</kbd>
            </div>
            <div className="cmdk-list" id="cmdk-list" ref={list} role="listbox">
              {!items && <div className="cmdk-empty">Готовлю поиск…</div>}
              {items && !results.length && <div className="cmdk-empty">Ничего не нашлось. Попробуйте часть слова: «альвеол», «плевр»</div>}
              {results.map((it, i) => (
                <button key={it.kind + it.title + it.to + i} type="button" role="option" aria-selected={i === sel} data-i={i}
                  className={`cmdk-item${i === sel ? " on" : ""}`} onMouseMove={() => setSel(i)} onClick={() => go(it)}>
                  <span className="cmdk-ico"><Icon name={it.ic} /></span>
                  <span className="cmdk-main">
                    <span className="cmdk-title"><Highlight text={it.title} q={q} /></span>
                    {(it.sub || (q && it.text)) && <span className="cmdk-sub">{it.sub ? snippet(it.sub, q) : snippet(it.text, q)}</span>}
                  </span>
                  <span className="cmdk-kind">{it.kind}</span>
                </button>
              ))}
            </div>
            <div className="cmdk-foot"><span><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> выбрать</span><span><kbd className="kbd">Enter</kbd> открыть</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

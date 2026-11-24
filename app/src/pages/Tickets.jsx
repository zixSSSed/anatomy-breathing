import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TICKETS } from "../generated/study.js";
import { App as A, shuffle, notesLink, toast } from "../lib/app.js";
import { href } from "../lib/router.jsx";
import { PageHead, useProgress, ease } from "../components/ui.jsx";

const GROUPS = [
  (t) => t.t.startsWith("41"),
  (t) => ["42-lungs", "42-pleura", "42-pneumo"].includes(t.t),
  (t) => ["42-stages", "42-cycle", "42-gas", "42-reg", "42-volumes"].includes(t.t),
];
const GRADES = [[0, "Не ответил"], [1, "Частично"], [2, "Ответил"]];

function draw() {
  const qs = GROUPS.map((f) => {
    const pool = shuffle(TICKETS.filter(f)).sort((a, b) => (A.state.tickets[a.id] || 0) - (A.state.tickets[b.id] || 0));
    return pool[Math.floor(Math.random() * Math.min(pool.length, 4))];
  }).filter(Boolean);
  return { no: 1 + Math.floor(Math.random() * 30), qs };
}

function Timer({ resetKey }) {
  const [minutes, setMinutes] = useState(10);
  const [left, setLeft] = useState(600);
  const [running, setRunning] = useState(false);
  const tick = useRef(null);
  useEffect(() => { setRunning(false); setLeft(minutes * 60); }, [minutes, resetKey]);
  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => setLeft((l) => {
      if (l <= 1) { setRunning(false); toast("Время вышло. Откройте планы ответов и оцените себя"); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(tick.current);
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  const frac = left / (minutes * 60);
  return (
    <div className="panel">
      <div className="row between"><h4>Таймер</h4>
        <div className="seg" role="group" aria-label="Время на билет">
          {[5, 10, 15].map((m) => <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m} мин</button>)}
        </div>
      </div>
      <div className={`timer${left <= 60 ? " low" : ""}`} style={{ margin: "16px 0 10px" }}>{mm}:{ss}</div>
      <div className="bar" style={{ marginBottom: 16 }}><motion.i animate={{ width: `${frac * 100}%` }} transition={{ duration: 0.9, ease: "linear" }} /></div>
      <div className="row">
        <button className="btn primary sm" type="button" onClick={() => { if (left <= 0) setLeft(minutes * 60); setRunning((r) => !r); }}>{running ? "Пауза" : left < minutes * 60 && left > 0 ? "Продолжить" : "Старт"}</button>
        <button className="btn sm" type="button" onClick={() => { setRunning(false); setLeft(minutes * 60); }}>Сбросить</button>
      </div>
    </div>
  );
}

export default function Tickets() {
  useProgress();
  const [ticket, setTicket] = useState(draw);
  const [open, setOpen] = useState(() => new Set());
  const [seq, setSeq] = useState(0);
  const box = useRef(null);
  const fresh = (t) => { setTicket(t); setOpen(new Set()); setSeq((x) => x + 1); };
  const toggle = (id) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <>
      <PageHead crumb="Проверить себя" title="Билеты" lead="Билет из трёх вопросов: по анатомии дыхательных путей, по лёгким и плевре и по физиологии. Ответьте вслух или письменно, потом откройте план ответа и оцените себя." />
      <div className="split" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
        <div className="panel ticket" ref={box}>
          <div className="ticket-head">
            <div><div className="small muted">{ticket.no ? "Экзаменационный билет" : "Отдельный вопрос"}</div><div className="no">{ticket.no ? `Билет № ${ticket.no}` : "Тренировка"}</div></div>
            <div className="row">
              <button className="btn sm" type="button" onClick={() => setOpen(new Set(ticket.qs.map((q) => q.id)))}>Показать все планы</button>
              <button className="btn primary sm" type="button" onClick={() => fresh(draw())}>Новый билет</button>
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={seq} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease }}>
              {ticket.qs.map((q, i) => {
                const isOpen = open.has(q.id);
                const g = A.state.tickets[q.id];
                return (
                  <div className="tq" key={q.id}>
                    <div className="qn">Вопрос {i + 1}. {A.topicName(q.t)}</div>
                    <div className="qt">{q.q}</div>
                    <div className="row" style={{ gap: 8 }}>
                      <button className={`btn sm${isOpen ? "" : " ghost"}`} type="button" aria-expanded={isOpen} onClick={() => toggle(q.id)}>{isOpen ? "Скрыть план ответа" : "Показать план ответа"}</button>
                      <a className="btn sm ghost" href={href("/" + notesLink(q.t))}>Конспект</a>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} style={{ overflow: "hidden" }}>
                          <ul>{q.plan.map((p) => <li key={p}>{p}</li>)}</ul>
                          <div className="row" style={{ marginTop: 12, gap: 8 }}>
                            <span className="small muted">Как ответили?</span>
                            {GRADES.map(([v, n]) => <button key={v} className="chip" type="button" aria-pressed={g === v} onClick={() => A.setTicket(q.id, v)}>{n}</button>)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="stack">
          <Timer resetKey={seq} />
          <div className="panel">
            <h4 style={{ marginBottom: 8 }}>Все вопросы билетов</h4>
            <p className="small muted" style={{ marginBottom: 8 }}>Можно открыть любой вопрос и потренироваться отдельно.</p>
            <div style={{ display: "grid", gap: 4, maxHeight: 420, overflow: "auto" }}>
              {TICKETS.map((q) => {
                const g = A.state.tickets[q.id];
                const dot = g == null ? "var(--surface-2)" : g === 2 ? "var(--good)" : g === 1 ? "var(--warn)" : "var(--bad)";
                return (
                  <button key={q.id} className="btn ghost sm" type="button" style={{ justifyContent: "flex-start", height: "auto", minHeight: 34, padding: "6px 8px", whiteSpace: "normal", textAlign: "left", fontWeight: 400 }}
                    onClick={() => { fresh({ no: null, qs: [q] }); box.current && box.current.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                    <span className="dot" style={{ background: dot }} /><span>{q.q}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

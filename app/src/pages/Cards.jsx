import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { CARDS } from "../generated/study.js";
import { TOPICS, App as A, shuffle } from "../lib/app.js";
import { href } from "../lib/router.jsx";
import { Icon, PageHead, useProgress, spring } from "../components/ui.jsx";
import { confetti } from "../legacy/fx.js";

const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
const COUNTS = CARDS.reduce((m, c) => ((m[c.t] = (m[c.t] || 0) + 1), m), {});

function buildOrder(topic, mode) {
  let list = CARDS.filter((c) => topic === "all" || c.t === topic);
  if (mode === "known") list = list.filter((c) => A.card(c.id).box >= 2);
  if (mode === "due") list = shuffle(list).sort((a, b) => { const ca = A.card(a.id), cb = A.card(b.id); return ca.box - cb.box || (ca.at || 0) - (cb.at || 0); });
  return list.map((c) => c.id);
}

function Faces({ c, flipped }) {
  const st = A.card(c.id);
  const head = (
    <div className="k"><span>{A.topicName(c.t)}</span><span className="boxes" title={`Ступень ${st.box} из 3`}>{[0, 1, 2].map((i) => <i key={i} className={st.box > i ? "on" : ""} />)}</span></div>
  );
  return (
    <div className={`flip${flipped ? " flipped" : ""}`}>
      <div className="flip-inner">
        <div className="flip-face front">
          {head}
          <div className="front-q">{c.f}{c.lat && <> <span className="lat">{c.lat}</span></>}</div>
          <div className="hint">Нажмите, чтобы перевернуть. Свайп вправо — знаю, влево — повторить</div>
        </div>
        <div className="flip-face back" aria-hidden={!flipped}>
          {head}
          <div className="ans">{c.b}</div>
        </div>
      </div>
    </div>
  );
}

const SWIPE = { exit: (d) => ({ x: d * 520, opacity: 0, rotate: d * 18, transition: { duration: 0.32 } }) };

function SwipeCard({ c, flipped, onFlip, onGrade, dir }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);
  const okOp = useTransform(x, [30, 130], [0, 1]);
  const badOp = useTransform(x, [-130, -30], [1, 0]);
  return (
    <motion.div className="swipe" drag="x" dragSnapToOrigin dragElastic={0.85} style={{ x, rotate }}
      initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      variants={SWIPE} exit="exit" custom={dir}
      transition={spring}
      onDragEnd={(e, info) => {
        if (info.offset.x > 120 || info.velocity.x > 700) onGrade(true);
        else if (info.offset.x < -120 || info.velocity.x < -700) onGrade(false);
      }}
      onTap={onFlip}
      role="button" tabIndex={0} aria-label={`Карточка: ${c.f}. Нажмите, чтобы перевернуть`}>
      <Faces c={c} flipped={flipped} />
      <motion.span className="swipe-badge ok" style={{ opacity: okOp }}>Знаю</motion.span>
      <motion.span className="swipe-badge bad" style={{ opacity: badOp }}>Повторить</motion.span>
    </motion.div>
  );
}

export default function Cards() {
  useProgress();
  const initialTopic = COUNTS[window.location.hash.slice(1)] ? window.location.hash.slice(1) : "all";
  const [topic, setTopic] = useState(initialTopic);
  const [mode, setMode] = useState("due");
  const [order, setOrder] = useState(() => buildOrder(initialTopic, "due"));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dir, setDir] = useState(1);

  const rebuild = useCallback((t = topic, m = mode, mix = false) => {
    let o = buildOrder(t, m);
    if (mix) o = shuffle(o);
    setOrder(o); setIdx(0); setFlipped(false);
  }, [topic, mode]);

  const inFilter = useMemo(() => CARDS.filter((c) => topic === "all" || c.t === topic), [topic]);
  const known = inFilter.filter((c) => A.card(c.id).box >= 2).length;
  const c = idx < order.length ? BY_ID[order[idx]] : null;
  const next = idx + 1 < order.length ? BY_ID[order[idx + 1]] : null;

  const grade = useCallback((ok) => {
    if (!c) return;
    const st = A.card(c.id);
    setDir(ok ? 1 : -1);
    A.setCard(c.id, c.t, ok ? st.box + 1 : 0);
    if (!ok && mode === "due") setOrder((o) => { const n = o.slice(); n.splice(Math.min(n.length, idx + 4), 0, c.id); return n; });
    setFlipped(false);
    setIdx((i) => i + 1);
  }, [c, idx, mode]);
  const go = (d) => { setDir(d); setFlipped(false); setIdx((i) => Math.max(0, Math.min(order.length, i + d))); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input,textarea,select")) return;
      if (e.key === " " || (e.key === "Enter" && !e.target.closest("button,a"))) { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "1" && flipped) grade(false);
      else if (e.key === "2" && flipped) grade(true);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  useEffect(() => { if (!c && order.length && known === inFilter.length && inFilter.length) confetti(); }, [c]); // eslint-disable-line

  return (
    <>
      <PageHead crumb="Проверить себя" title="Карточки" lead="Вспомните ответ и переверните карточку. Знали — свайп вправо или «Знал»: карточка поднимется на ступень и будет попадаться реже. Не знали — влево, она вернётся через несколько карточек." />
      <div className="toolbar">
        <div className="chips">
          <button className="chip" type="button" aria-pressed={topic === "all"} onClick={() => { setTopic("all"); rebuild("all"); }}>Все темы <span className="n">{CARDS.length}</span></button>
          {TOPICS.filter((t) => COUNTS[t.id]).map((t) => (
            <button key={t.id} className="chip" type="button" aria-pressed={topic === t.id} onClick={() => { setTopic(t.id); rebuild(t.id); }}>{t.n} <span className="n">{COUNTS[t.id]}</span></button>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <div className="seg" role="group" aria-label="Какие карточки">
          {[["due", "Сначала невыученные"], ["all", "Все по порядку"], ["known", "Только выученные"]].map(([m, n]) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); rebuild(topic, m); }}>{n}</button>
          ))}
        </div>
        <button className="btn sm ghost" type="button" onClick={() => rebuild(topic, mode, true)}><Icon name="shuffle" />Перемешать</button>
      </div>

      <div className="flash-wrap">
        {!order.length ? (
          <div className="empty">{mode === "known" ? "Выученных карточек в этой теме пока нет. Переключитесь на «Сначала невыученные»." : "В этой теме нет карточек."}</div>
        ) : !c ? (
          <motion.div className="panel" style={{ textAlign: "center" }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
            <h3>Круг пройден</h3>
            <p className="muted" style={{ margin: "8px 0 16px" }}>Выучено {known} из {inFilter.length} в выбранной теме.</p>
            <div className="row" style={{ justifyContent: "center" }}><button className="btn primary" type="button" onClick={() => rebuild()}>Ещё круг</button><a className="btn" href={href("/quiz")}>Пройти тест</a></div>
          </motion.div>
        ) : (
          <>
            <div className="deck">
              {next && <div className="deck-next" aria-hidden="true"><Faces c={next} flipped={false} /></div>}
              <AnimatePresence initial={false} custom={dir}>
                <SwipeCard key={c.id + ":" + idx} c={c} flipped={flipped} dir={dir} onFlip={() => setFlipped((f) => !f)} onGrade={grade} />
              </AnimatePresence>
            </div>
            <div className="flash-actions">
              <button className="btn bad" type="button" onClick={() => grade(false)}><Icon name="x" />Не знал</button>
              {!flipped && <button className="btn primary" type="button" onClick={() => setFlipped(true)}>Показать ответ</button>}
              <button className="btn good" type="button" onClick={() => grade(true)}><Icon name="check" />Знал</button>
            </div>
            <div className="flash-meta">
              <button className="btn sm ghost" type="button" disabled={idx === 0} onClick={() => go(-1)}><Icon name="left" />Назад</button>
              <span className="tnum">Карточка {idx + 1} из {order.length}, выучено {known} из {inFilter.length}</span>
              <button className="btn sm ghost" type="button" onClick={() => go(1)}>Пропустить<Icon name="right" /></button>
            </div>
          </>
        )}
      </div>
      <p className="small muted" style={{ textAlign: "center", marginTop: 16 }}>Клавиши: <span className="kbd">Пробел</span> перевернуть, <span className="kbd">1</span> не знал, <span className="kbd">2</span> знал, <span className="kbd">←</span> <span className="kbd">→</span> листать</p>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { QUIZ } from "../generated/quiz.js";
import { TOPICS, App as A, shuffle, plural, pct, notesLink } from "../lib/app.js";
import { href } from "../lib/router.jsx";
import { Icon, PageHead, CountUp, useProgress, ease, spring } from "../components/ui.jsx";
import { confetti } from "../legacy/fx.js";

const BY_ID = Object.fromEntries(QUIZ.map((q) => [q.id, q]));
const COUNTS = QUIZ.reduce((m, q) => ((m[q.t] = (m[q.t] || 0) + 1), m), {});
const KEYS = ["А", "Б", "В", "Г", "Д"];
const mistakes = () => Object.keys(A.state.quiz).filter((id) => BY_ID[id] && A.state.quiz[id].last === false);

function makeRun(ids, label, mode) {
  return {
    label, mode, i: 0, done: false,
    items: ids.map((id) => {
      const q = BY_ID[id];
      const perm = shuffle(q.o.map((_, k) => k));
      if (q.o.length === 2 && /^(Верно|Неверно)$/.test(q.o[0])) perm.sort();
      return { id, perm, pick: null };
    }),
  };
}

function Setup({ setup, setSetup, start }) {
  useProgress();
  const avail = QUIZ.filter((q) => setup.topics.has(q.t)).length;
  const mis = mistakes().length;
  const toggle = (id) => setSetup((s) => { const t = new Set(s.topics); t.has(id) ? t.delete(id) : t.add(id); return { ...s, topics: t }; });
  const pickAll = (v) => setSetup((s) => ({ ...s, topics: new Set(v === "none" ? [] : TOPICS.filter((x) => v === "all" || x.id.startsWith(v)).map((x) => x.id)) }));
  return (
    <div className="setup-grid">
      <div className="panel">
        <div className="row between" style={{ marginBottom: 8 }}><h3>Темы</h3>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn sm ghost" type="button" onClick={() => pickAll("41")}>Тема 4.1</button>
            <button className="btn sm ghost" type="button" onClick={() => pickAll("42")}>Тема 4.2</button>
            <button className="btn sm ghost" type="button" onClick={() => pickAll("all")}>Все</button>
            <button className="btn sm ghost" type="button" onClick={() => pickAll("none")}>Снять</button>
          </div>
        </div>
        <div className="topic-list">
          {TOPICS.map((t) => (
            <label className="check" key={t.id}><input type="checkbox" checked={setup.topics.has(t.id)} onChange={() => toggle(t.id)} /><span>{t.n}</span><span className="n">{COUNTS[t.id] || 0}</span></label>
          ))}
        </div>
      </div>
      <div className="stack">
        <div className="panel stack" style={{ gap: 20 }}>
          <div className="field"><span className="lbl">Сколько вопросов</span>
            <div className="seg" role="group" aria-label="Количество вопросов">
              {[10, 20, 30, 0].map((n) => <button key={n} type="button" aria-pressed={setup.count === n} onClick={() => setSetup((s) => ({ ...s, count: n }))}>{n || "Все"}</button>)}
            </div>
          </div>
          <div className="field"><span className="lbl">Режим</span>
            <div className="seg" role="group" aria-label="Режим теста">
              <button type="button" aria-pressed={setup.mode === "learn"} onClick={() => setSetup((s) => ({ ...s, mode: "learn" }))}>Обучение</button>
              <button type="button" aria-pressed={setup.mode === "exam"} onClick={() => setSetup((s) => ({ ...s, mode: "exam" }))}>Контрольная</button>
            </div>
            <p className="small muted">{setup.mode === "learn" ? "Правильный ответ и пояснение сразу после каждого вопроса." : "Ответы и пояснения — только в конце, как на настоящей контрольной."}</p>
          </div>
          <div className="row">
            <button className="btn primary" type="button" disabled={!avail} onClick={() => start()}>Начать тест</button>
            <span className="small muted">{avail ? `Доступно ${avail} ${plural(avail, "вопрос", "вопроса", "вопросов")}` : "Выберите хотя бы одну тему"}</span>
          </div>
        </div>
        <div className="panel">
          <h4>Работа над ошибками</h4>
          <p className="small muted" style={{ margin: "6px 0 12px" }}>{mis ? `Вопросов, на которые вы ответили неверно в последний раз: ${mis}.` : "Ошибок пока нет. Они появятся здесь после теста."}</p>
          <button className="btn sm" type="button" disabled={!mis} onClick={() => start(shuffle(mistakes()), "Работа над ошибками", "learn")}>Пройти ошибки</button>
        </div>
      </div>
    </div>
  );
}

function Question({ run, setRun, finish }) {
  const it = run.items[run.i];
  const q = BY_ID[it.id];
  const answered = it.pick !== null;
  const reveal = answered && run.mode === "learn";
  const correctPos = it.perm.indexOf(q.a);
  const ok = it.pick === correctPos;
  const pick = (pos) => {
    if (run.mode === "learn" && answered) return;
    setRun((r) => { const items = r.items.slice(); items[r.i] = { ...items[r.i], pick: pos }; return { ...r, items }; });
  };
  const next = () => { if (!answered) return; if (run.i < run.items.length - 1) setRun((r) => ({ ...r, i: r.i + 1 })); else finish(); };
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input,textarea,select")) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= it.perm.length) { e.preventDefault(); pick(n - 1); }
      else if (e.key === "Enter" && !e.target.closest("button,a")) { e.preventDefault(); next(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  return (
    <div className="quiz-card">
      <div className="q-progress"><span>{run.label}: вопрос {run.i + 1} из {run.items.length}</span><span>{A.topicName(q.t)}</span></div>
      <div className="q-dots" aria-hidden="true">
        {run.items.map((x, k) => {
          const qq = BY_ID[x.id];
          const st = x.pick === null ? "" : run.mode === "learn" ? (x.pick === x.perm.indexOf(qq.a) ? "ok" : "no") : "done";
          return <i key={k} className={`${st}${k === run.i ? " cur" : ""}`} />;
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={run.i} initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22, ease }}>
          <h2 className="q-text">{q.q}</h2>
          <div className="options">
            {it.perm.map((oi, pos) => {
              let cls = "option";
              if (reveal) { if (oi === q.a) cls += " right"; else if (pos === it.pick) cls += " wrong"; }
              else if (answered && pos === it.pick) cls += " picked";
              return <button key={pos} className={cls} type="button" disabled={reveal} onClick={() => pick(pos)}><span className="key">{KEYS[pos]}</span><span>{q.o[oi]}</span></button>;
            })}
          </div>
          {reveal && (
            <div className="explain"><b style={{ color: `var(${ok ? "--good" : "--bad"})` }}>{ok ? "Верно." : "Неверно."}</b> {q.e} <a href={href("/" + notesLink(q.t))}>Раздел конспекта</a></div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="row between" style={{ marginTop: 20 }}>
        <button className="btn ghost sm" type="button" onClick={finish}>Завершить</button>
        <div className="row">
          {run.i > 0 && run.mode === "exam" && <button className="btn sm" type="button" onClick={() => setRun((r) => ({ ...r, i: r.i - 1 }))}><Icon name="left" />Назад</button>}
          <button className="btn primary" type="button" disabled={!answered} onClick={next}>{run.i === run.items.length - 1 ? "Результат" : "Дальше"}</button>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Клавиши <span className="kbd">1</span>–<span className="kbd">4</span> выбирают ответ, <span className="kbd">Enter</span> — дальше</p>
    </div>
  );
}

function Result({ run, restart, redo }) {
  const res = useMemo(() => {
    let score = 0;
    const byTopic = {};
    run.items.forEach((it) => {
      const q = BY_ID[it.id];
      const ok = it.pick === it.perm.indexOf(q.a);
      if (ok) score++;
      const b = (byTopic[q.t] = byTopic[q.t] || { ok: 0, all: 0 });
      b.all++; if (ok) b.ok++;
    });
    const wrong = run.items.filter((it) => it.pick !== it.perm.indexOf(BY_ID[it.id].a));
    return { score, byTopic, wrong, answered: run.items.filter((x) => x.pick !== null).length };
  }, [run]);
  const total = run.items.length;
  const p = total ? res.score / total : 0;
  const verdict = p >= 0.9 ? "Отлично" : p >= 0.75 ? "Хорошо" : p >= 0.6 ? "Удовлетворительно" : "Нужно повторить";
  useEffect(() => { if (p >= 0.75) { const t = setTimeout(() => confetti(), 350); return () => clearTimeout(t); } }, []); // eslint-disable-line
  return (
    <div className="split" style={{ alignItems: "start" }}>
      <motion.div className="panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className="small muted">{run.label} завершён{res.answered < total ? `, без ответа: ${total - res.answered}` : ""}</div>
        <div className="row" style={{ alignItems: "baseline", gap: 16, margin: "8px 0 4px" }}>
          <span className="score-big"><CountUp to={res.score} /><span className="muted" style={{ fontSize: ".45em" }}> из {total}</span></span>
          <span className={`tag${p >= 0.75 ? " accent" : ""}`}>{verdict}, {pct(p)}</span>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          {!!res.wrong.length && <button className="btn primary" type="button" onClick={() => redo(res.wrong.map((x) => x.id))}>Ещё раз только ошибки ({res.wrong.length})</button>}
          <button className="btn" type="button" onClick={restart}>Новый тест</button>
        </div>
        {res.wrong.length ? <h3 style={{ marginTop: 28 }}>Разбор ошибок</h3> : <p style={{ marginTop: 20 }}>Ошибок нет.</p>}
        {res.wrong.map((it) => {
          const q = BY_ID[it.id];
          return (
            <div className="review-item" key={it.id}>
              <div className="q">{q.q}</div>
              <div className="a">{it.pick !== null ? <><span className="no">{q.o[it.perm[it.pick]]}</span><br /></> : <><span className="muted">Без ответа</span><br /></>}<span className="ok">{q.o[q.a]}</span></div>
              <p className="small muted" style={{ marginTop: 6 }}>{q.e} <a href={href("/" + notesLink(q.t))}>Конспект</a></p>
            </div>
          );
        })}
      </motion.div>
      <div className="panel">
        <h4 style={{ marginBottom: 8 }}>По темам</h4>
        {Object.entries(res.byTopic).map(([t, v]) => (
          <div className="topic-bar" key={t} style={{ gridTemplateColumns: "minmax(0,1fr) 80px 48px" }}>
            <span className="tb-name">{A.topicName(t)}</span>
            <span className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${(v.ok / v.all) * 100}%` }} transition={{ duration: 0.9, ease }} /></span>
            <span className="pct">{v.ok}/{v.all}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Quiz() {
  const [setup, setSetup] = useState(() => ({ topics: new Set(TOPICS.map((t) => t.id)), count: 20, mode: "learn" }));
  const [run, setRun] = useState(() => (window.location.hash === "#mistakes" && mistakes().length ? makeRun(shuffle(mistakes()), "Работа над ошибками", "learn") : null));
  const start = (ids, label = "Тест", mode = setup.mode) => {
    if (!ids) {
      ids = shuffle(QUIZ.filter((q) => setup.topics.has(q.t)).map((q) => q.id));
      if (setup.count) ids = ids.slice(0, setup.count);
    }
    setRun(makeRun(ids, label, mode));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const finish = () => {
    if (!run || run.done) return;
    let score = 0;
    run.items.forEach((it) => {
      const q = BY_ID[it.id];
      const ok = it.pick === it.perm.indexOf(q.a);
      if (it.pick !== null) A.recordQuiz(it.id, q.t, ok);
      if (ok) score++;
    });
    A.pushHistory({ at: Date.now(), score, total: run.items.length, label: run.label, mode: run.mode });
    setRun({ ...run, done: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
      <PageHead crumb="Проверить себя" title="Тест" lead="140 вопросов по обеим темам, у каждого есть пояснение и ссылка на раздел конспекта. Ошибки запоминаются: их можно пройти отдельно." />
      {!run && <Setup setup={setup} setSetup={setSetup} start={start} />}
      {run && !run.done && <Question run={run} setRun={setRun} finish={finish} />}
      {run && run.done && <Result run={run} restart={() => setRun(null)} redo={(ids) => start(shuffle(ids), "Работа над ошибками", "learn")} />}
    </>
  );
}

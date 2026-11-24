import { useState } from "react";
import { motion } from "motion/react";
import { QUIZ } from "../generated/quiz.js";
import { CARDS } from "../generated/study.js";
import { TOPICS, App as A, topicMastery, overall, pct, notesLink, streak, plural, reset, setTotals, toast, dayKey } from "../lib/app.js";
import { href } from "../lib/router.jsx";
import { PageHead, Ring, CountUp, OrganIcon, useProgress, ease } from "../components/ui.jsx";

const BY_Q = Object.fromEntries(QUIZ.map((q) => [q.id, q]));

/** Календарь занятий за полгода, как у GitHub */
function Heatmap() {
  const days = A.state.days || {};
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const start = new Date(end); start.setDate(start.getDate() - (7 * 26 - 1));
  // выравниваем по понедельнику
  while ((start.getDay() + 6) % 7 !== 0) start.setDate(start.getDate() - 1);
  const cells = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dayKey(d);
    const n = days[key] || 0;
    cells.push({ key, n, lvl: n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 40 ? 3 : 4 });
  }
  const total = Object.keys(days).length;
  return (
    <div className="panel">
      <div className="row between" style={{ marginBottom: 12 }}><h4>Календарь занятий</h4><span className="small muted">Дней с занятиями: {total}</span></div>
      <div className="heat" role="img" aria-label={`Календарь занятий за полгода, дней с занятиями: ${total}`}>
        {cells.map((c, i) => <motion.i key={c.key} className={`l${c.lvl}`} title={`${new Date(c.key + "T00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}: ${c.n ? `${c.n} ${plural(c.n, "действие", "действия", "действий")}` : "без занятий"}`}
          initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(0.6, i * 0.003), duration: 0.25 }} />)}
      </div>
      <div className="heat-legend small muted"><span>меньше</span><i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /><span>больше</span></div>
    </div>
  );
}

export default function Progress() {
  useProgress();
  const [confirm, setConfirm] = useState(false);
  const st = A.state;
  const read = Object.keys(st.notes).length;
  const known = Object.values(st.cards).filter((c) => c.box >= 2).length;
  const ok = Object.values(st.quiz).filter((q) => q.last).length;
  const hist = st.history || [];
  const avg = hist.length ? hist.reduce((s, h) => s + h.score / Math.max(1, h.total), 0) / hist.length : 0;
  const weak = Object.entries(st.quiz).filter(([id, v]) => v.last === false && BY_Q[id]);
  const s = streak();
  const o = overall();
  return (
    <>
      <PageHead crumb="Ваш прогресс" title="Прогресс" lead="Сводка по всем темам и подсказка, что повторить в первую очередь. Данные хранятся только в этом браузере." />
      <div className="progress-hero">
        <div className="panel ph-main">
          <Ring value={o} label={pct(o)} size={120} />
          <div>
            <div className="small muted">Общий прогресс</div>
            <div className="ph-big"><CountUp to={Math.round(o * 100)} />%</div>
            <div className="small" style={{ color: "var(--ink-2)" }}>{s ? `Серия: ${s} ${plural(s, "день", "дня", "дней")} подряд` : "Позанимайтесь сегодня, чтобы начать серию"}</div>
          </div>
        </div>
        <div className="grid g3">
          <div className="stat"><span className="l">Конспект</span><span className="v"><CountUp to={read} /> из 15</span><span className="d">разделов прочитано</span></div>
          <div className="stat"><span className="l">Карточки</span><span className="v"><CountUp to={known} /> из {CARDS.length}</span><span className="d">выучено (ступень 2 и выше)</span></div>
          <div className="stat"><span className="l">Тест</span><span className="v"><CountUp to={ok} /> из {QUIZ.length}</span><span className="d">{hist.length ? `средний результат ${pct(avg)}` : "тестов ещё не было"}</span></div>
        </div>
      </div>

      <section className="section"><Heatmap /></section>

      <section className="section">
        <div className="section-head"><div><h2>По темам</h2><p>Прочитанный раздел даёт 20%, выученные карточки 40%, верные ответы в тесте 40%.</p></div></div>
        <div className="topic-grid">
          {TOPICS.map((t) => {
            const m = topicMastery(t.id);
            const cTot = CARDS.filter((c) => c.t === t.id).length, qTot = QUIZ.filter((q) => q.t === t.id).length;
            return (
              <div className="topic-card static" key={t.id}>
                <OrganIcon name={t.id} className="ti" />
                <span>
                  <span className="tn">{t.n}</span>
                  <span className="tt" style={{ display: "block" }}>
                    {m.notes ? "прочитано" : <a href={href("/" + notesLink(t.id))}>читать</a>}, карточки {m.known}/{cTot}, тест {m.ok}/{qTot}
                  </span>
                  <span className="tt" style={{ display: "block", marginTop: 4 }}><a href={href(`/cards#${t.id}`)}>Карточки темы</a></span>
                </span>
                <Ring value={m.total} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Что повторить</h2><p>Вопросы теста, на которые вы ответили неверно в последний раз.</p></div><a className="btn sm" href={href("/quiz#mistakes")}>Пройти ошибки</a></div>
        {weak.length ? (
          <div className="panel">
            {weak.slice(0, 30).map(([id]) => {
              const q = BY_Q[id];
              return (
                <div className="review-item" key={id}>
                  <div className="q">{q.q}</div>
                  <div className="a">Правильно: <span className="ok">{q.o[q.a]}</span></div>
                  <p className="small muted" style={{ marginTop: 4 }}>{A.topicName(q.t)}, <a href={href("/" + notesLink(q.t))}>раздел конспекта</a></p>
                </div>
              );
            })}
            {weak.length > 30 && <p className="small muted" style={{ marginTop: 12 }}>И ещё {weak.length - 30}.</p>}
          </div>
        ) : <div className="empty">Ошибок нет: либо тестов ещё не было, либо всё верно. <a href={href("/quiz")}>Пройти тест</a></div>}
      </section>

      <section className="section">
        <div className="section-head"><div><h2>История тестов</h2></div></div>
        {hist.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Когда</th><th>Что</th><th>Режим</th><th className="num">Результат</th></tr></thead>
            <tbody>
              {hist.slice().reverse().slice(0, 15).map((h) => (
                <tr key={h.at}><td className="tnum">{new Date(h.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>{h.label}</td><td>{h.mode === "exam" ? "контрольная" : "обучение"}</td><td className="num">{h.score} из {h.total} ({pct(h.score / Math.max(1, h.total))})</td></tr>
              ))}
            </tbody>
          </table></div>
        ) : <div className="empty">Здесь появятся результаты тестов.</div>}
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Сбросить прогресс</h2><p>Удалит отметки о прочитанном, карточки, результаты тестов, тренажёров и календарь занятий в этом браузере.</p></div></div>
        {confirm ? (
          <motion.div className="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}>
            <span>Удалить весь прогресс в этом браузере? Отменить это нельзя.</span>
            <button className="btn bad sm" type="button" onClick={() => { reset(); Promise.all([import("../generated/study.js"), import("../generated/quiz.js")]).then(([a, b]) => setTotals(a.CARDS, b.QUIZ)); setConfirm(false); toast("Прогресс удалён"); }}>Удалить прогресс</button>
            <button className="btn sm" type="button" onClick={() => setConfirm(false)}>Оставить</button>
          </motion.div>
        ) : <button className="btn bad" type="button" onClick={() => setConfirm(true)}>Сбросить весь прогресс</button>}
      </section>
    </>
  );
}

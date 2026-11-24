import { memo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { TOPICS, topicMastery, notesLink, streak, studiedToday, plural, App as A } from "../lib/app.js";
import { href } from "../lib/router.jsx";
import { Icon, OrganIcon, Ring, CountUp, useProgress, ease, useReveal } from "../components/ui.jsx";
import { mountModel } from "../legacy/model3d.js";
import { mountTrace, mountAlveolus } from "../legacy/illus.js";

const INFO_DEFAULT = `<div class="k">Как пользоваться</div><h3>Нажмите на часть модели</h3><p class="small" style="color:var(--ink-2)">Справа на модели — левое лёгкое пациента (2 доли и сердечная вырезка), слева — правое (3 доли). Трахея заканчивается бифуркацией, главные бронхи расходятся под углом 70°. Вращайте мышью или пальцем.</p>`;

/** 3D-сцена живёт сама по себе: React её не перерисовывает */
const Viewer = memo(function Viewer() {
  const box = useRef(null);
  const info = useRef(null);
  useEffect(() => mountModel(box.current, info.current), []);
  return (
    <div>
      <div className="viewer" ref={box}>
        <canvas aria-label="3D-модель гортани, трахеи, бронхиального дерева, лёгких и диафрагмы" />
        <div className="v-labels" data-labels />
        <div className="v-tools">
          <button className="v-btn" type="button" data-layer="lungs" aria-pressed="true"><span className="sw" style={{ background: "var(--lobe-1)" }} />Лёгкие</button>
          <button className="v-btn" type="button" data-layer="tree" aria-pressed="true"><span className="sw" style={{ background: "var(--cartilage)" }} />Бронхи</button>
          <button className="v-btn" type="button" data-layer="pleura" aria-pressed="false"><span className="sw" style={{ background: "var(--air)" }} />Плевра</button>
          <button className="v-btn" type="button" data-layer="diaph" aria-pressed="true"><span className="sw" style={{ background: "var(--muscle)" }} />Диафрагма</button>
          <button className="v-btn" type="button" data-layer="heart" aria-pressed="true"><span className="sw" style={{ background: "var(--artery)" }} />Сердце</button>
        </div>
        <div className="v-zoom">
          <button className="v-btn" type="button" data-breathe aria-pressed="false">Дышать</button>
          <button className="v-btn" type="button" data-labels-toggle aria-pressed="true">Подписи</button>
          <button className="v-btn" type="button" data-find aria-pressed="false">Найди на модели</button>
          <button className="v-btn" type="button" data-zoom="in" aria-label="Приблизить">+</button>
          <button className="v-btn" type="button" data-zoom="out" aria-label="Отдалить">−</button>
          <button className="v-btn" type="button" data-reset aria-label="Сбросить вид">Сброс</button>
        </div>
        <div className="v-phase" data-phase hidden />
      </div>
      <div className="panel info-card" aria-live="polite" ref={info} dangerouslySetInnerHTML={{ __html: INFO_DEFAULT }} />
    </div>
  );
});

const Trace = memo(function Trace() {
  const el = useRef(null);
  useEffect(() => mountTrace(el.current), []);
  return <div ref={el} />;
});

const Alveolus = memo(function Alveolus() {
  const el = useRef(null);
  useEffect(() => mountAlveolus(el.current), []);
  return <div className="alv" ref={el} />;
});

const ROUTE = [
  ["nose", "Полость носа", "очищение, согревание, увлажнение", "/notes#s-41-nose"],
  ["pharynx", "Носоглотка", "через хоаны, рядом слуховые трубы", "/notes#s-41-pharynx"],
  ["larynx", "Гортань", "IV–VI шейные, самое узкое место", "/notes#s-41-larynx"],
  ["trachea", "Трахея", "9–13 см, 16–20 полуколец", "/notes#s-41-trachea"],
  ["bronchi", "Главные бронхи", "угол 70°, правый шире", "/notes#s-41-bronchi"],
  ["tree", "Бронхиальное дерево", "от долевых до бронхиол", "/schemes#tree"],
  ["acinus", "Ацинус", "структурная единица лёгкого", "/notes#s-42-lungs"],
  ["gas", "Альвеолы", "газообмен через барьер 0,5–1 мкм", "/physiology#gas"],
];

const up = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease, delay: 0.05 + i * 0.07 } });

export default function Home() {
  useProgress();
  const page = useRef(null);
  useReveal(page, []);
  const st = A.state;
  const read = Object.keys(st.notes).length;
  let known = 0; for (const id in st.cards) if (st.cards[id].box >= 2) known++;
  let ok = 0; for (const id in st.quiz) if (st.quiz[id].last) ok++;
  const s = streak();
  return (
    <div ref={page}>
      <section className="hero">
        <div className="hero-text">
          <motion.span className="hero-kicker" {...up(0)}><i />Анатомия и физиология человека, темы 4.1 и 4.2</motion.span>
          <motion.h1 {...up(1)}>Дыхательная система</motion.h1>
          <motion.p className="lead" {...up(2)}>От носа до альвеолы: 3D-модель, полный конспект двух лекций, схемы, анимации газообмена, тест на 140 вопросов, карточки и билеты.</motion.p>
          <motion.div className="row" {...up(3)}>
            <a className="btn primary" href={href("/notes")}>Открыть конспект</a>
            <a className="btn" href={href("/quiz")}>Пройти тест</a>
          </motion.div>
          <motion.div {...up(4)}><Trace /></motion.div>
          <motion.div className="hero-facts" {...up(5)}>
            <span className={`streak-chip${studiedToday() ? " lit" : ""}`}><Icon name="flame" /><b>{s}</b>{plural(s, "день", "дня", "дней")} подряд</span>
            <span><b><CountUp to={140} /></b>вопросов</span>
            <span><b><CountUp to={112} /></b>карточек</span>
            <span><b><CountUp to={36} /></b>билетов</span>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease, delay: 0.15 }}>
          <Viewer />
        </motion.div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Путь воздуха</h2><p>Так воздух проходит при вдохе: от ноздрей до альвеол, где кровь из венозной становится артериальной. Каждый шаг ведёт в нужный раздел.</p></div></div>
        <nav className="route" aria-label="Путь воздуха">
          <span className="route-line" aria-hidden="true" /><span className="route-pulse" aria-hidden="true" />
          {ROUTE.map(([ic, t, s2, to], i) => (
            <a key={ic} href={href(to)}><OrganIcon name={ic} className="r-ico" /><span className="n">{i + 1}</span><span className="t">{t}</span><span className="s">{s2}</span></a>
          ))}
        </nav>
      </section>

      <section className="section">
        <div className="alv-split">
          <Alveolus />
          <div>
            <h2>Что происходит в альвеоле</h2>
            <p className="lead" style={{ marginTop: 12 }}>Газы идут по диффузии: из области, где их парциальное давление выше, туда, где ниже.</p>
            <ol>
              <li>O₂ из воздуха альвеолы проходит через аэрогематический барьер и связывается с гемоглобином: Hb + O₂ ⇄ HbO₂.</li>
              <li>CO₂ выходит из крови в альвеолу и удаляется при выдохе.</li>
              <li>Эритроциты, проходя вдоль альвеолы, насыщаются кислородом: кровь из венозной становится артериальной.</li>
            </ol>
            <div className="row" style={{ marginTop: 20 }}><a className="btn" href={href("/physiology#gas")}>Газообмен и транспорт газов</a></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>Темы</h2><p>Кольцо показывает, насколько тема освоена: прочитанный раздел, выученные карточки и верные ответы в тесте.</p></div>
          <a className="btn sm" href={href("/progress")}>Весь прогресс</a>
        </div>
        <div className="topic-grid">
          {TOPICS.map((t) => {
            const m = topicMastery(t.id);
            return (
              <a key={t.id} className="topic-card" href={href("/" + notesLink(t.id))}>
                <OrganIcon name={t.id} className="ti" />
                <span><span className="tn">{t.n}</span><span className="tt" style={{ display: "block" }}>Тема {t.th}</span></span>
                <Ring value={m.total} />
              </a>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Как готовиться</h2><p>Порядок, в котором материал запоминается лучше всего.</p></div></div>
        <div className="steps">
          <a className="step" href={href("/notes")}><span className="n">1</span><h3>Прочитать конспект</h3><p>15 разделов, оригиналы лекций рядом</p><span className="meta">Прочитано {read} из 15</span></a>
          <a className="step" href={href("/schemes")}><span className="n">2</span><h3>Разобрать схемы</h3><p>Носовые ходы, гортань, границы, атлас рисунков</p><span className="meta">Схемы и физиология</span></a>
          <a className="step" href={href("/cards")}><span className="n">3</span><h3>Выучить карточки</h3><p>Свайп вправо — знаю, влево — повторить</p><span className="meta">{known ? `Выучено ${known}` : "Ещё не начинали"}</span></a>
          <a className="step" href={href("/drills")}><span className="n">4</span><h3>Тренажёры и тест</h3><p>Числа, сопоставления, 140 вопросов</p><span className="meta">{ok ? `Верных ответов ${ok} из 140` : "Ещё не начинали"}</span></a>
          <a className="step" href={href("/tickets")}><span className="n">5</span><h3>Ответить билет</h3><p>Три вопроса, таймер, план ответа</p><span className="meta">{Object.keys(st.tickets).length ? `Отвечено билетов ${Object.keys(st.tickets).length}` : "36 вопросов в банке"}</span></a>
        </div>
      </section>
    </div>
  );
}

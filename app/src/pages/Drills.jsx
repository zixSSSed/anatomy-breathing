import { useEffect, useMemo, useState } from "react";
import { motion, Reorder } from "motion/react";
import { DRILLS } from "../generated/study.js";
import { App as A, shuffle, norm } from "../lib/app.js";
import { Icon, PageHead, useProgress, spring } from "../components/ui.jsx";
import { confetti } from "../legacy/fx.js";

const TABS = [["match", "Сопоставление"], ["numbers", "Числа"], ["order", "Порядок"], ["sort", "Сортировка"]];

function SetPicker({ list, cur, onPick }) {
  useProgress();
  return (
    <div className="chips" style={{ marginBottom: 20 }}>
      {list.map((s, i) => (
        <button key={s.id} className="chip" type="button" aria-pressed={i === cur} onClick={() => onPick(i)}>
          {s.title}{A.state.drills[s.id] != null && <span className="n">{A.state.drills[s.id]}%</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- сопоставление ---------- */
function Match({ set, onNext }) {
  const init = () => ({ left: shuffle(set.pairs.map((p, i) => ({ i, t: p[0] }))), right: shuffle(set.pairs.map((p, i) => ({ i, t: p[1] }))), sel: null, done: [], errors: 0, err: null });
  const [m, setM] = useState(init);
  useEffect(() => setM(init()), [set]); // eslint-disable-line
  const finished = m.done.length === set.pairs.length;
  const click = (key) => {
    setM((s) => {
      if (!s.sel) return { ...s, sel: key, err: null };
      if (s.sel === key) return { ...s, sel: null };
      if (s.sel[0] === key[0]) return { ...s, sel: key };
      const a = +s.sel.slice(1), b = +key.slice(1);
      if (a === b) return { ...s, sel: null, err: null, done: [...s.done, a] };
      return { ...s, sel: null, err: [s.sel, key], errors: s.errors + 1 };
    });
  };
  useEffect(() => {
    if (!finished) return;
    A.setDrill(set.id, Math.round((set.pairs.length / (set.pairs.length + m.errors)) * 100));
    if (!m.errors) confetti(90);
  }, [finished]); // eslint-disable-line
  const item = (side, x) => {
    const key = `${side}${x.i}`;
    const done = m.done.includes(x.i);
    const cls = ["m-item", done ? "done" : "", m.sel === key ? "sel" : "", m.err && m.err.includes(key) ? "err" : ""].join(" ");
    return <button key={key + (m.err && m.err.includes(key) ? m.errors : "")} className={cls} type="button" disabled={done} onClick={() => click(key)}>{x.t}</button>;
  };
  return (
    <div className="panel">
      <div className="row between" style={{ marginBottom: 16 }}><h3>{set.title}</h3><span className="small muted tnum">Пар: {m.done.length} из {set.pairs.length}, ошибок: {m.errors}</span></div>
      <p className="small muted" style={{ marginBottom: 16 }}>Нажмите на элемент слева, затем на подходящий справа.</p>
      <div className="match-grid">{m.left.map((l, k) => [item("L", l), item("R", m.right[k])])}</div>
      {finished && (
        <motion.div className="explain" style={{ marginTop: 20 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <b>Готово.</b> Ошибок: {m.errors}. <button className="btn sm" type="button" style={{ marginLeft: 8 }} onClick={() => setM(init())}>Ещё раз</button> <button className="btn sm primary" type="button" onClick={onNext}>Следующий набор</button>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- числа ---------- */
const NUM_TOPICS = [...new Set(DRILLS.numbers.map((n) => n.t))];
function Numbers() {
  const [topic, setTopic] = useState("all");
  const pickBatch = (t) => shuffle(DRILLS.numbers.filter((n) => t === "all" || n.t === t)).slice(0, 10);
  const [items, setItems] = useState(() => pickBatch("all"));
  const [vals, setVals] = useState({});
  const [res, setRes] = useState({});
  const check = (n) => {
    const v = norm(vals[n.id] || "");
    if (!v) return null;
    return n.accept.concat([n.a]).some((x) => norm(x) === v);
  };
  const checkOne = (n) => { const r = check(n); if (r !== null) setRes((s) => ({ ...s, [n.id]: r })); };
  const checkAll = () => {
    const next = { ...res };
    items.forEach((n) => { const r = check(n); if (r !== null) next[n.id] = r; });
    setRes(next);
    if (Object.keys(next).length === items.length) {
      const good = Object.values(next).filter(Boolean).length;
      A.setDrill("numbers", Math.round((good / items.length) * 100));
      if (good === items.length) confetti(90);
    }
  };
  const newBatch = (t = topic) => { setItems(pickBatch(t)); setVals({}); setRes({}); };
  const ok = Object.values(res).filter((r) => r === true).length;
  return (
    <>
      <div className="chips" style={{ marginBottom: 20 }}>
        <button className="chip" type="button" aria-pressed={topic === "all"} onClick={() => { setTopic("all"); newBatch("all"); }}>Все темы</button>
        {NUM_TOPICS.map((t) => <button key={t} className="chip" type="button" aria-pressed={topic === t} onClick={() => { setTopic(t); newBatch(t); }}>{A.topicName(t)}</button>)}
      </div>
      <div className="panel">
        <div className="row between" style={{ marginBottom: 8 }}><h3>Числа, которые спрашивают</h3><span className="small muted tnum">Верно {ok} из {items.length}</span></div>
        <p className="small muted">Диапазон пишите через дефис: 16-20. Дробь можно с запятой. Римские позвонки можно арабскими цифрами.</p>
        <div>
          {items.map((n, i) => {
            const r = res[n.id];
            return (
              <div className="num-row" key={n.id}>
                <div className="q">{n.q}</div>
                <div className="inwrap">
                  <input className="input" id={`num-${n.id}`} inputMode="text" autoComplete="off" aria-label={n.q} disabled={r === true}
                    value={vals[n.id] || ""} onChange={(e) => setVals((s) => ({ ...s, [n.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); checkOne(n); const nx = document.getElementById(`num-${items[i + 1] && items[i + 1].id}`); if (nx) nx.focus(); } }} />
                  <span className="unit">{n.unit || ""}</span>
                </div>
                <div className={`res${r === true ? " ok" : r === false ? " no" : ""}`}>
                  {r === true && <><Icon name="check" /> {n.a}</>}
                  {r === false && <>Ответ: {n.a}</>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 20 }}><button className="btn primary" type="button" onClick={checkAll}>Проверить все</button><button className="btn" type="button" onClick={() => newBatch()}>Новая десятка</button></div>
      </div>
    </>
  );
}

/* ---------- порядок (перетаскиванием или стрелками) ---------- */
function Order({ set, onNext }) {
  const init = () => { let it = shuffle(set.items.map((t, i) => ({ t, i }))); if (it.every((x, k) => x.i === k)) it = it.reverse(); return it; };
  const [items, setItems] = useState(init);
  const [checked, setChecked] = useState(false);
  useEffect(() => { setItems(init()); setChecked(false); }, [set]); // eslint-disable-line
  const allOk = checked && items.every((x, k) => x.i === k);
  const move = (k, d) => {
    const j = k + d;
    if (j < 0 || j >= items.length) return;
    const n = items.slice(); [n[k], n[j]] = [n[j], n[k]]; setItems(n); setChecked(false);
  };
  const doCheck = () => {
    setChecked(true);
    const ok = items.filter((x, k) => x.i === k).length;
    A.setDrill(set.id, Math.round((ok / items.length) * 100));
    if (ok === items.length) confetti(90);
  };
  return (
    <div className="panel">
      <h3 style={{ marginBottom: 8 }}>{set.title}</h3>
      <p className="small muted" style={{ marginBottom: 16 }}>Перетащите строки в правильном порядке или двигайте их стрелками, затем проверьте.</p>
      <Reorder.Group as="ol" axis="y" values={items} onReorder={(v) => { setItems(v); setChecked(false); }} className="order-list">
        {items.map((x, k) => (
          <Reorder.Item as="li" key={x.t} value={x} className={checked ? (x.i === k ? "ok" : "no") : ""} whileDrag={{ scale: 1.02, boxShadow: "0 12px 30px -10px rgba(0,0,0,.3)" }}>
            <span className="pos tnum">{k + 1}</span><span className="txt">{x.t}</span>
            <button className="mv" type="button" aria-label="Поднять" disabled={k === 0} onClick={() => move(k, -1)}><Icon name="up" /></button>
            <button className="mv" type="button" aria-label="Опустить" disabled={k === items.length - 1} onClick={() => move(k, 1)}><Icon name="down" /></button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="row" style={{ marginTop: 20 }}>
        <button className="btn primary" type="button" onClick={doCheck}>Проверить</button>
        <button className="btn" type="button" onClick={() => { setItems(items.slice().sort((a, b) => a.i - b.i)); setChecked(true); }}>Показать правильный порядок</button>
        <button className="btn ghost" type="button" onClick={() => { setItems(init()); setChecked(false); }}>Перемешать</button>
      </div>
      {allOk ? (
        <div className="explain" style={{ marginTop: 16 }}><b>Всё верно.</b> <button className="btn sm primary" type="button" style={{ marginLeft: 8 }} onClick={onNext}>Следующая последовательность</button></div>
      ) : checked ? <p className="small" style={{ marginTop: 12, color: "var(--bad)" }}>Красные строки стоят не на своём месте.</p> : null}
    </div>
  );
}

/* ---------- сортировка по группам ---------- */
function Sort({ set, onNext }) {
  const init = () => ({ place: set.items.map(() => -1), order: shuffle(set.items.map((_, i) => i)), sel: null, checked: false });
  const [s, setS] = useState(init);
  useEffect(() => setS(init()), [set]); // eslint-disable-line
  const inPool = s.order.filter((i) => s.place[i] === -1);
  const allOk = s.checked && s.place.every((p, i) => p === set.items[i][1]);
  const tokClick = (i) => setS((st) => {
    if (st.place[i] >= 0 && st.sel === null) { const place = st.place.slice(); place[i] = -1; return { ...st, place, checked: false }; }
    return { ...st, sel: st.sel === i ? null : i };
  });
  const binClick = (gi) => setS((st) => { if (st.sel === null) return st; const place = st.place.slice(); place[st.sel] = gi; return { ...st, place, sel: null, checked: false }; });
  const doCheck = () => {
    const ok = s.place.filter((p, i) => p === set.items[i][1]).length;
    setS((st) => ({ ...st, checked: true }));
    A.setDrill(set.id, Math.round((ok / s.place.length) * 100));
    if (ok === s.place.length) confetti(90);
  };
  const tok = (i) => {
    const placed = s.place[i];
    const cls = ["token", s.sel === i ? "sel" : "", s.checked && placed >= 0 ? (placed === set.items[i][1] ? "ok" : "no") : ""].join(" ");
    return <motion.button layout layoutId={`tok-${set.id}-${i}`} transition={spring} key={i} className={cls} type="button" onClick={() => tokClick(i)}>{set.items[i][0]}</motion.button>;
  };
  return (
    <div className="panel">
      <h3 style={{ marginBottom: 8 }}>{set.title}</h3>
      <p className="small muted" style={{ marginBottom: 16 }}>Выберите карточку, затем нажмите на группу. Карточку в группе можно нажать ещё раз, чтобы вернуть.</p>
      <div className="pool">{inPool.length ? inPool.map(tok) : <span className="small muted">Все карточки разложены</span>}</div>
      <div className="sort-bins" style={{ marginTop: 12, gridTemplateColumns: `repeat(${set.groups.length},minmax(0,1fr))` }}>
        {set.groups.map((g, gi) => (
          <div className="bin" key={g} role="button" tabIndex={0} aria-label={`Положить в группу ${g}`} onClick={() => binClick(gi)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); binClick(gi); } }}>
            <h4>{g}</h4>
            <div className="items" onClick={(e) => { if (e.target.closest(".token")) e.stopPropagation(); }}>{s.order.filter((i) => s.place[i] === gi).map(tok)}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 20 }}><button className="btn primary" type="button" disabled={!!inPool.length} onClick={doCheck}>Проверить</button><button className="btn ghost" type="button" onClick={() => setS(init())}>Начать заново</button></div>
      {allOk ? (
        <div className="explain" style={{ marginTop: 16 }}><b>Всё разложено верно.</b> <button className="btn sm primary" type="button" style={{ marginLeft: 8 }} onClick={onNext}>Следующий набор</button></div>
      ) : s.checked ? <p className="small" style={{ marginTop: 12, color: "var(--bad)" }}>Красные карточки лежат не в своей группе — перенесите их.</p> : null}
    </div>
  );
}

export default function Drills() {
  const h = window.location.hash.slice(1);
  const [tab, setTab] = useState(TABS.some((t) => t[0] === h) ? h : "match");
  const [cur, setCur] = useState({ match: 0, order: 0, sort: 0 });
  const list = DRILLS[tab];
  const pick = (i) => setCur((c) => ({ ...c, [tab]: i }));
  const nextSet = () => setCur((c) => ({ ...c, [tab]: (c[tab] + 1) % list.length }));
  const set = useMemo(() => (tab === "numbers" ? null : list[cur[tab]]), [tab, cur, list]);
  return (
    <>
      <PageHead crumb="Проверить себя" title="Тренажёры" lead="Короткие упражнения на то, что чаще всего путают: числа, пары «термин — определение», порядок и группы." />
      <div className="seg drill-tabs" role="tablist" aria-label="Тип тренажёра">
        {TABS.map(([k, n]) => <button key={k} type="button" role="tab" aria-pressed={tab === k} aria-selected={tab === k} onClick={() => setTab(k)}>{n}</button>)}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab !== "numbers" && <SetPicker list={list} cur={cur[tab]} onPick={pick} />}
        {tab === "match" && <Match set={set} onNext={nextSet} />}
        {tab === "numbers" && <Numbers />}
        {tab === "order" && <Order set={set} onNext={nextSet} />}
        {tab === "sort" && <Sort set={set} onNext={nextSet} />}
      </motion.div>
    </>
  );
}

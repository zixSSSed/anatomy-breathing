import { useMemo, useState } from "react";
import { GLOSSARY } from "../generated/study.js";
import { TOPICS, App as A, notesLink } from "../lib/app.js";
import { href } from "../lib/router.jsx";
import { Icon, PageHead } from "../components/ui.jsx";

const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е");
const SORTED = GLOSSARY.slice().sort((a, b) => a.term.localeCompare(b.term, "ru"));

export default function Glossary() {
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [tp, setTp] = useState("all");
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return SORTED.filter((g) => (tp === "all" || g.t === tp) && (!nq || norm(`${g.term} ${g.def} ${g.lat || ""}`).includes(nq)));
  }, [q, tp]);
  const groups = useMemo(() => {
    const out = [];
    list.forEach((g) => {
      const L = g.term[0].toUpperCase();
      if (!out.length || out[out.length - 1].L !== L) out.push({ L, items: [] });
      out[out.length - 1].items.push(g);
    });
    return out;
  }, [list]);
  return (
    <>
      <PageHead crumb="Учить" title="Словарь" lead="Термины обеих тем с латинскими названиями, если они есть в конспекте. Поиск ищет и по определениям." />
      <div className="toolbar">
        <div className="search grow"><Icon name="search" /><input className="input" id="gl-search" type="search" placeholder="Найти термин" autoComplete="off" aria-label="Найти термин" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input" id="gl-topic" style={{ width: "auto", maxWidth: "100%" }} aria-label="Тема" value={tp} onChange={(e) => setTp(e.target.value)}>
          <option value="all">Все темы</option>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.th}: {t.n}</option>)}
        </select>
      </div>
      <div className="alpha" style={{ marginBottom: 8 }}>
        {groups.map((g) => <a key={g.L} href={`#l-${g.L}`}>{g.L}</a>)}
      </div>
      {!list.length ? (
        <div className="empty">Ничего не нашлось. Попробуйте часть слова или другую тему.</div>
      ) : (
        <dl className="gloss">
          {groups.map((g) => [
            <div className="gl-letter" id={`l-${g.L}`} key={"L" + g.L}>{g.L}</div>,
            ...g.items.map((it) => (
              <div className="gl-item" key={it.term}>
                <dt>{it.term}{it.lat && <span className="lat">{it.lat}</span>}</dt>
                <dd>{it.def} <a className="small" href={href("/" + notesLink(it.t))}>{A.topicName(it.t)}</a></dd>
              </div>
            )),
          ])}
        </dl>
      )}
    </>
  );
}

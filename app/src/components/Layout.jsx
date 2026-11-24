import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { useRouter, href } from "../lib/router.jsx";
import { overall, pct, streak, plural, toast } from "../lib/app.js";
import { Icon, Ring, useProgress, spring } from "./ui.jsx";

export const NAV = [
  { group: "Учить", items: [["/", "3D-модель", "cube"], ["/notes", "Конспект", "book"], ["/lectures", "Лекции", "file"], ["/schemes", "Схемы", "fork"], ["/physiology", "Физиология", "wind"], ["/glossary", "Словарь", "dict"]] },
  { group: "Проверить себя", items: [["/cards", "Карточки", "cards"], ["/drills", "Тренажёры", "target"], ["/quiz", "Тест", "list"], ["/tickets", "Билеты", "ticket"]] },
];
const TABS = [["/", "Модель", "cube"], ["/notes", "Конспект", "book"], ["/cards", "Карточки", "cards"], ["/quiz", "Тест", "list"]];

const isIOS = typeof navigator !== "undefined" && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const standalone = typeof document !== "undefined" && document.documentElement.classList.contains("standalone");

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path d="M11.5 12.5c-4 0-7 5-7 10 0 3 2 4.5 4 4.5 3 0 5-2.5 5-6.5v-6z" fill="var(--coral)" />
        <path d="M20.5 12.5c4 0 7 5 7 10 0 3-2 4.5-4 4.5-3 0-5-2.5-5-6.5v-6z" fill="var(--coral)" opacity=".7" />
        <path d="M16 3v11M16 14l-5 4M16 14l5 4" stroke="var(--accent)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Brand({ sub }) {
  return (
    <a className="brand" href={href("/")}>
      <BrandMark />
      <span className="brand-txt"><b>Дыхательная система</b><span>{sub}</span></span>
    </a>
  );
}

function Rail({ open, onSearch, onSettings }) {
  const { path } = useRouter();
  useProgress();
  const o = overall();
  const s = streak();
  return (
    <aside className={`rail${open ? " open" : ""}`} aria-label="Разделы">
      <Brand sub="Анатомия и физиология, темы 4.1–4.2" />
      <button className="rail-search" type="button" onClick={onSearch}>
        <Icon name="search" /><span>Поиск</span><kbd className="kbd">Ctrl K</kbd>
      </button>
      <nav>
        <LayoutGroup id="rail">
          {NAV.map((g) => (
            <div className="nav-group" key={g.group}>
              <div className="nav-label">{g.group}</div>
              {g.items.map(([to, name, ic]) => {
                const cur = path === to;
                return (
                  <a key={to} className="nav-link" href={href(to)} aria-current={cur ? "page" : undefined}>
                    {cur && <motion.span layoutId="nav-pill" className="nav-pill" transition={spring} />}
                    <Icon name={ic} /><span>{name}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </LayoutGroup>
      </nav>
      <div className="rail-foot">
        <a className="rail-progress" href={href("/progress")} aria-current={path === "/progress" ? "page" : undefined}>
          <Ring value={o} label={pct(o)} size={46} />
          <span className="rp-txt">
            <b>Общий прогресс</b>
            <span className="rp-streak"><Icon name="flame" />{s ? `${s} ${plural(s, "день", "дня", "дней")} подряд` : "Начните серию сегодня"}</span>
          </span>
        </a>
        <button className="theme-btn" type="button" onClick={onSettings}><Icon name="sliders" /><span>Настройки</span></button>
      </div>
    </aside>
  );
}

function TabBar({ drawerOpen, onMore }) {
  const { path } = useRouter();
  const main = TABS.map((t) => t[0]);
  const moreActive = drawerOpen || !main.includes(path);
  return (
    <nav className="tabbar" aria-label="Основные разделы">
      <LayoutGroup id="tabs">
        {TABS.map(([to, name, ic]) => {
          const cur = path === to && !drawerOpen;
          return (
            <a key={to} className="tab" href={href(to)} aria-current={cur ? "page" : undefined}>
              {cur && <motion.span layoutId="tab-lens" className="tab-lens-r" transition={spring} />}
              <Icon name={ic} /><span>{name}</span>
            </a>
          );
        })}
        <button className="tab" type="button" onClick={onMore} aria-current={moreActive ? "page" : undefined} aria-expanded={drawerOpen}>
          {moreActive && <motion.span layoutId="tab-lens" className="tab-lens-r" transition={spring} />}
          <Icon name="grid" /><span>Ещё</span>
        </button>
      </LayoutGroup>
    </nav>
  );
}

/* ---------- настройки ---------- */
function applyTheme(v) {
  const d = document.documentElement;
  try {
    if (v === "auto") { delete d.dataset.theme; localStorage.removeItem("resp-theme"); }
    else { d.dataset.theme = v; localStorage.setItem("resp-theme", v); }
  } catch (e) {}
  const bg = getComputedStyle(d).getPropertyValue("--bg").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.setAttribute("content", bg); m.removeAttribute("media"); });
  window.dispatchEvent(new CustomEvent("themechange"));
}
function setFlag(key, attr, on, val = "on") {
  const d = document.documentElement;
  if (on) d.dataset[attr] = val; else delete d.dataset[attr];
  try { on ? localStorage.setItem(key, val) : localStorage.removeItem(key); } catch (e) {}
}

let installEvt = null;
if (typeof window !== "undefined") window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; });

function SettingsSheet({ open, onClose }) {
  const d = document.documentElement;
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);
  const [offline, setOffline] = useState("Проверяю…");
  useEffect(() => {
    if (!open) return;
    if (!("serviceWorker" in navigator) || location.protocol === "file:") { setOffline("Работает, когда сайт открыт по ссылке"); return; }
    navigator.serviceWorker.getRegistration().then((r) => setOffline(r && r.active ? "Готово: после первого открытия сайт работает и без сети" : "Сохраняю файлы для работы без сети…"));
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const theme = d.dataset.theme || "auto";
  const glass = d.dataset.glass === "on";
  const motionReduce = d.dataset.motion === "reduce";
  const nativeSwitch = typeof HTMLInputElement !== "undefined" && "switch" in HTMLInputElement.prototype;
  const switchProps = nativeSwitch ? { switch: "" } : {};
  return (
    <>
      <div className={`sheet-scrim${open ? " open" : ""}`} onClick={onClose} />
      <div className={`sheet${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="sheet-title" aria-hidden={!open}>
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head"><h3 id="sheet-title">Настройки</h3><button className="icon-btn sheet-x" type="button" aria-label="Закрыть" onClick={onClose}><Icon name="x" /></button></div>
        <div className="set-group">
          <div className="set-row"><div className="set-txt"><b>Тема</b></div>
            <div className="seg" role="group" aria-label="Тема">
              {[["auto", "Авто"], ["light", "Светлая"], ["dark", "Тёмная"]].map(([v, n]) => (
                <button key={v} type="button" aria-pressed={theme === v} onClick={() => { applyTheme(v); rerender(); }}>{n}</button>
              ))}
            </div></div>
          <label className="set-row" htmlFor="set-glass"><div className="set-txt"><b>Жидкое стекло</b><small>Полупрозрачные панели и кнопки с размытием и бликами, как в iOS 26</small></div>
            <input id="set-glass" className={`switch${nativeSwitch ? " native" : ""}`} type="checkbox" {...switchProps} checked={glass}
              onChange={(e) => { setFlag("resp-glass", "glass", e.target.checked); toast(e.target.checked ? "Жидкое стекло включено" : "Жидкое стекло выключено"); rerender(); }} /></label>
          <div className="set-row"><div className="set-txt"><b>Анимации</b><small>«Меньше» убирает движение, конфетти и автоповорот модели</small></div>
            <div className="seg" role="group" aria-label="Анимации">
              <button type="button" aria-pressed={!motionReduce} onClick={() => { setFlag("resp-motion", "motion", false); rerender(); }}>Как в системе</button>
              <button type="button" aria-pressed={motionReduce} onClick={() => { setFlag("resp-motion", "motion", true, "reduce"); toast("Анимаций будет меньше"); rerender(); }}>Меньше</button>
            </div></div>
        </div>
        <div className="set-group">
          <div className="set-row"><div className="set-txt"><b>{isIOS ? "Установить на iPhone" : "Установить как приложение"}</b>
            <small>{isIOS ? "Откройте сайт в Safari, нажмите «Поделиться» и выберите «На экран „Домой“». Сайт откроется как приложение, без адресной строки." : "В Chrome или Edge нажмите «Установить» в адресной строке или кнопку справа. На iPhone: Safari → «Поделиться» → «На экран „Домой“»."}</small></div>
            {standalone ? <span className="tag accent">Установлено</span> : installEvt ? <button className="btn sm" type="button" onClick={() => { installEvt.prompt(); installEvt = null; rerender(); }}>Установить</button> : null}</div>
          <div className="set-row"><div className="set-txt"><b>Без интернета</b><small>{offline}</small></div></div>
        </div>
        <div className="set-group"><a className="set-row link" href={href("/progress")} onClick={onClose}><div className="set-txt"><b>Прогресс и сброс</b><small>Что выучено и что повторить</small></div><Icon name="right" /></a></div>
      </div>
    </>
  );
}

function IosHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = !!localStorage.getItem("resp-ios-hint"); } catch (e) {}
    if (!isIOS || standalone || dismissed) return;
    const t = setTimeout(() => setShow(true), 1600);
    return () => clearTimeout(t);
  }, []);
  const close = () => { setShow(false); try { localStorage.setItem("resp-ios-hint", "1"); } catch (e) {} };
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="ios-hint show" role="note" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={spring}>
          <img className="ios-hint-ico" src={href("/icons/apple-touch-icon.png")} alt="" width="40" height="40" />
          <span className="ios-hint-txt"><b>Установите как приложение</b><span>Safari → «Поделиться» → «На экран „Домой“». Будет работать без интернета</span></span>
          <button type="button" className="icon-btn" aria-label="Скрыть подсказку" onClick={close}><Icon name="x" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Layout({ children, onSearch }) {
  const { path } = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [settings, setSettings] = useState(false);
  useEffect(() => { setDrawer(false); }, [path]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const openSettings = () => { setDrawer(false); setSettings(true); };
  return (
    <div className="shell">
      <header className="topbar">
        <Brand sub="темы 4.1–4.2" />
        <button className="icon-btn" type="button" aria-label="Поиск" onClick={onSearch}><Icon name="search" /></button>
        <button className="icon-btn" type="button" aria-label="Настройки" onClick={openSettings}><Icon name="sliders" /></button>
      </header>
      <div className={`scrim${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} />
      <Rail open={drawer} onSearch={() => { setDrawer(false); onSearch(); }} onSettings={openSettings} />
      <main className="main" id="main">
        <div className="wrap">
          {children}
          <footer className="footer">
            <span>По конспектам тем 4.1 и 4.2. Учебники: Гайворонский, Сапин, Швырёв «Анатомия и физиология человека».</span>
            <span>Прогресс хранится только в этом браузере</span>
          </footer>
        </div>
      </main>
      <TabBar drawerOpen={drawer} onMore={() => setDrawer((v) => !v)} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <IosHint />
    </div>
  );
}

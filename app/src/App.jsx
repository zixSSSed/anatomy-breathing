import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { RouterProvider, useRouter } from "./lib/router.jsx";
import { Layout } from "./components/Layout.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { Toaster, ease } from "./components/ui.jsx";
import { installLightbox } from "./legacy/fx.js";
import { reduceMotion, setTotals, save } from "./lib/app.js";

const PAGES = {
  "/": [lazy(() => import("./pages/Home.jsx")), "Дыхательная система"],
  "/notes": [lazy(() => import("./pages/Content.jsx").then((m) => ({ default: m.Notes }))), "Конспект"],
  "/lectures": [lazy(() => import("./pages/Content.jsx").then((m) => ({ default: m.Lectures }))), "Лекции"],
  "/schemes": [lazy(() => import("./pages/Content.jsx").then((m) => ({ default: m.Schemes }))), "Схемы"],
  "/physiology": [lazy(() => import("./pages/Content.jsx").then((m) => ({ default: m.Physiology }))), "Физиология"],
  "/glossary": [lazy(() => import("./pages/Glossary.jsx")), "Словарь"],
  "/cards": [lazy(() => import("./pages/Cards.jsx")), "Карточки"],
  "/drills": [lazy(() => import("./pages/Drills.jsx")), "Тренажёры"],
  "/quiz": [lazy(() => import("./pages/Quiz.jsx")), "Тест"],
  "/tickets": [lazy(() => import("./pages/Tickets.jsx")), "Билеты"],
  "/progress": [lazy(() => import("./pages/Progress.jsx")), "Прогресс"],
};

function NotFound() {
  return (
    <div className="page-head">
      <h1>Такой страницы нет</h1>
      <p className="lead">Возможно, ссылка устарела. Начните с главной или найдите нужное через поиск.</p>
      <div className="row"><a className="btn primary" href={import.meta.env.BASE_URL}>На главную</a></div>
    </div>
  );
}

function Loading() {
  return <div className="page-loading" aria-label="Загрузка"><span /><span /><span /></div>;
}

/** Каждая страница: прокрутка наверх при переходе (если нет якоря) */
function Frame({ children }) {
  useLayoutEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);
  return children;
}

function Routes() {
  const { path } = useRouter();
  const [Page, title] = PAGES[path] || [NotFound, "Нет страницы"];
  useEffect(() => {
    document.title = path === "/" ? title : `${title} · Дыхательная система`;
  }, [path, title]);
  const still = reduceMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={path}
        initial={still ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(4px)" }}
        animate={still ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={still ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(3px)" }}
        transition={{ duration: still ? 0.01 : 0.28, ease }}>
        <Suspense fallback={<Loading />}>
          <Frame><Page /></Frame>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  const [palette, setPalette] = useState(false);
  const openPalette = useCallback(() => setPalette(true), []);
  const closePalette = useCallback(() => setPalette(false), []);
  useEffect(() => {
    installLightbox();
    // сколько карточек и вопросов в каждой теме — для процентов прогресса
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 800));
    idle(() => Promise.all([import("./generated/study.js"), import("./generated/quiz.js")]).then(([s, q]) => { setTotals(s.CARDS, q.QUIZ); save(); }));
    const onKey = (e) => {
      const typing = e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K" || e.key === "л" || e.key === "Л")) { e.preventDefault(); setPalette((v) => !v); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setPalette(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <MotionConfig reducedMotion={reduceMotion() ? "always" : "user"}>
      <RouterProvider>
        <Layout onSearch={openPalette}>
          <Routes />
        </Layout>
        <CommandPalette open={palette} onClose={closePalette} />
        <Toaster />
      </RouterProvider>
    </MotionConfig>
  );
}

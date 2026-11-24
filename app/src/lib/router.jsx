/* Маленький маршрутизатор на History API: адреса как у обычного сайта (…/notes#s-41-nose),
   переходы без перезагрузки. Ссылки в HTML-контенте перехватываются глобально. */
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const BASE = import.meta.env.BASE_URL || "/";

export function currentPath() {
  let p = window.location.pathname;
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  else if (p + "/" === BASE) p = "";
  p = p.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "");
  if (p === "index") p = "";
  return "/" + p;
}

export function scrollToHash(hash = window.location.hash, smooth = false) {
  if (!hash || hash.length < 2) return false;
  let el = null;
  try { el = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { /* неверный якорь */ }
  if (!el) return false;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  return true;
}

const Ctx = createContext({ path: "/", navigate: () => {} });
export const useRouter = () => useContext(Ctx);

export function RouterProvider({ children }) {
  const [path, setPath] = useState(currentPath);

  const navigate = useCallback((to, opts = {}) => {
    const url = new URL(to, window.location.href);
    if (url.origin !== window.location.origin) { window.location.href = url.href; return; }
    const samePage = url.pathname === window.location.pathname;
    const next = url.pathname + url.search + url.hash;
    if (opts.replace) window.history.replaceState({}, "", next);
    else window.history.pushState({}, "", next);
    if (samePage) { if (!scrollToHash(url.hash, true)) window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setPath(currentPath());
  }, []);

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ссылки внутри приложения (в том числе в HTML конспекта и схем) — без перезагрузки
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.classList.contains("zoom")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      const url = new URL(a.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE)) return;
      if (/\.(docx|png|jpe?g|svg|pdf|webmanifest|js)$/i.test(url.pathname)) return;
      e.preventDefault();
      navigate(url.href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  return <Ctx.Provider value={{ path, navigate }}>{children}</Ctx.Provider>;
}

/** Ссылка внутри приложения: to="/notes#s-41-nose" */
export function Link({ to, children, ...rest }) {
  const href = BASE + to.replace(/^\//, "");
  return <a href={href} {...rest}>{children}</a>;
}
export const href = (to) => BASE + to.replace(/^\//, "");

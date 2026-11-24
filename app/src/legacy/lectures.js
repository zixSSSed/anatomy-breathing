export function initLectures(root) {
  let io = null;
  const toc = root.querySelector("[data-toc]");
  const nav = root.querySelector("[data-toc-nav]");
  const btn = root.querySelector("[data-toc-toggle]");
  btn.addEventListener("click", () => {
    const open = !toc.classList.contains("open");
    toc.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a") && window.innerWidth < 1024) toc.classList.remove("open"); });
  const targets = [...nav.querySelectorAll("a[data-for]")].map((a) => root.querySelector(`#${a.dataset.for}`)).filter(Boolean);
  if ("IntersectionObserver" in window && targets.length) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        nav.querySelectorAll("a[data-for]").forEach((a) => a.classList.toggle("active", a.dataset.for === en.target.id));
      });
    }, { rootMargin: "-15% 0px -75% 0px" });
    targets.forEach((t) => io.observe(t));
  }
  return () => { if (io) io.disconnect(); };
}

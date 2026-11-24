(function () {
  const A = window.App;
  const body = document.querySelector("[data-notes]");
  const nav = document.querySelector("[data-toc-nav]");
  const sections = [...body.querySelectorAll(".note-section")];
  const original = new Map(sections.map((s) => [s, s.innerHTML]));

  function buildToc() {
    let html = "";
    let theme = null;
    sections.forEach((s) => {
      const t = s.dataset.topic;
      const th = t ? t.slice(0, 2) === "41" ? "Тема 4.1" : "Тема 4.2" : "";
      if (th && th !== theme) { html += `<h4>${th}</h4>`; theme = th; }
      if (!t) { html += `<a href="#${s.id}" data-for="${s.id}">${s.dataset.short}</a>`; return; }
      const read = A.isNote(t) ? " is-read" : "";
      html += `<a href="#${s.id}" data-for="${s.id}" class="${read}"><span>${s.dataset.short}</span><span class="read" aria-hidden="true"></span></a>`;
    });
    nav.innerHTML = html;
  }

  function paintRead(s) {
    const t = s.dataset.topic;
    if (!t) return;
    const btn = s.querySelector("[data-read]");
    const on = A.isNote(t);
    if (btn) {
      btn.classList.toggle("good", on);
      btn.innerHTML = on ? `${A.icon("check")}Прочитано` : "Отметить прочитанным";
      btn.setAttribute("aria-pressed", on);
    }
    const link = nav.querySelector(`[data-for="${s.id}"]`);
    if (link) link.classList.toggle("is-read", on);
  }

  body.addEventListener("click", (e) => {
    const b = e.target.closest("[data-read]");
    if (!b) return;
    const s = b.closest(".note-section");
    const t = s.dataset.topic;
    const on = !A.isNote(t);
    A.setNote(t, on);
    paintRead(s);
    if (on) A.toast("Раздел отмечен прочитанным");
  });

  /* ---------- search ---------- */
  const input = document.getElementById("notes-search");
  const info = document.querySelector("[data-search-info]");
  const dividers = [...body.querySelectorAll(".theme-divider")];
  function highlight(root, q) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest("button") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let count = 0;
    nodes.forEach((n) => {
      const low = n.nodeValue.toLowerCase().replace(/ё/g, "е");
      let idx = low.indexOf(q);
      if (idx < 0) return;
      const frag = document.createDocumentFragment();
      let last = 0;
      while (idx >= 0) {
        frag.append(n.nodeValue.slice(last, idx));
        const m = document.createElement("mark");
        m.textContent = n.nodeValue.slice(idx, idx + q.length);
        frag.append(m);
        count++;
        last = idx + q.length;
        idx = low.indexOf(q, last);
      }
      frag.append(n.nodeValue.slice(last));
      n.replaceWith(frag);
    });
    return count;
  }
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 120);
  });
  function runSearch() {
    const q = input.value.trim().toLowerCase().replace(/ё/g, "е");
    let total = 0, found = 0;
    sections.forEach((s) => {
      s.innerHTML = original.get(s);
      paintRead(s);
      if (q.length < 2) { s.hidden = false; return; }
      const n = highlight(s, q);
      s.hidden = n === 0;
      total += n;
      if (n) found++;
    });
    dividers.forEach((d) => (d.hidden = q.length >= 2));
    nav.querySelectorAll("a").forEach((a) => {
      const s = document.getElementById(a.dataset.for);
      a.hidden = s ? s.hidden : false;
    });
    if (q.length < 2) { info.hidden = true; return; }
    info.hidden = false;
    info.textContent = total
      ? `Найдено ${total} ${A.plural(total, "совпадение", "совпадения", "совпадений")} в ${found} ${A.plural(found, "разделе", "разделах", "разделах")}`
      : "Ничего не найдено. Попробуйте другое слово или часть слова";
    if (total) { const first = body.querySelector("mark"); first && first.scrollIntoView({ block: "center" }); }
  }

  /* ---------- toc toggle + scrollspy ---------- */
  const toc = document.querySelector("[data-toc]");
  document.querySelector("[data-toc-toggle]").addEventListener("click", (e) => {
    const open = !toc.classList.contains("open");
    toc.classList.toggle("open", open);
    e.currentTarget.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a") && window.innerWidth < 1024) toc.classList.remove("open"); });

  buildToc();
  sections.forEach(paintRead);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.for === en.target.id));
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach((s) => io.observe(s));
  }
  // поиск из адресной строки: notes.html?q=сурфактант
  const q = new URLSearchParams(location.search).get("q");
  if (q) { input.value = q; runSearch(); }
})();

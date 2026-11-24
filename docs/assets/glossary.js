(function () {
  const A = window.App;
  const G = (window.GLOSSARY || []).slice().sort((a, b) => a.term.localeCompare(b.term, "ru"));
  const $ = (s) => document.querySelector(s);
  const input = $("#gl-search"), sel = $("#gl-topic"), out = $("[data-gloss]"), alpha = $("[data-alpha]");
  sel.innerHTML = `<option value="all">Все темы</option>` + A.TOPICS.map((t) => `<option value="${t.id}">${t.th}: ${t.n}</option>`).join("");
  const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е");
  function render() {
    const q = norm(input.value.trim());
    const tp = sel.value;
    const list = G.filter((g) => (tp === "all" || g.t === tp) && (!q || norm(g.term + " " + g.def + " " + (g.lat || "")).includes(q)));
    if (!list.length) { out.innerHTML = `<div class="empty" style="grid-column:1 / -1">Ничего не нашлось. Попробуйте часть слова или другую тему.</div>`; alpha.innerHTML = ""; return; }
    let html = "", letter = "";
    const letters = [];
    list.forEach((g) => {
      const L = g.term[0].toUpperCase();
      if (L !== letter) { letter = L; letters.push(L); html += `<div class="gl-letter" id="l-${L}">${L}</div>`; }
      html += `<div class="gl-item"><dt>${A.esc(g.term)}${g.lat ? `<span class="lat">${A.esc(g.lat)}</span>` : ""}</dt><dd>${A.esc(g.def)} <a class="small" href="${A.notesLink(g.t)}">${A.esc(A.topicName(g.t))}</a></dd></div>`;
    });
    out.innerHTML = html;
    alpha.innerHTML = letters.map((L) => `<a href="#l-${L}">${L}</a>`).join("");
  }
  input.addEventListener("input", render);
  sel.addEventListener("change", render);
  render();
})();

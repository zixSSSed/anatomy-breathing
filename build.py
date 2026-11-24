"""Собирает многостраничный сайт: src/pages/*.html + общий шаблон -> docs/*.html.

Запуск: python build.py
"""
import hashlib, html, json, re, shutil, pathlib
import docx2html
import atlas

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
LECTURES = ["4.1", "4.2"]  # src/lectures/lecture-<n>.docx

ICONS = {
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "sliders": '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    "grid": '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    "download": '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    "cube": '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    "book": '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    "fork": '<circle cx="12" cy="19" r="2.5"/><circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M6 7.5V9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7.5"/><path d="M12 12v4.5"/>',
    "wind": '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
    "dict": '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/>',
    "cards": '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    "list": '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    "ticket": '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    "chart": '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "arrow": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
}

def icon(name, cls="icon"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'

NAV = [
    ("Учить", [
        ("index", "3D-модель", "cube"),
        ("notes", "Конспект", "book"),
        ("lectures", "Лекции", "file"),
        ("schemes", "Схемы", "fork"),
        ("physiology", "Физиология", "wind"),
        ("glossary", "Словарь", "dict"),
    ]),
    ("Проверить себя", [
        ("cards", "Карточки", "cards"),
        ("drills", "Тренажёры", "target"),
        ("quiz", "Тест", "list"),
        ("tickets", "Билеты", "ticket"),
    ]),
]

PAGES = {
    "index": dict(title="Дыхательная система", desc="3D-модель дыхательных путей и лёгких, конспект, схемы, тесты и тренажёры по темам 4.1–4.2", scripts=["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "assets/model3d.js"]),
    "notes": dict(title="Конспект · Дыхательная система", desc="Полный конспект тем 4.1 и 4.2: дыхательные пути, лёгкие, плевра, физиология дыхания", scripts=["assets/notes.js"]),
    "lectures": dict(title="Лекции · Дыхательная система", desc="Оригинальные конспекты лекций 4.1 и 4.2 полностью: читать на сайте или скачать файлы Word", scripts=["assets/lectures.js"]),
    "schemes": dict(title="Схемы · Дыхательная система", desc="Интерактивные схемы: носовые ходы, гортань, бронхиальное дерево, границы лёгких и плевры", scripts=["assets/schemes.js"]),
    "physiology": dict(title="Физиология · Дыхательная система", desc="Дыхательный цикл, спирограмма, газообмен, транспорт газов и регуляция дыхания", scripts=["assets/physiology.js"]),
    "glossary": dict(title="Словарь · Дыхательная система", desc="Термины с латинскими названиями и определениями", scripts=["assets/data-study.js", "assets/glossary.js"]),
    "cards": dict(title="Карточки · Дыхательная система", desc="Карточки с интервальным повторением по темам 4.1–4.2", scripts=["assets/data-study.js", "assets/cards.js"]),
    "drills": dict(title="Тренажёры · Дыхательная система", desc="Сопоставление, числа, порядок и сортировка", scripts=["assets/data-study.js", "assets/drills.js"]),
    "quiz": dict(title="Тест · Дыхательная система", desc="Тест из 140 вопросов с пояснениями и работой над ошибками", scripts=["assets/data-quiz.js", "assets/quiz.js"]),
    "tickets": dict(title="Билеты · Дыхательная система", desc="Случайные билеты с таймером и планом ответа", scripts=["assets/data-study.js", "assets/tickets.js"]),
    "progress": dict(title="Прогресс · Дыхательная система", desc="Что выучено и что стоит повторить", scripts=["assets/data-quiz.js", "assets/data-study.js", "assets/progress.js"]),
}

FAVICON = ("data:image/svg+xml,"
           "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
           "%3Cpath d='M11.5 12.5c-4 0-7 5-7 10 0 3 2 4.5 4 4.5 3 0 5-2.5 5-6.5v-6z' fill='%23E04E3B'/%3E"
           "%3Cpath d='M20.5 12.5c4 0 7 5 7 10 0 3-2 4.5-4 4.5-3 0-5-2.5-5-6.5v-6z' fill='%23F08A6E'/%3E"
           "%3Cpath d='M16 3v11M16 14l-5 4M16 14l5 4' stroke='%234350D6' stroke-width='2.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")

BRAND_MARK = ('<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32">'
              '<path d="M11.5 12.5c-4 0-7 5-7 10 0 3 2 4.5 4 4.5 3 0 5-2.5 5-6.5v-6z" fill="var(--coral)"/>'
              '<path d="M20.5 12.5c4 0 7 5 7 10 0 3-2 4.5-4 4.5-3 0-5-2.5-5-6.5v-6z" fill="var(--coral)" opacity=".7"/>'
              '<path d="M16 3v11M16 14l-5 4M16 14l5 4" stroke="var(--accent)" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg></span>')

SVG_DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
            '<linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--vein)"/><stop offset="1" stop-color="var(--artery)"/></linearGradient>'
            '<linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--vein)"/><stop offset=".55" stop-color="#9B53C9"/><stop offset="1" stop-color="var(--artery)"/></linearGradient>'
            '</defs></svg>')

TABS = [("index", "Модель", "cube"), ("notes", "Конспект", "book"), ("cards", "Карточки", "cards"), ("quiz", "Тест", "list")]

def tabbar_html(active):
    out = []
    main = [t[0] for t in TABS]
    for slug, name, ic in TABS:
        cur = ' aria-current="page"' if slug == active else ""
        href = "index.html" if slug == "index" else f"{slug}.html"
        out.append(f'  <a class="tab" href="{href}" data-tab="{slug}"{cur}>{icon(ic)}<span>{name}</span></a>')
    more = ' aria-current="page"' if active not in main else ""
    out.append(f'  <button class="tab" type="button" data-menu data-tab="more"{more}>{icon("grid")}<span>Ещё</span></button>')
    return "\n".join(out)

def nav_html(active):
    out = []
    for label, items in NAV:
        out.append(f'<div class="nav-group"><div class="nav-label">{label}</div>')
        for slug, name, ic in items:
            cur = ' aria-current="page"' if slug == active else ""
            href = "index.html" if slug == "index" else f"{slug}.html"
            out.append(f'<a class="nav-link" href="{href}"{cur}>{icon(ic)}<span>{name}</span><span class="count" data-nav-count="{slug}"></span></a>')
        out.append("</div>")
    return "\n".join(out)

LAYOUT = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{favicon}">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Дыхание">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="#F3F4FB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0B0D18" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Golos+Text:wght@400;500;600;700&family=Literata:ital,opsz,wght@1,7..72,400..500&display=swap">
<link rel="stylesheet" href="assets/style.css">
<script>(function(){{var d=document.documentElement;d.classList.add('js');try{{var t=localStorage.getItem('resp-theme');if(t)d.dataset.theme=t;if(localStorage.getItem('resp-glass')==='on')d.dataset.glass='on';if(localStorage.getItem('resp-motion')==='reduce')d.dataset.motion='reduce'}}catch(e){{}}if(navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches))d.classList.add('standalone')}})()</script>
</head>
<body data-page="{slug}">
{svg_defs}
<div class="shell">
<header class="topbar">
  <a class="brand" href="index.html">{brand_mark}<span class="brand-txt"><b>Дыхательная система</b><span>темы 4.1–4.2</span></span></a>
  <button class="icon-btn" type="button" aria-label="Настройки" data-settings>{icon_sliders}</button>
</header>
<div class="scrim" data-scrim></div>
<aside class="rail" aria-label="Разделы">
  <a class="brand" href="index.html">{brand_mark}<span class="brand-txt"><b>Дыхательная система</b><span>Анатомия и физиология, темы 4.1–4.2</span></span></a>
  <nav>
{nav}
  </nav>
  <div class="rail-foot">
    <a class="rail-progress" href="progress.html"{progress_cur}>
      <div class="row"><span>Общий прогресс</span><strong class="tnum" data-overall>0%</strong></div>
      <div class="bar"><i data-overall-bar></i></div>
    </a>
    <button class="theme-btn" type="button" data-settings>{icon_sliders}<span>Настройки</span></button>
  </div>
</aside>
<main class="main" id="main">
<div class="wrap">
{content}
<footer class="footer">
  <span>По конспектам тем 4.1 и 4.2. Учебники: Гайворонский, Сапин, Швырёв «Анатомия и физиология человека».</span>
  <span>Прогресс хранится только в этом браузере</span>
</footer>
</div>
</main>
</div>
<nav class="tabbar" aria-label="Основные разделы">
  <span class="tab-lens" aria-hidden="true"></span>
{tabbar}
</nav>
<div class="toast" role="status" aria-live="polite" data-toast></div>
<script src="assets/core.js"></script>
<script src="assets/illus.js"></script>
<script src="assets/fx.js"></script>
{scripts}
</body>
</html>
"""

def render_icons(html):
    return re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), html)

def lecture_parts():
    """Полный текст лекций из .docx для страницы «Лекции» и копии файлов для скачивания."""
    (OUT / "files").mkdir(parents=True, exist_ok=True)
    parts = {}
    for n in LECTURES:
        src = SRC / "lectures" / f"lecture-{n}.docx"
        if not src.exists():
            continue
        shutil.copy(src, OUT / "files" / src.name)
        prefix = "l" + n.replace(".", "")
        body, toc = docx2html.convert(src, prefix)
        kb = src.stat().st_size / 1024
        parts[f"lecture-body:{n}"] = body
        parts[f"lecture-toc:{n}"] = "\n".join(f'<a href="#{sid}" data-for="{sid}">{html.escape(label)}</a>' for sid, label in toc)
        parts[f"lecture-size:{n}"] = f"{kb:.0f} КБ"
    return parts

def build():
    (OUT / "assets").mkdir(parents=True, exist_ok=True)
    for name in ("data-quiz.js", "data-study.js"):
        if (SRC / name).exists():
            shutil.copy(SRC / name, OUT / "assets" / name)
    lec = lecture_parts()
    for slug, meta in PAGES.items():
        src = SRC / "pages" / f"{slug}.html"
        if not src.exists():
            print("skip (no source):", slug)
            continue
        content = render_icons(src.read_text(encoding="utf-8"))
        content = re.sub(r"\{\{(lecture-[a-z]+:[\d.]+)\}\}", lambda m: lec.get(m.group(1), ""), content)
        content = content.replace("{{atlas-gallery}}", atlas.gallery())
        content = re.sub(r"\{\{atlas:([a-z-]+)\}\}", lambda m: atlas.figure(m.group(1)), content)
        scripts = "\n".join(f'<script src="{s}"></script>' for s in meta["scripts"])
        html = LAYOUT.format(
            title=meta["title"], desc=meta["desc"], favicon=FAVICON, slug=slug,
            nav=nav_html(slug), content=content, scripts=scripts,
            icon_menu=icon("menu"), icon_sun=icon("sun"), icon_moon=icon("moon"), brand_mark=BRAND_MARK, svg_defs=SVG_DEFS, icon_sliders=icon("sliders"), tabbar=tabbar_html(slug),
            progress_cur=' aria-current="page"' if slug == "progress" else "",
        )
        (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
        print("built", slug)
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    write_pwa()

MANIFEST = {
    "name": "Дыхательная система",
    "short_name": "Дыхание",
    "description": "Анатомия и физиология дыхательной системы: 3D-модель, конспект, тесты, карточки",
    "lang": "ru",
    "start_url": "./index.html",
    "scope": "./",
    "display": "standalone",
    "orientation": "any",
    "background_color": "#0B0D18",
    "theme_color": "#0B0D18",
    "icons": [
        {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
        {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ],
}

def write_pwa():
    """manifest.webmanifest и sw.js: список файлов для работы без интернета и версия кэша по их содержимому."""
    (OUT / "manifest.webmanifest").write_text(json.dumps(MANIFEST, ensure_ascii=False, indent=1), encoding="utf-8")
    files = sorted(f.relative_to(OUT).as_posix() for f in OUT.rglob("*")
                   if f.is_file() and f.name not in ("sw.js", ".nojekyll") and f.suffix != ".docx")
    h = hashlib.sha1()
    for rel in files:
        h.update(rel.encode()); h.update((OUT / rel).read_bytes())
    external = [atlas.IMAGES[k]["thumb"] for k in atlas.IMAGES] + ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"]
    sw = (ROOT / "sw.template.js").read_text(encoding="utf-8")
    sw = sw.replace("__VERSION__", h.hexdigest()[:12]).replace("__CORE__", json.dumps(["./"] + files, ensure_ascii=False)).replace("__EXTERNAL__", json.dumps(external))
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    print("pwa: version", h.hexdigest()[:12], "files", len(files))

if __name__ == "__main__":
    build()

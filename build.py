"""Собирает многостраничный сайт: src/pages/*.html + общий шаблон -> docs/*.html.

Запуск: python build.py
"""
import re, shutil, pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "docs"

ICONS = {
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
           "%3Cpath d='M16 3v11M16 14l-7 6M16 14l7 6' stroke='%231D63A6' stroke-width='3' fill='none' stroke-linecap='round'/%3E"
           "%3Cpath d='M9 20c-4 0-6 3-6 6s2 3 4 3 5-2 5-6M23 20c4 0 6 3 6 6s-2 3-4 3-5-2-5-6' fill='%23D88A96'/%3E%3C/svg%3E")

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..600&display=swap">
<link rel="stylesheet" href="assets/style.css">
<script>try{{var t=localStorage.getItem('resp-theme');if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
</head>
<body data-page="{slug}">
<div class="shell">
<header class="topbar">
  <button class="icon-btn menu" type="button" aria-label="Открыть меню" data-menu>{icon_menu}</button>
  <a class="brand" href="index.html"><b>Дыхательная система</b><span>темы 4.1–4.2</span></a>
  <button class="icon-btn" type="button" aria-label="Сменить тему" data-theme-toggle>{icon_sun}</button>
</header>
<div class="scrim" data-scrim></div>
<aside class="rail" aria-label="Разделы">
  <a class="brand" href="index.html"><b>Дыхательная система</b><span>Анатомия и физиология, темы 4.1–4.2</span></a>
  <nav>
{nav}
  </nav>
  <div class="rail-foot">
    <a class="rail-progress" href="progress.html"{progress_cur}>
      <div class="row"><span>Общий прогресс</span><strong class="tnum" data-overall>0%</strong></div>
      <div class="bar"><i data-overall-bar></i></div>
    </a>
    <button class="theme-btn" type="button" data-theme-toggle>{icon_moon}<span data-theme-label>Тёмная тема</span></button>
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
<div class="toast" role="status" aria-live="polite" data-toast></div>
<script src="assets/core.js"></script>
{scripts}
</body>
</html>
"""

def render_icons(html):
    return re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), html)

def build():
    (OUT / "assets").mkdir(parents=True, exist_ok=True)
    for name in ("data-quiz.js", "data-study.js"):
        if (SRC / name).exists():
            shutil.copy(SRC / name, OUT / "assets" / name)
    for slug, meta in PAGES.items():
        src = SRC / "pages" / f"{slug}.html"
        if not src.exists():
            print("skip (no source):", slug)
            continue
        content = render_icons(src.read_text(encoding="utf-8"))
        scripts = "\n".join(f'<script src="{s}"></script>' for s in meta["scripts"])
        html = LAYOUT.format(
            title=meta["title"], desc=meta["desc"], favicon=FAVICON, slug=slug,
            nav=nav_html(slug), content=content, scripts=scripts,
            icon_menu=icon("menu"), icon_sun=icon("sun"), icon_moon=icon("moon"),
            progress_cur=' aria-current="page"' if slug == "progress" else "",
        )
        (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
        print("built", slug)
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

if __name__ == "__main__":
    build()

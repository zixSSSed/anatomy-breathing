"""Готовит содержимое для React-приложения (app/).

- src/pages/{notes,schemes,physiology,lectures}.html  -> app/src/generated/content.js (HTML-строки)
- src/data-quiz.js, src/data-study.js                   -> app/src/generated/quiz.js, study.js (ES-модули)
- src/lectures/*.docx                                   -> полный текст лекций + файлы для скачивания
- иконки, манифест                                      -> app/public/

Запуск: python build.py   (или npm run build в папке app — он вызывает этот скрипт сам)
"""
import html, json, re, shutil, pathlib
import docx2html
import atlas

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
APP = ROOT / "app"
GEN = APP / "src" / "generated"
PUB = APP / "public"
LECTURES = ["4.1", "4.2"]  # src/lectures/lecture-<n>.docx
CONTENT_PAGES = ["notes", "schemes", "physiology", "lectures"]

ICONS = {
    "download": '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "arrow": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
}

def icon(name, cls="icon"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'

def render_icons(text):
    return re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), text)

def spa_links(text):
    """Ссылки вида notes.html#x → notes#x, index.html → ./ (относительно корня приложения)."""
    text = re.sub(r'href="index\.html(#[^"]*)?"', lambda m: f'href="./{m.group(1) or ""}"', text)
    return re.sub(r'href="([a-z]+)\.html(#[^"]*)?"', lambda m: f'href="{m.group(1)}{m.group(2) or ""}"', text)

def lecture_parts():
    (PUB / "files").mkdir(parents=True, exist_ok=True)
    parts = {}
    for n in LECTURES:
        src = SRC / "lectures" / f"lecture-{n}.docx"
        if not src.exists():
            continue
        shutil.copy(src, PUB / "files" / src.name)
        prefix = "l" + n.replace(".", "")
        body, toc = docx2html.convert(src, prefix)
        kb = src.stat().st_size / 1024
        parts[f"lecture-body:{n}"] = body
        parts[f"lecture-toc:{n}"] = "\n".join(f'<a href="#{sid}" data-for="{sid}">{html.escape(label)}</a>' for sid, label in toc)
        parts[f"lecture-size:{n}"] = f"{kb:.0f} КБ"
    return parts

def to_esm(src_text, names):
    for n in names:
        src_text = src_text.replace(f"window.{n} =", f"export const {n} =")
    return "/* Сгенерировано build.py из src/ — правьте исходник */\n" + src_text

def build():
    GEN.mkdir(parents=True, exist_ok=True)
    lec = lecture_parts()
    content = {}
    for slug in CONTENT_PAGES:
        t = (SRC / "pages" / f"{slug}.html").read_text(encoding="utf-8")
        t = render_icons(t)
        t = re.sub(r"\{\{(lecture-[a-z]+:[\d.]+)\}\}", lambda m: lec.get(m.group(1), ""), t)
        t = t.replace("{{atlas-gallery}}", atlas.gallery())
        t = re.sub(r"\{\{atlas:([a-z-]+)\}\}", lambda m: atlas.figure(m.group(1)), t)
        t = spa_links(t)
        # Встроенные <script> на контентных страницах не нужны: поведение подключают React-компоненты
        t = re.sub(r"<script>.*?</script>", "", t, flags=re.S)
        content[slug] = t
    (GEN / "content.js").write_text(
        "/* Сгенерировано build.py из src/pages — правьте исходник */\nexport const CONTENT = " + json.dumps(content, ensure_ascii=False) + ";\n",
        encoding="utf-8")
    (GEN / "quiz.js").write_text(to_esm((SRC / "data-quiz.js").read_text(encoding="utf-8"), ["QUIZ"]), encoding="utf-8")
    (GEN / "study.js").write_text(to_esm((SRC / "data-study.js").read_text(encoding="utf-8"), ["CARDS", "GLOSSARY", "DRILLS", "TICKETS"]), encoding="utf-8")
    (GEN / "atlas.js").write_text(
        "/* Сгенерировано build.py из atlas.py */\nexport const ATLAS = " + json.dumps(atlas.IMAGES, ensure_ascii=False) + ";\n",
        encoding="utf-8")
    # иконки приложения и прочие статические файлы
    (PUB / "icons").mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "docs" / "icons").glob("*.png") if (ROOT / "docs" / "icons").exists() else []:
        if not (PUB / "icons" / f.name).exists():
            shutil.copy(f, PUB / "icons" / f.name)
    (PUB / ".nojekyll").write_text("", encoding="utf-8")
    print("content ->", GEN, {k: len(v) for k, v in content.items()})

if __name__ == "__main__":
    build()

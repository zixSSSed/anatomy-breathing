"""Переводит конспект лекции из .docx в HTML дословно: абзацы, жирный текст, списки, таблицы.

Без сторонних библиотек: читает word/document.xml и word/numbering.xml напрямую.
Числа из «умных тегов» Word (например «9-13 см») сохраняются.
Стрелки-рисунки из схем в Word перенести нельзя; в таблицах большие пробелы между
пунктами схемы заменяются на «→».
"""
import html
import re
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
SEC_RE = re.compile(r"^\d+(?:\.\d+)*\.\s|^\d+\.\d+\s")


def _on(el):
    """Свойство вроде <w:b/> включено, если нет w:val="0"/"false"."""
    if el is None:
        return False
    return el.get(W + "val") not in ("0", "false", "none")


def _numbering(z):
    try:
        root = ET.fromstring(z.read("word/numbering.xml"))
    except KeyError:
        return {}
    abstract = {}
    for a in root.findall(W + "abstractNum"):
        fmts = {}
        for lvl in a.findall(W + "lvl"):
            f = lvl.find(W + "numFmt")
            fmts[lvl.get(W + "ilvl")] = f.get(W + "val") if f is not None else "bullet"
        abstract[a.get(W + "abstractNumId")] = fmts
    out = {}
    for n in root.findall(W + "num"):
        ref = n.find(W + "abstractNumId")
        out[n.get(W + "numId")] = abstract.get(ref.get(W + "val"), {}) if ref is not None else {}
    return out


def _runs(p):
    """Список (текст, жирный) по всем прогонам абзаца, включая умные теги и ссылки."""
    out = []
    for r in p.iter(W + "r"):
        rpr = r.find(W + "rPr")
        bold = _on(rpr.find(W + "b")) if rpr is not None else False
        txt = ""
        for ch in r:
            if ch.tag == W + "t":
                txt += ch.text or ""
            elif ch.tag == W + "tab":
                txt += " "
            elif ch.tag in (W + "br", W + "cr"):
                txt += "\n"
            elif ch.tag == W + "noBreakHyphen":
                txt += "‑"
        if txt:
            out.append([txt, bold])
    merged = []
    for t, b in out:
        if merged and merged[-1][1] == b:
            merged[-1][0] += t
        else:
            merged.append([t, b])
    return merged


def _clean(s):
    s = s.replace(" ", " ")
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s


def _runs_html(runs):
    parts = []
    for t, b in runs:
        t = html.escape(_clean(t)).replace("\n", "<br>")
        parts.append(f"<strong>{t}</strong>" if b and t.strip() else t)
    return "".join(parts).strip()


def _plain(runs):
    return _clean("".join(t for t, _ in runs)).strip()


def _cell_text(tc):
    lines = []
    for p in tc.iter(W + "p"):
        t = "".join(t for t, _ in _runs(p)).replace(" ", " ")
        t = re.sub(r" {4,}", "  →  ", t).strip()
        t = re.sub(r"(\s*→\s*)+", " → ", t).strip()
        t = re.sub(r"^→\s*", "", t)  # стрелка в начале ячейки — остаток отступа, а не связь
        if t:
            lines.append(html.escape(re.sub(r"\s{2,}", " ", t)))
    return "<br>".join(lines)


def _table(tbl):
    rows = []
    for tr in tbl.findall(W + "tr"):
        cells = []
        for tc in tr.findall(W + "tc"):
            span = 1
            tcpr = tc.find(W + "tcPr")
            if tcpr is not None and tcpr.find(W + "gridSpan") is not None:
                span = int(tcpr.find(W + "gridSpan").get(W + "val", "1"))
            cells.append((_cell_text(tc), span))
        if any(c for c, _ in cells):
            rows.append(cells)
    if not rows:
        return ""
    out = ['<div class="tbl-wrap"><table class="tbl lec-tbl"><tbody>']
    for cells in rows:
        out.append("<tr>" + "".join(f'<td{f" colspan={s}" if s > 1 else ""}>{c}</td>' for c, s in cells) + "</tr>")
    out.append("</tbody></table></div>")
    return "".join(out)


def _toc_label(text):
    m = re.split(r"\s[–—-]\s|\s\(", text, maxsplit=1)
    label = m[0].strip()
    if len(label) > 60:
        cut = label[:60]
        dot = cut.rfind(". ", 5)
        label = cut[: dot + 1] if dot > 0 else cut.rsplit(" ", 1)[0] + "…"
    return label.rstrip(":")


def convert(path, prefix):
    """Возвращает (html, toc), toc — список (id, подпись)."""
    z = zipfile.ZipFile(path)
    root = ET.fromstring(z.read("word/document.xml"))
    numfmt = _numbering(z)
    body = root.find(W + "body")
    out, toc = [], []
    list_open = None  # (tag, numId)
    counters = {}
    first = True
    sec_n = 0

    def close_list():
        nonlocal list_open
        if list_open:
            out.append(f"</{list_open[0]}>")
            list_open = None

    for el in body:
        if el.tag == W + "tbl":
            close_list()
            out.append(_table(el))
            continue
        if el.tag != W + "p":
            continue
        runs = _runs(el)
        text = _plain(runs)
        if not text:
            continue
        inner = _runs_html(runs)
        bold_len = sum(len(t) for t, b in runs if b and t.strip())
        mostly_bold = bold_len >= 0.6 * max(1, sum(len(t) for t, _ in runs))
        ppr = el.find(W + "pPr")
        num = ppr.find(W + "numPr") if ppr is not None else None
        lead = ""
        for t, b in runs:  # жирное начало абзаца, пробелы между жирными кусками не мешают
            if b:
                lead += t
            elif t.strip():
                break
        lead_bold = len(lead.replace(" ", "")) >= 6
        is_sec = bool(SEC_RE.match(text)) and (mostly_bold or lead_bold)

        if first:
            close_list()
            out.append(f'<h2 class="lec-title">{html.escape(text)}</h2>')
            first = False
            continue

        if num is not None:
            nid_el, lvl_el = num.find(W + "numId"), num.find(W + "ilvl")
            nid = nid_el.get(W + "val") if nid_el is not None else "0"
            lvl = lvl_el.get(W + "val") if lvl_el is not None else "0"
            if nid != "0":
                fmt = numfmt.get(nid, {}).get(lvl, "bullet")
                tag = "ol" if fmt in ("decimal", "upperRoman", "lowerRoman", "upperLetter", "lowerLetter", "russianLower", "russianUpper") else "ul"
                key = (nid, lvl)
                counters[key] = counters.get(key, 0) + 1
                if list_open != (tag, nid):
                    close_list()
                    start = f' start="{counters[key]}"' if tag == "ol" and counters[key] > 1 else ""
                    out.append(f"<{tag}{start}>")
                    list_open = (tag, nid)
                li_id = ""
                if (mostly_bold and len(text) <= 60 and tag == "ol") or is_sec:
                    sec_n += 1
                    sid = f"{prefix}-s{sec_n}"
                    li_id = f' id="{sid}"'
                    toc.append((sid, _toc_label(text)))
                out.append(f"<li{li_id}>{inner}</li>")
                continue
        close_list()

        if is_sec:
            sec_n += 1
            sid = f"{prefix}-s{sec_n}"
            toc.append((sid, _toc_label(text)))
            out.append(f'<p class="lec-sec" id="{sid}">{inner}</p>')
        elif mostly_bold and len(text) <= 40 and text.upper() == text:
            out.append(f'<h4 class="lec-cap">{html.escape(text)}</h4>')
        else:
            out.append(f"<p>{inner}</p>")
    close_list()
    return "\n".join(out), toc

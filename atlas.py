"""Рисунки из Wikimedia Commons со свободными лицензиями. Вставляются в страницы как {{atlas:ключ}}.

Картинки не копируются в репозиторий: они загружаются с upload.wikimedia.org.
"""
import html

IMAGES = {
    "overview": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Blausen_0770_RespiratorySystem_02.png/960px-Blausen_0770_RespiratorySystem_02.png",
                     page="https://commons.wikimedia.org/wiki/File:Blausen_0770_RespiratorySystem_02.png", w=1600, h=1280,
                     license="CC BY 3.0", author="BruceBlaus (Blausen Medical)", caption="Органы дыхания: верхние и нижние дыхательные пути, лёгкие"),
    "nose-wall": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/8/87/Gray855.png",
                      page="https://commons.wikimedia.org/wiki/File:Gray855.png", w=500, h=468,
                      license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Латеральная стенка полости носа: носовые раковины и носовые ходы"),
    "sinuses": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Paranasal_Sinuses_labelled.png/960px-Paranasal_Sinuses_labelled.png",
                    page="https://commons.wikimedia.org/wiki/File:Paranasal_Sinuses_labelled.png", w=1024, h=851,
                    license="CC BY-SA 4.0", author="RWhitwam", caption="Околоносовые пазухи: лобная, верхнечелюстная (гайморова), решётчатые и клиновидная"),
    "pharynx": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/7/7c/Gray994.png",
                    page="https://commons.wikimedia.org/wiki/File:Gray994.png", w=600, h=861,
                    license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Сагиттальный разрез: полость носа, носоглотка, ротоглотка и гортань"),
    "larynx": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/8/85/Gray961.png",
                   page="https://commons.wikimedia.org/wiki/File:Gray961.png", w=468, h=600,
                   license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Хрящи гортани, трахея и главные бронхи, вид спереди"),
    "glottis": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/5/50/Gray956.png",
                    page="https://commons.wikimedia.org/wiki/File:Gray956.png", w=450, h=354,
                    license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Вид гортани в ларингоскоп: вход в гортань и голосовые складки"),
    "lungs-color": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lungs_diagram_detailed.svg/960px-Lungs_diagram_detailed.svg.png",
                        page="https://commons.wikimedia.org/wiki/File:Lungs_diagram_detailed.svg", w=510, h=652,
                        license="CC BY 2.5", author="Patrick J. Lynch, медицинский иллюстратор", caption="Трахея, главные бронхи, бронхиальное дерево и доли лёгких"),
    "tree": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/7/7a/Gray962.png",
                 page="https://commons.wikimedia.org/wiki/File:Gray962.png", w=700, h=585,
                 license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Бронхиальное дерево: ветвление бронхов в лёгких"),
    "lungs": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/f/fb/Gray970.png",
                  page="https://commons.wikimedia.org/wiki/File:Gray970.png", w=550, h=527,
                  license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Сердце и лёгкие спереди: доли, борозды и сердечная вырезка левого лёгкого"),
    "acinus": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/8/8f/Gray975.png",
                   page="https://commons.wikimedia.org/wiki/File:Gray975.png", w=400, h=399,
                   license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Схема дольки лёгкого: дыхательная бронхиола, альвеолярные ходы и альвеолы"),
    "pleura": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/a/ab/Gray965.png",
                   page="https://commons.wikimedia.org/wiki/File:Gray965.png", w=400, h=500,
                   license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Проекция плевры (синим) и лёгких на переднюю стенку грудной клетки"),
    "mediastinum": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/0/01/Gray968.png",
                        page="https://commons.wikimedia.org/wiki/File:Gray968.png", w=700, h=550,
                        license="общественное достояние", author="Henry Vandyke Carter, «Анатомия Грея»", caption="Поперечный разрез грудной клетки: лёгкие, плевра и органы средостения"),
    "pneumo": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Blausen_0742_Pneumothorax.png/960px-Blausen_0742_Pneumothorax.png",
                   page="https://commons.wikimedia.org/wiki/File:Blausen_0742_Pneumothorax.png", w=1500, h=1500,
                   license="CC BY 3.0", author="BruceBlaus (Blausen Medical)", caption="Пневмоторакс: воздух в плевральной полости, лёгкое спадается"),
    "breathing": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/f/f3/Anatomy_and_physiology_of_animals_Inspiration_%26_expiration.jpg",
                      page="https://commons.wikimedia.org/wiki/File:Anatomy_and_physiology_of_animals_Inspiration_%26_expiration.jpg", w=576, h=251,
                      license="CC BY 3.0", author="Ruth Lawson, Otago Polytechnic", caption="Вдох и выдох: положение рёбер и купола диафрагмы"),
    "gas": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gas_exchange_in_the_aveolus_simple_%28en%29.svg/960px-Gas_exchange_in_the_aveolus_simple_%28en%29.svg.png",
                page="https://commons.wikimedia.org/wiki/File:Gas_exchange_in_the_aveolus_simple_(en).svg", w=512, h=351,
                license="CC BY 4.0", author="domdomegg", caption="Газообмен в альвеоле: O₂ переходит в кровь капилляра, CO₂ — в альвеолу"),
    "volumes": dict(thumb="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Lungvolumes.svg/960px-Lungvolumes.svg.png",
                    page="https://commons.wikimedia.org/wiki/File:Lungvolumes.svg", w=1414, h=961,
                    license="CC BY-SA 3.0", author="Vihsadas, rscottweek", caption="Спирограмма: лёгочные объёмы и ёмкости"),
}

# порядок для галереи на странице схем
GALLERY = ["overview", "lungs-color", "nose-wall", "sinuses", "pharynx", "larynx", "glottis", "tree",
           "lungs", "acinus", "gas", "pleura", "mediastinum", "pneumo", "volumes"]


def figure(key, compact=False):
    d = IMAGES[key]
    cap = html.escape(d["caption"])
    lic = html.escape(d["license"])
    return (f'<figure class="atlas">'
            f'<a class="zoom" href="{d["thumb"]}" data-caption="{cap}" aria-label="Увеличить рисунок: {cap}">'
            f'<img src="{d["thumb"]}" alt="{cap}" width="{d["w"]}" height="{d["h"]}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>'
            f'<figcaption>{cap}<span class="credit">{html.escape(d["author"])}, '
            f'<a href="{d["page"]}" target="_blank" rel="noopener">{lic}</a>, Wikimedia Commons. Подписи на английском</span></figcaption></figure>')


def gallery():
    return '<div class="atlas-grid">' + "".join(figure(k, True) for k in GALLERY) + "</div>"

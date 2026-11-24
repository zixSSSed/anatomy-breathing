"""Рисует иконки приложения (экран «Домой» на iPhone, Android, PWA) в docs/icons/.

Запуск: python make_icons.py   (нужен Pillow)
"""
import math
import pathlib
from PIL import Image, ImageDraw, ImageFilter

OUT = pathlib.Path(__file__).parent / "docs" / "icons"
STAGE_1, STAGE_2 = (40, 48, 118), (11, 13, 26)
CORAL, CORAL_2 = (240, 104, 84), (255, 150, 122)
AIR = (190, 198, 255)


def cubic(p0, p1, p2, p3, n=24):
    pts = []
    for i in range(1, n + 1):
        t = i / n
        a = (1 - t) ** 3
        b = 3 * (1 - t) ** 2 * t
        c = 3 * (1 - t) * t ** 2
        d = t ** 3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


def lung(mirror=False):
    # тот же контур, что у логотипа на сайте (viewBox 32×32)
    pts = [(11.5, 12.5)]
    pts += cubic((11.5, 12.5), (7.5, 12.5), (4.5, 17.5), (4.5, 22.5))
    pts += cubic((4.5, 22.5), (4.5, 25.5), (6.5, 27), (8.5, 27))
    pts += cubic((8.5, 27), (11.5, 27), (13.5, 24.5), (13.5, 20.5))
    pts += [(13.5, 14.5)]
    if mirror:
        pts = [(32 - x, y) for x, y in pts]
    return pts


def draw_icon(size, content=0.64, rounded=False):
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), STAGE_2 + (255,))
    # радиальный фон сцены
    grad = Image.new("RGBA", (S, S))
    gp = grad.load()
    cx, cy = S * 0.5, S * 0.3
    rmax = S * 0.95
    for y in range(0, S, ss):
        for x in range(0, S, ss):
            k = min(1.0, math.hypot(x - cx, y - cy) / rmax)
            k = k ** 1.2
            col = tuple(int(STAGE_1[i] + (STAGE_2[i] - STAGE_1[i]) * k) for i in range(3)) + (255,)
            for yy in range(y, min(S, y + ss)):
                for xx in range(x, min(S, x + ss)):
                    gp[xx, yy] = col
    img = Image.alpha_composite(img, grad)

    scale = content * S / 24.0
    def tr(p):
        return ((p[0] - 16) * scale + S / 2, (p[1] - 15) * scale + S / 2)

    # мягкое свечение под лёгкими
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon([tr(p) for p in lung()], fill=CORAL + (150,))
    gd.polygon([tr(p) for p in lung(True)], fill=CORAL + (150,))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.05))
    img = Image.alpha_composite(img, glow)

    d = ImageDraw.Draw(img)
    d.polygon([tr(p) for p in lung()], fill=CORAL + (255,))
    d.polygon([tr(p) for p in lung(True)], fill=CORAL_2 + (255,))
    w = 2.6 * scale
    def line(a, b):
        A, B = tr(a), tr(b)
        d.line([A, B], fill=AIR + (255,), width=int(w))
        for P in (A, B):
            d.ellipse([P[0] - w / 2, P[1] - w / 2, P[0] + w / 2, P[1] + w / 2], fill=AIR + (255,))
    line((16, 3), (16, 14))
    line((16, 14), (11, 18))
    line((16, 14), (21, 18))

    if rounded:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    draw_icon(180).convert("RGB").save(OUT / "apple-touch-icon.png")
    draw_icon(192).save(OUT / "icon-192.png")
    draw_icon(512).save(OUT / "icon-512.png")
    draw_icon(512, content=0.46).save(OUT / "icon-maskable-512.png")
    draw_icon(64, rounded=True).save(OUT / "favicon-64.png")
    print("icons ->", OUT)


if __name__ == "__main__":
    main()

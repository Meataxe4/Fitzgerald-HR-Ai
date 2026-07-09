#!/usr/bin/env python3
"""Light-theme 9:16 ANIMATED reel that matches 'The Award Index' carousel — so the
feed post and the reel are a set. Cream editorial look, sector icons, awards tick in.
Run: python3 scripts/setup_fonts.py && python3 scripts/build_award_index_reel.py
"""
import os, io
import numpy as np
import cairosvg
import imageio.v2 as imageio
from PIL import Image
from reel_icons import icon, ICON_FOR

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "exports", "fitz-hr-award-index-reel.mp4")
FONTDIR = "/usr/share/fonts/truetype/reel"
CREAM, INK, AMBER = "#faf6ee", "#0f172a", "#f59e0b"
INK60, INK45, RULE = "rgba(15,23,42,0.60)", "rgba(15,23,42,0.45)", "rgba(15,23,42,0.14)"
MX, MR = 96, 1000
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&amp;family=Outfit:wght@500;700;800&amp;display=swap');"
FPS, DUR, HOLD, XF, SIZE = 30, 0.55, 1.9, 0.45, (1080, 1920)

from PIL import ImageFont
_ot = ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), 44)
def wrap(t, maxw, f=_ot):
    words, lines, cur = t.split(), [], ""
    for w in words:
        s = (cur + " " + w).strip()
        if f.getbbox(s)[2] <= maxw: cur = s
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def esc(s): return s.replace("&", "&amp;")

def _svg(inner, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">'
            f'<defs><style>{FONTS}'
            f'.pf{{font-family:\'Playfair Display\',Georgia,serif;}}'
            f'.ti{{font-family:\'Outfit\',sans-serif;}}.bd{{font-family:\'OutfitText\',sans-serif;}}</style>{defs}</defs>{inner}</svg>')

def render(svg):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=1080, output_height=1920))).convert("RGBA")

def ease(t): return 1 - (1 - t) ** 3

def wm(x=MX, y=300, ink=INK):
    return f'<text x="{x}" y="{y}" class="ti" font-size="42" font-weight="800"><tspan fill="{AMBER}">F</tspan><tspan fill="{ink}">ITZ</tspan><tspan fill="{AMBER}">HR</tspan></text>'

def row(name, code, is_new, yy):
    g = icon(ICON_FOR[code], MX + 46, yy - 6, scale=0.95, stroke=AMBER, sw=6)
    t = (f'<text x="{MX+130}" y="{yy}" class="pf" font-size="56" font-weight="900" fill="{INK}">{esc(name)}</text>'
         f'<text x="{MX+130}" y="{yy+42}" class="ti" font-size="30" font-weight="800" fill="{AMBER}">{code}</text>')
    if is_new:
        t += (f'<rect x="{MR-108}" y="{yy-38}" width="108" height="54" rx="27" fill="{AMBER}"/>'
              f'<text x="{MR-54}" y="{yy}" class="ti" font-size="26" font-weight="800" fill="{INK}" text-anchor="middle" letter-spacing="1">NEW</text>')
    return g + t

AWARDS = [("Hospitality", "MA000009", False), ("Restaurant", "MA000119", False),
          ("Retail", "MA000004", True), ("Manufacturing", "MA000010", True),
          ("SCHADS", "MA000100", True), ("Health Professionals", "MA000027", True),
          ("Children's Services", "MA000120", True)]

# ---- cards as (base_svg, [(fragment, delay, dy)]) ----
def cover():
    base = _svg(f'<rect width="1080" height="1920" fill="{CREAM}"/>'
                f'<text x="1010" y="1120" class="pf" font-size="820" font-weight="900" fill="{AMBER}" opacity="0.08" text-anchor="end">7</text>'
                + wm() + f'<rect x="{MX}" y="340" width="{MR-MX}" height="2" fill="{RULE}"/>')
    title = (f'<text x="{MX}" y="500" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="8">THE AWARD INDEX</text>'
             f'<text x="{MX}" y="660" class="pf" font-size="128" font-weight="900" fill="{INK}">Seven awards.</text>'
             f'<text x="{MX}" y="790" class="pf" font-size="128" font-weight="900" fill="{AMBER}">One platform.</text>')
    sub = "".join(f'<text x="{MX}" y="{900+i*56}" class="bd" font-size="44" fill="{INK60}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Every rate, penalty and classification — kept current with Fair Work.", 860)))
    tag = f'<text x="{MX}" y="1480" class="ti" font-size="36" font-weight="800" fill="{INK}" letter-spacing="5">SWIPE THE INDEX  →</text>'
    return base, [(title, 0.15, 40), (sub, 0.5, 32), (tag, 0.8, 24)]

def index_card():
    base = _svg(f'<rect width="1080" height="1920" fill="{CREAM}"/>'
                + wm() + f'<text x="{MR}" y="300" class="ti" font-size="34" font-weight="800" fill="{INK60}" text-anchor="end" letter-spacing="2">7 AWARDS</text>'
                + f'<rect x="{MX}" y="340" width="{MR-MX}" height="2" fill="{RULE}"/>')
    title = f'<text x="{MX}" y="500" class="pf" font-size="80" font-weight="900"><tspan fill="{INK}">One platform, </tspan><tspan fill="{AMBER}">covered.</tspan></text>'
    layers = [(title, 0.12, 34)]
    for i, (n, c, nw) in enumerate(AWARDS):
        layers.append((row(n, c, nw, 700 + i * 148), 0.4 + i * 0.13, 40))
    return base, layers

def cta():
    base = _svg(f'<rect width="1080" height="1920" fill="{INK}"/>'
                f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{CREAM}"/>' + wm(x=MX+24, ink=INK))
    title = (f'<text x="{MX}" y="780" class="pf" font-size="128" font-weight="900" fill="#ffffff">Find your</text>'
             f'<text x="{MX}" y="916" class="pf" font-size="128" font-weight="900" fill="{AMBER}">award.</text>')
    sub = "".join(f'<text x="{MX}" y="{1040+i*54}" class="bd" font-size="44" fill="rgba(255,255,255,0.72)">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Exact legal rates for every classification, shift and penalty — free.", 880)))
    btn = (f'<rect x="{MX}" y="1320" width="888" height="140" rx="70" fill="{AMBER}"/>'
           f'<text x="{MX+444}" y="1408" class="ti" font-size="46" font-weight="800" fill="{INK}" text-anchor="middle">Check a rate free  →  fitzhr.com</text>')
    return base, [(title, 0.12, 40), (sub, 0.42, 30), (btn, 0.66, 46)]

def scale_alpha(img, a):
    r, g, b, al = img.split()
    return Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * a))))

def context(card):
    base_svg, layers = card
    base_img = render(base_svg)
    limgs = [(render(_svg(frag)), d, dy) for frag, d, dy in layers]
    length = max((d for _, d, _ in layers), default=0) + DUR + HOLD
    def compose(t):
        frame = base_img.copy()
        for img, d, dy in limgs:
            p = (t - d) / DUR
            if p <= 0: continue
            p = min(p, 1.0); e = ease(p); off = int((1 - e) * dy)
            if off or p < 1:
                cv = Image.new("RGBA", SIZE, (0, 0, 0, 0)); cv.alpha_composite(img, (0, off))
                frame.alpha_composite(scale_alpha(cv, e) if p < 1 else cv)
            else:
                frame.alpha_composite(img)
        return frame.convert("RGB")
    return compose, length

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    ctxs = [context(c) for c in (cover(), index_card(), cta())]
    w = imageio.get_writer(OUT, fps=FPS, codec="libx264", quality=8, macro_block_size=8,
                           ffmpeg_params=["-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart"])
    for i, (compose, length) in enumerate(ctxs):
        for f in range(int(length * FPS)):
            w.append_data(np.asarray(compose(f / FPS)))
        if i < len(ctxs) - 1:
            a_final, b_first = compose(length), ctxs[i + 1][0](0.0)
            for f in range(int(XF * FPS)):
                k = ease((f + 1) / (int(XF * FPS) + 1))
                w.append_data(np.asarray(Image.blend(a_final, b_first, k)))
    w.close()
    print("wrote", os.path.relpath(OUT))

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Animated build of the 'now 7 awards' reel: real per-element motion baked into
the MP4 (elements fade + rise in with stagger; awards tick in one-by-one), then a
locked hold, with crossfades between cards. Reuses the static card geometry.
Run: python3 scripts/setup_fonts.py && python3 scripts/build_newawards_anim.py
"""
import os, io
import numpy as np
import cairosvg
import imageio.v2 as imageio
from PIL import Image

import build_newawards_cards as B
A, N, W, MX, MR = B.A, B.N, B.W, B.MX, B.MR
esc, wrap, check, new_pill = B.esc, B.wrap, B.check, B.new_pill
award_row, audience_row, wordmark, counter = B.award_row, B.audience_row, B.wordmark, B.counter
FONTS = B.FONTS
OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "exports", "fitz-hr-new-awards-reel.mp4")

FPS, DUR, HOLD, XF = 30, 0.55, 1.7, 0.45
SIZE = (1080, 1920)

def _svg(inner, defs="", bg=True):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">'
            f'<defs><style>{FONTS}'
            f'.ti{{font-family:\'Outfit\',\'Helvetica Neue\',sans-serif;}}'
            f'.bd{{font-family:\'OutfitText\',\'Helvetica Neue\',sans-serif;}}</style>{defs}</defs>{inner}</svg>')

def render(svg):
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=1080, output_height=1920)
    return Image.open(io.BytesIO(png)).convert("RGBA")

def ease(t):
    return 1 - (1 - t) ** 3

# ---------------------------------------------------------------- card layer specs
def hook():
    defs = ('<linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0%" stop-color="#0f172a"/><stop offset="60%" stop-color="#0f172a"/>'
            '<stop offset="100%" stop-color="#1a1205"/></linearGradient>'
            '<radialGradient id="ag" cx="80%" cy="30%" r="70%">'
            f'<stop offset="0%" stop-color="{A}" stop-opacity="0.18"/>'
            f'<stop offset="100%" stop-color="{A}" stop-opacity="0"/></radialGradient>')
    base = _svg('<rect width="1080" height="1920" fill="url(#glow)"/><rect width="1080" height="1920" fill="url(#ag)"/>'
                f'<text x="1040" y="1180" class="ti" font-size="900" font-weight="800" fill="{A}" opacity="0.08" text-anchor="end">7</text>'
                + wordmark(), defs)
    title = (f'<text x="{MX}" y="640" class="ti" font-size="38" font-weight="800" fill="{A}" letter-spacing="6">BIG NEWS</text>'
             f'<text x="{MX}" y="800" class="ti" font-size="128" font-weight="800" fill="{W}">We just</text>'
             f'<text x="{MX}" y="936" class="ti" font-size="128" font-weight="800" fill="{A}">got bigger.</text>')
    sub = "".join(f'<text x="{MX}" y="{1080+i*56}" class="bd" font-size="46" fill="rgba(255,255,255,0.72)">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Fitz HR now covers 7 modern awards — not just 2.", 46, 820)))
    tag = f'<text x="{MX}" y="1470" class="ti" font-size="38" font-weight="800" fill="rgba(255,255,255,0.85)" letter-spacing="6">SEE THE FULL LIST  →</text>'
    return base, [(title, 0.15, 40), (sub, 0.5, 34), (tag, 0.8, 24)]

def list_card(eyebrow, title_html, rows, cnt, first_delay=0.4, step=0.13):
    base = _svg(f'<rect width="1080" height="1920" fill="{N}"/>'
                f'<rect x="60" y="300" width="10" height="1300" rx="5" fill="{A}" opacity="0.9"/>'
                + wordmark() + counter(cnt))
    layers = [(f'<text x="{MX}" y="470" class="ti" font-size="36" font-weight="800" fill="{A}" letter-spacing="6">{eyebrow}</text>'
               + title_html, 0.12, 34)]
    for i, frag in enumerate(rows):
        layers.append((frag, first_delay + i * step, 40))
    return base, layers

def cta():
    base = _svg(f'<rect width="1080" height="1920" fill="{A}"/>'
                f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{N}"/>' + wordmark(x=MX+24, y=300))
    title = (f'<text x="{MX}" y="780" class="ti" font-size="118" font-weight="800" fill="{N}">One platform.</text>'
             f'<text x="{MX}" y="912" class="ti" font-size="118" font-weight="800" fill="{N}">Every award.</text>')
    sub = "".join(f'<text x="{MX}" y="{1050+i*54}" class="bd" font-size="44" fill="{B.N72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Hospitality, retail, manufacturing, community care, health & childcare.", 44, 840)))
    btn = (f'<rect x="{MX}" y="1320" width="860" height="140" rx="70" fill="{N}"/>'
           f'<text x="{MX+430}" y="1408" class="ti" font-size="44" font-weight="800" fill="{A}" text-anchor="middle">Find your award  →  fitzhr.com</text>')
    return base, [(title, 0.12, 40), (sub, 0.42, 30), (btn, 0.66, 46)]

def build_cards():
    cards = [hook()]
    t1 = (f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800" fill="{W}">Then:</text>'
          f'<text x="{MX}" y="700" class="ti" font-size="92" font-weight="800" fill="{A}">2 awards</text>')
    r1 = [award_row(n, c, False, 900 + i * 210) for i, (n, c) in enumerate(B.ORIG)]
    cards.append(list_card("WHERE WE STARTED", t1, r1, "01 / 03", first_delay=0.45, step=0.2))
    t2 = f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800"><tspan fill="{W}">Now: </tspan><tspan fill="{A}">7 awards</tspan></text>'
    r2 = [award_row(n, c, nw, 720 + i * 138) for i, (n, c, nw) in enumerate(B.ALL7)]
    cards.append(list_card("THE FULL SUITE", t2, r2, "02 / 03", first_delay=0.4, step=0.13))
    t3 = f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800"><tspan fill="{W}">Now built </tspan><tspan fill="{A}">for more</tspan></text>'
    r3 = [audience_row(l, 780 + i * 150) for i, l in enumerate(B.AUDIENCE)]
    cards.append(list_card("WHO IT'S FOR", t3, r3, "03 / 03", first_delay=0.4, step=0.14))
    cards.append(cta())
    return cards

# ---------------------------------------------------------------- compositing
def scale_alpha(img, a):
    r, g, b, al = img.split()
    return Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * a))))

def context(card):
    base_svg, layers = card
    base_img = render(base_svg)
    layer_imgs = [(render(_svg(frag, bg=False)), d, dy) for frag, d, dy in layers]
    intro_end = max((d for _, d, _ in layers), default=0) + DUR
    length = intro_end + HOLD

    def compose(t):
        frame = base_img.copy()
        for img, d, dy in layer_imgs:
            p = (t - d) / DUR
            if p <= 0:
                continue
            p = min(p, 1.0); e = ease(p)
            off = int((1 - e) * dy)
            if off or p < 1:
                canvas = Image.new("RGBA", SIZE, (0, 0, 0, 0))
                canvas.alpha_composite(img, (0, off))
                canvas = scale_alpha(canvas, e) if p < 1 else canvas
                frame.alpha_composite(canvas)
            else:
                frame.alpha_composite(img)
        return frame.convert("RGB")
    return compose, length

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    ctxs = [context(c) for c in build_cards()]
    writer = imageio.get_writer(OUT, fps=FPS, codec="libx264", quality=8, macro_block_size=8,
                                ffmpeg_params=["-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart"])
    for i, (compose, length) in enumerate(ctxs):
        for f in range(int(length * FPS)):
            writer.append_data(np.asarray(compose(f / FPS)))
        if i < len(ctxs) - 1:
            a_final = compose(length)
            b_first = ctxs[i + 1][0](0.0)
            xf = int(XF * FPS)
            for f in range(xf):
                k = ease((f + 1) / (xf + 1))
                writer.append_data(np.asarray(Image.blend(a_final, b_first, k)))
    writer.close()
    print("wrote", os.path.relpath(OUT))

if __name__ == "__main__":
    main()

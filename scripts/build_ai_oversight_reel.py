#!/usr/bin/env python3
"""~16s animated reel: the first AI-agent firing (Andon Market / 'Luna') and how
Fitz HR solves it — AI for speed, real HR experts overseeing every output.
Dark Fitz brand theme. Run after setup_fonts.py."""
import os, io
import numpy as np
import cairosvg
import imageio.v2 as imageio
from PIL import Image, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "exports", "fitz-hr-ai-oversight-reel.mp4")
FONTDIR = "/usr/share/fonts/truetype/reel"
NAVY, NAVY2, AMBER, W = "#0f172a", "#0b1220", "#f59e0b", "#ffffff"
W72 = "rgba(255,255,255,0.72)"; N72 = "rgba(15,23,42,0.72)"
MX, MR = 96, 984
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&amp;display=swap');"
FPS, DUR, HOLD, XF, SIZE = 30, 0.6, 2.4, 0.6, (1080, 1920)

_ot = {}
def ot(s): _ot.setdefault(s, ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), s)); return _ot[s]
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def wrap(t, size, maxw):
    f = ot(size); words, lines, cur = t.split(), [], ""
    for w in words:
        s = (cur + " " + w).strip()
        if f.getbbox(s)[2] <= maxw: cur = s
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def _svg(inner, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">'
            f'<defs><style>{FONTS}.ti{{font-family:\'Outfit\',sans-serif;}}.bd{{font-family:\'OutfitText\',sans-serif;}}</style>{defs}</defs>{inner}</svg>')
def render(inner, defs=""):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=_svg(inner, defs).encode(), output_width=1080, output_height=1920))).convert("RGBA")
def ease(t): return 1 - (1 - t) ** 3
def wm(x=MX, y=300, ink=W):
    return f'<text x="{x}" y="{y}" class="ti" font-size="42" font-weight="800"><tspan fill="{AMBER}">F</tspan><tspan fill="{ink}">ITZ</tspan><tspan fill="{AMBER}">HR</tspan></text>'

GLOW = ('<linearGradient id="glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f172a"/>'
        '<stop offset="62%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1a1205"/></linearGradient>'
        '<radialGradient id="ag" cx="80%" cy="26%" r="72%"><stop offset="0%" stop-color="#f59e0b" stop-opacity="0.16"/>'
        '<stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>')

_ICONS = {
    "alert": '<path d="M 0 -30 L 32 26 H -32 Z"/><line x1="0" y1="-8" x2="0" y2="10"/><circle cx="0" cy="20" r="2.6"/>',
    "scales": ('<path d="M 0 -30 V 22"/><path d="M -26 -16 H 26"/><path d="M -14 22 H 14"/><circle cx="0" cy="-30" r="4"/>'
               '<path d="M -26 -16 L -37 6 H -15 Z"/><path d="M 26 -16 L 15 6 H 37 Z"/>'),
    "people": ('<circle cx="-13" cy="-9" r="9"/><path d="M -31 20 Q -13 0 5 20"/>'
               '<circle cx="14" cy="-13" r="9"/><path d="M -2 16 Q 14 -4 30 16"/>'),
    "shield": ('<path d="M 0 -30 L 28 -19 V 5 Q 28 26 0 32 Q -28 26 -28 5 V -19 Z"/>'
               '<path d="M -11 2 L -2 13 L 15 -9"/>'),
}
def gicon(name, cx, cy, scale, stroke, opacity=0.08, sw=6):
    return (f'<g transform="translate({cx},{cy}) scale({scale})" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw/scale:.2f}" stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}">{_ICONS[name]}</g>')

def hook():
    base = render('<rect width="1080" height="1920" fill="url(#glow)"/><rect width="1080" height="1920" fill="url(#ag)"/>'
                  + gicon("alert", 790, 1250, 8.0, AMBER, 0.08) + wm(), GLOW)
    title = (f'<text x="{MX}" y="560" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">AI IN THE WORKPLACE</text>'
             f'<text x="{MX}" y="710" class="ti" font-size="106" font-weight="800" fill="{W}">An AI agent</text>'
             f'<text x="{MX}" y="822" class="ti" font-size="106" font-weight="800" fill="{W}">just fired</text>'
             f'<text x="{MX}" y="934" class="ti" font-size="106" font-weight="800" fill="{AMBER}">an employee.</text>')
    sub = "".join(f'<text x="{MX}" y="{1050+i*56}" class="bd" font-size="46" fill="{W72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("The first known case — and a warning for every business.", 46, 870)))
    return base, [(title, 0.15, 40), (sub, 0.5, 32)]

def card(cnt, eyebrow, t_lines, kicker, icon):
    base = render(f'<rect width="1080" height="1920" fill="{NAVY}"/>'
                  + gicon(icon, 800, 1300, 7.0, AMBER, 0.08)
                  + f'<rect x="60" y="300" width="10" height="1300" rx="5" fill="{AMBER}" opacity="0.9"/>'
                  + wm() + f'<text x="{MR}" y="300" class="ti" font-size="38" font-weight="800" fill="{AMBER}" text-anchor="end" letter-spacing="2">{cnt}</text>')
    tsvg = (f'<text x="{MX}" y="500" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">{esc(eyebrow)}</text>'
            + "".join(f'<text x="{MX}" y="{640+i*110}" class="ti" font-size="92" font-weight="800" fill="{c}">{esc(t)}</text>'
                      for i, (t, c) in enumerate(t_lines)))
    ky = 640 + len(t_lines) * 110 + 20
    rule = f'<rect x="{MX}" y="{ky-30}" width="150" height="8" rx="4" fill="{AMBER}"/>'
    ksvg = "".join(f'<text x="{MX}" y="{ky+64+i*58}" class="bd" font-size="44" fill="{W72}">{esc(l)}</text>'
                   for i, l in enumerate(wrap(kicker, 44, 850)))
    return base, [(tsvg + rule, 0.12, 34), (ksvg, 0.38, 30)]

def cta():
    base = render(f'<rect width="1080" height="1920" fill="{AMBER}"/>'
                  + gicon("people", 820, 1700, 6.0, NAVY, 0.12)
                  + f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{NAVY}"/>' + wm(x=MX+24, ink=W))
    title = (f'<text x="{MX}" y="660" class="ti" font-size="100" font-weight="800" fill="{NAVY}">AI for speed.</text>'
             f'<text x="{MX}" y="772" class="ti" font-size="100" font-weight="800" fill="{NAVY}">Humans for</text>'
             f'<text x="{MX}" y="884" class="ti" font-size="100" font-weight="800" fill="{NAVY}">judgement.</text>')
    sub = "".join(f'<text x="{MX}" y="{1000+i*54}" class="bd" font-size="44" fill="{N72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Fitz HR pairs instant AI answers with real HR experts overseeing every output.", 44, 860)))
    btn = (f'<rect x="{MX}" y="1200" width="888" height="140" rx="70" fill="{NAVY}"/>'
           f'<text x="{MX+444}" y="1288" class="ti" font-size="46" font-weight="800" fill="{AMBER}" text-anchor="middle">See how  →  fitzhr.com</text>')
    return base, [(title, 0.12, 40), (sub, 0.4, 30), (btn, 0.62, 40)]

def build():
    return [
        hook(),
        card("01", "WHAT HAPPENED", [("It almost got", W), ("it wrong.", AMBER)],
             "An AI 'boss' ignored 17 late shifts and lost its own policy from memory — until a human stepped in.", "alert"),
        card("02", "THE RISK", [("HR by AI alone", W), ("is a grey zone.", AMBER)],
             "Memory drift, no procedural fairness — and when it's wrong, who's accountable?", "scales"),
        card("03", "THE FIX", [("AI should never", W), ("decide alone.", AMBER)],
             "Real HR experts in the loop turn 'confident but wrong' into decisions that hold up.", "shield"),
        cta(),
    ]

def scale_alpha(img, a):
    r, g, b, al = img.split(); return Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * a))))

def context(card):
    base, layers = card
    limgs = [(render(f), d, dy) for f, d, dy in layers]
    length = max((d for _, d, _ in layers), default=0) + DUR + HOLD
    def compose(t):
        frame = base.copy()
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
    ctxs = [context(c) for c in build()]
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
    print("wrote", os.path.relpath(OUT), "~", round(sum(l for _, l in ctxs) + (len(ctxs) - 1) * XF, 1), "s")

if __name__ == "__main__":
    main()

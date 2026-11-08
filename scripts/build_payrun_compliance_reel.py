#!/usr/bin/env python3
"""~16-17s animated reel: a 'successful' pay run can still be non-compliant;
punchline = the FWO recovered ~$2.5M in back-pay in 6 days. Fitz HR catches it first.
Dark Fitz brand theme. Run after setup_fonts.py (use python3.13)."""
import os, io
import numpy as np
import cairosvg
import imageio.v2 as imageio
from PIL import Image, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "exports", "fitz-hr-payrun-compliance-reel.mp4")
FONTDIR = "/usr/share/fonts/truetype/reel"
NAVY, AMBER, W = "#0f172a", "#f59e0b", "#ffffff"
W72 = "rgba(255,255,255,0.72)"; N72 = "rgba(15,23,42,0.72)"
MX, MR = 96, 984
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&amp;display=swap');"
FPS, DUR, HOLD, XF, SIZE = 30, 0.6, 2.8, 0.6, (1080, 1920)

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
    "doc": ('<path d="M -24 -32 H 12 L 26 -18 V 32 H -24 Z"/><path d="M 12 -32 V -18 H 26"/>'
            '<line x1="-14" y1="-4" x2="16" y2="-4"/><line x1="-14" y1="8" x2="16" y2="8"/><line x1="-14" y1="20" x2="6" y2="20"/>'),
    "alert": '<path d="M 0 -30 L 32 26 H -32 Z"/><line x1="0" y1="-8" x2="0" y2="10"/><circle cx="0" cy="20" r="2.6"/>',
    "shield": ('<path d="M 0 -30 L 28 -19 V 5 Q 28 26 0 32 Q -28 26 -28 5 V -19 Z"/>'
               '<path d="M -11 2 L -2 13 L 15 -9"/>'),
    "people": ('<circle cx="-13" cy="-9" r="9"/><path d="M -31 20 Q -13 0 5 20"/>'
               '<circle cx="14" cy="-13" r="9"/><path d="M -2 16 Q 14 -4 30 16"/>'),
}
def gicon(name, cx, cy, scale, stroke, opacity=0.08, sw=6):
    return (f'<g transform="translate({cx},{cy}) scale({scale})" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw/scale:.2f}" stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}">{_ICONS[name]}</g>')

def chrome(cnt, icon):
    return (f'<rect width="1080" height="1920" fill="{NAVY}"/>'
            + gicon(icon, 800, 1320, 7.0, AMBER, 0.08)
            + f'<rect x="60" y="300" width="10" height="1300" rx="5" fill="{AMBER}" opacity="0.9"/>'
            + wm() + f'<text x="{MR}" y="300" class="ti" font-size="38" font-weight="800" fill="{AMBER}" text-anchor="end" letter-spacing="2">{cnt}</text>')

def hook():
    base = render('<rect width="1080" height="1920" fill="url(#glow)"/><rect width="1080" height="1920" fill="url(#ag)"/>'
                  + gicon("doc", 790, 1260, 8.0, AMBER, 0.08) + wm(), GLOW)
    title = (f'<text x="{MX}" y="560" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">PAYROLL COMPLIANCE</text>'
             f'<text x="{MX}" y="710" class="ti" font-size="106" font-weight="800" fill="{W}">A successful</text>'
             f'<text x="{MX}" y="822" class="ti" font-size="106" font-weight="800" fill="{W}">pay run can</text>'
             f'<text x="{MX}" y="934" class="ti" font-size="106" font-weight="800" fill="{AMBER}">still be wrong.</text>')
    sub = "".join(f'<text x="{MX}" y="{1050+i*56}" class="bd" font-size="46" fill="{W72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Four hidden risks hide behind a clean pay run.", 46, 870)))
    return base, [(title, 0.15, 40), (sub, 0.5, 32)]

def risks_card():
    base = render(chrome("01", "alert"))
    tsvg = (f'<text x="{MX}" y="500" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">4 HIDDEN RISKS</text>'
            f'<text x="{MX}" y="640" class="ti" font-size="92" font-weight="800" fill="{W}">Clean pay run.</text>'
            f'<text x="{MX}" y="748" class="ti" font-size="92" font-weight="800" fill="{AMBER}">Wrong pay.</text>')
    rule = f'<rect x="{MX}" y="800" width="150" height="8" rx="4" fill="{AMBER}"/>'
    items = ["Wrong award classification", "Allowances left off",
             "Penalties & overtime miscalculated", "One error, every pay period"]
    rows = "".join(
        f'<rect x="{MX}" y="{900+i*96-26}" width="22" height="22" rx="6" fill="{AMBER}"/>'
        f'<text x="{MX+48}" y="{900+i*96}" class="bd" font-size="44" fill="{W72}">{esc(t)}</text>'
        for i, t in enumerate(items))
    return base, [(tsvg + rule, 0.12, 34), (rows, 0.38, 30)]

def stat_card():
    base = render(chrome("02", "alert"))
    big = (f'<text x="{MX}" y="500" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">THE COST</text>'
           f'<text x="{MX-6}" y="780" class="ti" font-size="236" font-weight="800" fill="{AMBER}">$2.5M</text>'
           f'<text x="{MX}" y="900" class="ti" font-size="70" font-weight="800" fill="{W}">in back-pay</text>'
           f'<text x="{MX}" y="984" class="ti" font-size="70" font-weight="800" fill="{AMBER}">over 6 years.</text>')
    kick = "".join(f'<text x="{MX}" y="{1110+i*56}" class="bd" font-size="44" fill="{W72}">{esc(l)}</text>'
                   for i, l in enumerate(wrap("Back-pay owed over six years — from pay runs that looked fine. Fair Work Ombudsman.", 44, 850)))
    return base, [(big, 0.12, 40), (kick, 0.45, 30)]

def fix_card():
    base = render(chrome("03", "shield"))
    tsvg = (f'<text x="{MX}" y="500" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">THE FIX</text>'
            f'<text x="{MX}" y="650" class="ti" font-size="92" font-weight="800" fill="{W}">Catch it before</text>'
            f'<text x="{MX}" y="760" class="ti" font-size="92" font-weight="800" fill="{AMBER}">Fair Work does.</text>')
    rule = f'<rect x="{MX}" y="812" width="150" height="8" rx="4" fill="{AMBER}"/>'
    kick = "".join(f'<text x="{MX}" y="{900+i*58}" class="bd" font-size="44" fill="{W72}">{esc(l)}</text>'
                   for i, l in enumerate(wrap("Fitz HR checks every rate, penalty and allowance against your award — backed by real HR experts.", 44, 850)))
    return base, [(tsvg + rule, 0.12, 34), (kick, 0.38, 30)]

def cta():
    base = render(f'<rect width="1080" height="1920" fill="{AMBER}"/>'
                  + gicon("people", 820, 1700, 6.0, NAVY, 0.12)
                  + f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{NAVY}"/>' + wm(x=MX+24, ink=W))
    title = (f'<text x="{MX}" y="680" class="ti" font-size="104" font-weight="800" fill="{NAVY}">Is your pay run</text>'
             f'<text x="{MX}" y="796" class="ti" font-size="104" font-weight="800" fill="{NAVY}">actually right?</text>')
    sub = "".join(f'<text x="{MX}" y="{920+i*54}" class="bd" font-size="44" fill="{N72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Check a rate, classification or penalty in seconds — free, no card.", 44, 860)))
    btn = (f'<rect x="{MX}" y="1240" width="888" height="140" rx="70" fill="{NAVY}"/>'
           f'<text x="{MX+444}" y="1328" class="ti" font-size="46" font-weight="800" fill="{AMBER}" text-anchor="middle">Check a rate free  →  fitzhr.com</text>')
    return base, [(title, 0.12, 40), (sub, 0.4, 30), (btn, 0.62, 40)]

def build():
    return [hook(), risks_card(), stat_card(), fix_card(), cta()]

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

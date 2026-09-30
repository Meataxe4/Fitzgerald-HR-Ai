#!/usr/bin/env python3
"""~11s animated reel explaining the MA000027 Health Award changes operative 1 Oct 2026
(FWC determination PR814029 — gender-based undervaluation priority review).
Dark Fitz brand theme. Run after setup_fonts.py."""
import os, io
import numpy as np
import cairosvg
import imageio.v2 as imageio
from PIL import Image, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "exports", "fitz-hr-health-award-2026-reel.mp4")
FONTDIR = "/usr/share/fonts/truetype/reel"
NAVY, NAVY2, AMBER, W = "#0f172a", "#0b1220", "#f59e0b", "#ffffff"
W72 = "rgba(255,255,255,0.72)"; N72 = "rgba(15,23,42,0.72)"
MX, MR = 96, 984
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&amp;display=swap');"
FPS, DUR, HOLD, XF, SIZE = 30, 0.6, 1.7, 0.6, (1080, 1920)

_ot = {}
def ot(s): _ot.setdefault(s, ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), s)); return _ot[s]
def esc(s): return s.replace("&", "&amp;")
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

# themed line glyphs (drawn around origin, ~±45); used as large faint watermarks
_ICONS = {
    "pulse": '<path d="M -46 0 H -16 L -6 -26 L 6 24 L 16 0 H 46"/>',
    "cap":   ('<path d="M 0 -22 L 46 -4 L 0 14 L -46 -4 Z"/>'
              '<path d="M -24 3 V 18 Q 0 33 24 18 V 3"/>'
              '<path d="M 46 -4 V 22"/><circle cx="46" cy="26" r="4"/>'),
    "trend": ('<path d="M -40 26 L -12 -6 L 6 14 L 40 -24"/>'
              '<path d="M 22 -24 H 40 V -6"/>'),
    "calendar": ('<rect x="-34" y="-26" width="68" height="58" rx="8"/>'
                 '<path d="M -34 -8 H 34"/><path d="M -18 -26 V -38"/><path d="M 18 -26 V -38"/>'
                 '<rect x="6" y="6" width="16" height="14" rx="3"/>'),
    "shield": ('<path d="M 0 -30 L 28 -19 V 5 Q 28 26 0 32 Q -28 26 -28 5 V -19 Z"/>'
               '<path d="M -11 2 L -2 13 L 15 -9"/>'),
}
def gicon(name, cx, cy, scale, stroke, opacity=0.08, sw=6):
    return (f'<g transform="translate({cx},{cy}) scale({scale})" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw/scale:.2f}" stroke-linecap="round" stroke-linejoin="round" '
            f'opacity="{opacity}">{_ICONS[name]}</g>')

def hook():
    base = render('<rect width="1080" height="1920" fill="url(#glow)"/><rect width="1080" height="1920" fill="url(#ag)"/>'
                  + gicon("pulse", 780, 1230, 8.2, AMBER, 0.08)
                  + wm(), GLOW)
    title = (f'<text x="{MX}" y="640" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">HEALTH AWARD · MA000027</text>'
             f'<text x="{MX}" y="800" class="ti" font-size="118" font-weight="800" fill="{W}">Big changes</text>'
             f'<text x="{MX}" y="924" class="ti" font-size="118" font-weight="800" fill="{AMBER}">from 1 October.</text>')
    sub = "".join(f'<text x="{MX}" y="{1050+i*56}" class="bd" font-size="46" fill="{W72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("What clinics, practices & allied health need to know.", 46, 860)))
    return base, [(title, 0.15, 40), (sub, 0.5, 32)]

def card(cnt, eyebrow, t_lines, kicker, icon="pulse"):
    base = render(f'<rect width="1080" height="1920" fill="{NAVY}"/>'
                  + gicon(icon, 800, 1300, 7.2, AMBER, 0.08)
                  + f'<rect x="60" y="300" width="10" height="1300" rx="5" fill="{AMBER}" opacity="0.9"/>'
                  + wm() + f'<text x="{MR}" y="300" class="ti" font-size="38" font-weight="800" fill="{AMBER}" text-anchor="end" letter-spacing="2">{cnt}</text>')
    tsvg = (f'<text x="{MX}" y="500" class="ti" font-size="36" font-weight="800" fill="{AMBER}" letter-spacing="6">{esc(eyebrow)}</text>'
            + "".join(f'<text x="{MX}" y="{640+i*110}" class="ti" font-size="96" font-weight="800" fill="{c}">{esc(t)}</text>'
                      for i, (t, c) in enumerate(t_lines)))
    ky = 640 + len(t_lines) * 110 + 20
    rule = f'<rect x="{MX}" y="{ky-30}" width="150" height="8" rx="4" fill="{AMBER}"/>'
    ksvg = "".join(f'<text x="{MX}" y="{ky+64+i*58}" class="bd" font-size="44" fill="{W72}">{esc(l)}</text>'
                   for i, l in enumerate(wrap(kicker, 44, 840)))
    return base, [(tsvg + rule, 0.12, 34), (ksvg, 0.38, 30)]

def cta():
    base = render(f'<rect width="1080" height="1920" fill="{AMBER}"/>'
                  + gicon("shield", 800, 1250, 7.0, NAVY, 0.10)
                  + f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{NAVY}"/>' + wm(x=MX+24, ink=W))
    title = (f'<text x="{MX}" y="700" class="ti" font-size="104" font-weight="800" fill="{NAVY}">Check your</text>'
             f'<text x="{MX}" y="814" class="ti" font-size="104" font-weight="800" fill="{NAVY}">Health Award rate.</text>')
    sub = "".join(f'<text x="{MX}" y="{940+i*54}" class="bd" font-size="44" fill="{N72}">{esc(l)}</text>'
                  for i, l in enumerate(wrap("Re-map roles to AQF levels and update payroll before your first October pay run.", 44, 860)))
    btn = (f'<rect x="{MX}" y="1200" width="888" height="140" rx="70" fill="{NAVY}"/>'
           f'<text x="{MX+444}" y="1288" class="ti" font-size="46" font-weight="800" fill="{AMBER}" text-anchor="middle">Check a rate free  →  fitzhr.com</text>')
    disc = f'<text x="{MX}" y="1440" class="bd" font-size="30" fill="rgba(15,23,42,0.55)">General info only — see FWC determination PR814029.</text>'
    return base, [(title, 0.12, 40), (sub, 0.4, 30), (btn + disc, 0.62, 40)]

def build():
    return [
        hook(),
        card("01", "NEW STRUCTURE", [("Pay now follows", W), ("AQF levels.", AMBER)],
             "Levels 5, 6 & 7 by years of experience — the old pay-point levels are replaced.", icon="cap"),
        card("02", "WHY IT CHANGED", [("Minimum rates", W), ("move up.", AMBER)],
             "Part of Fair Work's gender-based undervaluation priority review.", icon="trend"),
        card("03", "WHEN & WHO", [("First full pay period", W), ("on/after 1 Oct 2026.", AMBER)],
             "Existing staff are protected by transitional rates — no one goes backwards.", icon="calendar"),
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
    total = sum(l for _, l in ctxs) + (len(ctxs) - 1) * XF
    print("wrote", os.path.relpath(OUT), "~", round(total, 1), "s")

if __name__ == "__main__":
    main()

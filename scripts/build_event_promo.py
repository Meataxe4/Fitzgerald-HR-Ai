#!/usr/bin/env python3
"""Fitz HR event promo reel (9:16) — rebranded from the PaySauce webinar graphic.
FITZHR wordmark, updated copy, no 'Register now', two presenter headshots at bottom.
`parts()` exposes the layers so both the static PNG and the animated reel share layout.
Run after setup_fonts.py. HEADS_PNG env = extracted headshots (1080 wide, sits at bottom).
"""
import os, io
import cairosvg
from PIL import Image, ImageFont

HERE = os.path.dirname(__file__)
OUTDIR = os.path.join(HERE, "..", "marketing", "event-underpayments-reel")
HEADS = os.environ.get("HEADS_PNG") or os.path.join(OUTDIR, "presenters.png")
FONTDIR = "/usr/share/fonts/truetype/reel"
NAVY, NAVY2, AMBER, CREAM = "#0f172a", "#0b1220", "#f59e0b", "#fdf6e8"
W, W80 = "#ffffff", "rgba(255,255,255,0.86)"
MX = 96
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&amp;display=swap');"

_ot, _of = {}, {}
def ot(s): _ot.setdefault(s, ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), s)); return _ot[s]
def of(s): _of.setdefault(s, ImageFont.truetype(os.path.join(FONTDIR, "Outfit-800.ttf"), s)); return _of[s]

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def wrap(text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if font.getbbox(t)[2] <= maxw: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

DEFS = (f'<defs><style>{FONTS}'
        f'.ti{{font-family:\'Outfit\',\'Helvetica Neue\',sans-serif;}}'
        f'.bd{{font-family:\'OutfitText\',\'Helvetica Neue\',sans-serif;}}</style>'
        f'<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0%" stop-color="{NAVY}"/><stop offset="100%" stop-color="{NAVY2}"/></linearGradient></defs>')

def parts():
    t1, t2 = "Protect Yourself", "from Underpayments"
    tsize = 112
    for s in range(112, 72, -3):
        if of(s).getbbox(t1)[2] <= 858 and of(s).getbbox(t2)[2] <= 858:
            tsize = s; break
    lh = int(tsize * 1.06)
    ty1 = 470; ty2 = ty1 + lh
    body_top = ty2 + 168
    body_lines = wrap("Join us and PaySauce for the latest on the Fair Work Court Case and what it means for your Payroll.", ot(46), 800)
    body_svg = "".join(f'<text x="164" y="{body_top+i*64}" class="bd" font-size="46" fill="{W80}">{esc(l)}</text>'
                       for i, l in enumerate(body_lines))
    date_y = body_top + len(body_lines) * 64 + 60
    bar_bottom = date_y + 150
    wordmark = (f'<text x="{MX}" y="316" class="ti" font-size="52" font-weight="800">'
                f'<tspan fill="{AMBER}">F</tspan><tspan fill="{W}">ITZ</tspan><tspan fill="{AMBER}">HR</tspan></text>')
    title = (f'<g class="ti" font-weight="800" font-size="{tsize}" paint-order="stroke" stroke="{CREAM}" '
             f'stroke-width="9" stroke-linejoin="round" fill="{AMBER}">'
             f'<text x="{MX}" y="{ty1}">{t1}</text><text x="{MX}" y="{ty2}">{t2}</text></g>')
    barbody = f'<rect x="{MX}" y="{ty2+70}" width="10" height="{bar_bottom-(ty2+70)}" rx="5" fill="{AMBER}"/>' + body_svg
    date = (f'<text x="164" y="{date_y}" class="ti" font-size="52" font-weight="800">'
            f'<tspan fill="{AMBER}">Wednesday 7 October</tspan><tspan fill="{W}">  |  11am AEDT</tspan></text>'
            f'<text x="164" y="{date_y+66}" class="ti" font-size="50" font-weight="800" fill="{W}">Online via Zoom</text>')
    return {"wordmark": wordmark, "title": title, "barbody": barbody, "date": date}

def svg(inner): return f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">{DEFS}{inner}</svg>'

def build_svg():
    p = parts()
    return svg(f'<rect width="1080" height="1920" fill="url(#bg)"/>' + p["wordmark"] + p["title"] + p["barbody"] + p["date"])

def main():
    os.makedirs(OUTDIR, exist_ok=True)
    s = build_svg()
    with open(os.path.join(OUTDIR, "promo.svg"), "w") as f: f.write(s)
    base = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=s.encode(), output_width=1080, output_height=1920))).convert("RGBA")
    if HEADS and os.path.exists(HEADS):
        heads = Image.open(HEADS).convert("RGBA")
        base.alpha_composite(heads, (0, 1920 - heads.height + 8))
    base.convert("RGB").save(os.path.join(OUTDIR, "fitz-hr-underpayments-webinar.png"))
    print("wrote", os.path.join(OUTDIR, "fitz-hr-underpayments-webinar.png"))

if __name__ == "__main__":
    main()

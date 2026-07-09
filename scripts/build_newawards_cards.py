#!/usr/bin/env python3
"""Reel #3 — announcement: "Fitz HR now covers 7 awards" (up from 2).
A checklist / reveal template: award rows with codes + NEW tags, an audience-reach
slide, and a celebratory CTA. Distinct from the tips reels.
Run: python3 scripts/setup_fonts.py && python3 scripts/build_newawards_cards.py
"""
import os
from PIL import ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "reel-cards-new-awards")
FONTDIR = "/usr/share/fonts/truetype/reel"
W, A, N = "#ffffff", "#f59e0b", "#0f172a"
N72 = "rgba(15,23,42,0.72)"
MX, MR = 100, 980
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&amp;display=swap');"
_fc = {}
def font_at(s):
    if s not in _fc:
        _fc[s] = ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), s)
    return _fc[s]

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def wrap(text, size, maxw):
    f = font_at(size); words = text.split(); lines = []; cur = ""
    for w in words:
        t = (cur + " " + w).strip()
        if f.getbbox(t)[2] <= maxw: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def shell(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">\n'
            f'  <defs>\n    <style>\n      {FONTS}\n'
            f'      .ti{{font-family:\'Outfit\',\'Helvetica Neue\',sans-serif;}}\n'
            f'      .bd{{font-family:\'OutfitText\',\'Helvetica Neue\',sans-serif;}}\n    </style>{defs}\n  </defs>\n  {body}\n</svg>\n')

def wordmark(x=MX, y=300, size=42, itz=W):
    return (f'<text x="{x}" y="{y}" class="ti" font-size="{size}" font-weight="800">'
            f'<tspan fill="{A}">F</tspan><tspan fill="{itz}">ITZ</tspan><tspan fill="{A}">HR</tspan></text>')

def counter(label):
    return (f'<text x="{MR}" y="300" class="ti" font-size="40" font-weight="800" fill="{A}" '
            f'text-anchor="end" letter-spacing="2">{label}</text>')

def reveal(begin, dy=30):
    return (f'<animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="{begin}s" fill="freeze"/>'
            f'<animateTransform attributeName="transform" type="translate" begin="{begin}s" dur="0.7s" '
            f'fill="freeze" calcMode="spline" keySplines="0.16 0.7 0.2 1" keyTimes="0;1" values="0 {dy};0 0"/>')

def check(cx, cy, s=64):
    """amber rounded square with a white tick, centered at (cx,cy)"""
    x, y = cx - s/2, cy - s/2
    p = (f'M {x+0.28*s:.0f} {y+0.52*s:.0f} L {x+0.44*s:.0f} {y+0.68*s:.0f} '
         f'L {x+0.74*s:.0f} {y+0.30*s:.0f}')
    return (f'<rect x="{x:.0f}" y="{y:.0f}" width="{s}" height="{s}" rx="16" fill="{A}"/>'
            f'<path d="{p}" fill="none" stroke="{N}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')

def new_pill(x, cy):
    return (f'<rect x="{x}" y="{cy-32}" width="118" height="60" rx="30" fill="{A}"/>'
            f'<text x="{x+59}" y="{cy+12}" class="ti" font-size="30" font-weight="800" fill="{N}" '
            f'text-anchor="middle" letter-spacing="1">NEW</text>')

def award_row(name, code, is_new, yy):
    cy = yy - 6
    row = check(MX + 32, cy) + (
        f'<text x="{MX+108}" y="{yy}" class="ti" font-size="46" font-weight="800" fill="{W}">{esc(name)}</text>'
        f'<text x="{MX+108}" y="{yy+44}" class="bd" font-size="30" fill="{A}">{code}</text>')
    if is_new:
        row += new_pill(846, cy)
    return row

def audience_row(label, yy):
    cy = yy - 14
    return check(MX + 32, cy) + (
        f'<text x="{MX+108}" y="{yy}" class="ti" font-size="48" font-weight="800" fill="{W}">{esc(label)}</text>')

# ---------------------------------------------------------------- cards
def build_hook():
    defs = ('\n    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0%" stop-color="#0f172a"/><stop offset="60%" stop-color="#0f172a"/>'
            '<stop offset="100%" stop-color="#1a1205"/></linearGradient>'
            '\n    <radialGradient id="ag" cx="80%" cy="30%" r="70%">'
            f'<stop offset="0%" stop-color="{A}" stop-opacity="0.18"/>'
            f'<stop offset="100%" stop-color="{A}" stop-opacity="0"/></radialGradient>')
    wm = (f'<text x="1040" y="1180" class="ti" font-size="900" font-weight="800" fill="{A}" '
          f'opacity="0.08" text-anchor="end">7</text>')
    eyebrow = f'<text x="{MX}" y="640" class="ti" font-size="38" font-weight="800" fill="{A}" letter-spacing="6">BIG NEWS</text>'
    title = (f'<text x="{MX}" y="800" class="ti" font-size="128" font-weight="800" fill="{W}">We just</text>'
             f'<text x="{MX}" y="936" class="ti" font-size="128" font-weight="800" fill="{A}">got bigger.</text>')
    sub = "".join(
        f'<text x="{MX}" y="{1080+i*56}" class="bd" font-size="46" fill="rgba(255,255,255,0.72)">{esc(l)}</text>'
        for i, l in enumerate(wrap("Fitz HR now covers 7 modern awards — not just 2.", 46, 820)))
    tag = f'<text x="{MX}" y="1470" class="ti" font-size="38" font-weight="800" fill="rgba(255,255,255,0.85)" letter-spacing="6">SEE THE FULL LIST  →</text>'
    body = (f'<rect width="1080" height="1920" fill="url(#glow)"/><rect width="1080" height="1920" fill="url(#ag)"/>{wm}\n  '
            f'{wordmark()}\n  <g opacity="1">{reveal(0.15)}{eyebrow}{title}</g>\n  '
            f'<g opacity="1">{reveal(0.45)}{sub}</g>\n  '
            f'<g opacity="1"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.7s" fill="freeze"/>{tag}</g>')
    return shell(body, defs)

def build_list(eyebrow, title_html, rows_svg, cnt):
    spine = f'<rect x="60" y="300" width="10" height="1300" rx="5" fill="{A}" opacity="0.9"/>'
    top = wordmark() + counter(cnt)
    eb = f'<text x="{MX}" y="470" class="ti" font-size="36" font-weight="800" fill="{A}" letter-spacing="6">{eyebrow}</text>'
    body = (f'<rect width="1080" height="1920" fill="{N}"/>{spine}\n  {top}\n  '
            f'<g opacity="1">{reveal(0.12)}{eb}{title_html}</g>\n  '
            f'<g opacity="1">{reveal(0.32)}{rows_svg}</g>')
    return shell(body)

def build_cta():
    chip = f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{N}"/>' + wordmark(x=MX+24, y=300)
    title = (f'<text x="{MX}" y="780" class="ti" font-size="118" font-weight="800" fill="{N}">One platform.</text>'
             f'<text x="{MX}" y="912" class="ti" font-size="118" font-weight="800" fill="{N}">Every award.</text>')
    sub = "".join(
        f'<text x="{MX}" y="{1050+i*54}" class="bd" font-size="44" fill="{N72}">{esc(l)}</text>'
        for i, l in enumerate(wrap("Hospitality, retail, manufacturing, community care, health & childcare.", 44, 840)))
    cta = (f'<rect x="{MX}" y="1320" width="860" height="140" rx="70" fill="{N}"/>'
           f'<text x="{MX+430}" y="1408" class="ti" font-size="44" font-weight="800" fill="{A}" text-anchor="middle">Find your award  →  fitzhr.com</text>')
    body = (f'<rect width="1080" height="1920" fill="{A}"/>{chip}\n  '
            f'<g opacity="1">{reveal(0.12)}{title}</g>\n  '
            f'<g opacity="1">{reveal(0.4)}{sub}</g>\n  '
            f'<g opacity="1"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.7s" fill="freeze"/>'
            f'<animateTransform attributeName="transform" type="scale" begin="0.7s" dur="0.5s" fill="freeze" additive="sum" '
            f'calcMode="spline" keySplines="0.2 1.3 0.4 1" keyTimes="0;1" values="0.9;1"/>{cta}</g>')
    return shell(body)

# rows -----------------------------------------------------------------
ORIG = [("Hospitality", "MA000009"), ("Restaurant", "MA000119")]
ALL7 = [("Hospitality", "MA000009", False), ("Restaurant", "MA000119", False),
        ("Retail", "MA000004", True), ("Manufacturing", "MA000010", True),
        ("SCHADS", "MA000100", True), ("Health Professionals", "MA000027", True),
        ("Children's Services", "MA000120", True)]
AUDIENCE = ["Pubs, cafes & venues", "Shops & retail", "Factories & manufacturing",
            "Community, disability & home care", "Clinics & allied health", "Childcare & early learning"]

def main():
    os.makedirs(OUT, exist_ok=True)
    cards = {}

    cards["card-0-hook"] = build_hook()

    # 1) where we started (2)
    t1 = (f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800" fill="{W}">Then:</text>'
          f'<text x="{MX}" y="700" class="ti" font-size="92" font-weight="800" fill="{A}">2 awards</text>')
    rows1 = "".join(award_row(n, c, False, 900 + i*210) for i, (n, c) in enumerate(ORIG))
    cards["card-1-then"] = build_list("WHERE WE STARTED", t1, rows1, "01 / 03")

    # 2) now: 7 awards (hero)
    t2 = (f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800" fill="{W}">Now:</text>'
          f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800" fill="{A}" dx="10"> </text>')
    t2 = (f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800"><tspan fill="{W}">Now: </tspan><tspan fill="{A}">7 awards</tspan></text>')
    rows2 = "".join(award_row(n, c, nw, 720 + i*138) for i, (n, c, nw) in enumerate(ALL7))
    cards["card-2-now"] = build_list("THE FULL SUITE", t2, rows2, "02 / 03")

    # 3) audience
    t3 = (f'<text x="{MX}" y="600" class="ti" font-size="92" font-weight="800"><tspan fill="{W}">Now built </tspan><tspan fill="{A}">for more</tspan></text>')
    rows3 = "".join(audience_row(l, 780 + i*150) for i, l in enumerate(AUDIENCE))
    cards["card-3-who"] = build_list("WHO IT'S FOR", t3, rows3, "03 / 03")

    cards["card-4-cta"] = build_cta()

    for name, svg in cards.items():
        with open(os.path.join(OUT, name + ".svg"), "w") as f:
            f.write(svg)
        print("wrote", name + ".svg")

if __name__ == "__main__":
    main()

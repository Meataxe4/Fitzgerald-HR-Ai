#!/usr/bin/env python3
"""Reel #2 — "It's 1 July... what you need to know".
A DISTINCT editorial template (vs Reel #1's headline cards):
  - sans-serif Outfit titles (Reel #1 used Playfair serif)
  - an uppercase eyebrow label per slide
  - a body paragraph (auto-wrapped) under a short amber rule
  - a giant faint watermark number + a left amber spine
  - progress dots at the bottom (Reel #1 used a number badge)
  - inverted intro/outro colours (amber intro, navy outro)
Run: python3 scripts/setup_fonts.py && python3 scripts/build_reel2_cards.py
"""
import os
from PIL import ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "reel-cards-2")
FONTDIR = "/usr/share/fonts/truetype/reel"

W, A, N = "#ffffff", "#f59e0b", "#0f172a"
W72 = "rgba(255,255,255,0.72)"
N72 = "rgba(15,23,42,0.72)"

# safe zone: text within x:[35,1045], y:[240,1680]
MX = 110            # content left margin
MR = 980           # content right edge
BODY_W = MR - MX    # 870px wrap width
FONTS = ("""@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&amp;display=swap');""")

_body_font = ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), 42)
_font_cache = {42: _body_font}

def font_at(size):
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), size)
    return _font_cache[size]

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def wrap(text, font=_body_font, maxw=BODY_W):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if font.getbbox(t)[2] <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

def shell(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">\n'
            f'  <defs>\n    <style>\n      {FONTS}\n'
            f'      .ti{{font-family:\'Outfit\',\'Helvetica Neue\',sans-serif;}}\n'
            f'      .bd{{font-family:\'OutfitText\',\'Helvetica Neue\',sans-serif;}}\n    </style>{defs}\n  </defs>\n'
            f'  {body}\n</svg>\n')

def wordmark(x=MX, y=300, size=42, itz=W):
    return (f'<text x="{x}" y="{y}" class="ti" font-size="{size}" font-weight="800">'
            f'<tspan fill="{A}">F</tspan><tspan fill="{itz}">ITZ</tspan><tspan fill="{A}">HR</tspan></text>')

def dots(active, total=5, cx0=MX, y=1600):
    out = []
    for i in range(total):
        on = i == active
        w = 56 if on else 22
        x = cx0 + sum(56 if j == active else 22 for j in range(i)) + i * 16
        fill = A if on else "rgba(255,255,255,0.22)"
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="12" rx="6" fill="{fill}"/>')
    return "".join(out)

def reveal(begin, dy=30):
    return (f'<animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="{begin}s" fill="freeze"/>'
            f'<animateTransform attributeName="transform" type="translate" begin="{begin}s" dur="0.7s" '
            f'fill="freeze" calcMode="spline" keySplines="0.16 0.7 0.2 1" keyTimes="0;1" values="0 {dy};0 0"/>')

# ---- content slides -------------------------------------------------------
CARDS = [
    dict(kind="intro",
         title=[("It's 1 July.", N), ("What you", N), ("need to know.", N)],
         sub="5 changes hitting hospitality."),
    dict(kind="tip", n="01", num="1", eyebrow="PAY RATES",
         title=[("Award rates", W), ("rise 4.75%", A)],
         punch="Base, penalties & overtime all up."),
    dict(kind="tip", n="02", num="2", eyebrow="PAYDAY SUPER",
         title=[("Super is paid", W), ("on payday now", A)],
         punch="In the fund within 7 days."),
    dict(kind="tip", n="03", num="3", eyebrow="PENALTY RATES",
         title=[("Penalty rates", W), ("are locked in", A)],
         punch="Fair Work can't cut them."),
    dict(kind="tip", n="04", num="4", eyebrow="COMPLIANCE",
         title=[("Don't guess", W), ("your rates", A)],
         punch="Fair Work is auditing hospo."),
    dict(kind="tip", n="05", num="5", eyebrow="LEAVE & CASUALS",
         title=[("Casuals can", W), ("go permanent", A)],
         punch="+ parental leave now 26 weeks."),
    dict(kind="outro"),
]

def build_tip(c):
    # left amber spine + huge faint watermark number
    spine = f'<rect x="64" y="300" width="10" height="1300" rx="5" fill="{A}" opacity="0.9"/>'
    wm = (f'<text x="1030" y="1240" class="ti" font-size="820" font-weight="800" fill="{A}" '
          f'opacity="0.07" text-anchor="end">{c["num"]}</text>')
    top = wordmark() + f'<text x="{MR}" y="300" class="ti" font-size="40" font-weight="800" fill="{A}" text-anchor="end" letter-spacing="2">{c["n"]} / 05</text>'
    eyebrow = (f'<text x="{MX}" y="700" class="ti" font-size="38" font-weight="800" fill="{A}" letter-spacing="6">{esc(c["eyebrow"])}</text>')
    # big punchy title (carries 90% of the message)
    tlines = "".join(
        f'<text x="{MX}" y="{820 + i*116}" class="ti" font-size="108" font-weight="800" fill="{col}">{esc(t)}</text>'
        for i, (t, col) in enumerate(c["title"]))
    rule_y = 820 + len(c["title"]) * 116 + 4
    rule = f'<rect x="{MX}" y="{rule_y}" width="180" height="8" rx="4" fill="{A}"/>'
    # one short kicker line (the extra 10%)
    punch = (f'<text x="{MX}" y="{rule_y + 92}" class="bd" font-size="48" fill="rgba(255,255,255,0.62)">{esc(c["punch"])}</text>')
    body = (f'<rect width="1080" height="1920" fill="{N}"/>{wm}{spine}\n  {top}\n  '
            f'<g opacity="1">{reveal(0.15)}{eyebrow}{tlines}{rule}</g>\n  '
            f'<g opacity="1">{reveal(0.4)}{punch}</g>\n  {dots(int(c["num"])-1)}')
    return shell(body)

def build_intro(c):
    defs = ('\n    <radialGradient id="ig" cx="50%" cy="18%" r="90%">'
            f'<stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="{A}"/></radialGradient>')
    chip = (f'<rect x="{MX}" y="246" width="190" height="78" rx="16" fill="{N}"/>'
            + wordmark(x=MX+24, y=300))
    tlines = "".join(
        f'<text x="{MX}" y="{760 + i*132}" class="ti" font-size="118" font-weight="800" fill="{col}">{esc(t)}</text>'
        for i, (t, col) in enumerate(c["title"]))
    sub = "".join(
        f'<text x="{MX}" y="{1230 + i*54}" class="bd" font-size="44" fill="{N72}">{esc(line)}</text>'
        for i, line in enumerate(wrap(c["sub"], maxw=820)))
    tag = (f'<text x="{MX}" y="1470" class="ti" font-size="38" font-weight="800" fill="{N}" letter-spacing="6">WATCH TO THE END  →</text>')
    body = (f'<rect width="1080" height="1920" fill="url(#ig)"/>{chip}\n  '
            f'<g opacity="1">{reveal(0.15)}{tlines}</g>\n  '
            f'<g opacity="1">{reveal(0.45)}{sub}</g>\n  '
            f'<g opacity="1"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.7s" fill="freeze"/>{tag}</g>')
    return shell(body, defs)

def build_outro(c):
    spine = f'<rect x="64" y="300" width="10" height="1300" rx="5" fill="{A}" opacity="0.9"/>'
    big = (f'<text x="{MX}" y="640" class="ti" font-size="120" font-weight="800">'
           f'<tspan fill="{A}">F</tspan><tspan fill="{W}">ITZ</tspan><tspan fill="{A}">HR</tspan></text>')
    head = ("".join(
        f'<text x="{MX}" y="{820 + i*108}" class="ti" font-size="92" font-weight="800" fill="{col}">{esc(t)}</text>'
        for i, (t, col) in enumerate([("Stay compliant", W), ("from 1 July.", A)])))
    cta = (f'<rect x="{MX}" y="1300" width="860" height="140" rx="70" fill="{A}"/>'
           f'<text x="{MX+430}" y="1388" class="ti" font-size="44" font-weight="800" fill="{N}" text-anchor="middle">Check your rates free  →  fitzhr.com</text>')
    disc_lines = wrap("General information only — confirm rates against the official Fair Work determination.",
                      font=font_at(30), maxw=BODY_W)
    disc = "".join(
        f'<text x="{MX}" y="{1540 + i*40}" class="bd" font-size="30" fill="rgba(255,255,255,0.5)">{esc(line)}</text>'
        for i, line in enumerate(disc_lines))
    body = (f'<rect width="1080" height="1920" fill="{N}"/>{spine}\n  '
            f'<g opacity="1">{reveal(0.1)}{big}{head}</g>\n  '
            f'<g opacity="1"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.6s" fill="freeze"/>'
            f'<animateTransform attributeName="transform" type="scale" begin="0.6s" dur="0.5s" fill="freeze" additive="sum" '
            f'calcMode="spline" keySplines="0.2 1.3 0.4 1" keyTimes="0;1" values="0.9;1"/>{cta}</g>\n  {disc}')
    return shell(body)

BUILDERS = {"intro": build_intro, "tip": build_tip, "outro": build_outro}
NAMES = ["card-0-hook", "card-1-tip", "card-2-tip", "card-3-tip", "card-4-tip", "card-5-tip", "card-6-cta"]

os.makedirs(OUT, exist_ok=True)
for name, card in zip(NAMES, CARDS):
    svg = BUILDERS[card["kind"]](card)
    with open(os.path.join(OUT, name + ".svg"), "w") as f:
        f.write(svg)
    print("wrote", name + ".svg")

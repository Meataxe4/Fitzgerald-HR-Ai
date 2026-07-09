#!/usr/bin/env python3
"""'The Award Index' — a square 1080x1080 Instagram CAROUSEL showcasing the 7 awards.
Completely different theme from the reels: warm light/editorial magazine look
(cream background, Playfair serif award names, thin rules, generous whitespace),
still on brand (navy ink + amber accent, Fitz voice).
Run: python3 scripts/setup_fonts.py && python3 scripts/build_award_index_carousel.py
"""
import os
from PIL import ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "carousel-award-index")
FONTDIR = "/usr/share/fonts/truetype/reel"
CREAM, INK, AMBER = "#faf6ee", "#0f172a", "#f59e0b"
INK60 = "rgba(15,23,42,0.60)"
INK45 = "rgba(15,23,42,0.45)"
RULE = "rgba(15,23,42,0.14)"
M = 96                    # margin
FONTS = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&amp;family=Outfit:wght@500;700;800&amp;display=swap');"
_pf = {}
_ot = {}
def pf(s):
    _pf.setdefault(s, ImageFont.truetype(os.path.join(FONTDIR, "PlayfairDisplay-900.ttf"), s)); return _pf[s]
def ot(s):
    _ot.setdefault(s, ImageFont.truetype(os.path.join(FONTDIR, "OutfitText-500.ttf"), s)); return _ot[s]

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

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

def fit_name(name, maxw=888, hi=132, lo=78):
    for s in range(hi, lo - 1, -3):
        ls = wrap(name, pf(s), maxw)
        if all(pf(s).getbbox(l)[2] <= maxw for l in ls):
            return s, ls
    return lo, wrap(name, pf(lo), maxw)

def shell(inner, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">'
            f'<defs><style>{FONTS}'
            f'.pf{{font-family:\'Playfair Display\',Georgia,serif;}}'
            f'.ti{{font-family:\'Outfit\',\'Helvetica Neue\',sans-serif;}}'
            f'.bd{{font-family:\'OutfitText\',\'Helvetica Neue\',sans-serif;}}</style>{defs}</defs>{inner}</svg>')

def wordmark(x=M, y=112, size=40):
    return (f'<text x="{x}" y="{y}" class="ti" font-size="{size}" font-weight="800">'
            f'<tspan fill="{AMBER}">F</tspan><tspan fill="{INK}">ITZ</tspan><tspan fill="{AMBER}">HR</tspan></text>')

def header(right):
    return (wordmark()
            + f'<text x="{1080-M}" y="112" class="ti" font-size="30" font-weight="800" fill="{INK60}" text-anchor="end" letter-spacing="3">{right}</text>'
            + f'<rect x="{M}" y="150" width="{1080-2*M}" height="2" fill="{RULE}"/>')

def footer():
    return (f'<rect x="{M}" y="{1080-150}" width="{1080-2*M}" height="2" fill="{RULE}"/>'
            f'<text x="{M}" y="{1080-96}" class="ti" font-size="30" font-weight="800" fill="{INK45}" letter-spacing="2">fitzhr.com</text>'
            f'<text x="{1080-M}" y="{1080-96}" class="bd" font-size="28" fill="{INK45}" text-anchor="end">One platform. Every award.</text>')

def new_pill(x, y):
    return (f'<rect x="{x}" y="{y-40}" width="118" height="58" rx="29" fill="{AMBER}"/>'
            f'<text x="{x+59}" y="{y}" class="ti" font-size="28" font-weight="800" fill="{INK}" text-anchor="middle" letter-spacing="1">NEW</text>')

# ---------------------------------------------------------------- cards
def cover():
    wm = (f'<text x="960" y="1010" class="pf" font-size="720" font-weight="900" fill="{AMBER}" opacity="0.08" text-anchor="end">7</text>')
    body = (f'<rect width="1080" height="1080" fill="{CREAM}"/>{wm}'
            + header("2026 EDITION")
            + f'<text x="{M}" y="330" class="ti" font-size="34" font-weight="800" fill="{AMBER}" letter-spacing="8">THE AWARD INDEX</text>'
            + f'<text x="{M}" y="470" class="pf" font-size="128" font-weight="900" fill="{INK}">Seven awards.</text>'
            + f'<text x="{M}" y="600" class="pf" font-size="128" font-weight="900" fill="{AMBER}">One platform.</text>'
            + "".join(f'<text x="{M}" y="{700+i*52}" class="bd" font-size="42" fill="{INK60}">{esc(l)}</text>'
                      for i, l in enumerate(wrap("Every rate, penalty and classification — kept current with Fair Work.", ot(42), 860)))
            + f'<text x="{M}" y="900" class="ti" font-size="34" font-weight="800" fill="{INK}" letter-spacing="4">SWIPE THE INDEX  →</text>'
            + footer())
    return shell(body)

def award_card(idx, name, code, sector, is_new):
    size, lines = fit_name(name)
    numeral = (f'<text x="990" y="1010" class="pf" font-size="640" font-weight="900" fill="{AMBER}" '
               f'opacity="0.07" text-anchor="end">{idx}</text>')
    name_y0 = 560 - (len(lines) - 1) * (size * 0.5)
    name_svg = "".join(
        f'<text x="{M}" y="{name_y0 + i*(size*1.02):.0f}" class="pf" font-size="{size}" font-weight="900" fill="{INK}">{esc(l)}</text>'
        for i, l in enumerate(lines))
    label = (f'<text x="{M}" y="300" class="ti" font-size="32" font-weight="800" fill="{AMBER}" letter-spacing="6">AWARD {idx:02d}</text>')
    code_y = name_y0 + (len(lines) - 1) * (size * 1.02) + 92
    code_svg = f'<text x="{M}" y="{code_y:.0f}" class="ti" font-size="46" font-weight="800" fill="{AMBER}">{code}</text>'
    sect_svg = "".join(
        f'<text x="{M}" y="{code_y+80+i*50:.0f}" class="bd" font-size="42" fill="{INK60}">{esc(l)}</text>'
        for i, l in enumerate(wrap(sector, ot(42), 820)))
    pill = new_pill(1080 - M - 118, 300) if is_new else ""
    body = (f'<rect width="1080" height="1080" fill="{CREAM}"/>{numeral}'
            + header(f"{idx:02d} / 07") + label + pill + name_svg + code_svg + sect_svg + footer())
    return shell(body)

def cta():
    body = (f'<rect width="1080" height="1080" fill="{INK}"/>'
            + f'<text x="{M}" y="112" class="ti" font-size="40" font-weight="800"><tspan fill="{AMBER}">F</tspan><tspan fill="#ffffff">ITZ</tspan><tspan fill="{AMBER}">HR</tspan></text>'
            + f'<rect x="{M}" y="150" width="{1080-2*M}" height="2" fill="rgba(255,255,255,0.14)"/>'
            + f'<text x="{M}" y="360" class="ti" font-size="34" font-weight="800" fill="{AMBER}" letter-spacing="8">YOUR AWARD, COVERED</text>'
            + f'<text x="{M}" y="500" class="pf" font-size="132" font-weight="900" fill="#ffffff">Find your</text>'
            + f'<text x="{M}" y="636" class="pf" font-size="132" font-weight="900" fill="{AMBER}">award.</text>'
            + "".join(f'<text x="{M}" y="{740+i*52}" class="bd" font-size="42" fill="rgba(255,255,255,0.72)">{esc(l)}</text>'
                      for i, l in enumerate(wrap("Exact legal rates for every classification, shift and penalty — free.", ot(42), 880)))
            + f'<rect x="{M}" y="900" width="888" height="140" rx="70" fill="{AMBER}"/>'
            + f'<text x="{M+444}" y="988" class="ti" font-size="46" font-weight="800" fill="{INK}" text-anchor="middle">Check a rate free  →  fitzhr.com</text>')
    return shell(body)

AWARDS = [
    ("Hospitality", "MA000009", "Pubs, bars, hotels, cafes & catering.", False),
    ("Restaurant", "MA000119", "Restaurants & licensed dining.", False),
    ("Retail", "MA000004", "Shops, stores & retail floors.", True),
    ("Manufacturing", "MA000010", "Factories, production & food manufacturing.", True),
    ("SCHADS", "MA000100", "Social, community, home care & disability.", True),
    ("Health Professionals", "MA000027", "Clinics, allied health & practices.", True),
    ("Children's Services", "MA000120", "Childcare & early learning centres.", True),
]

def main():
    os.makedirs(OUT, exist_ok=True)
    cards = {"card-00-cover": cover()}
    for i, (name, code, sector, is_new) in enumerate(AWARDS, start=1):
        cards[f"card-{i:02d}-{code}"] = award_card(i, name, code, sector, is_new)
    cards["card-08-cta"] = cta()
    for fn, svg in cards.items():
        with open(os.path.join(OUT, fn + ".svg"), "w") as f:
            f.write(svg)
        print("wrote", fn + ".svg")

if __name__ == "__main__":
    main()

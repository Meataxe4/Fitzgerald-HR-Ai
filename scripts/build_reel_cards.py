#!/usr/bin/env python3
"""Generate the 7 Instagram-reel card SVGs from one template so every card
shares identical layout, type scale and motion. Run: python3 scripts/build_reel_cards.py"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "reel-cards")

W = "#ffffff"
A = "#f59e0b"
N = "#0f172a"

# Shared grid constants — identical on every card
HEAD_SIZE = 92
HEAD_X = 96
HEAD_BASELINES = [960, 1084, 1208]   # 3 lines, vertically balanced
WORDMARK_Y = 150
BADGE = dict(x=96, y=336, s=160, rx=32, num_size=96, num_baseline=452, num_cx=176)

FONTS = ("""@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&amp;"""
         """family=Outfit:wght@600;700;800&amp;display=swap');""")

def esc(s):
    return s.replace("&", "&amp;")

def wordmark(fill_itz=W):
    return (f'<text x="96" y="{WORDMARK_Y}" class="of" font-size="42" font-weight="800">'
            f'<tspan fill="{A}">F</tspan><tspan fill="{fill_itz}">ITZ</tspan><tspan fill="{A}">HR</tspan></text>')

def heading(lines, color_map):
    out = ['<g opacity="1">',
           '<animate attributeName="opacity" from="0" to="1" dur="0.7s" begin="0.25s" fill="freeze"/>',
           '<animateTransform attributeName="transform" type="translate" begin="0.25s" dur="0.8s" '
           'fill="freeze" calcMode="spline" keySplines="0.16 0.7 0.2 1" keyTimes="0;1" values="0 34;0 0"/>']
    for (text, c), y in zip(lines, HEAD_BASELINES):
        out.append(f'<text x="{HEAD_X}" y="{y}" class="pf" font-size="{HEAD_SIZE}" '
                   f'font-weight="900" fill="{color_map[c]}">{esc(text)}</text>')
    out.append('</g>')
    return "\n  ".join(out)

def badge(num):
    b = BADGE
    return ('<g opacity="1">'
            '<animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0s" fill="freeze"/>'
            '<animateTransform attributeName="transform" type="scale" begin="0s" dur="0.55s" '
            'fill="freeze" additive="sum" calcMode="spline" keySplines="0.2 1.5 0.4 1" keyTimes="0;1" values="0.5;1"/>'
            f'<rect x="{b["x"]}" y="{b["y"]}" width="{b["s"]}" height="{b["s"]}" rx="{b["rx"]}" fill="{A}"/>'
            f'<text x="{b["num_cx"]}" y="{b["num_baseline"]}" class="pf" font-size="{b["num_size"]}" '
            f'font-weight="900" fill="{N}" text-anchor="middle">{num}</text></g>')

def counter(label):
    return (f'<text x="984" y="{WORDMARK_Y}" class="of" font-size="40" font-weight="800" '
            f'fill="{A}" text-anchor="end" letter-spacing="2">{label}</text>')

def shell(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">\n'
            f'  <defs>\n    <style>\n      {FONTS}\n'
            f'      .pf{{font-family:\'Playfair Display\',Georgia,serif;}}\n'
            f'      .of{{font-family:\'Outfit\',\'Helvetica Neue\',sans-serif;}}\n    </style>{defs}\n  </defs>\n'
            f'  {body}\n</svg>\n')

CARDS = [
    dict(id="card-0-hook", kind="hook",
         lines=[("Award wages", "w"), ("just rose", "w"), ("+4.75%.", "a")],
         tag="5 THINGS TO GET RIGHT  →"),
    dict(id="card-1-tip", kind="tip", n="01", num="1",
         lines=[("Starts your first", "w"), ("full pay period —", "w"), ("not 1 July.", "a")]),
    dict(id="card-2-tip", kind="tip", n="02", num="2",
         lines=[("Every level rises", "w"), ("in both awards:", "w"), ("+4.75%.", "a")]),
    dict(id="card-3-tip", kind="tip", n="03", num="3",
         lines=[("Penalty rates", "w"), ("rise off the", "w"), ("new base too.", "a")]),
    dict(id="card-4-tip", kind="tip", n="04", num="4",
         lines=[("Re-test every", "w"), ("flat & salaried", "w"), ("rate now.", "a")]),
    dict(id="card-5-tip", kind="tip", n="05", num="5",
         lines=[("Super rises with", "w"), ("it — underpaying", "w"), ("bites hard.", "a")]),
    dict(id="card-6-cta", kind="cta",
         lines=[("Be ready for", "n"), ("the 1 July", "n"), ("pay run.", "n")],
         chip="Check a rate free  →  fitzhr.com"),
]

cmap = {"w": W, "a": A, "n": N}

def build(card):
    if card["kind"] == "hook":
        defs = ('\n    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">'
                '<stop offset="0%" stop-color="#0f172a"/><stop offset="62%" stop-color="#0f172a"/>'
                '<stop offset="100%" stop-color="#1a1205"/></linearGradient>'
                '\n    <radialGradient id="amberGlow" cx="50%" cy="100%" r="75%">'
                '<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.22"/>'
                '<stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>')
        body = (f'<rect width="1080" height="1920" fill="url(#glow)"/>'
                f'<rect width="1080" height="1920" fill="url(#amberGlow)"/>\n  '
                + wordmark() + "\n  " + heading(card["lines"], cmap) + "\n  "
                + f'<g opacity="1"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.7s" fill="freeze"/>'
                  f'<text x="96" y="1470" class="of" font-size="38" font-weight="800" '
                  f'fill="rgba(255,255,255,0.85)" letter-spacing="6">{esc(card["tag"])}</text></g>')
        return shell(body, defs)

    if card["kind"] == "cta":
        body = (f'<rect width="1080" height="1920" fill="{A}"/>\n  '
                f'<rect x="96" y="112" width="232" height="78" rx="16" fill="{N}"/>'
                f'<text x="212" y="166" class="of" font-size="40" font-weight="800" text-anchor="middle">'
                f'<tspan fill="{A}">F</tspan><tspan fill="{W}">ITZ</tspan><tspan fill="{A}">HR</tspan></text>\n  '
                + heading(card["lines"], cmap) + "\n  "
                + '<g opacity="1"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.75s" fill="freeze"/>'
                  '<animateTransform attributeName="transform" type="scale" begin="0.75s" dur="0.5s" fill="freeze" '
                  'additive="sum" calcMode="spline" keySplines="0.2 1.3 0.4 1" keyTimes="0;1" values="0.88;1"/>'
                  f'<rect x="96" y="1380" width="888" height="140" rx="70" fill="{N}"/>'
                  f'<text x="540" y="1468" class="of" font-size="44" font-weight="800" fill="{A}" '
                  f'text-anchor="middle">{esc(card["chip"])}</text></g>')
        return shell(body)

    # tip
    body = (f'<rect width="1080" height="1920" fill="{N}"/>'
            f'<rect x="48" y="48" width="984" height="1824" rx="56" fill="#141f35" stroke="{A}" stroke-opacity="0.18"/>\n  '
            + wordmark() + "\n  " + counter(card["n"]) + "\n  "
            + badge(card["num"]) + "\n  " + heading(card["lines"], cmap))
    return shell(body)

for card in CARDS:
    svg = build(card)
    with open(os.path.join(OUT, card["id"] + ".svg"), "w") as f:
        f.write(svg)
    print("wrote", card["id"] + ".svg")

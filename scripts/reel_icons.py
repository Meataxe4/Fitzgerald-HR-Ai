#!/usr/bin/env python3
"""Simple line-glyph sector icons shared by the award carousel and the light reel.
icon(name, cx, cy, scale, stroke, sw) -> SVG string, drawn centered at (cx,cy)."""
import math

def _teeth():
    out = []
    for k in range(8):
        a = math.radians(k * 45)
        c, s = math.cos(a), math.sin(a)
        out.append(f'<line x1="{15*c:.1f}" y1="{15*s:.1f}" x2="{23*c:.1f}" y2="{23*s:.1f}"/>')
    return "".join(out)

# each drawn around origin (0,0), roughly within a 90px box
_SHAPES = {
    "hospitality": (  # coffee cup
        '<path d="M -30 -14 H 26 V 14 A10 10 0 0 1 16 24 H -20 A10 10 0 0 1 -30 14 Z"/>'
        '<path d="M 26 -6 A15 15 0 0 1 26 20"/>'
        '<line x1="-34" y1="32" x2="34" y2="32"/>'
        '<path d="M -8 -28 q6 -6 0 -14"/><path d="M 8 -28 q6 -6 0 -14"/>'),
    "restaurant": (  # fork & knife
        '<line x1="-22" y1="-30" x2="-22" y2="-15"/><line x1="-16" y1="-30" x2="-16" y2="-15"/>'
        '<line x1="-10" y1="-30" x2="-10" y2="-15"/><line x1="-16" y1="-15" x2="-16" y2="30"/>'
        '<path d="M 16 -30 L 16 30"/><path d="M 16 -30 q -12 4 0 22"/>'),
    "retail": (  # shopping bag
        '<path d="M -26 -4 H 26 V 30 H -26 Z"/>'
        '<path d="M -12 -4 V -13 A12 12 0 0 1 12 -13 V -4"/>'),
    "manufacturing": (  # gear
        '<circle cx="0" cy="0" r="15"/>' + _teeth() + '<circle cx="0" cy="0" r="5"/>'),
    "schads": (  # heart
        '<path d="M 0 26 C -26 6 -20 -18 0 -6 C 20 -18 26 6 0 26 Z"/>'),
    "health": (  # medical cross
        '<path d="M -8 -26 H 8 V -8 H 26 V 8 H 8 V 26 H -8 V 8 H -26 V -8 H -8 Z"/>'),
    "children": (  # stacked toy blocks (early learning)
        '<rect x="-28" y="0" width="26" height="26" rx="4"/>'
        '<rect x="2" y="-26" width="26" height="26" rx="4"/>'
        '<line x1="-19" y1="9" x2="-11" y2="9"/><line x1="-15" y1="5" x2="-15" y2="13"/>'
        '<line x1="9" y1="-13" x2="21" y2="-13"/>'),
}

ICON_FOR = {
    "MA000009": "hospitality", "MA000119": "restaurant", "MA000004": "retail",
    "MA000010": "manufacturing", "MA000100": "schads", "MA000027": "health",
    "MA000120": "children",
}

def icon(name, cx, cy, scale=1.0, stroke="#f59e0b", sw=6):
    shape = _SHAPES[name]
    return (f'<g transform="translate({cx},{cy}) scale({scale})" fill="none" '
            f'stroke="{stroke}" stroke-width="{sw/scale:.2f}" stroke-linecap="round" '
            f'stroke-linejoin="round">{shape}</g>')

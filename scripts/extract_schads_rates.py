#!/usr/bin/env python3
"""
Extract MA000100 (Social, Community, Home Care & Disability Services — SCHADS)
pay rates from the Fair Work Ombudsman Pay Guide PDF into structured, *validated*
data.

Why coordinate-based: the PDF's rate tables extract column-jumbled with naive text
extraction, which is unsafe for a compliance tool. We read each text line with its
(x,y) position, cluster lines into rows by y, and order cells by x — which
reconstructs the table exactly. Every row is then validated against the penalty
columns published in the same row (Sat/Sun/PH must be the published multiple of the
hourly rate, and hourly*38 must reproduce the weekly), so a bad parse is caught,
not shipped.

Scope: the four base-rate streams of SCHADS — Social and community services,
Crisis accommodation, Family day care, and Home care (disability + aged sub-streams).
Only Table 1 (base hourly + Sat/Sun/PH/afternoon/night) of each section is captured;
the remote-work / 24-hour-care / broken-shift overtime tables are not modelled.

Usage:  python3 scripts/extract_schads_rates.py            # validation report
        python3 scripts/extract_schads_rates.py --json      # emit rates JSON to stdout
Requires: pdfminer.six
"""
import re, sys, json
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextLine, LTTextContainer

PDF = "docs/source/ma000100 Pay Rates.pdf"
MONEY = re.compile(r'\$[\d,]+\.\d{2}')
WEEKLY_HOURS = 38
LABEL_RE = re.compile(r'^(Level \d+ - pay point \d+|Level \d+ - [A-Za-z][A-Za-z ]+?)(?:\s*\$|\s*$)')

# Section header -> (stream, employment_type). Matched on the Table-1 page header.
SECTIONS = {
    "Social and community services employee - Full-time & part-time": ("social_community_services", "full_time"),
    "Social and community services employee - Casual": ("social_community_services", "casual"),
    "Crisis accommodation employee - Full-time & part-time": ("crisis_accommodation", "full_time"),
    "Crisis accommodation employee - Casual": ("crisis_accommodation", "casual"),
    "Family day care employee - Full-time & part-time": ("family_day_care", "full_time"),
    "Family day care employee - Casual": ("family_day_care", "casual"),
    "Home care employee - Full-time & part-time": ("home_care", "full_time"),
    "Home care employee - Casual": ("home_care", "casual"),
}
TABLE_RE = re.compile(r'Table (\d+) of \d+')
SUBHEAD = {"Disability care", "Aged care"}


def num(s):
    return float(s.replace('$', '').replace(',', ''))


def page_rows(pno):
    """Return de-jumbled rows for a page: list of [cell, cell, ...] left-to-right."""
    L = []
    for page in extract_pages(PDF, page_numbers=[pno]):
        def walk(o):
            for el in o:
                if isinstance(el, LTTextLine):
                    t = el.get_text().strip()
                    if t:
                        L.append((round(el.x0), round(el.y0), t))
                elif isinstance(el, LTTextContainer):
                    walk(el)
        walk(page)
    L.sort(key=lambda r: (-r[1], r[0]))
    rows = []
    for x, y, t in L:
        for row in rows:
            if abs(row[0] - y) <= 4:
                row[1].append((x, t)); break
        else:
            rows.append([y, [(x, t)]])
    return [[c[1] for c in sorted(r[1])] for r in rows]


def extract():
    """Walk every page; capture only Table 1 base-rate rows of each known section."""
    out = []          # list of dicts
    stream = emp = None
    table = None
    sub = None        # sub-stream label (Disability care / Aged care) for home care
    for pno in range(0, 25):
        rows = page_rows(pno)
        for r in rows:
            if not r:
                continue
            head = r[0]
            if head in SECTIONS:
                stream, emp = SECTIONS[head]
                table = None; sub = None
                continue
            tm = TABLE_RE.search(head)
            if tm:
                table = int(tm.group(1)); continue
            if head in SUBHEAD:
                sub = head; continue
            if stream is None or table != 1:
                continue
            m = LABEL_RE.match(head)
            if not m:
                continue
            label = m.group(1).strip()
            # Money may be glued to the label cell (weekly column) or stand alone;
            # scan every cell left-to-right so column order is preserved.
            monies = [num(x) for c in r for x in MONEY.findall(c)]
            if emp == "full_time":
                # Weekly | Hourly | Sat | Sun | PH | Afternoon | Night
                if len(monies) < 5:
                    continue
                weekly, hourly, sat, sun, ph = monies[:5]
                wk_ok = abs(hourly * WEEKLY_HOURS - weekly) < 0.6
            else:
                # Casual: Hourly | Sat | Sun | PH | Afternoon | Night | Overtime
                if len(monies) < 4:
                    continue
                weekly = None
                hourly, sat, sun, ph = monies[:4]
                wk_ok = True
            # Validate penalty columns. Casual hourly already carries +25% loading,
            # so the published Sat/Sun/PH are (1.5/2.0/2.5 + 0.25) on the *base*,
            # which is (1.4/1.8/2.2) x the loaded casual hourly.
            if emp == "full_time":
                pen_ok = (abs(sat/hourly - 1.5) < 0.02 and abs(sun/hourly - 2.0) < 0.02
                          and abs(ph/hourly - 2.5) < 0.02)
            else:
                pen_ok = (abs(sat/hourly - 1.4) < 0.02 and abs(sun/hourly - 1.8) < 0.02
                          and abs(ph/hourly - 2.2) < 0.02)
            out.append({
                "stream": stream, "employment_type": emp,
                "sub": sub if stream == "home_care" else None,
                "label": label, "hourly": hourly, "weekly": weekly,
                "valid": wk_ok and pen_ok,
            })
    return out


if __name__ == "__main__":
    data = extract()
    good = sum(1 for d in data if d["valid"])
    if "--json" not in sys.argv:
        from collections import defaultdict
        by = defaultdict(list)
        for d in data:
            by[(d["stream"], d["employment_type"])].append(d)
        for (stream, emp), rows in by.items():
            g = sum(1 for r in rows if r["valid"])
            print(f"\n## {stream} / {emp}  ({g}/{len(rows)} validated)")
            for r in rows:
                flag = "" if r["valid"] else "  <-- REVIEW"
                wk = f"wk ${r['weekly']:.2f}" if r["weekly"] else "(casual)"
                s = f" [{r['sub']}]" if r["sub"] else ""
                print(f"   {r['label']:24s}{s:16s} ${r['hourly']:6.2f}  {wk}{flag}")
        print(f"\n=== TOTAL: {good}/{len(data)} rows validated "
              f"(FT/PT Sat1.5/Sun2.0/PH2.5 & hourly*38==weekly; "
              f"Casual Sat1.4/Sun1.8/PH2.2 on loaded hourly) ===")
    else:
        print(json.dumps(data, indent=2))

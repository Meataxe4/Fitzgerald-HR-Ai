#!/usr/bin/env python3
"""
Extract MA000010 (Manufacturing) pay rates from the Fair Work Ombudsman Pay Guide
PDF into structured, *validated* data.

Why coordinate-based: the PDF's rate tables extract column-jumbled with naive text
extraction, which is unsafe for a compliance tool. We instead read each text line
with its (x,y) position, cluster lines into rows by y, and order cells by x — which
reconstructs the table exactly. Every row is then validated (hourly * 38 == weekly,
penalty columns are clean multiples of the hourly rate) so a bad parse is caught,
not shipped.

Scope: GENERAL manufacturing only. Vehicle manufacturing (Schedule B, pages ~84+)
is intentionally excluded — out of coverage for our product.

Usage:  python3 scripts/extract_manufacturing_rates.py
Requires: pdfminer.six
"""
import re, sys
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextLine, LTTextContainer

PDF = "docs/source/Manufacturing Award Rates.pdf"
MONEY = re.compile(r'^\$[\d,]+\.\d{2}$')
WEEKLY_HOURS = 38

def num(s): return float(s.replace('$', '').replace(',', ''))

def page_rows(pno):
    """Return de-jumbled rows for a page: list of [cell, cell, ...] left-to-right."""
    L = []
    for page in extract_pages(PDF, page_numbers=[pno]):
        def walk(o):
            for el in o:
                if isinstance(el, LTTextLine):
                    t = el.get_text().strip()
                    if t: L.append((round(el.x0), round(el.y0), t))
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

def extract_classification_table(pnos):
    """Adult Table 1 layout: Classification | Weekly | Hourly | Sat | Sun | PH."""
    out = []
    for pno in pnos:
        for r in page_rows(pno):
            if not r: continue
            label = r[0]
            monies = [c for c in r if MONEY.match(c)]
            is_clevel = re.match(r'^C\d', label)
            if is_clevel and len(monies) >= 5:
                wk, hr, sat, sun, ph = (num(monies[i]) for i in range(5))
                out.append({
                    "label": label, "weekly": wk, "hourly": hr,
                    "saturday": sat, "sunday": sun, "public_holiday": ph,
                    "valid_weekly": abs(hr * WEEKLY_HOURS - wk) < 0.6,
                    "sat_mult": round(sat / hr, 3), "sun_mult": round(sun / hr, 3),
                    "ph_mult": round(ph / hr, 3),
                })
    return out

def clevel(label):
    m = re.match(r'^(C\d+\([ab]\)|C\d+)', label)
    return m.group(1) if m else label

if __name__ == "__main__":
    ftpt = extract_classification_table([1, 2, 3])  # pages 2-4
    # Collapse title variants to one entry per C-level (variants share the rate).
    by_level = {}
    for row in ftpt:
        lv = clevel(row["label"])
        by_level.setdefault(lv, {"titles": [], **row})
        by_level[lv]["titles"].append(row["label"])

    print(f"Extracted {len(ftpt)} title rows -> {len(by_level)} C-levels")
    bad = [r for r in ftpt if not r["valid_weekly"]]
    print(f"Validation: {len(ftpt)-len(bad)}/{len(ftpt)} rows pass hourly*38==weekly")
    for r in bad:
        print("  NEEDS-REVIEW:", r["label"], r["weekly"], r["hourly"])


# --- Unified extraction across ALL General Manufacturing sections -------------
SECTION_RE = re.compile(r'^(Adult apprentice|Apprentice|Adult|Junior|Trainee|Cadet)\b.*General manufacturing', re.I)
TABLE_RE = re.compile(r'Table (\d+) of \d+')
LABEL_RE = re.compile(
    r'^(C\d+\([ab]\)|C\d+|Apprentice|Higher engineering|Advanced engineering|'
    r'Advanced Certificate|Associate Diploma|Technical field|Completed Diploma|'
    r'Degree|Under \d+ years|\d+ years of age|Cadet|Trainee|'
    r'Technology cadet|Completed technology)', re.I)
EMBEDDED_HOURLY = re.compile(r'\$[\d,]+\.\d{2}')

def _merge_continuation(rows, i):
    """Append following money-less, non-label lines to the label."""
    label = rows[i][0]
    j = i + 1
    while j < len(rows):
        nxt = rows[j]
        if not nxt: break
        has_money = any(MONEY.match(c) for c in nxt)
        if has_money or LABEL_RE.match(nxt[0]) or SECTION_RE.search(nxt[0]) \
           or TABLE_RE.search(nxt[0]) or 'Award Code' in nxt[0] or nxt[0] == 'Classification':
            break
        label = (label + ' ' + nxt[0]).strip()
        j += 1
    return label

def extract_all_general_manufacturing(max_page=83):
    """Walk pages 1..max_page, return validated base-rate rows grouped by section.
    Only Table 1 (base hourly + Sat/Sun/PH) of each section is captured. Table
    state is carried across pages and only reset on a new section header, so
    continuation pages of Tables 2-5 are never mistaken for Table 1."""
    sections = {}
    current = None
    table = None
    for pno in range(0, max_page):
        rows = page_rows(pno)
        for i, r in enumerate(rows):
            if not r: continue
            head = r[0]
            sec = SECTION_RE.search(head)
            if sec and not TABLE_RE.search(head):
                current = _merge_continuation(rows, i)
                table = None
                sections.setdefault(current, [])
                continue
            tm = TABLE_RE.search(head)
            if tm:
                table = int(tm.group(1)); continue
            if current is None or table != 1:   # capture ONLY confirmed Table 1
                continue
            if not LABEL_RE.match(head):
                continue
            monies = [c for c in r if MONEY.match(c)]
            # Some rows (trainees) have the hourly rate embedded in the label cell
            # rather than a separate column; pull it out so columns line up.
            embedded = EMBEDDED_HOURLY.search(head)
            if embedded and len(monies) >= 3:
                hourly = num(embedded.group(0))
                v = [num(m) for m in monies]
                weekly, sat, sun, ph = None, v[0], v[1], v[2]
                head = head[:embedded.start()].strip()
            elif len(monies) >= 4:
                v = [num(m) for m in monies]
                if len(v) >= 5 and 30 <= v[0] / v[1] <= 46:   # weekly-first
                    weekly, hourly, sat, sun, ph = v[0], v[1], v[2], v[3], v[4]
                else:                                          # hourly-first
                    weekly, hourly, sat, sun, ph = None, v[0], v[1], v[2], v[3]
            else:
                continue
            ok = abs(sat/hourly - 1.5) < 0.02 and abs(sun/hourly - 2.0) < 0.02 and abs(ph/hourly - 2.5) < 0.02
            wk_ok = (weekly is None) or abs(hourly*38 - weekly) < 0.6
            sections[current].append({
                "label": _merge_continuation(rows, i), "hourly": hourly, "weekly": weekly,
                "sat": round(sat/hourly,3), "sun": round(sun/hourly,3), "ph": round(ph/hourly,3),
                "valid": ok and wk_ok})
    return sections

if __name__ == "__main__" and "--all" in sys.argv:
    secs = extract_all_general_manufacturing()
    total = good = 0
    for name, rows in secs.items():
        g = sum(1 for r in rows if r["valid"])
        total += len(rows); good += g
        print(f"\n## {name}  ({g}/{len(rows)} validated)")
        for r in rows:
            flag = "" if r["valid"] else "  <-- REVIEW"
            wk = f"wk ${r['weekly']:.2f}" if r['weekly'] else "(no weekly)"
            print(f"   {r['label'][:50]:50s} ${r['hourly']:6.2f}  {wk}{flag}")
    print(f"\n=== TOTAL: {good}/{total} rows validated (Sat 1.5 / Sun 2.0 / PH 2.5) ===")

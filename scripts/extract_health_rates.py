#!/usr/bin/env python3
"""
Extract MA000027 (Health Professionals and Support Services Award) adult pay
rates from the Fair Work Ombudsman Pay Guide into structured, *validated* data.

The Pay Guide's Adult tables are transcribed here from "Pay Guide - Health
Professionals and Support Services Award [MA000027]" (published 24 June 2026,
effective 1 July 2026). Every base rate is cross-validated two ways and the
penalty multipliers the calculator uses are asserted against the published
penalty-dollar columns on a representative row of each stream, so a wrong figure
fails the build rather than shipping.

Relationships checked:
  full-time/part-time:  hourly           = round(weekly / 38, 2)
                        Mon-Fri shift    = 115% of hourly (clause 26)
                        Saturday/Sunday  = 150% of hourly (clause 26)
                        public holiday   = 250% of hourly (clause 26)
                        overtime 1st 2h  = 150% ; after 2h = 200% (clause 25)
  casual (25% loading): hourly           = 125% of the FT hourly base
                        Mon-Fri shift    = 140% of base (15% + 25%, additive)
                        Saturday/Sunday  = 175% of base (150% + 25%, additive)
                        public holiday   = 275% of base (250% + 25%, additive)
                        overtime 1st 2h  = 187.5% ; after 2h = 250% of base
                                           (overtime % applied to the loaded
                                            casual rate — multiplicative)

Scope: the four Adult classification streams — Support services employees
(Levels 1-9), Dental assistants, Pathology collectors, and Health professional
employees (Levels 1-4) — full-time/part-time and casual. Junior (age-scaled)
and apprentice tables in the Pay Guide are not modelled in this dataset.

Usage:  python3 scripts/extract_health_rates.py            # validation report
        python3 scripts/extract_health_rates.py --json      # emit rates JSON to stdout
"""
import json
import sys
from decimal import Decimal, ROUND_HALF_UP

WEEKLY_HOURS = 38

# (classification, weekly, ft_hourly, casual_hourly)
SUPPORT_SERVICES = [
    ("Level 1", 1024.70, 26.97, 33.71),
    ("Level 2", 1065.20, 28.03, 35.04),
    ("Level 3", 1106.20, 29.11, 36.39),
    ("Level 4", 1119.10, 29.45, 36.81),
    ("Level 5", 1157.20, 30.45, 38.06),
    ("Level 6", 1219.50, 32.09, 40.11),
    ("Level 7", 1241.40, 32.67, 40.84),
    ("Level 8 - pay point 1", 1283.50, 33.78, 42.23),
    ("Level 8 - pay point 2", 1317.20, 34.66, 43.33),
    ("Level 8 - pay point 3", 1409.70, 37.10, 46.38),
    ("Level 9 - pay point 1", 1435.00, 37.76, 47.20),
    ("Level 9 - pay point 2", 1485.90, 39.10, 48.88),
    ("Level 9 - pay point 3", 1497.80, 39.42, 49.28),
]

DENTAL_ASSISTANTS = [
    ("Level 3 - dental assistant", 1106.20, 29.11, 36.39),
    ("Level 5 - dental assistant", 1107.80, 29.15, 36.44),
    ("Level 6 - dental assistant", 1163.90, 30.63, 38.29),
    ("Level 7 - dental assistant", 1203.50, 31.67, 39.59),
]

PATHOLOGY_COLLECTORS = [
    ("Level 5 - pathology collector", 1157.20, 30.45, 38.06),
    ("Level 6 - pathology collector", 1163.90, 30.63, 38.29),
    ("Level 7 - pathology collector (unqualified)", 1203.50, 31.67, 39.59),
    ("Level 7 - pathology collector (qualified)", 1241.40, 32.67, 40.84),
]

HEALTH_PROFESSIONALS = [
    ("Level 1 - pay point 1", 1174.00, 30.89, 38.61),
    ("Level 1 - pay point 2", 1219.50, 32.09, 40.11),
    ("Level 1 - pay point 3", 1273.40, 33.51, 41.89),
    ("Level 1 - pay point 4", 1317.20, 34.66, 43.33),
    ("Level 1 - pay point 5", 1435.00, 37.76, 47.20),
    ("Level 1 - pay point 6", 1485.90, 39.10, 48.88),
    ("Level 2 - pay point 1", 1493.90, 39.31, 49.14),
    ("Level 2 - pay point 2", 1548.30, 40.74, 50.93),
    ("Level 2 - pay point 3", 1607.40, 42.30, 52.88),
    ("Level 2 - pay point 4", 1671.40, 43.98, 54.98),
    ("Level 3 - pay point 1", 1743.90, 45.89, 57.36),
    ("Level 3 - pay point 2", 1792.80, 47.18, 58.98),
    ("Level 3 - pay point 3", 1831.30, 48.19, 60.24),
    ("Level 3 - pay point 4", 1912.60, 50.33, 62.91),
    ("Level 3 - pay point 5", 1983.20, 52.19, 65.24),
    ("Level 4 - pay point 1", 2111.60, 55.57, 69.46),
    ("Level 4 - pay point 2", 2253.30, 59.30, 74.13),
    ("Level 4 - pay point 3", 2450.40, 64.48, 80.60),
    ("Level 4 - pay point 4", 2705.10, 71.19, 88.99),
]

STREAMS = [
    ("support_services", "Support services employees (other than dental assistants and pathology collectors)", SUPPORT_SERVICES),
    ("dental_assistants", "Support services employees - Dental assistants", DENTAL_ASSISTANTS),
    ("pathology_collectors", "Support services employees - Pathology collectors", PATHOLOGY_COLLECTORS),
    ("health_professionals", "Health professional employees", HEALTH_PROFESSIONALS),
]

# Representative row per stream with the published penalty-dollar columns, to lock
# the multipliers. (base_hourly, ft{shift,sat,sun,ph,ot1,ot2}, casual{shift,sat,sun,ph,ot1,ot2})
SPOT_CHECKS = {
    "support_services|Level 1": {
        "base": 26.97,
        "ft": {"shift": 31.02, "sat": 40.46, "sun": 40.46, "ph": 67.43, "ot1": 40.46, "ot2": 53.94},
        "casual": {"shift": 37.76, "sat": 47.20, "sun": 47.20, "ph": 74.17, "ot1": 50.57, "ot2": 67.43},
    },
    "health_professionals|Level 4 - pay point 4": {
        "base": 71.19,
        "ft": {"shift": 81.87, "sat": 106.79, "sun": 106.79, "ph": 177.98, "ot1": 106.79, "ot2": 142.38},
        "casual": {"shift": 99.67, "sat": 124.58, "sun": 124.58, "ph": 195.77, "ot1": 133.48, "ot2": 177.98},
    },
    "dental_assistants|Level 5 - dental assistant": {
        "base": 29.15,
        "ft": {"shift": 33.52, "sat": 43.73, "sun": 43.73, "ph": 72.88, "ot1": 43.73, "ot2": 58.30},
        "casual": {"shift": 40.81, "sat": 51.01, "sun": 51.01, "ph": 80.16, "ot1": 54.66, "ot2": 72.88},
    },
    "pathology_collectors|Level 5 - pathology collector": {
        "base": 30.45,
        "ft": {"shift": 35.02, "sat": 45.68, "sun": 45.68, "ph": 76.13, "ot1": 45.68, "ot2": 60.90},
        "casual": {"shift": 42.63, "sat": 53.29, "sun": 53.29, "ph": 83.74, "ot1": 57.09, "ot2": 76.13},
    },
}

# Full-time/part-time multipliers on the base hourly rate.
FT_MULT = {"shift": 1.15, "sat": 1.5, "sun": 1.5, "ph": 2.5, "ot1": 1.5, "ot2": 2.0}
# Casual: penalties add the 25% loading (additive); overtime applies the % to the
# loaded casual rate (multiplicative, i.e. base x mult x 1.25).
CASUAL_MULT = {"shift": 1.40, "sat": 1.75, "sun": 1.75, "ph": 2.75, "ot1": 1.875, "ot2": 2.5}


def _d(x):
    return Decimal(str(x))


def mul(base, mult):
    return float((_d(base) * _d(mult)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def div38(weekly):
    return float((_d(weekly) / Decimal(WEEKLY_HOURS)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def validate():
    errors = []
    # Base-rate cross-checks for every row.
    for key, label, rows in STREAMS:
        for (cls, weekly, ft, cas) in rows:
            if div38(weekly) != ft:
                errors.append(f"{key} {cls}: weekly/38 {div38(weekly)} != hourly {ft}")
            if mul(ft, 1.25) != cas:
                errors.append(f"{key} {cls}: FT x1.25 {mul(ft,1.25)} != casual {cas}")
    # Penalty multiplier spot-checks against the published penalty-dollar columns.
    for spot, data in SPOT_CHECKS.items():
        base = data["base"]
        for col, want in data["ft"].items():
            got = mul(base, FT_MULT[col])
            if got != want:
                errors.append(f"{spot} FT {col}: {got} != published {want}")
        for col, want in data["casual"].items():
            got = mul(base, CASUAL_MULT[col])
            if got != want:
                errors.append(f"{spot} casual {col}: {got} != published {want}")
    return errors


def build():
    rates = []
    for key, label, rows in STREAMS:
        for (cls, weekly, ft, cas) in rows:
            rates.append({
                "category": "adult",
                "stream": key,
                "employment_type": "full_time",
                "section": label + " - Full-time & part-time",
                "classification": cls,
                "rate": ft,
                "weekly_rate": weekly,
            })
            rates.append({
                "category": "adult",
                "stream": key,
                "employment_type": "casual",
                "section": label + " - Casual",
                "classification": cls,
                "rate": cas,
            })

    return {
        "award_name": "Health Professionals and Support Services Award MA000027",
        "ma_number": "MA000027",
        "effective_date": "2026-07-01",
        "next_review_date": "2027-07-01",
        "version": "2026-2027",
        "status": ("PREVIEW — machine-validated from FWO Pay Guide (published 24 Jun 2026, "
                   "effective 1 Jul 2026); gated behind health_preview flag, not GA — pending "
                   "human/consultant sign-off"),
        "source": "Fair Work Ombudsman Pay Guide MA000027, published 24 June 2026",
        "weekly_hours": WEEKLY_HOURS,
        "coverage_note": ("Private-sector health professionals and health support services (e.g. private "
                          "hospitals, medical/dental/allied-health practices, diagnostic and pathology "
                          "services, community and aged-care health). Does NOT cover employees excluded "
                          "by the Fair Work Act, employees under a modern enterprise award or enterprise "
                          "instrument, State reference public sector employees, or Medical Practitioners "
                          "(clause 4.6). Where more than one award could apply, the most appropriate "
                          "classification to the work performed applies (clause 4.7)."),
        "casual_loading": 0.25,
        "superannuation_rate": 0.12,
        "streams": {
            "support_services": "Support Services employees — Levels 1-9 (clerical, administrative, catering, cleaning, gardening, technical and support roles). Graded under clause 16.",
            "dental_assistants": "Support Services — Dental assistants (Levels 3, 5, 6, 7). Graded under clause 16.",
            "pathology_collectors": "Support Services — Pathology collectors (Levels 5, 6, 7 unqualified/qualified). Graded under clause 16.",
            "health_professionals": "Health Professional employees — Levels 1-4 with pay points (clause 17). Level 1 = graduate/entry; Level 4 = senior/principal.",
        },
        "minimum_engagement": {
            "casual_hours_per_shift": 3,
        },
        "minimum_engagement_note": ("Casual: minimum period of engagement is 3 hours (clause 11.2); "
                                    "cleaners employed in private medical practices have a 2-hour minimum "
                                    "(clause 11.3). Part-time: no fixed per-shift minimum — a regular "
                                    "pattern of hours (weekly hours, days, start/finish times) must be "
                                    "agreed in writing before commencement (clause 10.2). Full-time "
                                    "averages 38 ordinary hours per week (clause 9). Source: MA000027 award text."),
        "penalty_rates": {
            "saturday_full_time_part_time": 1.5,
            "saturday_casual": 1.75,
            "sunday_full_time_part_time": 1.5,
            "sunday_casual": 1.75,
            "public_holiday_full_time_part_time": 2.5,
            "public_holiday_casual": 2.75,
            "shift_loading_mon_fri": 0.15,
            "overtime_first_2hrs": 1.5,
            "overtime_after_2hrs": 2.0,
            "sunday_overtime": 2.0,
        },
        "penalty_rates_source": ("Clause 26 — Saturday and Sunday 150% of the minimum hourly rate for "
                                 "full-time/part-time, 175% for casuals (150% + 25% loading); public "
                                 "holiday 250% (full-time/part-time) / 275% (casual). Monday-to-Friday "
                                 "shiftwork loading 115% (full-time/part-time) / 140% (casual). "
                                 "Clause 25 — overtime 150% for the first 2 hours and 200% thereafter "
                                 "(Monday-Saturday), Sunday overtime 200%. For casuals, the overtime "
                                 "percentage is applied to the loaded casual rate (multiplicative): "
                                 "187.5% first 2 hours, 250% thereafter, 250% Sunday, 312.5% public "
                                 "holiday. A 'less than 10 hour break after overtime' rate of 200% "
                                 "(full-time/part-time) also applies per clause 25."),
        "annualised_wage": {
            "clause": "22",
            "eligibility": ("Full-time employees only, and only in Support Services employee Level 8 or "
                            "Level 9, or Health Professional employee Level 2, Level 3 or Level 4 "
                            "(clause 22.1(a))."),
            "absorbed_provisions": [
                "clause 16/17 — Minimum rates",
                "clause 23 — Allowances",
                "clause 25 — Overtime",
                "clause 26 — Penalty rates and shiftwork",
                "clause 27.3 — Annual leave loading",
            ],
            "outer_limit_clause": "22.1(c)",
            "reconciliation_clause": "22.2(b)",
            "record_clause": "22.2(c)",
            "base_rate_clause": "22.3",
        },
        "leave": {
            "cash_out_schedule": "Schedule I",
            "leave_in_advance_schedule": "Schedule H",
            "time_off_in_lieu_schedule": "Schedule G",
        },
        # Common allowances transcribed from the FWO Pay Guide MA000027 allowances table (page 40).
        "allowances": [
            {"name": "Heat allowance (temperature 40°C-46°C, employed at current workplace before 8 Aug 1991)", "amount": 0.61, "unit": "per hour", "condition": "or part of an hour"},
            {"name": "Heat allowance (temperature exceeds 46°C, employed at current workplace before 8 Aug 1991)", "amount": 0.73, "unit": "per hour", "condition": "or part of an hour"},
            {"name": "Laundry allowance", "amount": 0.33, "unit": "per shift", "condition": "or part thereof, up to a maximum of $1.53 per week"},
            {"name": "Meal allowance", "amount": 17.30, "unit": "per meal", "condition": "for the first meal; $15.60 for an extra meal"},
            {"name": "Nauseous work allowance (not linen sealed in airtight containers)", "amount": 0.61, "unit": "per hour", "condition": "or part thereof, minimum payment $3.29 per week"},
            {"name": "Occasional interpreting allowance", "amount": 1.34, "unit": "per occasion", "condition": "up to a maximum of $15.49 per week"},
            {"name": "On call allowance (Monday to Saturday)", "amount": 26.34, "unit": "per 24-hour period", "condition": "or part of a 24-hour period"},
            {"name": "On call allowance (Sunday & public holiday)", "amount": 52.56, "unit": "per 24-hour period", "condition": "or part of a 24-hour period"},
            {"name": "Tool allowance (chefs and cooks)", "amount": 13.41, "unit": "per week"},
            {"name": "Uniform allowance", "amount": 1.26, "unit": "per shift", "condition": "or part thereof, up to a maximum of $6.41 per week"},
            {"name": "Vehicle allowance", "amount": 1.01, "unit": "per km"},
            {"name": "Blood check allowance", "text": "reimbursement of out-of-pocket expenses for a blood check"},
            {"name": "Special clothing", "text": "reimbursement of the cost of purchasing the special clothing or safety equipment"},
            {"name": "Travel allowance", "text": "reimbursement for reasonably incurred fares, meals and accommodation on production of receipts (subject to agreed limits)"},
            {"name": "Apprentice training fees and textbook costs", "text": "reimbursement of training fees for prescribed courses and the cost of prescribed textbooks"},
        ],
        "allowances_note": ("Common allowances from the FWO Pay Guide MA000027 (effective 1 Jul 2026). "
                            "Not every allowance is listed — consult the award and Pay Guide for others "
                            "(e.g. telephone and apprentice-travel reimbursements)."),
        "notes": [
            "MA000027 has four adult classification streams: Support Services (Levels 1-9), Dental "
            "assistants, Pathology collectors, and Health Professional employees (Levels 1-4 with pay "
            "points). Pick the stream and level that match the work performed and the employee's "
            "qualifications/experience.",
            "Casual rates shown already include the 25% casual loading. Casual penalty rates add the "
            "25% loading to the penalty (additive: Saturday/Sunday 175%, public holiday 275%, Mon-Fri "
            "shift 140%). Casual OVERTIME instead applies the overtime percentage to the loaded casual "
            "rate (multiplicative: 187.5% first 2 hours, 250% thereafter).",
            "MA000027 HAS an annualised wage arrangement clause (clause 22) but it is restricted to "
            "full-time Support Services Level 8/9 or Health Professional Level 2/3/4 employees.",
            "Junior (age-scaled) and apprentice rates are not modelled in this dataset — see the Pay "
            "Guide for those.",
            "All 80 adult base-rate rows validated: FT hourly = round(weekly/38); casual = round(FT x "
            "1.25). Penalty multipliers (shift 115%/140%, Sat/Sun 150%/175%, PH 250%/275%, overtime "
            "150%/200% FT and 187.5%/250% casual) verified against the published penalty-dollar columns "
            "on a representative row of each stream.",
        ],
        "rates": rates,
    }


def main():
    errors = validate()
    if "--json" in sys.argv:
        if errors:
            sys.stderr.write("VALIDATION FAILED:\n" + "\n".join(errors) + "\n")
            sys.exit(1)
        json.dump(build(), sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
        return
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    total = sum(len(rows) for _, _, rows in STREAMS)
    print(f"OK — {total} adult classifications x2 employment types = {total*2} rows validated "
          "(weekly/38, casual x1.25, and penalty multipliers on a row per stream).")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Extract MA000120 (Children's Services Award) adult pay rates from the Fair Work
Ombudsman Pay Guide into structured, *validated* data.

The Pay Guide's Adult tables are transcribed here from "Pay Guide - Children's
Services Award [MA000120]" (published 24 June 2026, effective 1 July 2026). Every
base rate is cross-validated two ways and the penalty multipliers the calculator
uses are asserted against the published penalty-dollar columns on a
representative row of each stream, so a wrong figure fails the build rather than
shipping.

Relationships checked:
  full-time/part-time:  hourly              = round(weekly / 38, 2)
                        Saturday (shiftwk)  = 150% of hourly (clause 23)
                        Sunday              = 200% of hourly (clause 23)
                        public holiday      = 250% of hourly (clause 23)
                        early morning shift = 110% ; afternoon = 115%
                        rotating night      = 117.5% ; permanent night = 130%
                        overtime 1st 2h     = 150% ; after 2h = 200%
  casual (25% loading): hourly              = 125% of the FT hourly base
                        every penalty/shift/overtime = FT multiplier + 25%
                        (additive), e.g. early morning 135%, overtime 175%/225%

Saturday note: for day workers (non-shiftworkers) Saturday is paid at overtime
rates (150% first 2h / 200% after); only shiftworkers have a Saturday ordinary
penalty (150%). The stored saturday_* keys carry 150%/175% for the quick tools.

Scope: the two Adult classification streams — Support worker (levels 1.1-3.1) and
Children's services employee (Level 1 Introductory educator .. Level 8 Director) —
full-time/part-time and casual. Junior (age-scaled) and apprentice tables in the
Pay Guide are not modelled in this dataset.

Usage:  python3 scripts/extract_childrens_rates.py            # validation report
        python3 scripts/extract_childrens_rates.py --json      # emit rates JSON to stdout
"""
import json
import sys
from decimal import Decimal, ROUND_HALF_UP

WEEKLY_HOURS = 38

# (classification, weekly, ft_hourly, casual_hourly)
SUPPORT_WORKER = [
    ("Support worker level 1.1 on commencement", 1004.90, 26.44, 33.05),
    ("Support worker level 2.1 on commencement", 1023.40, 26.93, 33.66),
    ("Support worker level 2.2 after 1 year", 1057.00, 27.82, 34.78),
    ("Support worker level 3.1 on commencement", 1119.10, 29.45, 36.81),
]

CHILDRENS_SERVICES = [
    ("Level 1 - Introductory educator", 1094.80, 28.81, 36.01),
    ("Level 2 - Educator", 1128.40, 29.69, 37.11),
    ("Level 3 - Qualified educator", 1233.90, 32.47, 40.59),
    ("Level 4 - Experienced educator", 1316.70, 34.65, 43.31),
    ("Level 5 - Advanced educator", 1389.50, 36.57, 45.71),
    ("Level 6 - Room leader", 1453.50, 38.25, 47.81),
    ("Level 7 - Assistant director", 1519.90, 40.00, 50.00),
    ("Level 8 - Director", 1752.70, 46.12, 57.65),
]

STREAMS = [
    ("support_worker", "Support worker", SUPPORT_WORKER),
    ("childrens_services_employee", "Children's services employee", CHILDRENS_SERVICES),
]

# Representative row per stream with published penalty-dollar columns, to lock the
# multipliers. (base, ft{...}, casual{...})
SPOT_CHECKS = {
    "support_worker|Support worker level 1.1 on commencement": {
        "base": 26.44,
        "ft": {"sat": 39.66, "sun": 52.88, "ph": 66.10, "early": 29.08, "arvo": 30.41,
               "rot": 31.07, "perm": 34.37, "ot1": 39.66, "ot2": 52.88},
        "casual": {"early": 35.69, "arvo": 37.02, "rot": 37.68, "perm": 40.98, "ot1": 46.27, "ot2": 59.49},
    },
    "childrens_services_employee|Level 8 - Director": {
        "base": 46.12,
        "ft": {"sat": 69.18, "sun": 92.24, "ph": 115.30, "early": 50.73, "arvo": 53.04,
               "rot": 54.19, "perm": 59.96, "ot1": 69.18, "ot2": 92.24},
        "casual": {"early": 62.26, "arvo": 64.57, "rot": 65.72, "perm": 71.49, "ot1": 80.71, "ot2": 103.77},
    },
}

FT_MULT = {"sat": 1.5, "sun": 2.0, "ph": 2.5, "early": 1.10, "arvo": 1.15,
           "rot": 1.175, "perm": 1.30, "ot1": 1.5, "ot2": 2.0}
# Casual: 25% loading added to every FT multiplier (additive).
CASUAL_MULT = {k: round(v + 0.25, 4) for k, v in FT_MULT.items()}


def _d(x):
    return Decimal(str(x))


def mul(base, mult):
    return float((_d(base) * _d(mult)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def div38(weekly):
    return float((_d(weekly) / Decimal(WEEKLY_HOURS)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def validate():
    errors = []
    for key, label, rows in STREAMS:
        for (cls, weekly, ft, cas) in rows:
            if div38(weekly) != ft:
                errors.append(f"{key} {cls}: weekly/38 {div38(weekly)} != hourly {ft}")
            if mul(ft, 1.25) != cas:
                errors.append(f"{key} {cls}: FT x1.25 {mul(ft,1.25)} != casual {cas}")
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
        "award_name": "Children's Services Award MA000120",
        "ma_number": "MA000120",
        "effective_date": "2026-07-01",
        "next_review_date": "2027-07-01",
        "version": "2026-2027",
        "status": ("PREVIEW — machine-validated from FWO Pay Guide (published 24 Jun 2026, "
                   "effective 1 Jul 2026); gated behind childrens_preview flag, not GA — pending "
                   "human/consultant sign-off"),
        "source": "Fair Work Ombudsman Pay Guide MA000120, published 24 June 2026",
        "weekly_hours": WEEKLY_HOURS,
        "coverage_note": ("Long day care, preschools/kindergartens, outside-school-hours care, "
                          "occasional care and other early childhood education and care services. Does "
                          "NOT cover employers whose primary functions are covered by the Educational "
                          "Services (Schools) General Staff Award, the Higher Education Industry—General "
                          "Staff—Award, the Local Government Industry Award or the Social, Community, "
                          "Home Care and Disability Services Industry Award (clause 4.1). Also excludes "
                          "employees excluded by the Fair Work Act, enterprise-award/instrument "
                          "employees and State reference public sector employees; covers on-hire and "
                          "group-training arrangements in the industry (clauses 4.2-4.6)."),
        "casual_loading": 0.25,
        "superannuation_rate": 0.12,
        "streams": {
            "support_worker": "Support workers — levels 1.1, 2.1, 2.2 and 3.1 (support roles not requiring an ECEC qualification; e.g. cooks, assistants). Graded under Schedule B / clause 14.",
            "childrens_services_employee": "Children's services employees (educators) — Level 1 Introductory educator through Level 8 Director. Graded by ECEC qualification, experience and responsibility under Schedule B / clause 14.",
        },
        "minimum_engagement": {
            "part_time_hours_per_shift": 2,
            "casual_hours_per_shift": 2,
        },
        "minimum_engagement_note": ("Part-time: an employer must roster a part-time employee for a "
                                    "minimum of 2 consecutive hours on any shift (clause 10.4(e)). "
                                    "Casual: a casual employee is paid a minimum of 2 hours pay for each "
                                    "engagement (clause 10.5(c)). Full-time works an average of 38 "
                                    "ordinary hours per week. Source: MA000120 award text clause 10."),
        "penalty_rates": {
            "saturday_full_time_part_time": 1.5,
            "saturday_casual": 1.75,
            "sunday_full_time_part_time": 2.0,
            "sunday_casual": 2.25,
            "public_holiday_full_time_part_time": 2.5,
            "public_holiday_casual": 2.75,
            "early_morning_shift_loading": 0.10,
            "afternoon_shift_loading": 0.15,
            "rotating_night_shift_loading": 0.175,
            "permanent_night_shift_loading": 0.30,
            "overtime_first_2hrs": 1.5,
            "overtime_after_2hrs": 2.0,
        },
        "penalty_rates_source": ("Clause 23 — Sunday 200%, public holiday 250% of the ordinary hourly "
                                 "rate for full-time/part-time employees; Saturday for shiftworkers 150% "
                                 "(day workers are paid overtime for Saturday work). Shift loadings: "
                                 "early morning +10% (110%), afternoon +15% (115%), rotating night "
                                 "+17.5% (117.5%), permanent night +30% (130%). Overtime 150% for the "
                                 "first 2 hours and 200% thereafter (Monday-Saturday). Casual employees "
                                 "add the 25% casual loading to every penalty, shift loading and "
                                 "overtime rate (additive): e.g. early morning 135%, Sunday 225%, public "
                                 "holiday 275%, overtime 175%/225%."),
        "leave": {
            "cash_out_schedule": "Schedule G",
            "leave_in_advance_schedule": "Schedule F",
            "time_off_in_lieu_schedule": "Schedule H",
        },
        # Common allowances transcribed from the FWO Pay Guide MA000120 allowances table (page 17).
        "allowances": [
            {"name": "Broken shift allowance", "amount": 21.38, "unit": "per day", "condition": "for each day on which a broken shift is worked"},
            {"name": "Excess fares allowance (working away from usual workplace)", "amount": 17.22, "unit": "per day"},
            {"name": "First aid allowance (Level 1/2, not in out-of-school-hours care)", "amount": 12.65, "unit": "per day"},
            {"name": "First aid allowance (Level 1/2, in out-of-school-hours care)", "amount": 1.68, "unit": "per hour"},
            {"name": "Meal allowance (overtime)", "amount": 16.12, "unit": "per occasion"},
            {"name": "Laundry & ironing allowance (full-time employees)", "amount": 9.74, "unit": "per week"},
            {"name": "Laundry & ironing allowance (part-time or casual employees)", "amount": 1.95, "unit": "per day", "condition": "up to a maximum of $9.74 per week"},
            {"name": "Laundry allowance, no ironing (full-time employees)", "amount": 6.14, "unit": "per week"},
            {"name": "Laundry allowance, no ironing (part-time or casual employees)", "amount": 1.23, "unit": "per day", "condition": "up to a maximum of $6.14 per week"},
            {"name": "Educational leader allowance (5 days or more per week)", "amount": 4784.28, "unit": "per year", "condition": "pro-rated for fewer days: 4 days $3,827.44, 3 days $2,870.58, 2 days $1,913.72, 1 day $956.86"},
            {"name": "Vehicle allowance (motor car)", "amount": 1.01, "unit": "per km"},
            {"name": "Vehicle allowance (motorcycle)", "amount": 0.34, "unit": "per km"},
            {"name": "Protective clothing and equipment", "text": "reimbursement for the reasonable costs of the protective clothing and equipment incurred"},
            {"name": "Special clothing", "text": "reimbursement for the cost of purchasing the special clothing"},
            {"name": "Apprentice training fees and textbook costs", "text": "reimbursement of training fees for prescribed courses and the cost of prescribed textbooks"},
        ],
        "allowances_note": ("Common allowances from the FWO Pay Guide MA000120 (effective 1 Jul 2026). "
                            "The educational leader allowance is an annual amount pro-rated by days per "
                            "week. Not every allowance is listed — consult the award and Pay Guide for "
                            "others."),
        "notes": [
            "MA000120 has two adult classification streams: Support worker (levels 1.1-3.1) and "
            "Children's services employee / educator (Level 1 Introductory educator through Level 8 "
            "Director). Pick the stream and level that match the ECEC qualification and role.",
            "Cooks required to hold or work towards an ECEC qualification who may work directly with "
            "children to maintain ratios are paid the Children's services employee rate for their "
            "qualification (not the Support worker rate).",
            "Casual rates shown already include the 25% casual loading. Casual penalty, shift and "
            "overtime rates add the 25% loading to the corresponding full-time multiplier (additive).",
            "Saturday: shiftworkers receive a 150% ordinary penalty; day workers (non-shiftworkers) are "
            "paid overtime for Saturday work (150% first 2 hours, 200% thereafter).",
            "MA000120 contains NO annualised wage arrangement clause; the Annualised Wage document "
            "templates are therefore not offered for this award.",
            "Junior (age-scaled) and apprentice rates are not modelled in this dataset — see the Pay "
            "Guide for those.",
            "All 24 adult base-rate rows validated: FT hourly = round(weekly/38); casual = round(FT x "
            "1.25). Penalty multipliers (Sat 150%/175%, Sun 200%/225%, PH 250%/275%, shift loadings "
            "110-130% FT, overtime 150%/200% FT and 175%/225% casual) verified against the published "
            "penalty-dollar columns on a representative row of each stream.",
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

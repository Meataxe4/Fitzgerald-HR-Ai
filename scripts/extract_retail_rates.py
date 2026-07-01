#!/usr/bin/env python3
"""
Extract MA000004 (General Retail Industry Award) adult pay rates from the Fair
Work Ombudsman Pay Guide into structured, *validated* data.

Unlike the Manufacturing/SCHADS extractors (which de-jumble a coordinate-based
PDF), the Retail Pay Guide's Adult tables are small and fully transcribed here
from "Pay Guide - General Retail Industry Award [MA000004]" (published 24 June
2026, effective 1 July 2026). Every published penalty-dollar column is asserted
against the multiplier the calculator uses, so a wrong figure fails the build
rather than shipping. The relationships checked are exactly the ones the app's
resolver relies on:

  full-time/part-time:  hourly              = round(weekly / 38, 2)
                        Saturday / evening  = 125% of hourly
                        Sunday              = 150% of hourly
                        public holiday      = 225% of hourly
                        overtime first 3h   = 150% of hourly
                        overtime after 3h   = 200% of hourly
                        public holiday OT   = 250% of hourly
  casual (25% loading): hourly              = 125% of the FT hourly base
                        Saturday / evening  = 150% of base
                        Sunday              = 175% of base
                        public holiday      = 250% of base

Scope: the Adult classification stream (Retail employee level 1-8), full-time/
part-time and casual. Junior (age-scaled), apprentice and allowance tables in
the Pay Guide are not modelled in this dataset — the tool covers the adult base
scale, mirroring the SCHADS base-table approach.

Usage:  python3 scripts/extract_retail_rates.py            # validation report
        python3 scripts/extract_retail_rates.py --json      # emit rates JSON to stdout
"""
import json
import sys
from decimal import Decimal, ROUND_HALF_UP

WEEKLY_HOURS = 38

# Adult - Full-time & part-time (Pay Guide Table 1 + Table 3 overtime).
# (level, weekly, hourly, evening_after_6pm, saturday, sunday, public_holiday,
#  ot_first_3h, ot_after_3h, ot_sunday, ot_public_holiday)
ADULT_FT = [
    (1, 1056.80, 27.81, 34.76, 34.76, 41.72, 62.57, 41.72, 55.62, 55.62, 69.53),
    (2, 1081.00, 28.45, 35.56, 35.56, 42.68, 64.01, 42.68, 56.90, 56.90, 71.13),
    (3, 1097.80, 28.89, 36.11, 36.11, 43.34, 65.00, 43.34, 57.78, 57.78, 72.23),
    (4, 1119.10, 29.45, 36.81, 36.81, 44.18, 66.26, 44.18, 58.90, 58.90, 73.63),
    (5, 1165.10, 30.66, 38.33, 38.33, 45.99, 68.99, 45.99, 61.32, 61.32, 76.65),
    (6, 1182.10, 31.11, 38.89, 38.89, 46.67, 70.00, 46.67, 62.22, 62.22, 77.78),
    (7, 1241.40, 32.67, 40.84, 40.84, 49.01, 73.51, 49.01, 65.34, 65.34, 81.68),
    (8, 1291.80, 33.99, 42.49, 42.49, 50.99, 76.48, 50.99, 67.98, 67.98, 84.98),
]

# Adult - Casual (Pay Guide Casual Table 1). Casual hourly already includes the
# 25% loading. (level, hourly, evening_after_6pm, saturday, sunday, public_holiday)
ADULT_CASUAL = [
    (1, 34.76, 41.72, 41.72, 48.67, 69.53),
    (2, 35.56, 42.68, 42.68, 49.79, 71.13),
    (3, 36.11, 43.34, 43.34, 50.56, 72.23),
    (4, 36.81, 44.18, 44.18, 51.54, 73.63),
    (5, 38.33, 45.99, 45.99, 53.66, 76.65),
    (6, 38.89, 46.67, 46.67, 54.44, 77.78),
    (7, 40.84, 49.01, 49.01, 57.17, 81.68),
    (8, 42.49, 50.99, 50.99, 59.48, 84.98),
]


_CENT = Decimal('0.01')


def _d(x):
    # Treat the transcribed floats as the exact 2-dp figures they represent.
    return Decimal(str(x))


def mul(base, mult):
    # Commercial round-half-up on the exact base, matching the FWO Pay Guide's
    # published penalty-dollar columns (Python's round() is half-to-even).
    return float((_d(base) * _d(mult)).quantize(_CENT, rounding=ROUND_HALF_UP))


def div38(weekly):
    return float((_d(weekly) / Decimal(WEEKLY_HOURS)).quantize(_CENT, rounding=ROUND_HALF_UP))


def validate():
    errors = []
    base_by_level = {}
    for (lvl, weekly, hourly, evening, sat, sun, ph, ot1, ot2, otsun, otph) in ADULT_FT:
        base_by_level[lvl] = hourly
        checks = [
            ('hourly=weekly/38', div38(weekly), hourly),
            ('evening 125%', mul(hourly, 1.25), evening),
            ('saturday 125%', mul(hourly, 1.25), sat),
            ('sunday 150%', mul(hourly, 1.5), sun),
            ('public holiday 225%', mul(hourly, 2.25), ph),
            ('overtime first 3h 150%', mul(hourly, 1.5), ot1),
            ('overtime after 3h 200%', mul(hourly, 2.0), ot2),
            ('overtime sunday 200%', mul(hourly, 2.0), otsun),
            ('overtime public holiday 250%', mul(hourly, 2.5), otph),
        ]
        for name, got, want in checks:
            if got != want:
                errors.append(f'FT L{lvl} {name}: computed {got} != published {want}')

    for (lvl, hourly, evening, sat, sun, ph) in ADULT_CASUAL:
        base = base_by_level[lvl]
        checks = [
            ('casual hourly = base+25%', mul(base, 1.25), hourly),
            ('casual evening 150% of base', mul(base, 1.5), evening),
            ('casual saturday 150% of base', mul(base, 1.5), sat),
            ('casual sunday 175% of base', mul(base, 1.75), sun),
            ('casual public holiday 250% of base', mul(base, 2.5), ph),
        ]
        for name, got, want in checks:
            if got != want:
                errors.append(f'Casual L{lvl} {name}: computed {got} != published {want}')
    return errors


def build():
    rates = []
    for (lvl, weekly, hourly, *_rest) in ADULT_FT:
        rates.append({
            'category': 'adult',
            'employment_type': 'full_time',
            'section': 'Adult - Full-time & part-time',
            'classification': f'Retail Employee Level {lvl}',
            'rate': hourly,
            'weekly_rate': weekly,
        })
    for (lvl, hourly, *_rest) in ADULT_CASUAL:
        rates.append({
            'category': 'adult',
            'employment_type': 'casual',
            'section': 'Adult - Casual',
            'classification': f'Retail Employee Level {lvl}',
            'rate': hourly,
        })

    return {
        'award_name': 'General Retail Industry Award MA000004',
        'ma_number': 'MA000004',
        'effective_date': '2026-07-01',
        'next_review_date': '2027-07-01',
        'version': '2026-2027',
        'status': ('PREVIEW — machine-validated from FWO Pay Guide (published 24 Jun 2026, '
                   'effective 1 Jul 2026); gated behind retail_preview flag, not GA — pending '
                   'human/consultant sign-off'),
        'source': 'Fair Work Ombudsman Pay Guide MA000004, published 24 June 2026',
        'weekly_hours': WEEKLY_HOURS,
        'coverage_note': ('General retail trade. Does NOT cover businesses covered by the Hair and '
                          'Beauty Industry Award, Fast Food Industry Award, Meat Industry Award, or '
                          'Pharmacy Industry Award.'),
        'casual_loading': 0.25,
        'superannuation_rate': 0.12,
        'minimum_engagement': {
            'part_time_hours_per_shift': 3,
            'casual_hours_per_shift': 3,
        },
        'minimum_engagement_note': ('Part-time: minimum 3 consecutive hours per shift (clause 10.9). '
                                    'Casual: minimum 3 hours per engagement (clause 11.2); this may be '
                                    'reduced to 1.5 hours only for a secondary school student engaged '
                                    'between 3:00pm and 6:30pm on a school day with parent/guardian '
                                    'agreement (clause 11.3). Full-time has no per-shift statutory '
                                    'minimum (ordinary hours average 38/week). Source: MA000004 award text.'),
        'penalty_rates': {
            'saturday_full_time_part_time': 1.25,
            'saturday_casual': 1.5,
            'sunday_full_time_part_time': 1.5,
            'sunday_casual': 1.75,
            'public_holiday_full_time_part_time': 2.25,
            'public_holiday_casual': 2.5,
            'evening_mon_fri_loading': 0.25,
            'overtime_first_3hrs': 1.5,
            'overtime_after_3hrs': 2.0,
            'sunday_overtime': 2.0,
            'public_holiday_overtime': 2.5,
        },
        'penalty_rates_source': ('Saturday 125% / Sunday 150% / public holiday 225% of the ordinary '
                                 'hourly rate for full-time & part-time (clause 22); casuals add the '
                                 '25% casual loading (Saturday 150% / Sunday 175% / public holiday '
                                 '250%). An evening loading of 25% applies to ordinary hours worked '
                                 'after 6:00pm Monday to Friday (clause 22). Overtime: first 3 hours '
                                 '150%, after 3 hours 200%; all Sunday overtime 200%; public holiday '
                                 'overtime 250% (clause 21).'),
        # Allowances transcribed from the FWO Pay Guide MA000004 allowances table
        # (published 24 Jun 2026, effective 1 Jul 2026). Monetary allowances carry
        # an exact amount + unit; reimbursement-style allowances carry a text
        # description. Figures a chat user is likely to ask about.
        'allowances': [
            {'name': 'Cold work allowance (0°C and above)', 'amount': 0.38, 'unit': 'per hour', 'condition': 'while so employed'},
            {'name': 'Cold work allowance (below 0°C)', 'amount': 0.97, 'unit': 'per hour', 'condition': 'while so employed'},
            {'name': 'District allowance – Broken Hill', 'amount': 1.26, 'unit': 'per hour'},
            {'name': 'First aid allowance', 'amount': 14.55, 'unit': 'per week'},
            {'name': 'Laundry allowance (full-time employees)', 'amount': 6.42, 'unit': 'per week'},
            {'name': 'Laundry allowance (part-time or casual employees)', 'amount': 1.28, 'unit': 'per shift'},
            {'name': 'Liquor licence allowance', 'amount': 34.69, 'unit': 'per week'},
            {'name': 'Meal allowance – overtime', 'amount': 24.56, 'unit': 'per occasion', 'condition': 'plus a further $22.27 when more than 4 hours of overtime is worked'},
            {'name': 'Vehicle allowance', 'amount': 1.00, 'unit': 'per km'},
            {'name': 'Recall allowance', 'text': 'the appropriate rate for all hours worked with a minimum of 3 hours on each occasion'},
            {'name': 'Protective or special clothing', 'text': 'reimbursement of the cost of purchasing protective or special clothing (such as a uniform or dress) and of replacing items due to normal wear and tear'},
            {'name': 'Apprentice training fees and textbook costs', 'text': 'reimbursement of training fees for prescribed courses and the cost of prescribed textbooks'},
            {'name': 'Transport reimbursement (finishing after 10pm or starting before 7am, normal transport unavailable)', 'text': 'reimbursement for the cost of a commercial passenger vehicle from the workplace to the usual place of residence'},
        ],
        'allowances_note': ('Common allowances from the FWO Pay Guide MA000004 (effective 1 Jul 2026). '
                            'Not every allowance is listed — consult the award and Pay Guide for others '
                            '(e.g. excess-travel and working-away reimbursements).'),
        'shift_definitions_note': ('The evening loading applies to ordinary hours worked after 6:00pm '
                                   'Monday to Friday. Weekend and public holiday penalty rates apply '
                                   'in place of the evening loading for hours worked on those days, '
                                   'not in addition.'),
        'notes': [
            'General Retail Industry Award classifications are Retail Employee Level 1-8 (a single '
            'linear scale), not hospitality roles or stream/grade combinations.',
            'Casual rates shown already include the 25% casual loading; casual penalty rates are the '
            'ordinary penalty computed on the base rate plus the 25% loading.',
            'MA000004 contains NO annualised wage arrangement clause (it was not one of the awards '
            'given the model annualised wage term in the 2020 review, unlike Hospitality/Restaurant '
            'cl 20 or Manufacturing cl 28). The Annualised Wage document templates are therefore not '
            'offered for this award; retail employers rely on common-law set-off arrangements instead.',
            'Annual leave: cash-out is under Schedule G and take-leave-in-advance under Schedule F of '
            'MA000004.',
            'Junior (age-scaled), apprentice and allowance tables in the Pay Guide are not modelled in '
            'this dataset — see the award and Pay Guide for those.',
            'All 16 adult base-rate rows validated: FT hourly = round(weekly/38); Sat/evening 125%, '
            'Sun 150%, PH 225% of hourly; casual Sat 150%, Sun 175%, PH 250% of the base rate; '
            'overtime first 3h 150% / after 3h 200% / PH 250%.',
        ],
        'rates': rates,
    }


def main():
    errors = validate()
    if '--json' in sys.argv:
        if errors:
            sys.stderr.write('VALIDATION FAILED:\n' + '\n'.join(errors) + '\n')
            sys.exit(1)
        json.dump(build(), sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write('\n')
        return
    if errors:
        print('VALIDATION FAILED:')
        for e in errors:
            print('  -', e)
        sys.exit(1)
    print(f'OK — {len(ADULT_FT)} full-time + {len(ADULT_CASUAL)} casual adult rows validated '
          'against the published penalty-dollar columns.')


if __name__ == '__main__':
    main()

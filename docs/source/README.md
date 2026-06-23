# Source award documents

Authoritative source PDFs/extracts for the modern awards we model. These are the
inputs the structured rates JSON files and grounding facts are built and verified
against — they are reference material, not shipped to users.

## Files

- `manufacturing-award-MA000010.pdf` — Manufacturing and Associated Industries and
  Occupations Award (MA000010) rates and classifications. Interim version; to be
  refreshed when the annual minimum-wage increase takes effect.

## Note on rate updates

When award rates change (e.g. the annual increase), update the structured data in
the corresponding `*-award-rates.json` file at the repo root. The chat prompt and
in-app calculators read from those JSON files, so a rates change is a data update
with no code changes required.

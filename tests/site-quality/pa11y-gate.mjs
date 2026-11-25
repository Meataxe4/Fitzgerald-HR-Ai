#!/usr/bin/env node
// Accessibility gate over a pa11y-ci JSON report.
//
//   node tests/site-quality/pa11y-gate.mjs <pa11y-report.json>
//
// Fails (exit 1) when any page has an issue from a rule that is not listed in
// known-a11y-debt.json, or when a page could not be tested at all. Issues from
// the known-debt rules are counted and reported, but do not fail the build.
// The summary is also written to the GitHub job summary when available.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const reportPath = process.argv[2];
if (!reportPath) {
  console.error('Usage: pa11y-gate.mjs <pa11y-report.json>');
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const debt = new Set(JSON.parse(readFileSync(join(here, 'known-a11y-debt.json'), 'utf8')).rules);

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error(`Could not read pa11y report ${reportPath}: ${err.message}`);
  process.exit(2);
}
if (!report.results || !report.total) {
  console.error('pa11y report is empty: no pages were tested. Failing closed.');
  process.exit(1);
}

const path = (url) => url.replace(/^https?:\/\/[^/]+/, '') || '/';
const debtCounts = new Map(); // rule -> { issues, pages:Set }
const blocking = [];          // { page, rule, message, selector }

for (const [url, issues] of Object.entries(report.results)) {
  for (const issue of issues) {
    // A page that failed to load is reported as an Error object with no code.
    const rule = issue.code || 'page-failed-to-load';
    if (debt.has(rule)) {
      const entry = debtCounts.get(rule) || { issues: 0, pages: new Set() };
      entry.issues += 1;
      entry.pages.add(url);
      debtCounts.set(rule, entry);
    } else {
      blocking.push({ page: path(url), rule, message: issue.message || '', selector: issue.selector || '' });
    }
  }
}

const lines = [];
lines.push('## Accessibility (pa11y-ci + axe, WCAG 2 AA)');
lines.push('');
lines.push(`Pages tested: ${report.total}`);
lines.push('');
lines.push(`### Blocking issues: ${blocking.length}`);
if (blocking.length) {
  lines.push('');
  lines.push('| Page | Rule | Element |');
  lines.push('|---|---|---|');
  for (const b of blocking.slice(0, 100)) {
    lines.push(`| ${b.page} | ${b.rule} | \`${b.selector.replace(/\|/g, '\\|').slice(0, 120)}\` |`);
  }
  if (blocking.length > 100) lines.push(`| ... | ${blocking.length - 100} more | |`);
}
lines.push('');
lines.push('### Known debt (reported, not blocking)');
lines.push('');
lines.push('| Rule | Issues | Pages |');
lines.push('|---|---|---|');
for (const rule of debt) {
  const entry = debtCounts.get(rule);
  lines.push(`| ${rule} | ${entry ? entry.issues : 0} | ${entry ? entry.pages.size : 0} |`);
}
const cleared = [...debt].filter((rule) => !debtCounts.has(rule));
if (cleared.length) {
  lines.push('');
  lines.push(`Now at zero: ${cleared.join(', ')}. Remove from known-a11y-debt.json so it stays fixed.`);
}

const summary = lines.join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');

if (blocking.length) {
  console.error(`\nFAIL: ${blocking.length} accessibility issue(s) outside the known-debt list.`);
  process.exit(1);
}
console.log('\nPASS: no accessibility issues outside the known-debt list.');

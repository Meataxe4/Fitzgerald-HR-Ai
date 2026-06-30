// netlify/functions/chat.js
// This file handles secure communication with Claude API

// Source-of-truth award data — bundled into the function via esbuild.
// If these JSON files change, the chat prompt facts update automatically
// without any code change here.
const restaurantRates = require('../../restaurant-award-rates.json');
const hospitalityRates = require('../../hospitality-award-rates.json');
const manufacturingRates = require('../../manufacturing-award-rates.json');

// Builds the PENALTY RATES section of the system prompt from a rates JSON.
function buildPenaltyRateFacts(rates, awardLabel) {
  const p = rates.penalty_rates || {};
  const lines = [`PENALTY RATES — ${awardLabel} (use these exact figures when discussing multipliers/loadings):`];

  if (typeof p.saturday === 'number') {
    lines.push(`- Saturday: ${Math.round(p.saturday * 100)}% of base rate`);
  }
  if (typeof p.sunday === 'number') {
    lines.push(`- Sunday: ${Math.round(p.sunday * 100)}% of base rate`);
  }
  if (typeof p.public_holiday === 'number' && typeof p.public_holiday_casual === 'number') {
    lines.push(`- Public holiday (full-time / part-time): ${Math.round(p.public_holiday * 100)}% of base rate`);
    lines.push(`- Public holiday (casual): ${Math.round(p.public_holiday_casual * 100)}% of base rate`);
  } else if (typeof p.public_holiday === 'number') {
    lines.push(`- Public holiday: ${Math.round(p.public_holiday * 100)}% of base rate`);
  }

  // Late-night windows — derived from which keys exist in the JSON, so the
  // text always matches the data.
  if (typeof p.evening_after_10pm_loading === 'number') {
    lines.push(`- Late evening loading (Mon-Fri, after 10pm to midnight): +$${p.evening_after_10pm_loading.toFixed(2)}/hr flat loading on top of base rate`);
  } else if (typeof p.evening_after_7pm_loading === 'number') {
    lines.push(`- Evening loading (Mon-Fri, 7pm to midnight): +$${p.evening_after_7pm_loading.toFixed(2)}/hr flat loading on top of base rate`);
  }
  if (typeof p.night_midnight_to_6am_loading === 'number') {
    lines.push(`- Night loading (Mon-Fri, midnight to 6am): +$${p.night_midnight_to_6am_loading.toFixed(2)}/hr flat loading on top of base rate`);
  } else if (typeof p.night_midnight_to_7am_loading === 'number') {
    lines.push(`- Night loading (Mon-Fri, midnight to 7am): +$${p.night_midnight_to_7am_loading.toFixed(2)}/hr flat loading on top of base rate`);
  }

  if (typeof p.overtime_first_2hrs === 'number' && typeof p.overtime_after_2hrs === 'number') {
    lines.push(`- Overtime: first 2 hours at ${Math.round(p.overtime_first_2hrs * 100)}%, thereafter ${Math.round(p.overtime_after_2hrs * 100)}%`);
  }
  if (typeof p.overtime_first_3hrs === 'number' && typeof p.overtime_after_3hrs === 'number') {
    lines.push(`- Overtime: first 3 hours at ${Math.round(p.overtime_first_3hrs * 100)}%, thereafter ${Math.round(p.overtime_after_3hrs * 100)}%`);
  }
  // Shift loadings (e.g. Manufacturing) — percentage loadings on top of base.
  if (typeof p.afternoon_shift_loading === 'number') {
    lines.push(`- Afternoon shift loading: +${Math.round(p.afternoon_shift_loading * 100)}% of base rate`);
  }
  if (typeof p.night_shift_loading === 'number') {
    lines.push(`- Night shift loading: +${Math.round(p.night_shift_loading * 100)}% of base rate`);
  }
  if (typeof p.permanent_night_shift_loading === 'number') {
    lines.push(`- Permanent night shift loading: +${Math.round(p.permanent_night_shift_loading * 100)}% of base rate`);
  }
  if (typeof rates.casual_loading === 'number') {
    lines.push(`- Casual loading: ${Math.round(rates.casual_loading * 100)}% (applies to base rate before penalties)`);
  }

  if (rates.ma_number === 'MA000119') {
    lines.push(`NOTE: The Restaurant Award's late-night windows differ from the Hospitality Award — evening loading only applies AFTER 10pm (not from 7pm), and night loading runs to 6am (not 7am). Weekend and public holiday rates supersede the late-night loadings.`);
  } else if (rates.ma_number === 'MA000010') {
    lines.push(`NOTE: Manufacturing shift loadings (afternoon/night) apply to shiftworkers on their ordinary hours; weekend, public holiday and overtime rates apply as listed. Afternoon and night shift loadings are +15% (clause 33.2(d)) and permanent night shift +30% (clause 33.2(f)).`);
  } else {
    lines.push(`NOTE: Weekend and public holiday rates supersede the late-night loadings.`);
  }

  return lines.join('\n');
}

// Builds the MINIMUM ENGAGEMENT section of the system prompt from a rates JSON.
function buildMinimumEngagementFacts(rates, awardLabel) {
  const m = rates.minimum_engagement || {};
  const lines = [`MINIMUM ENGAGEMENT — ${awardLabel} (use these exact figures):`];
  const ma = rates.ma_number;
  const isMA119 = ma === 'MA000119';
  const ftClause = isMA119 ? ' (clause 11)' : '';
  const ptClause = ma === 'MA000010' ? ' (clause 10.2)' : ' (clause 12)';
  const casClause = isMA119
    ? ' (clause 13.5 — "An employer must not engage a casual employee for less than 2 consecutive hours of work")'
    : ma === 'MA000010' ? ' (clause 11.2)' : ' (clause 11.4)';

  if (typeof m.full_time_hours_per_shift === 'number') {
    lines.push(`- Full-time employees: minimum ${m.full_time_hours_per_shift} consecutive hours per engagement${ftClause}.`);
  }
  if (typeof m.part_time_hours_per_shift === 'number') {
    lines.push(`- Part-time employees: minimum ${m.part_time_hours_per_shift} consecutive hours per engagement${ptClause}.`);
  }
  if (typeof m.casual_hours_per_shift === 'number') {
    lines.push(`- Casual employees: minimum ${m.casual_hours_per_shift} consecutive hours per engagement${casClause}.`);
  }
  if (typeof m.public_holiday_casual === 'number') {
    lines.push(`- Public holiday casual minimum: ${m.public_holiday_casual} hours.`);
  }
  if (typeof m.public_holiday_full_time_part_time === 'number') {
    lines.push(`- Public holiday full-time / part-time minimum: ${m.public_holiday_full_time_part_time} hours.`);
  }
  lines.push(`The casual minimum applies even if the employee is sent home early — they must still be paid for the minimum.`);
  if (ma === 'MA000010') {
    lines.push(`Under MA000010 both the part-time and casual minimum may be reduced to no less than 3 consecutive hours by written agreement at the employee's request.`);
  }
  return lines.join('\n');
}

// ============================================================================
// FITZ WATCH context block — builds a focused system addendum when a chat
// request comes from a gap card. Tells Claude to (a) treat the user's
// structured brief as established facts, (b) stay anchored to the gap's
// statutory citation, and (c) produce a specific, actionable response.
// ============================================================================
function buildFitzWatchContextBlock(venueContext, gapContext) {
  const lines = ['=== FITZ WATCH CONTEXT ==='];
  lines.push('The user is asking from inside Fitz Watch — the compliance risk dashboard.');
  lines.push('Their first message contains a structured brief with [VENUE CONTEXT], [GAP CONTEXT], and [ACTION] blocks.');
  lines.push('Treat the facts in [VENUE CONTEXT] as authoritative — do NOT re-ask the user for their state, award coverage, staff count, payroll software, or anything else listed there.');
  lines.push('');
  if (gapContext) {
    lines.push('Active gap details:');
    if (gapContext.gapId)    lines.push('- Gap ID: ' + gapContext.gapId);
    if (gapContext.title)    lines.push('- Gap title: ' + gapContext.title);
    if (gapContext.severity) lines.push('- Severity: ' + gapContext.severity);
    if (gapContext.domain)   lines.push('- Domain: ' + gapContext.domain);
    if (gapContext.statutoryAnchor) {
      const a = gapContext.statutoryAnchor;
      const anchorBits = [];
      if (a.act) anchorBits.push(a.act);
      if (a.section) anchorBits.push(a.section);
      if (anchorBits.length) lines.push('- Statutory anchor: ' + anchorBits.join('; '));
    }
    lines.push('');
  }
  lines.push('Produce a tight, practical response. Include:');
  lines.push('1. The specific steps the user should take to close this gap.');
  lines.push('2. The data they need to gather from payroll / time records / contracts.');
  lines.push('3. What they should check first.');
  lines.push('4. Any documents they need to draft or generate.');
  lines.push('Keep statutory citations accurate to the anchor above. Do not invent clause numbers.');
  return lines.join('\n');
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse request body. venueContext and gapContext are optional Fitz Watch
    // additions (Sprint 4). Existing chat callers send only the original four
    // fields and continue to behave identically.
    const { message, history, user, primaryAward, venueContext, gapContext } = JSON.parse(event.body);

    // Validate input
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid message' })
      };
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    // Determine which award this user is on — registry-based and FAIL CLOSED.
    // Guardrail: an unrecognised/unsupported award must NEVER silently default
    // to Hospitality. When the award cannot be resolved we answer only at the
    // NES / Fair Work Act / National Minimum Wage floor (see the else branch of
    // the system prompt below). See docs/guardrails-award-resolution.md.
    const SERVER_AWARDS = {
      MA000009: {
        fullName: 'Hospitality Industry (General) Award MA000009',
        sector: 'hotels, restaurants, cafes, pubs, bars, and other hospitality venues',
        industryAdj: 'hospitality',
        rates: hospitalityRates,
        aliases: ['hospitality']
      },
      MA000119: {
        fullName: 'Restaurant Industry Award MA000119',
        sector: 'restaurants, cafes, bistros, and table-service food venues',
        industryAdj: 'hospitality',
        rates: restaurantRates,
        aliases: ['restaurant']
      },
      MA000010: {
        fullName: 'Manufacturing and Associated Industries and Occupations Award MA000010',
        sector: 'general manufacturing and associated industries',
        industryAdj: 'manufacturing',
        rates: manufacturingRates,
        aliases: ['manufacturing']
      }
    };
    function resolveServerAward(stored) {
      if (!stored) return null;
      const s = String(stored).toLowerCase();
      for (const code in SERVER_AWARDS) {
        const entry = SERVER_AWARDS[code];
        const matched = s.indexOf(code.toLowerCase()) !== -1 ||
          entry.aliases.some(function (a) { return s.indexOf(a) !== -1; });
        if (matched) return Object.assign({ code: code }, entry);
      }
      return null;
    }

    const resolvedAward = resolveServerAward(primaryAward);
    const awardName = resolvedAward ? primaryAward : null;
    const awardFullName = resolvedAward ? resolvedAward.fullName : null;
    const industrySector = resolvedAward
      ? resolvedAward.sector
      : 'Australian businesses';
    // Short industry adjective for persona/framing prose ('hospitality' |
    // 'manufacturing'). Switches with the award so a Restaurant or Manufacturing
    // user is not framed as a hospitality operator.
    const industryAdj = resolvedAward ? resolvedAward.industryAdj : 'workplace';

    // Award-specific facts — sourced from the rates JSON files at module load,
    // so any future change to penalty rates / minimum engagement / loadings
    // updates this prompt automatically with no code edit required. Only built
    // when an award is resolved; the floor-only branch never quotes award rates.
    const ratesData = resolvedAward ? resolvedAward.rates : null;
    const penaltyRateFacts = resolvedAward ? buildPenaltyRateFacts(ratesData, awardFullName) : '';
    const minimumEngagementFacts = resolvedAward ? buildMinimumEngagementFacts(ratesData, awardFullName) : '';

    // System prompt for Fitz HR Assistant. When the award is resolved we use the
    // full award-aware prompt; when it is not, we fall back to a floor-only prompt
    // that never quotes award-specific figures (guardrail — fail closed).
    let systemPrompt;
    if (resolvedAward) {
    systemPrompt = `You are Fitz, an expert AI HR assistant specialising in Australian ${industryAdj} industry HR. You work for Fitz HR, a boutique consultancy focused on ${industrySector}. You are the friendly, knowledgeable avatar helping managers and owners with their HR challenges.

IMPORTANT — THIS USER'S AWARD: All advice, rates, classifications, and compliance guidance must reference the **${awardFullName}**. Do NOT reference a different award unless explicitly asked to compare. If the user asks about pay rates, classifications, or compliance, always frame your answer in terms of ${awardFullName}.

${penaltyRateFacts}

${minimumEngagementFacts}

CRITICAL — MINIMUM ENGAGEMENT QUESTIONS:
When a user asks about minimum shift length, minimum engagement, "shortest shift", "send someone home early", or "minimum hours per shift", you MUST quote the figures from the MINIMUM ENGAGEMENT section above for ${awardFullName}. Do NOT say "no minimum is specified" or "this depends on the contract" — the modern award sets explicit minimums and they always apply.

Your expertise includes:
- Fair Work Act and Modern Awards (especially ${awardFullName})
- Casual conversion obligations and compliance
- Recruitment and onboarding for ${industryAdj} roles
- Performance management in high-turnover environments
- Workplace investigations and employee relations
- Award interpretation and penalty rates
- Rostering and scheduling compliance
- Probation periods and dismissal procedures
- Workplace health and safety in ${industryAdj} settings

Your tone should be:
- Professional but approachable and friendly (Australian conversational style)
- Practical and solutions-focused
- Empathetic to the challenges ${industryAdj} operators face
- Clear about when issues require escalation to a qualified HR consultant or lawyer
- Personable - you're Fitz, a helpful AI companion, not a faceless system

CRITICAL - ALWAYS USE BRITISH/AUSTRALIAN ENGLISH SPELLING:
- Use "ise" not "ize" (e.g., specialise, organise, recognise)
- Use "our" not "or" (e.g., behaviour, labour, favour)
- Use "re" not "er" (e.g., centre, metre)
- Use "l" doubling (e.g., travelled, modelling, counselling)
- Use "ogue" not "og" (e.g., catalogue, dialogue)

CRITICAL AWARD RATES POLICY - READ CAREFULLY:
You must NEVER provide specific dollar amounts for award BASE RATES (i.e., the hourly classification rate for a role) in your chat responses. This is a strict policy to ensure accuracy and compliance.

⚠️ IMPORTANT — BASE RATES vs PENALTY LOADINGS:
- BASE RATE = hourly classification pay (e.g., "$25.85/hr for a Level 2 cook"). NEVER quote these.
- PENALTY MULTIPLIERS = percentages (Saturday 150%, Sunday 175%, etc.). ALWAYS quote exactly as listed in the PENALTY RATES section above.
- FLAT-DOLLAR LOADINGS = fixed $/hr added on top of base (e.g., +$2.95/hr after 10pm). ALWAYS quote the exact dollar figure listed in the PENALTY RATES section above. These are NOT base rates and the "no dollar amounts" rule does NOT apply to them.

🚫 DO NOT under any circumstances convert a flat-dollar loading into a percentage. The Restaurant Award MA000119 and Hospitality Award MA000009 evening and night loadings are flat $/hr additions — they are NOT percentages of the base rate. Quoting them as "110%" or "115%" is factually wrong and a serious compliance error.

WHEN USERS ASK ABOUT PAY RATES, WAGES, SALARIES, OR "HOW MUCH TO PAY":
❌ DO NOT say things like:
- "$25.85 per hour" (base rate)
- "The base rate is $X"
- "You should pay them $X per hour for ordinary hours"
- Any specific dollar amounts for BASE rates
- "Late evening is 110% of the base rate" (this converts a flat loading to a percentage — WRONG)
- "Night work is 115% of the base rate" (WRONG)

✅ INSTEAD, YOU MUST:
1. Acknowledge their question
2. Explain that accurate base rates depend on multiple factors (role, classification level, experience, employment type, hours worked, penalties)
3. STRONGLY recommend they use the Award Wizard tool for the base rate
4. Quote penalty multipliers and flat-dollar loadings exactly as listed in the PENALTY RATES section above
5. Say something like: "I recommend using the Award Wizard tool (click 🛠️ Tools above) to get the exact base rate. It asks about all the relevant factors to ensure 100% accuracy."

✅ EXCEPTIONS - You MAY (and SHOULD) mention:
- General educational ranges: "${awardName} rates generally range from $24-35/hour depending on the classification"
- Penalty rate multipliers and flat $/hr loadings as listed in the PENALTY RATES section above (always cite them in the context of ${awardFullName})
- Casual loading percentages: "Casual employees receive a 25% loading"
- General award structures without specific dollar amounts

EXAMPLE — CORRECT response for a Restaurant Award MA000119 question about late-night work:
User: "What are the penalty rates for evening and night shifts under the Restaurant Award?"
You: "Under the Restaurant Industry Award MA000119, late-night work attracts flat-dollar loadings on top of the base rate (Mon-Fri only — weekend and public holiday rates supersede):

- **After 10pm to midnight:** +$2.95 per hour on top of the base rate
- **Midnight to 6am:** +$4.42 per hour on top of the base rate

Weekend and public holiday rates take priority over these loadings:
- Saturday: 150% of base
- Sunday: 175% of base
- Public holiday: 225% of base (full-time/part-time) or 250% (casual)
- Overtime: 150% for the first 2 hours, 200% thereafter

To work out the exact dollar figure for your employee, use the Award Wizard (🛠️ Tools) — it pulls the right base rate for their classification and applies these loadings.

💡 For complex matters: support@fitzhr.com"

EXAMPLE — WRONG response (DO NOT do this):
❌ "Monday-Friday after 10pm: 110% of base rate until midnight, then 115%" — flat $/hr loadings are NEVER expressed as percentages.

EXAMPLE RESPONSES:
User: "How much should I pay a casual waiter?"
You: "⚠️ General guidance only - consult Fitz HR for specific advice.

The exact rate for a casual waiter depends on several factors including their experience level, classification grade, and the hours they work (weekday/weekend/public holidays).

I strongly recommend using the **Award Wizard tool** (click 🛠️ Tools in the menu above) to get the precise rate. It will ask you the right questions to determine the exact classification and rate that applies.

Generally, award rates range from around $24-35/hour for entry-level classifications depending on experience, plus casual loading and penalty rates.

💡 For complex matters: support@fitzhr.com"

IMPORTANT GUIDELINES:
- Always reference relevant Modern Awards or Fair Work provisions when discussing compliance
- Be specific about the user's operational context (the roles involved, casual vs permanent, day work vs shift work, etc.)
- When discussing complex legal matters or high-risk situations (dismissals, investigations, discrimination claims), recommend they speak with their Fitz HR consultant
- Provide actionable next steps, not just theoretical advice
- Use Australian terminology (e.g., "roster" not "schedule", "redundancy" not "layoff")
- Keep responses concise but comprehensive (aim for 150-250 words unless more detail is clearly needed)

CRITICAL - LIABILITY & DISCLAIMER FRAMEWORK:

YOU ARE AN INFORMATION TOOL, NOT A LEGAL ADVISOR.

Before providing ANY response, mentally classify it:

1. **GENERAL INFORMATION** (Low Risk):
   - Award structures, general compliance rules
   - Process overviews, educational content
   - Tool explanations (Award Wizard, etc.)
   → Response: Provide information clearly
   → End with: "💡 For complex matters: support@fitzhr.com"

2. **SPECIFIC GUIDANCE** (Medium Risk):
   - Performance management processes
   - Recruitment best practices
   - Document requirements
   → Response: Explain process + emphasize "this is general guidance"
   → End with: "📞 For your specific situation, consult Fitz HR: support@fitzhr.com"

3. **HIGH-RISK LEGAL MATTERS** (Critical Risk):
   - Terminations, dismissals, redundancies
   - Investigations, allegations, serious misconduct
   - Discrimination, harassment, bullying claims
   - Legal disputes, Fair Work claims
   → Start with: "⚠️ This is general information only - NOT specific legal advice"
   → Explain WHY consultant review is essential (legal liability, unfair dismissal risk, compliance penalties)
   → Be explicit: "You MUST consult a Fitz HR consultant before acting"
   → End with: "⚠️ **This matter involves legal risk.** Please contact one of our Senior Consultants at support@fitzhr.com for expert guidance"

NEVER say things like:
❌ "You should terminate this employee"
❌ "Go ahead and issue this warning"
❌ "This is definitely covered by the award"
❌ "You can safely dismiss them"

ALWAYS say things like:
✅ "Here's what the process typically involves... You'll need consultant review to apply this to your situation"
✅ "The award generally provides for X... Verify your specific circumstances with Fitz HR"
✅ "This is general information about the requirements... Professional review is essential before proceeding"

REMEMBER: You provide INFORMATION and EDUCATION. Fitz HR consultants provide ADVICE and DECISIONS.

The difference:
- Information: "Termination requires procedural fairness including X, Y, Z steps"
- Advice: "In your situation, you should terminate and here's how to do it" ← NEVER DO THIS

CRITICAL - DOCUMENT BUILDER PROTOCOL:

When users ask about formal warnings, performance management, terminations, investigations, or serious misconduct documentation:

✅ DO:
1. Provide clear, legally sound advice about the PROCESS and requirements
2. Explain WHAT documents they need and WHY
3. Outline the legal requirements and procedural fairness steps
4. Explain what should be IN the document (key elements)
5. Mention that "the Document Builder tool will appear to help you create this properly"
6. Focus on legal compliance, risks, evidence needed, and proper procedures

❌ DO NOT:
1. Generate actual document templates in your response
2. Output formatted letters, warnings, or documents
3. Create sample text for documents
4. Include "Dear [Name]" or letter formatting
5. Write out what the document should say word-for-word

EXAMPLE - GOOD RESPONSE:
User: "I need to give John a formal warning for being late"
You: "⚠️ General guidance only - consult Fitz HR for specific advice.

For a formal written warning to be procedurally fair, you need to:

1. **Document the issue clearly**: Specific dates/times John was late, how many occurrences
2. **Reference previous conversations**: Have you given verbal warnings? If so, note the dates
3. **State clear expectations**: What punctuality standard is required going forward
4. **Explain consequences**: What happens if lateness continues (further warnings → possible termination)
5. **Give opportunity to respond**: John must be able to provide his side of the story
6. **Set a review timeframe**: E.g., "improvement expected within 4 weeks"

The warning letter should be dated, signed, and John should acknowledge receipt (signing doesn't mean he agrees, just that he received it).

The Document Builder will guide you through creating this warning with all the necessary legal elements included.

⚠️ **This matter involves legal risk.** Please contact one of our Senior Consultants at support@fitzhr.com for expert guidance on your specific situation and next steps."

EXAMPLE - BAD RESPONSE (DON'T DO THIS):
❌ "Here's a formal warning letter you can use:

Dear John,

This letter serves as a formal written warning regarding your repeated lateness...
[etc - full letter text]"

REMEMBER: The UI shows a Document Builder button automatically. Your job is to explain the LEGAL REQUIREMENTS and PROCESS, not write the actual documents.

CRITICAL - LEGAL DISCLAIMER REQUIREMENTS:

START every response about employment law, termination, or legal matters with:
"⚠️ General guidance only - consult Fitz HR for specific advice."

END EVERY RESPONSE with the appropriate call-to-action based on risk level:

For HIGH-RISK/LEGAL matters (dismissals, investigations, discrimination, bullying, serious misconduct, legal disputes, compliance breaches):
"⚠️ **This matter involves legal risk.** Please contact one of our Senior Consultants at support@fitzhr.com for expert guidance on your specific situation and next steps."

For COMPLEX/STRATEGIC matters (performance management systems, restructures, policy development, workplace culture issues, recruitment strategies):
"📞 **Need personalised support?** Contact our Senior Consultants at support@fitzhr.com to discuss your specific circumstances and develop a tailored strategy."

For ROUTINE/GENERAL matters (award interpretation, basic templates, general compliance questions, scheduling queries):
"💡 For complex matters or specific advice: support@fitzhr.com"

ALWAYS include one of these closings in EVERY response - choose the most appropriate based on the risk level and complexity of the question.

For questions about PAY RATES specifically, ALSO mention the Award Wizard tool in your opening before the general guidance disclaimer:
"For accurate pay rates, I recommend using the **Award Wizard tool** (click 🛠️ Tools above).

⚠️ General guidance only - consult Fitz HR for specific advice.

[rest of your response]

💡 For complex matters or specific advice: support@fitzhr.com"

Remember: You're a support tool provided by Fitz HR, not a replacement for human expertise in complex or high-stakes situations. Always drive clients toward:
1. Using the Award Wizard tool for pay rate questions
2. Engaging with Fitz HR consultants for complex/legal matters`;
    } else {
    systemPrompt = `You are Fitz, an expert AI HR assistant for Australian businesses, working for Fitz HR, a boutique HR consultancy. You are friendly, knowledgeable and personable.

IMPORTANT — NO AWARD IS SET FOR THIS USER:
This user has not selected a supported modern award, so you do NOT know which award applies to them. You must therefore answer ONLY at the universal floor that applies regardless of award:
- The National Employment Standards (NES)
- The Fair Work Act 2009
- The National Minimum Wage

You must NOT quote or estimate any award-specific figures — base rates, penalty rates, casual loading, overtime rates, shift loadings, allowances, or classification structures. These differ by award and you cannot determine them without knowing the user's award.

If the user asks for any award-specific figure or rule, briefly explain that it depends on their specific modern award, and ask them to set their Award in Settings so you can give exact figures. Do not guess, and NEVER assume the Hospitality or Restaurant Award by default.

CRITICAL - ALWAYS USE BRITISH/AUSTRALIAN ENGLISH SPELLING (e.g. specialise, organise, behaviour, labour, centre).

Your tone should be professional but approachable and friendly (Australian conversational style), practical and solutions-focused, empathetic, and clear about when issues require escalation to a qualified HR consultant or lawyer.

Remember: You're a support tool provided by Fitz HR, not a replacement for human expertise. For pay rates and award-specific questions, direct the user to set their Award in Settings and to use the Award Wizard tool; for complex or legal matters, direct them to Fitz HR consultants.`;
    }

    // Prepare messages for Claude API
    const messages = [];
    
    // Add conversation history if provided
    if (history && Array.isArray(history) && history.length > 0) {
      // Only include last 10 messages to manage token usage
      const recentHistory = history.slice(-10);
      messages.push(...recentHistory);
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Build the system blocks. The main award-aware system prompt is sent
    // as a cacheable block; the Anthropic API charges ~10% of the input
    // cost for cache hits, so multi-turn conversations on the same award
    // get a substantial discount after the first turn. An optional Fitz
    // Watch context block is added when the caller is asking from a gap
    // card — that block tells Claude to treat the user's [VENUE CONTEXT]
    // and [GAP CONTEXT] as authoritative and not re-ask.
    const systemBlocks = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ];
    if (gapContext || venueContext) {
      systemBlocks.push({
        type: 'text',
        text: buildFitzWatchContextBlock(venueContext, gapContext)
      });
    }

    // Call Claude API. The previous model ID (claude-sonnet-4-20250514) was
    // retired by Anthropic on 2026-06-15 and now returns 404 not_found_error,
    // which surfaced to users as a failed chat. Moved to the current Sonnet 4.6
    // alias (claude-sonnet-4-6), the documented drop-in replacement.
    //
    // The earlier 504s seen on 'claude-sonnet-4-6' were Netlify function
    // timeouts, not an invalid model: Sonnet 4.6 defaults to effort "high",
    // which is slower and costlier than the old non-thinking Sonnet 4. We
    // explicitly disable thinking and set effort "low" so latency and cost
    // stay close to the previous model — appropriate for a chat endpoint
    // sitting behind Netlify's function timeout.
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        system: systemBlocks,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to get response from AI',
          details: response.status === 401 ? 'Invalid API key' : 'API error'
        })
      };
    }

    const data = await response.json();
    
    // Extract the response text
    const assistantMessage = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Log usage for monitoring. cache_read_input_tokens > 0 confirms prompt
    // caching is working (Sprint 4 added cache_control to the system prompt).
    console.log('Usage:', {
      user: user,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      cacheReadTokens: data.usage?.cache_read_input_tokens || 0,
      cacheCreateTokens: data.usage?.cache_creation_input_tokens || 0,
      hasGapContext: !!gapContext,
      timestamp: new Date().toISOString()
    });

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
        usage: data.usage
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

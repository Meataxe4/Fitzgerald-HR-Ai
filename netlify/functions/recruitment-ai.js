const Anthropic = require('@anthropic-ai/sdk');

// Increase function timeout to 26 seconds (Netlify max for background functions)
exports.handler = async (event, context) => {
  // Set function timeout
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, taskType } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Create system prompts based on task type
    const systemPrompts = {
      responsibilities: `You are an expert HR professional specializing in job descriptions. Generate 5-8 clear, specific, and measurable key responsibilities for the given role. Format as a bulleted list with bullet points. Each responsibility should:
- Start with an action verb
- Be specific and measurable where possible
- Reflect realistic day-to-day duties
- Be appropriate for the seniority level`,

      jobDescription: `You are an expert HR professional specializing in job descriptions. Create a professional, engaging job description with clear sections and formatting. Use markdown formatting for headers and bullet points.`,

      interviewQuestions: `You are an expert HR professional. Generate concise interview questions for the role. Format as a simple numbered list. Keep each question brief and clear. Focus on behavioral and technical competencies.`,

      requirements: `You are an expert HR professional specializing in job requirements. Generate 6-10 essential requirements for the given role. Format as a bulleted list. Include a mix of:
- Educational qualifications
- Years of experience
- Technical skills
- Soft skills
- Certifications (if relevant)`,

      benefits: `You are an expert HR professional specializing in employee benefits. Generate 5-8 attractive benefits for the given role and company context. Format as a bulleted list. Include a mix of:
- Compensation-related benefits
- Work-life balance benefits
- Professional development
- Health and wellness
- Unique perks`,

      scoringCriteria: `You are an expert HR professional specializing in candidate evaluation. Generate 5-7 scoring criteria for the given role. Format clearly with criteria names and weights.`,

      referenceQuestions: `You are an expert HR professional specializing in reference checks. Generate 6-10 reference check questions for the given role. Format as a numbered list.

Questions should:
- Verify key competencies
- Assess work style and culture fit
- Be open-ended
- Probe for specific examples`
    };

    const systemPrompt = systemPrompts[taskType] || systemPrompts.responsibilities;

    // Adjust max_tokens based on task type - keep it lower for faster response
    const maxTokens = taskType === 'interviewQuestions' ? 1500 : 2000;

    // Model migration (1 Oct 2026): claude-sonnet-4-20250514 was retired by
    // Anthropic on 15 June 2026 and every request to it now fails with
    // not_found_error (12 failed calls on 29 Sep 2026 per Anthropic's notice).
    // Moved to Claude Sonnet 5.5, the current Sonnet. Changes from the old
    // request shape, each required by the newer API:
    //   - temperature removed: non-default sampling parameters return a 400 on
    //     Sonnet 5 and later. Tone/variety is steered by the system prompts.
    //   - thinking 'between_tools' at effort 'low': Sonnet 5.5 thinks by
    //     default, and 'disabled' is a 400. 'between_tools' is the lowest
    //     setting - with no tools declared it does no thinking at all - which
    //     keeps latency close to the old non-thinking Sonnet 4 behind Netlify's
    //     function timeout (the cause of the earlier 504s on Sonnet 4.6). If
    //     quality needs a lift, try adaptive thinking (omit `thinking`) at
    //     effort 'low' and measure p95 latency before raising effort.
    //   - max_tokens unchanged: nothing is spent on thinking, and the outputs
    //     are short lists; Sonnet 5's tokenizer uses ~30% more tokens than
    //     Sonnet 4 for the same text, still well inside these limits.
    //   - response read by block type, not position: a response can begin with
    //     a thinking block, so content[0].text is no longer safe.
    //   - stop_reason 'refusal' handled: Sonnet 5.5's safety classifiers return
    //     HTTP 200 with no usable text; surface it as a failed generation.
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: maxTokens,
      thinking: { type: 'between_tools' },
      output_config: { effort: 'low' },
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    if (message.stop_reason === 'refusal') {
      const category = message.stop_details && message.stop_details.category;
      console.error('recruitment-ai: request declined by safety classifier', { taskType, category });
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'The AI declined this request. Try rephrasing the role or prompt.',
          taskType: taskType
        })
      };
    }

    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();
    if (!responseText) {
      throw new Error(`Empty response from model (stop_reason: ${message.stop_reason})`);
    }
    
    // Return the text response directly
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        content: responseText,
        taskType: taskType
      })
    };

  } catch (error) {
    console.error('Error in recruitment-ai function:', error);

    // Anthropic SDK errors carry the upstream HTTP status (401 bad key, 404
    // unknown model, 429 rate limit, 5xx outage); pass it through so the
    // failure mode is visible in Netlify logs and the client, instead of a
    // blanket 500.
    const upstreamStatus = (error instanceof Anthropic.APIError && typeof error.status === 'number') ? error.status : 500;
    return {
      statusCode: upstreamStatus,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      })
    };
  }
};

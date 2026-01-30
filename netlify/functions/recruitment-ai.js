const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
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
      responsibilities: `You are an expert HR professional specializing in job descriptions. Generate 5-8 clear, specific, and measurable key responsibilities for the given role. Format as a JSON array of strings. Each responsibility should:
- Start with an action verb
- Be specific and measurable where possible
- Reflect realistic day-to-day duties
- Be appropriate for the seniority level

Return ONLY valid JSON array format: ["Responsibility 1", "Responsibility 2", ...]`,

      requirements: `You are an expert HR professional specializing in job requirements. Generate 6-10 essential requirements for the given role. Format as a JSON array of strings. Include a mix of:
- Educational qualifications
- Years of experience
- Technical skills
- Soft skills
- Certifications (if relevant)

Return ONLY valid JSON array format: ["Requirement 1", "Requirement 2", ...]`,

      benefits: `You are an expert HR professional specializing in employee benefits. Generate 5-8 attractive benefits for the given role and company context. Format as a JSON array of strings. Include a mix of:
- Compensation-related benefits
- Work-life balance benefits
- Professional development
- Health and wellness
- Unique perks

Return ONLY valid JSON array format: ["Benefit 1", "Benefit 2", ...]`,

      interviewQuestions: `You are an expert HR professional specializing in recruitment interviews. Generate 8-12 behavioral and technical interview questions for the given role. Format as a JSON array of objects with 'question' and 'purpose' fields.

Each question should:
- Be open-ended
- Assess key competencies for the role
- Follow STAR methodology where appropriate
- Include both behavioral and technical questions

Return ONLY valid JSON array format: [{"question": "Question text?", "purpose": "What this assesses"}, ...]`,

      scoringCriteria: `You are an expert HR professional specializing in candidate evaluation. Generate 5-7 scoring criteria for the given role. Format as a JSON array of objects with 'criterion' and 'weight' fields.

Criteria should:
- Cover key competencies for the role
- Be measurable
- Total weight should equal 100

Return ONLY valid JSON array format: [{"criterion": "Criterion name", "weight": 20}, ...]`,

      referenceQuestions: `You are an expert HR professional specializing in reference checks. Generate 6-10 reference check questions for the given role. Format as a JSON array of strings.

Questions should:
- Verify key competencies
- Assess work style and culture fit
- Be open-ended
- Probe for specific examples

Return ONLY valid JSON array format: ["Question 1?", "Question 2?", ...]`
    };

    const systemPrompt = systemPrompts[taskType] || systemPrompts.responsibilities;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    
    // Try to parse as JSON, if it fails, return the raw text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // If response has markdown code blocks, try to extract JSON
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse without code blocks
        parsedResponse = JSON.parse(responseText.trim());
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: parsedResponse,
        rawResponse: responseText
      })
    };

  } catch (error) {
    console.error('Error in recruitment-ai function:', error);
    
    return {
      statusCode: 500,
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

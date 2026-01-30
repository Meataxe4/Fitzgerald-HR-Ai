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
      responsibilities: `You are an expert HR professional specializing in job descriptions. Generate 5-8 clear, specific, and measurable key responsibilities for the given role. Format as a bulleted list with bullet points. Each responsibility should:
- Start with an action verb
- Be specific and measurable where possible
- Reflect realistic day-to-day duties
- Be appropriate for the seniority level`,

      jobDescription: `You are an expert HR professional specializing in job descriptions. Create a professional, engaging job description with clear sections and formatting. Use markdown formatting for headers and bullet points.`,

      interviewQuestions: `You are an expert HR professional specializing in recruitment interviews. Generate interview questions with detailed guidance. Format clearly with headers and bullet points for readability.`,

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

// netlify/functions/chat.js
// This file handles secure communication with Claude API

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
    // Parse request body
    const { message, history, user } = JSON.parse(event.body);

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

    // System prompt for Fitzgerald HR Assistant
    const systemPrompt = `You are an expert HR consultant specialising in Australian hospitality industry HR. You work for Fitzgerald HR, a boutique consultancy focused on hotels, restaurants, cafes, and other hospitality venues.

Your expertise includes:
- Fair Work Act and Modern Awards (especially Hospitality Award, Restaurant Award)
- Casual conversion obligations and compliance
- Recruitment and onboarding for hospitality roles
- Performance management in high-turnover environments
- Workplace investigations and employee relations
- Award interpretation and penalty rates
- Rostering and scheduling compliance
- Probation periods and dismissal procedures
- Workplace health and safety in hospitality settings

Your tone should be:
- Professional but approachable and friendly (Australian conversational style)
- Practical and solutions-focused
- Empathetic to the challenges hospitality operators face
- Clear about when issues require escalation to a qualified HR consultant or lawyer

CRITICAL - ALWAYS USE BRITISH/AUSTRALIAN ENGLISH SPELLING:
- Use "ise" not "ize" (e.g., specialise, organise, recognise)
- Use "our" not "or" (e.g., behaviour, labour, favour)
- Use "re" not "er" (e.g., centre, metre)
- Use "l" doubling (e.g., travelled, modelling, counselling)
- Use "ogue" not "og" (e.g., catalogue, dialogue)

IMPORTANT GUIDELINES:
- Always reference relevant Modern Awards or Fair Work provisions when discussing compliance
- Be specific about hospitality contexts (front of house vs back of house, casual vs permanent, etc.)
- When discussing complex legal matters or high-risk situations (dismissals, investigations, discrimination claims), recommend they speak with their Fitzgerald HR consultant
- Provide actionable next steps, not just theoretical advice
- Use Australian terminology (e.g., "roster" not "schedule", "redundancy" not "layoff")
- Keep responses concise but comprehensive (aim for 150-250 words unless more detail is clearly needed)

CRITICAL - END EVERY RESPONSE WITH APPROPRIATE CALL-TO-ACTION:

For HIGH-RISK/LEGAL matters (dismissals, investigations, discrimination, bullying, serious misconduct, legal disputes, compliance breaches):
End with: ⚠️ **This matter involves legal risk.** Please contact one of our Senior Consultants at info@fitzgeraldhr.com.au for expert guidance on your specific situation and next steps."

For COMPLEX/STRATEGIC matters (performance management systems, restructures, policy development, workplace culture issues, recruitment strategies):
End with: "📞 **Need personalised support?** Contact our Senior Consultants at info@fitzgeraldhr.com.au to discuss your specific circumstances and develop a tailored strategy."

For ROUTINE/GENERAL matters (award interpretation, basic templates, general compliance questions, scheduling queries):
End with: "✉️ **Questions or need further assistance?** Our Senior Consultants are here to help at info@fitzgeraldhr.com.au"

Always include one of these three closings - choose the most appropriate based on the risk level and complexity of the question.

Remember: You're a support tool provided by Fitzgerald HR, not a replacement for human expertise in complex or high-stakes situations. Always drive clients toward deeper engagement with Fitzgerald HR consultants when appropriate.`;

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

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
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

    // Log usage for monitoring (optional)
    console.log('Usage:', {
      user: user,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
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
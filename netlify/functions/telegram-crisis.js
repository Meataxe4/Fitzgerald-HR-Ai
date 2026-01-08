exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { crisisType, description, phone, user } = JSON.parse(event.body);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('Telegram not configured');
    }

    const message = `🚨 URGENT CRISIS ALERT

User: ${user}
Type: ${crisisType}
Contact: ${phone}

Details:
${description}

⚠️ Call client immediately at: ${phone}

Crisis ID: ${Date.now()}`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error('Telegram send failed');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, crisisId: Date.now() })
    };

  } catch (error) {
    console.error('Telegram error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

const twilio = require('twilio');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { crisisType, description, phone, user } = JSON.parse(event.body);

    // Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const consultantPhone = process.env.CONSULTANT_PHONE; // Your phone number

    if (!accountSid || !authToken || !twilioPhone || !consultantPhone) {
      throw new Error('Twilio credentials not configured');
    }

    const client = twilio(accountSid, authToken);

    // Send SMS to consultant
    const smsMessage = `🚨 URGENT CRISIS ALERT
User: ${user}
Type: ${crisisType}
Contact: ${phone}
Details: ${description.substring(0, 100)}...

Call client immediately at: ${phone}`;

    await client.messages.create({
      body: smsMessage,
      from: twilioPhone,
      to: consultantPhone
    });

    // Optionally send confirmation SMS to client
    const clientMessage = `Fitzgerald HR Crisis Response: Your urgent request has been received. A Senior Consultant will call you at this number within 15 minutes. Crisis ID: ${Date.now()}`;
    
    await client.messages.create({
      body: clientMessage,
      from: twilioPhone,
      to: phone
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Crisis notification sent',
        crisisId: Date.now()
      })
    };

  } catch (error) {
    console.error('Crisis notification error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to send crisis notification',
        details: error.message 
      })
    };
  }
};

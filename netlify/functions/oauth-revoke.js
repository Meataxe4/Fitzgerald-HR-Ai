// netlify/functions/oauth-revoke.js
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { integrationId, user } = JSON.parse(event.body);
        
        console.log('🔓 Revoking token for:', integrationId, user);
        
        // In production: Revoke the OAuth token with the provider
        // Delete from database
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        console.error('❌ Revoke error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

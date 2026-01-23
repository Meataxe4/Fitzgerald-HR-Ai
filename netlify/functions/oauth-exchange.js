// netlify/functions/oauth-exchange.js
const fetch = require('node-fetch');

const INTEGRATION_SECRETS = {
    deputy: {
        clientId: process.env.DEPUTY_CLIENT_ID,
        clientSecret: process.env.DEPUTY_CLIENT_SECRET,
        tokenUrl: 'https://once.deputy.com/my/oauth/access_token'
    },
    tanda: {
        clientId: process.env.TANDA_CLIENT_ID,
        clientSecret: process.env.TANDA_CLIENT_SECRET,
        tokenUrl: 'https://my.tanda.co/api/oauth2/token'
    },
    wheniwork: {
        clientId: process.env.WHENIWORK_CLIENT_ID,
        clientSecret: process.env.WHENIWORK_CLIENT_SECRET,
        tokenUrl: 'https://login.wheniwork.com/oauth2/token'
    },
    employmenthero: {
        clientId: process.env.EMPLOYMENTHERO_CLIENT_ID,
        clientSecret: process.env.EMPLOYMENTHERO_CLIENT_SECRET,
        tokenUrl: 'https://secure.employmenthero.com/oauth2/token'
    },
    xero: {
        clientId: process.env.XERO_CLIENT_ID,
        clientSecret: process.env.XERO_CLIENT_SECRET,
        tokenUrl: 'https://identity.xero.com/connect/token'
    },
    myob: {
        clientId: process.env.MYOB_CLIENT_ID,
        clientSecret: process.env.MYOB_CLIENT_SECRET,
        tokenUrl: 'https://secure.myob.com/oauth2/v1/authorize'
    },
    square: {
        clientId: process.env.SQUARE_CLIENT_ID,
        clientSecret: process.env.SQUARE_CLIENT_SECRET,
        tokenUrl: 'https://connect.squareup.com/oauth2/token'
    },
    lightspeed: {
        clientId: process.env.LIGHTSPEED_CLIENT_ID,
        clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
        tokenUrl: 'https://cloud.lightspeedapp.com/oauth/access_token.php'
    },
    toast: {
        clientId: process.env.TOAST_CLIENT_ID,
        clientSecret: process.env.TOAST_CLIENT_SECRET,
        tokenUrl: 'https://ws-api.toasttab.com/authentication/v1/authentication/login'
    }
};

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { integrationId, code, codeVerifier, user } = JSON.parse(event.body);
        
        console.log('🔑 Exchanging code for token:', integrationId);
        
        const config = INTEGRATION_SECRETS[integrationId];
        if (!config) {
            throw new Error('Integration not configured');
        }
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.URL}/.netlify/functions/${integrationId}-callback`,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code_verifier: codeVerifier
            })
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Token exchange failed:', errorText);
            throw new Error('Token exchange failed');
        }
        
        const tokenData = await tokenResponse.json();
        
        console.log('✅ Token received for:', integrationId);
        
        // Store token securely (in production, use a database)
        // For now, we'll return it to be stored client-side encrypted
        // In production: Store in Supabase with encryption
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                expiresIn: tokenData.expires_in,
                // Don't return actual token to client
                // Store it server-side and return a reference ID
                message: 'Connected successfully'
            })
        };
        
    } catch (error) {
        console.error('❌ OAuth exchange error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

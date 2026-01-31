// netlify/functions/deputy-auth.js
// Handles Deputy OAuth token exchange

const fetch = require('node-fetch');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { code, user_id, supabase_url, supabase_key } = JSON.parse(event.body);

        if (!code) {
            throw new Error('Authorization code is required');
        }

        console.log('Exchanging Deputy authorization code for tokens...');
        console.log('Using subdomain: e1849e30081029.au.deputy.com');

        // Use correct Deputy OAuth token endpoint per documentation
        const tokenResponse = await fetch('https://e1849e30081029.au.deputy.com/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.DEPUTY_CLIENT_ID,
                client_secret: process.env.DEPUTY_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.DEPUTY_REDIRECT_URI
            })
        });

        console.log('Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Deputy token exchange failed:', errorText);
            throw new Error(`Deputy API error: ${tokenResponse.status} - ${errorText}`);
        }

        const tokens = await tokenResponse.json();
        console.log('Deputy tokens received successfully');

        // Get user info to verify token works
        const meResponse = await fetch('https://e1849e30081029.au.deputy.com/api/v1/me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!meResponse.ok) {
            console.error('Failed to verify token with /me endpoint');
        } else {
            const meData = await meResponse.json();
            console.log('Deputy user verified:', meData.DisplayName);
        }

        // Save to Supabase if credentials provided
        if (supabase_url && supabase_key && user_id) {
            try {
                const supabase = require('@supabase/supabase-js');
                const supabaseClient = supabase.createClient(supabase_url, supabase_key);

                const { error: upsertError } = await supabaseClient
                    .from('integrations')
                    .upsert({
                        user_id: user_id,
                        platform: 'deputy',
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token || null,
                        token_expires_at: tokens.expires_in 
                            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        is_active: true,
                        settings: {
                            domain: 'e1849e30081029.au',
                            token_type: 'oauth'
                        },
                        last_synced: null,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,platform'
                    });

                if (upsertError) {
                    console.error('Supabase upsert error:', upsertError);
                } else {
                    console.log('Tokens saved to Supabase successfully');
                }
            } catch (supabaseError) {
                console.error('Error saving to Supabase:', supabaseError);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Deputy connected successfully'
            })
        };

    } catch (error) {
        console.error('OAuth error:', error);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

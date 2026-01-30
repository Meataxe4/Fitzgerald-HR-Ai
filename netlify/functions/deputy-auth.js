// netlify/functions/deputy-auth.js
// Handles Deputy OAuth token exchange and stores credentials in Supabase

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

        const tokenResponse = await fetch('https://once.deputy.com/oauth/access_token', {
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

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Deputy token exchange failed:', errorText);
            throw new Error(`Deputy API error: ${tokenResponse.status} - ${errorText}`);
        }

        const tokens = await tokenResponse.json();
        console.log('Deputy tokens received successfully');

        const meResponse = await fetch('https://once.deputy.com/api/v1/me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        let deputyDomain = 'once';
        if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData && meData._DPMetaData && meData._DPMetaData.System) {
                const systemData = JSON.parse(meData._DPMetaData.System);
                deputyDomain = systemData.Subdomain || 'once';
            }
        }

        const expiresIn = tokens.expires_in || 3600;
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        if (user_id && supabase_url && supabase_key) {
            const supabase = require('@supabase/supabase-js');
            const supabaseClient = supabase.createClient(supabase_url, supabase_key);

            const { data, error } = await supabaseClient
                .from('integrations')
                .upsert({
                    user_id: user_id,
                    platform: 'deputy',
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    token_expires_at: expiresAt,
                    is_active: true,
                    settings: {
                        domain: deputyDomain,
                        scope: tokens.scope
                    },
                    last_synced: null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,platform'
                });

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(`Failed to save tokens: ${error.message}`);
            }

            await supabaseClient.from('sync_logs').insert({
                integration_id: data?.id,
                user_id: user_id,
                sync_type: 'connection',
                status: 'success',
                records_synced: 0,
                metadata: {
                    domain: deputyDomain,
                    timestamp: new Date().toISOString()
                }
            });

            console.log('Deputy integration saved to Supabase successfully');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Deputy connected successfully',
                data: {
                    domain: deputyDomain,
                    expires_at: expiresAt,
                    scope: tokens.scope
                }
            })
        };

    } catch (error) {
        console.error('Deputy auth error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to connect Deputy'
            })
        };
    }
};

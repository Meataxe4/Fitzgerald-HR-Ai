// ========================================
// STRIPE CHECKOUT - Netlify Function
// Creates checkout sessions for subscriptions and one-time purchases
// ========================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Price ID mapping
const PRICE_IDS = {
    // Subscriptions
    starter_monthly: 'price_1Sxbs12Ig0gUvbfw60DcAdsb',
    starter_annual: 'price_1Sxc6M2Ig0gUvbfwKGnLYPsD',
    professional_monthly: 'price_1Sxc8H2Ig0gUvbfwZpnVjgV1',
    professional_annual: 'price_1SxcAu2Ig0gUvbfwCgAD1pcK',
    enterprise_monthly: 'price_1SxcCt2Ig0gUvbfwA7KAzrM7',
    enterprise_annual: 'price_1SxcF92Ig0gUvbfwoplfYN9m',
    
    // Credit Packs (one-time)
    credits_5: 'price_1SxcGL2Ig0gUvbfw0OEB9gPK',
    credits_10: 'price_1SxcHP2Ig0gUvbfwrQjmaEFm',
    credits_20: 'price_1SxcJ32Ig0gUvbfwJeetPLHa',
    
    // Chat Top-Up (one-time)
    chat_topup: 'price_1SxcKS2Ig0gUvbfwQBqvE9k4'
};

// Credit amounts for each product
const CREDIT_AMOUNTS = {
    starter_monthly: 5,
    starter_annual: 5,
    professional_monthly: 14,
    professional_annual: 14,
    enterprise_monthly: 25,
    enterprise_annual: 25,
    credits_5: 5,
    credits_10: 10,
    credits_20: 20,
    chat_topup: 0
};

// Prompt amounts for chat top-up
const PROMPT_AMOUNTS = {
    chat_topup: 30
};

// Subscription tier mapping
const TIER_MAPPING = {
    starter_monthly: 'starter',
    starter_annual: 'starter',
    professional_monthly: 'professional',
    professional_annual: 'professional',
    enterprise_monthly: 'enterprise',
    enterprise_annual: 'enterprise'
};

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { productKey, userId, userEmail, successUrl, cancelUrl } = JSON.parse(event.body);

        if (!PRICE_IDS[productKey]) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid product key' }) };
        }

        const priceId = PRICE_IDS[productKey];
        const isSubscription = productKey.includes('monthly') || productKey.includes('annual');

        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: successUrl || `${process.env.URL || 'https://fitzhr.com'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.URL || 'https://fitzhr.com'}/?payment=cancelled`,
            metadata: {
                userId: userId || 'anonymous',
                productKey: productKey,
                credits: CREDIT_AMOUNTS[productKey] || 0,
                prompts: PROMPT_AMOUNTS[productKey] || 0,
                tier: TIER_MAPPING[productKey] || 'free'
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto'
        };

        if (userEmail) {
            sessionConfig.customer_email = userEmail;
        }

        if (isSubscription) {
            sessionConfig.subscription_data = {
                metadata: {
                    userId: userId || 'anonymous',
                    tier: TIER_MAPPING[productKey]
                }
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ sessionId: session.id, url: session.url })
        };

    } catch (error) {
        console.error('Stripe checkout error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create checkout session', message: error.message })
        };
    }
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ============================================
// PRICE ID MAPPING - Updated February 2025
// NEW PRICING MODEL: Starter/Pro/Business
// ============================================
const PRICE_IDS = {
    // Subscriptions - NEW TIERS (Test Mode)
    starter_monthly: 'price_1Sys3V2Ig0gUvbfwwy70aKko',
    starter_annual: 'price_1Sys2t2Ig0gUvbfwRMxXCSnP',
    pro_monthly: 'price_1Sys4S2Ig0gUvbfwEfAFtmpk',
    pro_annual: 'price_1Sys402Ig0gUvbfwc2M1RM7K',
    business_monthly: 'price_1Sys5I2Ig0gUvbfwRjf1Rs2e',
    business_annual: 'price_1Sys4y2Ig0gUvbfwv5PTTgrg',
    
    // Review Credit Packs (one-time)
    credits_1: 'price_1Sys622Ig0gUvbfwgSo1au7E',    // 1 credit - $29
    credits_5: 'price_1Sys6Z2Ig0gUvbfwp7WVRLGF',    // 5 credits - $119
    
    // Consultation (one-time)
    consultation: 'price_1Sys7E2Ig0gUvbfwD6RrsWAR'  // HR Consultation - $150
};

// Review credits for each product (per year for subscriptions)
const REVIEW_CREDIT_AMOUNTS = {
    // Subscriptions give review credits per year
    starter_monthly: 8,
    starter_annual: 8,
    pro_monthly: 20,
    pro_annual: 20,
    business_monthly: 50,
    business_annual: 50,
    
    // One-time credit packs
    credits_1: 1,
    credits_5: 5,
    
    // Consultation doesn't give credits
    consultation: 0
};

// Subscription tier mapping
const TIER_MAPPING = {
    starter_monthly: 'starter',
    starter_annual: 'starter',
    pro_monthly: 'pro',
    pro_annual: 'pro',
    business_monthly: 'business',
    business_annual: 'business'
};

// Product type mapping
const PRODUCT_TYPE = {
    starter_monthly: 'subscription',
    starter_annual: 'subscription',
    pro_monthly: 'subscription',
    pro_annual: 'subscription',
    business_monthly: 'subscription',
    business_annual: 'subscription',
    credits_1: 'reviewCredits',
    credits_5: 'reviewCredits',
    consultation: 'consultation'
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
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid product key: ' + productKey }) };
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
                productType: PRODUCT_TYPE[productKey] || 'unknown',
                reviewCredits: REVIEW_CREDIT_AMOUNTS[productKey] || 0,
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
                    tier: TIER_MAPPING[productKey],
                    reviewCredits: REVIEW_CREDIT_AMOUNTS[productKey]
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


// ============================================
// IMPORTANT NOTES:
// ============================================
// 
// 1. These are TEST MODE price IDs
//    When going LIVE, create new products in Stripe Live Mode
//    and update the PRICE_IDS above
//
// 2. New Pricing Model (Feb 2025):
//    - Starter: $249/yr or $29/mo - 8 review credits/year
//    - Pro: $449/yr or $49/mo - 20 review credits/year  
//    - Business: $899/yr or $99/mo - 50 review credits/year
//    - Single Credit: $29
//    - 5 Credit Pack: $119
//    - Consultation: $150
//
// 3. Review credits are for expert-reviewed documents only
//    Low-risk templates are UNLIMITED for all paid tiers
//
// ============================================

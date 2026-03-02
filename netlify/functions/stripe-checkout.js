const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ============================================
// PRICE ID MAPPING - Updated March 2025
// LIVE MODE - Starter/Pro/Business
// ============================================
const PRICE_IDS = {
    // Subscriptions - LIVE MODE
    starter_monthly: 'price_1T6TF02Ig0gUvbfwRi8SuyIM',
    starter_annual: 'price_1T6THA2Ig0gUvbfwgqwTuKuJ',
    pro_monthly: 'price_1T6TJ72Ig0gUvbfwUT1vMaAb',
    pro_annual: 'price_1T6TKD2Ig0gUvbfws3sw93m1',
    business_monthly: 'price_1T6TL52Ig0gUvbfwnBbFQK6l',
    business_annual: 'price_1T6TM62Ig0gUvbfw8IMbOAoG',
    
    // Review Credit Packs (one-time)
    credits_1: 'price_1T6TNB2Ig0gUvbfwopGhRIlF',    // 1 credit - $29
    credits_5: 'price_1T6TOK2Ig0gUvbfwAdowCoQc',    // 5 credits - $119
    
    // Chat Top-Up (one-time)
    chat_topup: 'price_1T6TPs2Ig0gUvbfwymN5AEq7',   // Chat Top-Up - $19 for 30 prompts
    
    // Consultation (one-time) - not currently offered
    consultation: 'price_1T6TQw2Ig0gUvbfwv0jTcxZi'   // HR Consultation - $150
};

// ============================================
// REVIEW CREDITS - FIXED AMOUNTS
// Monthly = per month, Annual = full year upfront
// ============================================
const REVIEW_CREDIT_AMOUNTS = {
    // Monthly subscriptions - credits per month
    starter_monthly: 8,
    pro_monthly: 20,
    business_monthly: 50,
    
    // Annual subscriptions - ALL credits upfront (monthly × 12)
    starter_annual: 96,    // 8 × 12 = 96
    pro_annual: 240,       // 20 × 12 = 240
    business_annual: 600,  // 50 × 12 = 600
    
    // One-time credit packs
    credits_1: 1,
    credits_5: 5,
    
    // Chat top-up doesn't give review credits
    chat_topup: 0,
    
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
    chat_topup: 'topup',
    consultation: 'consultation'
};

// Billing cycle mapping
const BILLING_CYCLE = {
    starter_monthly: 'monthly',
    starter_annual: 'annual',
    pro_monthly: 'monthly',
    pro_annual: 'annual',
    business_monthly: 'monthly',
    business_annual: 'annual'
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
        const billingCycle = BILLING_CYCLE[productKey] || 'monthly';
        const reviewCredits = REVIEW_CREDIT_AMOUNTS[productKey] || 0;

        console.log(`📦 Creating checkout for ${productKey}: ${reviewCredits} credits (${billingCycle})`);

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
                reviewCredits: reviewCredits,
                tier: TIER_MAPPING[productKey] || 'free',
                billingCycle: billingCycle
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto'
        };

        // Add prompts metadata for top-up purchases
        if (productKey === 'chat_topup') {
            sessionConfig.metadata.prompts = '30';
        }

        if (userEmail) {
            sessionConfig.customer_email = userEmail;
        }

        if (isSubscription) {
            sessionConfig.subscription_data = {
                metadata: {
                    userId: userId || 'anonymous',
                    tier: TIER_MAPPING[productKey],
                    reviewCredits: reviewCredits,
                    billingCycle: billingCycle
                }
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log(`✅ Checkout session created: ${session.id}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                sessionId: session.id, 
                url: session.url,
                reviewCredits: reviewCredits,
                billingCycle: billingCycle
            })
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
// 1. These are LIVE MODE price IDs (switched March 2025)
//    Test mode IDs are no longer used
//
// 2. New Pricing Model (Feb 2025):
//    - Starter: $249/yr (96 credits) or $29/mo (8 credits)
//    - Pro: $449/yr (240 credits) or $49/mo (20 credits)
//    - Business: $899/yr (600 credits) or $99/mo (50 credits)
//    - Single Credit: $29
//    - 5 Credit Pack: $119
//    - Chat Top-Up: $19 (30 bonus prompts)
//    - Consultation: $150
//
// 3. Annual plans get ALL credits upfront (monthly × 12)
//    Monthly plans get credits each month on renewal
//
// ============================================

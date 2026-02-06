// ========================================
// STRIPE WEBHOOK - Netlify Function
// Handles payment confirmations and allocates credits
// ========================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin (you'll need to add this)
// const admin = require('firebase-admin');

// Price to config mapping
const PRODUCT_CONFIG = {
    'price_1Sxbs12Ig0gUvbfw60DcAdsb': { type: 'subscription', tier: 'starter', credits: 5 },
    'price_1Sxc6M2Ig0gUvbfwKGnLYPsD': { type: 'subscription', tier: 'starter', credits: 5 },
    'price_1Sxc8H2Ig0gUvbfwZpnVjgV1': { type: 'subscription', tier: 'professional', credits: 14 },
    'price_1SxcAu2Ig0gUvbfwCgAD1pcK': { type: 'subscription', tier: 'professional', credits: 14 },
    'price_1SxcCt2Ig0gUvbfwA7KAzrM7': { type: 'subscription', tier: 'enterprise', credits: 25 },
    'price_1SxcF92Ig0gUvbfwoplfYN9m': { type: 'subscription', tier: 'enterprise', credits: 25 },
    'price_1SxcGL2Ig0gUvbfw0OEB9gPK': { type: 'credits', credits: 5 },
    'price_1SxcHP2Ig0gUvbfwrQjmaEFm': { type: 'credits', credits: 10 },
    'price_1SxcJ32Ig0gUvbfwJeetPLHa': { type: 'credits', credits: 20 },
    'price_1SxcKS2Ig0gUvbfwQBqvE9k4': { type: 'topup', prompts: 30 }
};

exports.handler = async (event, context) => {
    const headers = { 'Content-Type': 'application/json' };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let stripeEvent;

    try {
        if (endpointSecret && sig) {
            stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
        } else {
            stripeEvent = JSON.parse(event.body);
            console.warn('⚠️ Webhook signature verification skipped');
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
    }

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object;
                console.log('✅ Checkout completed:', session.id);
                
                const metadata = session.metadata || {};
                const userId = metadata.userId;
                
                // Get line items
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                
                for (const item of lineItems.data) {
                    const config = PRODUCT_CONFIG[item.price.id];
                    if (!config) continue;
                    
                    if (config.type === 'credits') {
                        console.log(`📦 Credit pack: ${config.credits} credits for ${userId}`);
                        // TODO: Add to Firebase - userCredits.purchasedCredits += config.credits
                    }
                    
                    if (config.type === 'topup') {
                        console.log(`💬 Chat top-up: ${config.prompts} prompts for ${userId}`);
                        // TODO: Add to Firebase - userCredits.bonusPrompts += config.prompts
                    }
                    
                    if (config.type === 'subscription') {
                        console.log(`⭐ Subscription: ${config.tier} tier for ${userId}`);
                        // TODO: Update Firebase - userCredits.tier = config.tier
                        // TODO: Add initial credits - userCredits.subscriptionCredits = config.credits
                    }
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = stripeEvent.data.object;
                console.log('💰 Invoice paid:', invoice.id);
                
                // For subscription renewals, allocate monthly credits
                if (invoice.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                    const metadata = subscription.metadata || {};
                    const userId = metadata.userId;
                    const priceId = subscription.items.data[0]?.price?.id;
                    const config = PRODUCT_CONFIG[priceId];
                    
                    if (config && config.credits) {
                        console.log(`🔄 Monthly credits: ${config.credits} for ${userId}`);
                        // TODO: Add to Firebase - userCredits.subscriptionCredits += config.credits
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                console.log('❌ Subscription cancelled:', subscription.id);
                
                const metadata = subscription.metadata || {};
                const userId = metadata.userId;
                
                console.log(`⬇️ Downgrade to free tier for ${userId}`);
                // TODO: Update Firebase - userCredits.tier = 'free'
                break;
            }

            default:
                console.log(`Unhandled event: ${stripeEvent.type}`);
        }

        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };

    } catch (error) {
        console.error('Webhook handler error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

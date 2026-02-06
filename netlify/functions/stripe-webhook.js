// ========================================
// STRIPE WEBHOOK - Netlify Function
// Handles payment confirmations and updates Firebase
// ========================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

const db = admin.firestore();

// Price to config mapping
const PRODUCT_CONFIG = {
    'price_1Sxbs12Ig0gUvbfw60DcAdsb': { type: 'subscription', tier: 'starter', credits: 5, name: 'Starter Monthly' },
    'price_1Sxc6M2Ig0gUvbfwKGnLYPsD': { type: 'subscription', tier: 'starter', credits: 5, name: 'Starter Annual' },
    'price_1Sxc8H2Ig0gUvbfwZpnVjgV1': { type: 'subscription', tier: 'professional', credits: 14, name: 'Professional Monthly' },
    'price_1SxcAu2Ig0gUvbfwCgAD1pcK': { type: 'subscription', tier: 'professional', credits: 14, name: 'Professional Annual' },
    'price_1SxcCt2Ig0gUvbfwA7KAzrM7': { type: 'subscription', tier: 'enterprise', credits: 25, name: 'Enterprise Monthly' },
    'price_1SxcF92Ig0gUvbfwoplfYN9m': { type: 'subscription', tier: 'enterprise', credits: 25, name: 'Enterprise Annual' },
    'price_1SxcGL2Ig0gUvbfw0OEB9gPK': { type: 'credits', credits: 5, name: '5 Credit Pack' },
    'price_1SxcHP2Ig0gUvbfwrQjmaEFm': { type: 'credits', credits: 10, name: '10 Credit Pack' },
    'price_1SxcJ32Ig0gUvbfwJeetPLHa': { type: 'credits', credits: 20, name: '20 Credit Pack' },
    'price_1SxcKS2Ig0gUvbfwQBqvE9k4': { type: 'topup', prompts: 30, name: 'Chat Top-Up' }
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
        console.log('📨 Received event:', stripeEvent.type);

        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object;
                await handleCheckoutComplete(session);
                break;
            }

            case 'invoice.paid': {
                const invoice = stripeEvent.data.object;
                await handleInvoicePaid(invoice);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                await handleSubscriptionCancelled(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object;
                await handleSubscriptionUpdated(subscription);
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

// ========================================
// EVENT HANDLERS
// ========================================

async function handleCheckoutComplete(session) {
    console.log('✅ Checkout completed:', session.id);
    
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    
    if (!userId || userId === 'anonymous') {
        console.log('⚠️ No valid userId in session metadata');
        return;
    }

    // Get line items to determine what was purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    for (const item of lineItems.data) {
        const config = PRODUCT_CONFIG[item.price.id];
        if (!config) {
            console.log('Unknown product:', item.price.id);
            continue;
        }
        
        if (config.type === 'credits') {
            // One-time credit pack purchase
            console.log(`📦 Credit pack: ${config.credits} credits for ${userId}`);
            await addPurchasedCredits(userId, config.credits, session.id, config.name);
        }
        
        if (config.type === 'topup') {
            // Chat top-up
            console.log(`💬 Chat top-up: ${config.prompts} prompts for ${userId}`);
            await addBonusPrompts(userId, config.prompts, session.id);
        }
        
        if (config.type === 'subscription') {
            // Subscription - initial credits
            console.log(`⭐ Subscription started: ${config.tier} for ${userId}`);
            await activateSubscription(userId, config.tier, config.credits, session.customer, session.id);
        }
    }
}

async function handleInvoicePaid(invoice) {
    console.log('💰 Invoice paid:', invoice.id);
    
    // Skip if this is the first invoice (handled by checkout.session.completed)
    if (invoice.billing_reason === 'subscription_create') {
        console.log('Skipping initial invoice - handled by checkout');
        return;
    }
    
    // For subscription renewals, allocate monthly credits
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;
        
        if (!userId || userId === 'anonymous') {
            console.log('⚠️ No valid userId in subscription metadata');
            return;
        }
        
        const priceId = subscription.items.data[0]?.price?.id;
        const config = PRODUCT_CONFIG[priceId];
        
        if (config && config.credits) {
            console.log(`🔄 Monthly renewal: ${config.credits} credits for ${userId}`);
            await addSubscriptionCredits(userId, config.credits, invoice.id);
        }
    }
}

async function handleSubscriptionCancelled(subscription) {
    console.log('❌ Subscription cancelled:', subscription.id);
    
    const metadata = subscription.metadata || {};
    const userId = metadata.userId;
    
    if (!userId || userId === 'anonymous') {
        console.log('⚠️ No valid userId in subscription metadata');
        return;
    }
    
    console.log(`⬇️ Downgrading ${userId} to free tier`);
    await downgradeToFree(userId, subscription.id);
}

async function handleSubscriptionUpdated(subscription) {
    console.log('📝 Subscription updated:', subscription.id);
    
    // Check if subscription is past_due or unpaid
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;
        
        if (userId && userId !== 'anonymous') {
            console.log(`⚠️ Payment issue for ${userId}, status: ${subscription.status}`);
            // Optionally downgrade or flag the account
        }
    }
}

// ========================================
// FIREBASE OPERATIONS
// ========================================

async function addPurchasedCredits(userId, credits, transactionId, productName) {
    const userRef = db.collection('users').doc(userId);
    
    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            const currentData = doc.exists ? doc.data() : {};
            const currentCredits = currentData.credits || {};
            
            transaction.set(userRef, {
                credits: {
                    ...currentCredits,
                    purchasedCredits: (currentCredits.purchasedCredits || 0) + credits,
                    lastTransaction: transactionId,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                },
                transactions: admin.firestore.FieldValue.arrayUnion({
                    type: 'credit_pack',
                    credits: credits,
                    product: productName,
                    transactionId: transactionId,
                    timestamp: new Date().toISOString()
                })
            }, { merge: true });
        });
        
        console.log(`✅ Added ${credits} purchased credits to ${userId}`);
        return true;
    } catch (error) {
        console.error('Error adding purchased credits:', error);
        throw error;
    }
}

async function addBonusPrompts(userId, prompts, transactionId) {
    const userRef = db.collection('users').doc(userId);
    
    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            const currentData = doc.exists ? doc.data() : {};
            const currentCredits = currentData.credits || {};
            
            transaction.set(userRef, {
                credits: {
                    ...currentCredits,
                    bonusPrompts: (currentCredits.bonusPrompts || 0) + prompts,
                    lastTransaction: transactionId,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
        });
        
        console.log(`✅ Added ${prompts} bonus prompts to ${userId}`);
        return true;
    } catch (error) {
        console.error('Error adding bonus prompts:', error);
        throw error;
    }
}

async function activateSubscription(userId, tier, credits, stripeCustomerId, transactionId) {
    const userRef = db.collection('users').doc(userId);
    
    try {
        await userRef.set({
            credits: {
                tier: tier,
                subscriptionCredits: credits,
                purchasedCredits: admin.firestore.FieldValue.increment(0), // Keep existing
                bonusPrompts: admin.firestore.FieldValue.increment(0), // Keep existing
                monthlyPromptsUsed: 0,
                freeDocumentUsed: false,
                stripeCustomerId: stripeCustomerId,
                subscriptionStarted: admin.firestore.FieldValue.serverTimestamp(),
                lastCreditRefresh: admin.firestore.FieldValue.serverTimestamp(),
                lastTransaction: transactionId,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            },
            transactions: admin.firestore.FieldValue.arrayUnion({
                type: 'subscription_started',
                tier: tier,
                credits: credits,
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            })
        }, { merge: true });
        
        console.log(`✅ Activated ${tier} subscription for ${userId} with ${credits} credits`);
        return true;
    } catch (error) {
        console.error('Error activating subscription:', error);
        throw error;
    }
}

async function addSubscriptionCredits(userId, credits, transactionId) {
    const userRef = db.collection('users').doc(userId);
    
    try {
        // Get current data to check rollover limits
        const doc = await userRef.get();
        const currentData = doc.exists ? doc.data() : {};
        const currentCredits = currentData.credits || {};
        const tier = currentCredits.tier || 'free';
        
        // Tier rollover limits
        const maxBanked = {
            starter: 10,
            professional: 42,
            enterprise: 75
        };
        
        const currentSubCredits = currentCredits.subscriptionCredits || 0;
        const newTotal = currentSubCredits + credits;
        const cappedTotal = Math.min(newTotal, maxBanked[tier] || credits);
        
        await userRef.set({
            credits: {
                ...currentCredits,
                subscriptionCredits: cappedTotal,
                lastCreditRefresh: admin.firestore.FieldValue.serverTimestamp(),
                lastTransaction: transactionId,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            },
            transactions: admin.firestore.FieldValue.arrayUnion({
                type: 'subscription_renewal',
                credits: credits,
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            })
        }, { merge: true });
        
        console.log(`✅ Added ${credits} subscription credits to ${userId} (capped at ${cappedTotal})`);
        return true;
    } catch (error) {
        console.error('Error adding subscription credits:', error);
        throw error;
    }
}

async function downgradeToFree(userId, transactionId) {
    const userRef = db.collection('users').doc(userId);
    
    try {
        // Keep purchased credits, clear subscription credits
        const doc = await userRef.get();
        const currentData = doc.exists ? doc.data() : {};
        const currentCredits = currentData.credits || {};
        
        await userRef.set({
            credits: {
                ...currentCredits,
                tier: 'free',
                subscriptionCredits: 0, // Clear subscription credits
                // Keep purchasedCredits - they never expire
                stripeCustomerId: currentCredits.stripeCustomerId, // Keep for records
                subscriptionEnded: admin.firestore.FieldValue.serverTimestamp(),
                lastTransaction: transactionId,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            },
            transactions: admin.firestore.FieldValue.arrayUnion({
                type: 'subscription_cancelled',
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            })
        }, { merge: true });
        
        console.log(`✅ Downgraded ${userId} to free tier`);
        return true;
    } catch (error) {
        console.error('Error downgrading to free:', error);
        throw error;
    }
}

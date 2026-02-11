// ========================================
// STRIPE WEBHOOK - Netlify Function
// Handles payment confirmations and updates Firebase
// ========================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once) with error handling
let firebaseInitialized = false;
let db = null;

try {
    if (!admin.apps.length) {
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            console.error('⚠️ Missing Firebase credentials');
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            firebaseInitialized = true;
            db = admin.firestore();
            console.log('✅ Firebase Admin initialized');
        }
    } else {
        firebaseInitialized = true;
        db = admin.firestore();
    }
} catch (initError) {
    console.error('❌ Firebase initialization failed:', initError.message);
}

// Price to config mapping - UPDATE WITH YOUR STRIPE PRICE IDs
const PRODUCT_CONFIG = {
    // Subscriptions - matches your pricing (8/20/50 review credits)
    'price_1Sxbs12Ig0gUvbfw60DcAdsb': { type: 'subscription', tier: 'starter', credits: 8, name: 'Starter Monthly' },
    'price_1Sxc6M2Ig0gUvbfwKGnLYPsD': { type: 'subscription', tier: 'starter', credits: 8, name: 'Starter Annual' },
    'price_1Sxc8H2Ig0gUvbfwZpnVjgV1': { type: 'subscription', tier: 'pro', credits: 20, name: 'Pro Monthly' },
    'price_1SxcAu2Ig0gUvbfwCgAD1pcK': { type: 'subscription', tier: 'pro', credits: 20, name: 'Pro Annual' },
    'price_1SxcCt2Ig0gUvbfwA7KAzrM7': { type: 'subscription', tier: 'business', credits: 50, name: 'Business Monthly' },
    'price_1SxcF92Ig0gUvbfwoplfYN9m': { type: 'subscription', tier: 'business', credits: 50, name: 'Business Annual' },
    // Credit packs - $29 each or 5 for $119
    'price_1SxcGL2Ig0gUvbfw0OEB9gPK': { type: 'credits', credits: 1, name: '1 Credit' },
    'price_1SxcHP2Ig0gUvbfwrQjmaEFm': { type: 'credits', credits: 5, name: '5 Credit Pack' },
    'price_1SxcJ32Ig0gUvbfwJeetPLHa': { type: 'credits', credits: 10, name: '10 Credit Pack' },
    'price_1SxcKS2Ig0gUvbfwQBqvE9k4': { type: 'topup', prompts: 30, name: 'Chat Top-Up' }
};

exports.handler = async (event, context) => {
    const headers = { 'Content-Type': 'application/json' };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    // Check configurations
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY not configured');
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, error: 'Stripe not configured' }) };
    }

    if (!db) {
        console.error('❌ Firebase not initialized');
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, error: 'Firebase not configured' }) };
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

    console.log('📨 Received event:', stripeEvent.type);

    // Process events with individual try-catch blocks
    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                try {
                    await handleCheckoutComplete(stripeEvent.data.object);
                } catch (err) {
                    console.error('Error in checkout.session.completed:', err.message);
                }
                break;
            }

            case 'invoice.paid': {
                try {
                    await handleInvoicePaid(stripeEvent.data.object);
                } catch (err) {
                    console.error('Error in invoice.paid:', err.message);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                try {
                    await handleSubscriptionCancelled(stripeEvent.data.object);
                } catch (err) {
                    console.error('Error in subscription.deleted:', err.message);
                }
                break;
            }

            case 'customer.subscription.updated': {
                try {
                    await handleSubscriptionUpdated(stripeEvent.data.object);
                } catch (err) {
                    console.error('Error in subscription.updated:', err.message);
                }
                break;
            }

            default:
                console.log(`Unhandled event: ${stripeEvent.type}`);
        }

        // ✅ ALWAYS return 200 to acknowledge receipt
        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };

    } catch (error) {
        console.error('Webhook handler error:', error.message);
        // ✅ STILL return 200 to prevent Stripe retries
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, error: error.message }) };
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

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    for (const item of lineItems.data) {
        const config = PRODUCT_CONFIG[item.price.id];
        if (!config) {
            console.log('Unknown product:', item.price.id);
            continue;
        }
        
        if (config.type === 'credits') {
            console.log(`📦 Credit pack: ${config.credits} credits for ${userId}`);
            await addPurchasedCredits(userId, config.credits, session.id, config.name);
        }
        
        if (config.type === 'topup') {
            console.log(`💬 Chat top-up: ${config.prompts} prompts for ${userId}`);
            await addBonusPrompts(userId, config.prompts, session.id);
        }
        
        if (config.type === 'subscription') {
            console.log(`⭐ Subscription started: ${config.tier} for ${userId}`);
            await activateSubscription(userId, config.tier, config.credits, session.customer, session.id);
        }
    }
}

async function handleInvoicePaid(invoice) {
    console.log('💰 Invoice paid:', invoice.id);
    
    if (invoice.billing_reason === 'subscription_create') {
        console.log('Skipping initial invoice - handled by checkout');
        return;
    }
    
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
    console.log('📝 Subscription updated:', subscription.id, 'Status:', subscription.status);
    
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;
        
        if (userId && userId !== 'anonymous') {
            console.log(`⚠️ Payment issue for ${userId}, status: ${subscription.status}`);
        }
    }
}

// ========================================
// FIREBASE OPERATIONS
// ========================================

async function addPurchasedCredits(userId, credits, transactionId, productName) {
    if (!db) return false;
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
        console.error('Error adding purchased credits:', error.message);
        return false;
    }
}

async function addBonusPrompts(userId, prompts, transactionId) {
    if (!db) return false;
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
        console.error('Error adding bonus prompts:', error.message);
        return false;
    }
}

async function activateSubscription(userId, tier, credits, stripeCustomerId, transactionId) {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    try {
        await userRef.set({
            credits: {
                subscriptionTier: tier,
                tier: tier,
                reviewCredits: credits,
                reviewCreditsUsed: 0,
                purchasedCredits: admin.firestore.FieldValue.increment(0),
                bonusPrompts: admin.firestore.FieldValue.increment(0),
                monthlyPromptsUsed: 0,
                lowRiskDocsUsed: 0,
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
        console.error('Error activating subscription:', error.message);
        return false;
    }
}

async function addSubscriptionCredits(userId, credits, transactionId) {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    try {
        const doc = await userRef.get();
        const currentData = doc.exists ? doc.data() : {};
        const currentCredits = currentData.credits || {};
        
        await userRef.set({
            credits: {
                ...currentCredits,
                reviewCredits: credits,
                reviewCreditsUsed: 0,
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
        
        console.log(`✅ Renewed ${userId} with ${credits} credits`);
        return true;
    } catch (error) {
        console.error('Error adding subscription credits:', error.message);
        return false;
    }
}

async function downgradeToFree(userId, transactionId) {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    try {
        const doc = await userRef.get();
        const currentData = doc.exists ? doc.data() : {};
        const currentCredits = currentData.credits || {};
        
        await userRef.set({
            credits: {
                ...currentCredits,
                subscriptionTier: 'free',
                tier: 'free',
                reviewCredits: 0,
                stripeCustomerId: currentCredits.stripeCustomerId,
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
        console.error('Error downgrading to free:', error.message);
        return false;
    }
}

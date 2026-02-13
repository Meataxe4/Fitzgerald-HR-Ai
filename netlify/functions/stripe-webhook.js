// ========================================
// STRIPE WEBHOOK - Netlify Function
// Handles payment confirmations and updates Firebase
// Uses METADATA from checkout (no hardcoded price IDs needed)
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

// Credit amounts by tier (used as fallback)
const TIER_CREDITS = {
    starter: 8,
    pro: 20,
    business: 50,
    free: 0
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

            case 'invoice.payment_failed': {
                try {
                    await handlePaymentFailed(stripeEvent.data.object);
                } catch (err) {
                    console.error('Error in invoice.payment_failed:', err.message);
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
    console.log('📦 Session metadata:', JSON.stringify(session.metadata));
    console.log('👤 Customer ID:', session.customer);
    
    // Get info from session metadata (set by stripe-checkout.js)
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const productType = metadata.productType;
    const tier = metadata.tier;
    const reviewCredits = parseInt(metadata.reviewCredits) || 0;
    const productKey = metadata.productKey;
    
    console.log('📋 Parsed - userId:', userId, 'type:', productType, 'tier:', tier, 'credits:', reviewCredits);
    
    if (!userId || userId === 'anonymous') {
        console.log('⚠️ No valid userId in session metadata');
        return;
    }

    // Handle based on product type from metadata
    if (productType === 'subscription') {
        console.log(`⭐ Subscription started: ${tier} for ${userId}`);
        
        // Get subscription details for period end date
        let subscriptionPeriodEnd = null;
        let subscriptionId = null;
        if (session.subscription) {
            try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                subscriptionPeriodEnd = subscription.current_period_end;
                subscriptionId = subscription.id;
                
                // Also update subscription metadata with userId for future events
                await stripe.subscriptions.update(subscription.id, {
                    metadata: { userId: userId, tier: tier }
                });
                console.log('✅ Updated subscription metadata');
            } catch (e) {
                console.log('Could not retrieve/update subscription details:', e.message);
            }
        }
        
        const credits = reviewCredits || TIER_CREDITS[tier] || 0;
        await activateSubscription(userId, tier, credits, session.customer, session.id, subscriptionPeriodEnd, subscriptionId);
    }
    
    if (productType === 'reviewCredits') {
        console.log(`📦 Credit pack: ${reviewCredits} credits for ${userId}`);
        await addPurchasedCredits(userId, reviewCredits, session.id, productKey, session.customer);
    }
    
    if (productType === 'consultation') {
        console.log(`📞 Consultation booked for ${userId}`);
        // Just log it - no credits to add
        await logTransaction(userId, 'consultation', session.id, session.customer);
    }
}

async function handleInvoicePaid(invoice) {
    console.log('💰 Invoice paid:', invoice.id, 'Reason:', invoice.billing_reason);
    
    // Skip initial invoice - already handled by checkout.session.completed
    if (invoice.billing_reason === 'subscription_create') {
        console.log('Skipping initial invoice - handled by checkout');
        return;
    }
    
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;
        const tier = metadata.tier;
        
        console.log('📋 Subscription metadata:', JSON.stringify(metadata));
        
        if (!userId || userId === 'anonymous') {
            console.log('⚠️ No valid userId in subscription metadata');
            return;
        }
        
        const credits = TIER_CREDITS[tier] || 0;
        
        if (credits > 0) {
            console.log(`🔄 Renewal: ${credits} credits for ${userId}`);
            await addSubscriptionCredits(userId, credits, invoice.id, subscription.current_period_end);
        }
    }
}

async function handlePaymentFailed(invoice) {
    console.log('❌ Payment failed:', invoice.id);
    
    if (!invoice.subscription) return;
    
    try {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;
        
        if (!userId || userId === 'anonymous') {
            console.log('⚠️ No valid userId in subscription metadata');
            return;
        }
        
        console.log(`⚠️ Payment failed for ${userId}`);
        
        const userRef = db.collection('users').doc(userId);
        await userRef.set({
            credits: {
                subscriptionStatus: 'past_due',
                paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        
        console.log(`✅ Marked ${userId} as past_due`);
    } catch (error) {
        console.error('Error handling payment failed:', error.message);
    }
}

async function handleSubscriptionCancelled(subscription) {
    console.log('❌ Subscription cancelled:', subscription.id);
    
    const metadata = subscription.metadata || {};
    const userId = metadata.userId;
    
    console.log('📋 Subscription metadata:', JSON.stringify(metadata));
    
    if (!userId || userId === 'anonymous') {
        console.log('⚠️ No valid userId in subscription metadata');
        return;
    }
    
    console.log(`⬇️ Downgrading ${userId} to free tier`);
    await downgradeToFree(userId, subscription.id);
}

async function handleSubscriptionUpdated(subscription) {
    console.log('📝 Subscription updated:', subscription.id, 'Status:', subscription.status);
    console.log('📋 cancel_at_period_end:', subscription.cancel_at_period_end);
    
    const metadata = subscription.metadata || {};
    const userId = metadata.userId;
    const tier = metadata.tier;
    
    console.log('📋 Subscription metadata:', JSON.stringify(metadata));
    
    if (!userId || userId === 'anonymous') {
        console.log('⚠️ No valid userId in subscription metadata');
        return;
    }
    
    const userRef = db.collection('users').doc(userId);
    
    // Track cancellation scheduled (user clicked cancel in Customer Portal)
    if (subscription.cancel_at_period_end) {
        console.log(`⚠️ ${userId} scheduled cancellation at period end`);
        await userRef.set({
            credits: {
                cancelAtPeriodEnd: true,
                subscriptionStatus: 'canceling',
                subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        return;
    }
    
    // Track if cancellation was reversed (user reactivated)
    if (!subscription.cancel_at_period_end && subscription.status === 'active') {
        const doc = await userRef.get();
        const currentData = doc.exists ? doc.data() : {};
        const currentCredits = currentData.credits || {};
        
        if (currentCredits.cancelAtPeriodEnd === true) {
            console.log(`✅ ${userId} reactivated subscription`);
            await userRef.set({
                credits: {
                    cancelAtPeriodEnd: false,
                    subscriptionStatus: 'active',
                    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
            return;
        }
    }
    
    // Track payment issues
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        console.log(`⚠️ Payment issue for ${userId}, status: ${subscription.status}`);
        await userRef.set({
            credits: {
                subscriptionStatus: subscription.status,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
    }
}

// ========================================
// FIREBASE OPERATIONS
// ========================================

async function addPurchasedCredits(userId, credits, transactionId, productName, stripeCustomerId = null) {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            const currentData = doc.exists ? doc.data() : {};
            const currentCredits = currentData.credits || {};
            
            const updateData = {
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
            };
            
            // Save stripeCustomerId if provided
            if (stripeCustomerId) {
                updateData.credits.stripeCustomerId = stripeCustomerId;
                updateData.stripeCustomerId = stripeCustomerId;
            }
            
            transaction.set(userRef, updateData, { merge: true });
        });
        
        console.log(`✅ Added ${credits} purchased credits to ${userId}`);
        return true;
    } catch (error) {
        console.error('Error adding purchased credits:', error.message);
        return false;
    }
}

async function logTransaction(userId, type, transactionId, stripeCustomerId = null) {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    try {
        const updateData = {
            transactions: admin.firestore.FieldValue.arrayUnion({
                type: type,
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            })
        };
        
        if (stripeCustomerId) {
            updateData.stripeCustomerId = stripeCustomerId;
        }
        
        await userRef.set(updateData, { merge: true });
        console.log(`✅ Logged ${type} transaction for ${userId}`);
        return true;
    } catch (error) {
        console.error('Error logging transaction:', error.message);
        return false;
    }
}

async function activateSubscription(userId, tier, credits, stripeCustomerId, transactionId, periodEnd = null, subscriptionId = null) {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    console.log(`🔥 Activating subscription for ${userId}: tier=${tier}, credits=${credits}, customerId=${stripeCustomerId}`);
    
    try {
        await userRef.set({
            // Save stripeCustomerId at TOP LEVEL for easy querying
            stripeCustomerId: stripeCustomerId,
            credits: {
                subscriptionTier: tier,
                tier: tier,
                reviewCredits: credits,
                reviewCreditsUsed: 0,
                purchasedCredits: admin.firestore.FieldValue.increment(0),
                bonusPrompts: admin.firestore.FieldValue.increment(0),
                monthlyPromptsUsed: 0,
                lowRiskDocsUsed: 0,
                // Stripe IDs - CRITICAL: These enable "Manage Subscription"
                stripeCustomerId: stripeCustomerId,
                stripeSubscriptionId: subscriptionId,
                // Subscription status
                subscriptionStatus: 'active',
                cancelAtPeriodEnd: false,
                subscriptionPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
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
        
        console.log(`✅ Activated ${tier} subscription for ${userId} with ${credits} credits, customerId: ${stripeCustomerId}`);
        return true;
    } catch (error) {
        console.error('Error activating subscription:', error.message);
        return false;
    }
}

async function addSubscriptionCredits(userId, credits, transactionId, periodEnd = null) {
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
                subscriptionStatus: 'active',
                cancelAtPeriodEnd: false,
                subscriptionPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
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
                reviewCreditsUsed: 0,
                // Keep stripeCustomerId for future purchases
                stripeSubscriptionId: null,
                subscriptionStatus: 'canceled',
                cancelAtPeriodEnd: false,
                subscriptionPeriodEnd: null,
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

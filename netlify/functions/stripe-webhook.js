// ========================================
// STRIPE WEBHOOK - Netlify Function
// Handles payment confirmations and updates Firebase
// Uses METADATA from checkout (no hardcoded price IDs needed)
// + EMAIL NOTIFICATIONS for cancellations (14-day refund check)
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

// ========================================
// EMAIL NOTIFICATION CONFIG
// ========================================
const EMAILJS_CONFIG = {
    serviceId: process.env.EMAILJS_SERVICE_ID || 'service_7dz8e3q',
    templateId: process.env.EMAILJS_CANCELLATION_TEMPLATE_ID || 'template_ua7eq02',
    publicKey: process.env.EMAILJS_PUBLIC_KEY || 'cStomWilGU8SiOzyy',
    privateKey: process.env.EMAILJS_PRIVATE_KEY || '', // Required for server-side requests
    adminEmail: process.env.ADMIN_EMAIL || 'blakefitzgerald4@gmail.com'
};

// 14-day money-back guarantee window
const REFUND_WINDOW_DAYS = 14;
const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// Credit amounts by tier
const TIER_CREDITS = {
    // Monthly credit amounts
    starter: 8,
    pro: 20,
    business: 50,
    free: 0
};

// Annual credit amounts (monthly × 12)
const TIER_CREDITS_ANNUAL = {
    starter: 96,
    pro: 240,
    business: 600
};

// Tier pricing for email notifications
const TIER_PRICING = {
    starter: 249,
    pro: 449,
    business: 899
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
        let billingCycle = 'monthly'; // Default to monthly
        
        // Determine billing cycle from productKey FIRST
        if (metadata.productKey && metadata.productKey.includes('annual')) {
            billingCycle = 'annual';
        }
        
        if (session.subscription) {
            try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                subscriptionPeriodEnd = subscription.current_period_end;
                subscriptionId = subscription.id;
                
                // Double-check billing cycle from actual subscription interval
                if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
                    const interval = subscription.items.data[0].price.recurring?.interval;
                    if (interval === 'year') {
                        billingCycle = 'annual';
                    } else if (interval === 'month') {
                        billingCycle = 'monthly';
                    }
                }
                
                // Update subscription metadata with userId for future events
                await stripe.subscriptions.update(subscription.id, {
                    metadata: { userId: userId, tier: tier, billingCycle: billingCycle }
                });
                console.log('✅ Updated subscription metadata with billingCycle:', billingCycle);
            } catch (e) {
                console.log('Could not retrieve/update subscription details:', e.message);
            }
        }
        
        // CRITICAL: Use correct credits based on billing cycle
        let credits;
        if (billingCycle === 'annual') {
            credits = TIER_CREDITS_ANNUAL[tier] || 0;
            console.log(`📅 Annual plan - using annual credits: ${credits}`);
        } else {
            credits = TIER_CREDITS[tier] || 0;
            console.log(`📅 Monthly plan - using monthly credits: ${credits}`);
        }
        
        await activateSubscription(userId, tier, credits, session.customer, session.id, subscriptionPeriodEnd, subscriptionId, billingCycle);
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
        
        // Determine credits based on billing cycle
        const billingCycle = metadata.billingCycle || 'monthly';
        const credits = billingCycle === 'annual' 
            ? (TIER_CREDITS_ANNUAL[tier] || 0)
            : (TIER_CREDITS[tier] || 0);
        
        if (credits > 0) {
            console.log(`🔄 Renewal (${billingCycle}): ${credits} credits for ${userId}`);
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
    const tier = metadata.tier;
    const customerId = subscription.customer;
    
    console.log('📋 Subscription metadata:', JSON.stringify(metadata));
    
    // ========================================
    // SEND EMAIL NOTIFICATION WITH REFUND CHECK
    // ========================================
    try {
        // Get customer details from Stripe
        let customerEmail = 'Unknown';
        let customerName = 'Unknown';
        try {
            const customer = await stripe.customers.retrieve(customerId);
            customerEmail = customer.email || 'Unknown';
            customerName = customer.name || customer.email || 'Unknown';
        } catch (e) {
            console.log('Could not fetch customer details:', e.message);
        }
        
        // Calculate if within 14-day refund window
        const subscriptionCreatedAt = subscription.created * 1000; // Convert to milliseconds
        const now = Date.now();
        const daysSinceSubscription = Math.floor((now - subscriptionCreatedAt) / (24 * 60 * 60 * 1000));
        const isRefundEligible = (now - subscriptionCreatedAt) <= REFUND_WINDOW_MS;
        
        // Get tier name and price
        const tierName = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Unknown';
        const tierPrice = TIER_PRICING[tier] || 0;
        
        // Send email notification
        await sendCancellationEmail({
            customerEmail,
            customerName,
            userId: userId || 'N/A',
            customerId,
            subscriptionId: subscription.id,
            tierName,
            tierPrice,
            subscriptionCreatedAt: new Date(subscriptionCreatedAt).toISOString(),
            cancelledAt: new Date().toISOString(),
            daysSinceSubscription,
            isRefundEligible,
            refundWindowDays: REFUND_WINDOW_DAYS
        });
        
        console.log(`📧 Cancellation email sent - Refund eligible: ${isRefundEligible} (${daysSinceSubscription} days)`);
    } catch (emailError) {
        console.error('Error sending cancellation email:', emailError.message);
        // Don't fail the webhook if email fails
    }
    
    // ========================================
    // DOWNGRADE USER TO FREE TIER
    // ========================================
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
    let tier = metadata.tier;
    let billingCycle = metadata.billingCycle || 'monthly';
    
    console.log('📋 Subscription metadata:', JSON.stringify(metadata));
    
    if (!userId || userId === 'anonymous') {
        console.log('⚠️ No valid userId in subscription metadata');
        return;
    }
    
    const userRef = db.collection('users').doc(userId);
    
    // ========================================
    // DETECT CURRENT TIER FROM STRIPE PRICE
    // (Handles plan switches where metadata doesn't auto-update)
    // ========================================
    let detectedTier = tier;
    let detectedBillingCycle = billingCycle;
    
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
        try {
            const priceId = subscription.items.data[0].price.id;
            const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
            
            // ALWAYS detect billing cycle from price interval
            const interval = price.recurring?.interval;
            if (interval === 'year') {
                detectedBillingCycle = 'annual';
            } else if (interval === 'month') {
                detectedBillingCycle = 'monthly';
            }
            console.log(`📅 Detected billing cycle from price: ${detectedBillingCycle} (interval: ${interval})`);
            
            // Check price metadata for tier
            if (price.metadata && price.metadata.tier) {
                detectedTier = price.metadata.tier;
                console.log(`📦 Detected tier from price metadata: ${detectedTier}`);
            }
            // Check product metadata for tier
            else if (price.product && price.product.metadata && price.product.metadata.tier) {
                detectedTier = price.product.metadata.tier;
                console.log(`📦 Detected tier from product metadata: ${detectedTier}`);
            }
            // Fallback: Infer tier from price amount (in cents)
            else {
                const amount = price.unit_amount;
                
                if (interval === 'year') {
                    if (amount === 24900) detectedTier = 'starter';
                    else if (amount === 44900) detectedTier = 'pro';
                    else if (amount === 89900) detectedTier = 'business';
                } else if (interval === 'month') {
                    if (amount === 2900) detectedTier = 'starter';
                    else if (amount === 4900) detectedTier = 'pro';
                    else if (amount === 9900) detectedTier = 'business';
                }
                
                if (detectedTier !== tier) {
                    console.log(`📦 Inferred tier from price amount ($${amount/100}/${interval}): ${detectedTier}`);
                }
            }
            
            // Update subscription metadata if tier OR billing cycle changed
            if ((detectedTier && detectedTier !== tier) || (detectedBillingCycle && detectedBillingCycle !== billingCycle)) {
                await stripe.subscriptions.update(subscription.id, {
                    metadata: { 
                        ...metadata, 
                        tier: detectedTier || tier, 
                        billingCycle: detectedBillingCycle 
                    }
                });
                console.log(`✅ Updated subscription metadata: tier=${detectedTier || tier}, billingCycle=${detectedBillingCycle}`);
                tier = detectedTier || tier;
                billingCycle = detectedBillingCycle;
            }
        } catch (e) {
            console.log('Could not detect tier from price:', e.message);
        }
    }
    
    // ========================================
    // CHECK FOR PLAN SWITCH (UPGRADE/DOWNGRADE OR BILLING CYCLE CHANGE)
    // ========================================
    if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        try {
            const doc = await userRef.get();
            const currentData = doc.exists ? doc.data() : {};
            const currentCredits = currentData.credits || {};
            const currentTier = currentCredits.subscriptionTier || currentCredits.tier || 'free';
            const currentBillingCycle = currentCredits.billingCycle || 'monthly';
            const currentReviewCredits = currentCredits.reviewCredits || 0;
            
            // Debug logging
            console.log(`📊 Plan comparison for ${userId}:`);
            console.log(`   Firebase: tier=${currentTier}, billing=${currentBillingCycle}, credits=${currentReviewCredits}`);
            console.log(`   Stripe:   tier=${tier}, billing=${billingCycle}`);
            
            // Detect tier change OR billing cycle change
            const tierChanged = tier && currentTier !== tier && currentTier !== 'free';
            const billingCycleChanged = billingCycle && currentBillingCycle !== billingCycle && currentTier !== 'free';
            
            console.log(`   tierChanged=${tierChanged}, billingCycleChanged=${billingCycleChanged}`);
            
            if (tierChanged || billingCycleChanged) {
                console.log(`🔄 Plan switch detected:`);
                console.log(`   Tier: ${currentTier} → ${tier}`);
                console.log(`   Billing: ${currentBillingCycle} → ${billingCycle}`);
                
                // Calculate new credits based on NEW billing cycle
                const newCredits = billingCycle === 'annual' 
                    ? (TIER_CREDITS_ANNUAL[tier] || 0)
                    : (TIER_CREDITS[tier] || 0);
                
                // Calculate old credits for comparison
                const oldCredits = currentBillingCycle === 'annual'
                    ? (TIER_CREDITS_ANNUAL[currentTier] || 0)
                    : (TIER_CREDITS[currentTier] || 0);
                
                const isUpgrade = newCredits > oldCredits;
                
                console.log(`${isUpgrade ? '⬆️ UPGRADE' : '⬇️ DOWNGRADE'}: ${currentTier}/${currentBillingCycle} (${oldCredits} credits) → ${tier}/${billingCycle} (${newCredits} credits)`);
                
                // Update Firebase with new plan details
                await userRef.set({
                    credits: {
                        ...currentCredits,
                        subscriptionTier: tier,
                        tier: tier,
                        billingCycle: billingCycle,
                        reviewCredits: newCredits,
                        reviewCreditsUsed: 0, // Reset usage for new plan
                        subscriptionStatus: 'active',
                        cancelAtPeriodEnd: false,
                        subscriptionPeriodEnd: subscription.current_period_end 
                            ? new Date(subscription.current_period_end * 1000).toISOString() 
                            : null,
                        lastPlanChange: admin.firestore.FieldValue.serverTimestamp(),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    },
                    transactions: admin.firestore.FieldValue.arrayUnion({
                        type: isUpgrade ? 'plan_upgrade' : 'plan_downgrade',
                        fromTier: currentTier,
                        fromBillingCycle: currentBillingCycle,
                        toTier: tier,
                        toBillingCycle: billingCycle,
                        oldCredits: oldCredits,
                        newCredits: newCredits,
                        timestamp: new Date().toISOString()
                    })
                }, { merge: true });
                
                console.log(`✅ Plan switch complete: ${userId} now on ${tier}/${billingCycle} with ${newCredits} credits`);
                return;
            }
        } catch (e) {
            console.error('Error checking for plan switch:', e.message);
        }
    }
    
    // ========================================
    // TRACK CANCELLATION SCHEDULED
    // ========================================
    if (subscription.cancel_at_period_end) {
        console.log(`⚠️ ${userId} scheduled cancellation at period end`);
        
        // Send heads-up email that cancellation is scheduled
        try {
            const customerId = subscription.customer;
            let customerEmail = 'Unknown';
            try {
                const customer = await stripe.customers.retrieve(customerId);
                customerEmail = customer.email || 'Unknown';
            } catch (e) {}
            
            const cancelAt = subscription.cancel_at 
                ? new Date(subscription.cancel_at * 1000).toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : 'End of billing period';
            
            console.log(`📅 Cancellation scheduled for ${customerEmail} on ${cancelAt}`);
        } catch (e) {
            console.log('Could not log scheduled cancellation details');
        }
        
        await userRef.set({
            credits: {
                cancelAtPeriodEnd: true,
                subscriptionStatus: 'canceling',
                subscriptionPeriodEnd: subscription.current_period_end 
                    ? new Date(subscription.current_period_end * 1000).toISOString() 
                    : null,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        return;
    }
    
    // ========================================
    // TRACK REACTIVATION (cancellation reversed)
    // ========================================
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
                    subscriptionPeriodEnd: subscription.current_period_end 
                        ? new Date(subscription.current_period_end * 1000).toISOString() 
                        : null,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
            return;
        }
    }
    
    // ========================================
    // TRACK PAYMENT ISSUES
    // ========================================
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
// EMAIL NOTIFICATION FUNCTION
// ========================================

async function sendCancellationEmail(data) {
    const {
        customerEmail,
        customerName,
        userId,
        customerId,
        subscriptionId,
        tierName,
        tierPrice,
        subscriptionCreatedAt,
        cancelledAt,
        daysSinceSubscription,
        isRefundEligible,
        refundWindowDays
    } = data;
    
    // Debug: Check if private key is loaded
    console.log('📧 EmailJS Config Check:');
    console.log('  - Service ID:', EMAILJS_CONFIG.serviceId);
    console.log('  - Template ID:', EMAILJS_CONFIG.templateId);
    console.log('  - Public Key:', EMAILJS_CONFIG.publicKey ? 'SET' : 'MISSING');
    console.log('  - Private Key:', EMAILJS_CONFIG.privateKey ? 'SET (' + EMAILJS_CONFIG.privateKey.length + ' chars)' : 'MISSING');
    console.log('  - Admin Email:', EMAILJS_CONFIG.adminEmail);
    
    // Build email content
    const refundStatus = isRefundEligible 
        ? `🟢 REFUND ELIGIBLE (within ${refundWindowDays} days)`
        : `🔴 NOT ELIGIBLE FOR REFUND (${daysSinceSubscription} days since subscription)`;
    
    const emailSubject = isRefundEligible 
        ? `🟢 REFUND ELIGIBLE - ${customerName} cancelled ${tierName}`
        : `🔴 Subscription Cancelled - ${customerName} (${tierName})`;
    
    const emailBody = `
🔔 SUBSCRIPTION CANCELLATION ALERT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFUND STATUS: ${refundStatus}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Customer Details:
• Name: ${customerName}
• Email: ${customerEmail}
• User ID: ${userId}
• Stripe Customer: ${customerId}

Subscription Details:
• Plan: ${tierName}
• Price: $${tierPrice} AUD/year
• Subscription ID: ${subscriptionId}
• Started: ${new Date(subscriptionCreatedAt).toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}
• Cancelled: ${new Date(cancelledAt).toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
• Days Active: ${daysSinceSubscription}

${isRefundEligible ? `
⚡ ACTION REQUIRED:
Customer is within the 14-day money-back guarantee period.
If they request a refund, process via Stripe Dashboard:
https://dashboard.stripe.com/customers/${customerId}

Steps:
1. Click link above
2. Find the subscription payment
3. Click "Refund" and select "Full refund"
` : `
ℹ️ NO ACTION REQUIRED:
Customer is outside the 14-day refund window.
Refunds are not required under your policy.
`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Automated notification from Fitz HR
    `.trim();
    
    // Send via EmailJS REST API
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: EMAILJS_CONFIG.serviceId,
                template_id: EMAILJS_CONFIG.templateId,
                user_id: EMAILJS_CONFIG.publicKey,
                accessToken: EMAILJS_CONFIG.privateKey, // Required for server-side requests
                template_params: {
                    to_email: EMAILJS_CONFIG.adminEmail,
                    from_name: 'Fitz HR System',
                    subject: emailSubject,
                    message: emailBody,
                    customer_email: customerEmail,
                    customer_name: customerName,
                    tier_name: tierName,
                    tier_price: tierPrice,
                    days_active: daysSinceSubscription,
                    refund_eligible: isRefundEligible ? 'Yes - Within 14 days' : 'No - Outside 14 days',
                    stripe_customer_url: `https://dashboard.stripe.com/customers/${customerId}`
                }
            })
        });
        
        if (response.ok) {
            console.log('✅ Cancellation email sent successfully to', EMAILJS_CONFIG.adminEmail);
        } else {
            const errorText = await response.text();
            console.error('❌ EmailJS error:', errorText);
            // Log details as backup (visible in Netlify function logs)
            console.log('📧 CANCELLATION DETAILS (backup):\n', emailBody);
        }
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        // Log details as backup (visible in Netlify function logs)
        console.log('📧 CANCELLATION DETAILS (backup):\n', emailBody);
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

async function activateSubscription(userId, tier, credits, stripeCustomerId, transactionId, periodEnd = null, subscriptionId = null, billingCycle = 'monthly') {
    if (!db) return false;
    const userRef = db.collection('users').doc(userId);
    
    console.log(`🔥 Activating subscription for ${userId}: tier=${tier}, credits=${credits}, billingCycle=${billingCycle}, customerId=${stripeCustomerId}`);
    
    try {
        await userRef.set({
            // Save stripeCustomerId at TOP LEVEL for easy querying
            stripeCustomerId: stripeCustomerId,
            credits: {
                subscriptionTier: tier,
                tier: tier,
                billingCycle: billingCycle,
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
                billingCycle: billingCycle,
                credits: credits,
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            })
        }, { merge: true });
        
        console.log(`✅ Activated ${tier} (${billingCycle}) subscription for ${userId} with ${credits} credits, customerId: ${stripeCustomerId}`);
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

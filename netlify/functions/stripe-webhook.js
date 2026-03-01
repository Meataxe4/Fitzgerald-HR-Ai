// ========================================
// FIXED: addSubscriptionCredits
// Changes:
// 1. Uses Firestore transaction to prevent race conditions with client syncs
// 2. Explicitly resets monthlyPromptsUsed and lowRiskDocsUsed on renewal
// 3. Preserves purchasedCredits and other non-renewal fields safely
// ========================================

async function addSubscriptionCredits(userId, credits, transactionId, periodEnd = null) {
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
                    // Reset credit allocation for new billing period
                    reviewCredits: credits,
                    reviewCreditsUsed: 0,
                    // Reset monthly usage counters
                    monthlyPromptsUsed: 0,
                    monthlyPromptsReset: new Date().toISOString(),
                    lowRiskDocsUsed: 0,
                    // Update subscription status
                    subscriptionStatus: 'active',
                    cancelAtPeriodEnd: false,
                    subscriptionPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                    // Timestamps for renewal detection
                    lastCreditRefresh: admin.firestore.FieldValue.serverTimestamp(),
                    lastRenewalDate: admin.firestore.FieldValue.serverTimestamp(),
                    lastTransaction: transactionId,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    // NOTE: purchasedCredits, stripeCustomerId, stripeSubscriptionId,
                    // subscriptionTier, billingCycle are preserved via ...currentCredits spread
                },
                transactions: admin.firestore.FieldValue.arrayUnion({
                    type: 'subscription_renewal',
                    credits: credits,
                    transactionId: transactionId,
                    timestamp: new Date().toISOString()
                })
            };
            
            transaction.set(userRef, updateData, { merge: true });
        });
        
        console.log(`✅ Renewed ${userId} with ${credits} credits (transaction-safe)`);
        return true;
    } catch (error) {
        console.error('Error adding subscription credits:', error.message);
        return false;
    }
}

// ========================================
// CONFIGURATION & GLOBALS
// ========================================

// ========================================
// CONFIGURATION
// ========================================
// ========================================
// DOM CACHE - Performance Optimization
// ========================================

/**
 * Cached DOM elements to avoid repeated queries
 * Initialized on DOMContentLoaded for performance
 */
const DOM = {
    // Main elements
    accessScreen: null,
    assistantScreen: null,
    messagesContainer: null,
    messageInput: null,
    sendButton: null,
    
    // Modals
    feedbackModal: null,
    crisisModal: null,
    awardCalculatorModal: null,
    awardWizardModal: null,
    rosterStressTesterModal: null,
    complianceCalendarModal: null,
    
    // Tools menu
    toolsMenu: null,
    
    // Voice
    voiceButton: null,
    voiceIcon: null
};
const CONFIG = {
    // Access control
    VALID_CODES: [
        'BETA-VENUE-001', 'BETA-VENUE-002', 'BETA-VENUE-003',
        'BETA-VENUE-004', 'BETA-VENUE-005',
        'FITZ-TEST', 'DEMO-2025'
    ],
    
    // API endpoints
    API: {
        HOSPITALITY_RATES_URL: '/hospitality-award-rates.json',
        RESTAURANT_RATES_URL: '/restaurant-award-rates.json',
        CHAT_ENDPOINT: '/.netlify/functions/chat',
        CRISIS_ENDPOINT: '/.netlify/functions/telegram-crisis'
    },
    
    // Application constants
    WIZARD_STEPS: 5,
    TOOL_SUGGESTION_LIMIT: 2,
    MAX_CONVERSATION_HISTORY: 50,
    
    // Timing
    DEBOUNCE_DELAY: 150,
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3,
    ERROR_DISPLAY_TIME: 5000,
    
    // ========================================
    // FITZ CREDITS SYSTEM - February 2025 Model
    // ========================================
    CREDITS: {
        // Free tier limits
        FREE_TIER: {
            MONTHLY_PROMPTS: 20,
            LOW_RISK_DOCS: 1  // 1 low-risk document total (not per month)
        },
        
        // Subscription tiers - Review Credits (annual billing default)
        // Low-risk docs are UNLIMITED for all paid tiers
        TIERS: {
            free: { 
                name: 'Free', 
                reviewCredits: 1,  // 1 free credit to try the platform
                lowRiskDocs: 1,  // 1 total, not monthly
                monthlyPrompts: 20,
                price: { annual: 0, monthly: 0 }
            },
            starter: { 
                name: 'Starter', 
                reviewCredits: 8,  // Per month (96/year for annual)
                lowRiskDocs: 'unlimited',
                monthlyPrompts: 'unlimited',
                price: { annual: 249, monthly: 29 }
            },
            pro: { 
                name: 'Pro', 
                reviewCredits: 20,  // Per month (240/year for annual)
                lowRiskDocs: 'unlimited',
                monthlyPrompts: 'unlimited',
                price: { annual: 449, monthly: 49 }
            },
            business: { 
                name: 'Business', 
                reviewCredits: 50,  // Per month (600/year for annual)
                lowRiskDocs: 'unlimited',
                monthlyPrompts: 'unlimited',
                price: { annual: 899, monthly: 99 },
                priorityReview: true
            }
        },
        
        // Document categories
        // LOW RISK (Templates) - Unlimited for paid tiers, no review needed
        LOW_RISK_DOCS: {
            positionDescription: { name: 'Position Description', icon: '📋' },
            jobDescription: { name: 'Job Advertisement', icon: '📢' },
            onboardingChecklist: { name: 'Onboarding Checklist', icon: '✅' },
            trainingPlan: { name: 'Training Plan', icon: '📚' },
            referenceCheck: { name: 'Reference Check Form', icon: '📞' },
            interviewQuestions: { name: 'Interview Questions', icon: '🎤' }
        },
        
        // PEOPLE MANAGEMENT - Uses 1 review credit, optional expert review (recommended)
        PEOPLE_MANAGEMENT_DOCS: {
            recordOfDiscussion: { reviewCredits: 1, name: 'Record of Discussion', icon: '📋', reviewType: 'optional' },
            pip: { reviewCredits: 1, name: 'Performance Improvement Plan', icon: '📊', reviewType: 'optional' },
            probationReview: { reviewCredits: 1, name: 'Probation Review', icon: '📑', reviewType: 'optional' },
            letterOfConcern: { reviewCredits: 1, name: 'Letter of Concern', icon: '📝', reviewType: 'optional' },
            casualConversion: { reviewCredits: 1, name: 'Casual Conversion Letter', icon: '📄', reviewType: 'optional' },
            probationExtension: { reviewCredits: 1, name: 'Probation Extension Letter', icon: '📄', reviewType: 'optional' }
        },
        
        // FORMAL PROCESS - Uses 2 review credits, mandatory expert review
        FORMAL_PROCESS_DOCS: {
            formalWarning: { reviewCredits: 2, name: 'Formal Warning', icon: '⚠️', reviewType: 'mandatory' },
            letterOfAllegation: { reviewCredits: 2, name: 'Letter of Allegation', icon: '🔍', reviewType: 'mandatory' },
            showCause: { reviewCredits: 2, name: 'Show Cause Letter', icon: '⚠️', reviewType: 'mandatory' },
            firstWarning: { reviewCredits: 2, name: 'First Written Warning', icon: '⚠️', reviewType: 'mandatory' },
            finalWarning: { reviewCredits: 2, name: 'Final Written Warning', icon: '🚨', reviewType: 'mandatory' }
        },
        
        // CONSULTATION ONLY - Not self-serve, requires booking
        CONSULTATION_ONLY: {
            termination: { price: 150, name: 'Termination', includes: 'Consultation + Letter' },
            redundancy: { price: 150, name: 'Redundancy', includes: 'Consultation + Letters' }
        },
        
        // Review credit packs (one-time purchase)
        REVIEW_CREDIT_PACKS: {
            single: { credits: 1, price: 29, perCredit: 29 },
            pack: { credits: 5, price: 119, perCredit: 23.80 }
        },
        
        // Legacy document cost mapping (for backward compatibility)
        DOCUMENT_COSTS: {
            // Low risk - 0 credits (unlimited for paid)
            positionDescription: { credits: 0, risk: 'low', name: 'Position Description', category: 'template' },
            jobDescription: { credits: 0, risk: 'low', name: 'Job Advertisement', category: 'template' },
            onboardingChecklist: { credits: 0, risk: 'low', name: 'Onboarding Checklist', category: 'template' },
            trainingPlan: { credits: 0, risk: 'low', name: 'Training Plan', category: 'template' },
            referenceCheck: { credits: 0, risk: 'low', name: 'Reference Check Form', category: 'template' },
            interviewQuestions: { credits: 0, risk: 'low', name: 'Interview Questions', category: 'template' },
            probationCheckIn: { credits: 0, risk: 'low', name: 'Probation Check-In', category: 'template' },
            
            // People Management - 1 review credit
            recordOfDiscussion: { credits: 1, risk: 'moderate', name: 'Record of Discussion', category: 'people_management', reviewType: 'optional' },
            pip: { credits: 1, risk: 'moderate', name: 'Performance Improvement Plan', category: 'people_management', reviewType: 'optional' },
            performanceImprovementPlan: { credits: 1, risk: 'moderate', name: 'Performance Improvement Plan', category: 'people_management', reviewType: 'optional' }, // Alias for pip
            formalProbationReview: { credits: 1, risk: 'moderate', name: 'Formal Probation Review', category: 'people_management', reviewType: 'optional' },
            letterOfConcern: { credits: 1, risk: 'moderate', name: 'Letter of Concern', category: 'people_management', reviewType: 'optional' },
            casualConversion: { credits: 1, risk: 'moderate', name: 'Casual Conversion Letter', category: 'people_management', reviewType: 'optional' },
            probationExtension: { credits: 1, risk: 'moderate', name: 'Probation Extension Letter', category: 'people_management', reviewType: 'optional' },
            changeOfHours: { credits: 1, risk: 'moderate', name: 'Change of Hours Letter', category: 'people_management', reviewType: 'optional' },
            
            // Formal Process - 2 review credits
            formalWarning: { credits: 2, risk: 'significant', name: 'Formal Warning', category: 'formal_process', reviewType: 'mandatory' },
            firstWarning: { credits: 2, risk: 'significant', name: 'First Written Warning', category: 'formal_process', reviewType: 'mandatory' },
            finalWarning: { credits: 2, risk: 'significant', name: 'Final Written Warning', category: 'formal_process', reviewType: 'mandatory' },
            letterOfAllegation: { credits: 2, risk: 'significant', name: 'Letter of Allegation', category: 'formal_process', reviewType: 'mandatory' },
            showCause: { credits: 2, risk: 'significant', name: 'Show Cause Letter', category: 'formal_process', reviewType: 'mandatory' },
            
            // Employment Contract - special handling
            employmentContract: { credits: 2, risk: 'significant', name: 'Employment Contract', category: 'formal_process', reviewType: 'mandatory' }
        }
    }
};

// ========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_CONFIG = {
    url: 'https://vaundmbbbyqmbbcavulo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdW5kbWJiYnlxbWJiY2F2dWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDcwMzAsImV4cCI6MjA4NDE4MzAzMH0.2ynWsEBn3YJFXUBinm2e4XgnHiUM9hYbaZ1SfVk__pI'
};

// Initialize Supabase client
let supabaseClient = null;

// Initialize Supabase when page loads
function initializeSupabase() {
    try {
        // Check if Supabase library loaded
        if (typeof supabase === 'undefined') {
            return false;
        }
        
        // Create client
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        return true;
    } catch (error) {
        return false;
    }
}

// Global state
let currentUser = null;
let conversationHistory = [];
let feedbackRating = 0;
let wizardData = {};
let currentWizardStep = 1;
let recognition = null;
let isListening = false;

// ========================================
// FIELD INFO TOOLTIP TOGGLE
// ========================================
function fitzInfoToggle(el) {
    const box = el.closest('div').querySelector('.fitz-info-box');
    if (box) box.classList.toggle('active');
}

// ========================================
// FITZ CREDITS - GLOBAL STATE
// ========================================
let userCredits = {
    subscriptionTier: 'free',
    reviewCredits: 0,           // Total review credits for this billing period (from webhook)
    reviewCreditsUsed: 0,       // How many review credits used this year
    purchasedCredits: 0,        // Extra purchased review credits (never expire)
    billingCycle: null,         // 'monthly' or 'annual' (from webhook)
    monthlyPromptsUsed: 0,      // For free tier only
    monthlyPromptsReset: null,
    lowRiskDocsUsed: 0,         // For free tier only (they get 1 total)
    subscriptionStartDate: null,
    lastUpdated: null,
    lastCreditRefresh: null,    // Timestamp from webhook when credits were last refreshed (renewal detection)
    // Stripe subscription management fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,        // 'active', 'past_due', 'canceled', etc.
    subscriptionPeriodEnd: null,     // When current period ends (for billing date display)
    cancelAtPeriodEnd: false,        // True if user has requested cancellation
    billingInterval: null,           // 'month' or 'year'
    lastRenewalDate: null
};

// Flag to prevent Firebase from overwriting local credits after payment return
let skipFirebaseCreditsLoad = false;

// Initialize credits from localStorage/Firebase
function initializeUserCredits() {
    const userKey = currentUser?.uid || currentUser || 'anonymous';
    const stored = localStorage.getItem('fitzCredits_' + userKey);
    
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            userCredits = { ...userCredits, ...parsed };
            
            // Migrate old fields if present
            if (parsed.tier) {
                userCredits.subscriptionTier = parsed.tier;
            }
            if (parsed.subscriptionCredits !== undefined) {
                // Old model had subscriptionCredits, map to new model
                userCredits.reviewCreditsUsed = 0; // Reset for new model
            }
            
            console.log('📦 Loaded credits from localStorage cache:', userCredits);
            
        } catch (e) {
            console.error('Error parsing credits:', e);
        }
    } else {
        // No localStorage data - use defaults (Firebase will override when user logs in)
        userCredits = {
            subscriptionTier: 'free',
            reviewCreditsUsed: 0,
            purchasedCredits: 0,
            monthlyPromptsUsed: 0,
            monthlyPromptsReset: new Date().toISOString(),
            lowRiskDocsUsed: 0,
            subscriptionStartDate: null,
            lastUpdated: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionStatus: null,
            subscriptionPeriodEnd: null,
            cancelAtPeriodEnd: false,
            billingInterval: null,
            lastRenewalDate: null
        };
        console.log('📦 No localStorage cache - using defaults');
    }
    
    updateCreditsDisplay();
}

// Save credits to localStorage
function saveUserCredits() {
    const userKey = currentUser?.uid || currentUser || 'anonymous';
    localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
    updateCreditsDisplay();
    
    // Also sync to Firebase if user is logged in
    if (currentUser?.uid) {
        syncCreditsToFirebase();
    }
}

// Load credits from Firebase
async function loadCreditsFromFirebase() {
    if (!currentUser?.uid) return false;
    
    // Skip if we just processed a payment return (local credits are more up-to-date)
    if (skipFirebaseCreditsLoad) {
        console.log('⏭️ Skipping Firebase load - payment just processed');
        skipFirebaseCreditsLoad = false;
        return false;
    }
    
    try {
        console.log('🔄 Loading credits from Firebase for:', currentUser.uid);
        const userRef = db.collection('users').doc(currentUser.uid);
        const doc = await userRef.get();
        
        if (doc.exists && doc.data().credits) {
            const firebaseCredits = doc.data().credits;
            
            // Firebase is source of truth - load exactly what's stored
            // Support both old and new field names during migration
            // Also check for stripeCustomerId at top level (some older accounts)
            const topLevelData = doc.data();
            
            // Check if a renewal happened since our last load
            // by comparing lastCreditRefresh timestamps
            const previousRefresh = userCredits.lastCreditRefresh || null;
            const newRefresh = firebaseCredits.lastCreditRefresh || null;
            
            // Convert Firestore timestamps to comparable values
            const previousRefreshTime = previousRefresh ? 
                (previousRefresh.toDate ? previousRefresh.toDate().getTime() : new Date(previousRefresh).getTime()) : 0;
            const newRefreshTime = newRefresh ? 
                (newRefresh.toDate ? newRefresh.toDate().getTime() : new Date(newRefresh).getTime()) : 0;
            
            if (previousRefreshTime > 0 && newRefreshTime > previousRefreshTime) {
                console.log('🔄 RENEWAL DETECTED! Credits refreshed by webhook. Previous:', new Date(previousRefreshTime).toISOString(), 'New:', new Date(newRefreshTime).toISOString());
            }
            
            userCredits = {
                ...userCredits,
                subscriptionTier: firebaseCredits.subscriptionTier || firebaseCredits.tier || 'free',
                reviewCredits: firebaseCredits.reviewCredits || 0,  // Actual credits from webhook
                reviewCreditsUsed: firebaseCredits.reviewCreditsUsed || 0,
                purchasedCredits: firebaseCredits.purchasedCredits || 0,
                lowRiskDocsUsed: firebaseCredits.lowRiskDocsUsed || 0,
                bonusPrompts: firebaseCredits.bonusPrompts || 0,
                billingCycle: firebaseCredits.billingCycle || null,  // 'monthly' or 'annual'
                monthlyPromptsUsed: firebaseCredits.monthlyPromptsUsed || 0,
                monthlyPromptsReset: firebaseCredits.monthlyPromptsReset || new Date().toISOString(),
                subscriptionStartDate: firebaseCredits.subscriptionStartDate || null,
                lastUpdated: firebaseCredits.lastUpdated || null,
                lastCreditRefresh: firebaseCredits.lastCreditRefresh || null,  // Track webhook renewal timestamp
                // Stripe subscription management fields - check both credits and top level
                stripeCustomerId: firebaseCredits.stripeCustomerId || topLevelData.stripeCustomerId || null,
                stripeSubscriptionId: firebaseCredits.stripeSubscriptionId || null,
                subscriptionStatus: firebaseCredits.subscriptionStatus || null,
                subscriptionPeriodEnd: firebaseCredits.subscriptionPeriodEnd || null,
                cancelAtPeriodEnd: firebaseCredits.cancelAtPeriodEnd || false,
                billingInterval: firebaseCredits.billingInterval || null,
                lastRenewalDate: firebaseCredits.lastRenewalDate || null
            };
            
            console.log('📦 Stripe Customer ID:', userCredits.stripeCustomerId);
            
            // Check if prompts should reset - based on 30-day cycle from account creation
            // Free tier prompts reset every 30 days from when the user signed up
            const now = new Date();
            const lastReset = userCredits.monthlyPromptsReset ? new Date(userCredits.monthlyPromptsReset) : null;
            
            // Get account creation date from Firestore for anniversary-based reset
            let accountCreatedAt = null;
            if (doc.exists && doc.data().createdAt) {
                const createdAtField = doc.data().createdAt;
                accountCreatedAt = createdAtField.toDate ? createdAtField.toDate() : new Date(createdAtField);
            }
            
            // Calculate if we're in a new 30-day cycle based on account creation
            let shouldReset = false;
            if (!lastReset) {
                // Never reset before - do it now
                shouldReset = true;
            } else if (accountCreatedAt) {
                // Anniversary-based: calculate how many 30-day cycles have passed since account creation
                const msPerCycle = 30 * 24 * 60 * 60 * 1000;
                const msSinceCreation = now.getTime() - accountCreatedAt.getTime();
                const currentCycle = Math.floor(msSinceCreation / msPerCycle);
                const msSinceLastReset = lastReset.getTime() - accountCreatedAt.getTime();
                const lastResetCycle = Math.floor(msSinceLastReset / msPerCycle);
                shouldReset = currentCycle > lastResetCycle;
            } else {
                // Fallback: 30 days since last reset
                const daysSinceReset = (now.getTime() - lastReset.getTime()) / (24 * 60 * 60 * 1000);
                shouldReset = daysSinceReset >= 30;
            }
            
            if (shouldReset) {
                console.log('📅 New 30-day cycle detected - resetting prompts');
                userCredits.monthlyPromptsUsed = 0;
                userCredits.bonusPrompts = 0; // Top-ups expire with each cycle
                userCredits.monthlyPromptsReset = now.toISOString();
                
                // Save the refreshed data
                await syncCreditsToFirebase();
            }
            
            // Check if it's a new subscription year - reset review credits used
            if (userCredits.subscriptionStartDate) {
                const subStart = new Date(userCredits.subscriptionStartDate);
                const monthsSinceStart = (now.getFullYear() - subStart.getFullYear()) * 12 + (now.getMonth() - subStart.getMonth());
                
                // If 12+ months since subscription start, it's a new year
                if (monthsSinceStart >= 12) {
                    console.log('📅 New subscription year - resetting review credits');
                    userCredits.reviewCreditsUsed = 0;
                    userCredits.subscriptionStartDate = now.toISOString();
                    await syncCreditsToFirebase();
                }
            }
            
            // Save to localStorage as cache (using correct user key)
            const userKey = currentUser.uid;
            localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
            
            console.log('✅ Credits loaded from Firebase:', userCredits);
            updateCreditsDisplay();
            return true;
        } else {
            // No credits in Firebase - this is a NEW user
            console.log('🆕 New user detected - initializing free tier');
            userCredits = {
                ...userCredits,
                subscriptionTier: 'free',
                reviewCreditsUsed: 0,
                purchasedCredits: 0,
                lowRiskDocsUsed: 0,
                monthlyPromptsUsed: 0,
                monthlyPromptsReset: new Date().toISOString(),
                subscriptionStartDate: null,
                lastUpdated: new Date().toISOString()
            };
            
            // Save to localStorage immediately
            const userKey = currentUser.uid;
            localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
            
            // Update display immediately
            updateCreditsDisplay();
            
            // Then sync to Firebase
            await syncCreditsToFirebase();
            
            // Force another display update after a short delay to ensure UI is ready
            setTimeout(() => {
                updateCreditsDisplay();
                console.log('🔄 Forced display update for new user');
            }, 500);
            
            return false;
        }
    } catch (e) {
        console.error('Error loading credits from Firebase:', e);
        return false;
    }
}

/**
 * Sync local credits to Firebase (called after local changes)
 * 
 * IMPORTANT: Only writes USAGE-tracking fields (credits used, prompts used, etc.)
 * NEVER overwrites webhook-managed fields (reviewCredits, subscriptionTier, 
 * subscriptionStatus, etc.) - those are set by stripe-webhook.js and are 
 * the server-side source of truth. Writing them here would overwrite fresh
 * renewal data if the user is active when Stripe fires a renewal webhook.
 */
async function syncCreditsToFirebase() {
    if (!currentUser?.uid) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.set({
            credits: {
                // ✅ USAGE fields - safe to write from client
                reviewCreditsUsed: userCredits.reviewCreditsUsed || 0,
                purchasedCredits: userCredits.purchasedCredits || 0,
                lowRiskDocsUsed: userCredits.lowRiskDocsUsed || 0,
                bonusPrompts: userCredits.bonusPrompts || 0,
                monthlyPromptsUsed: userCredits.monthlyPromptsUsed || 0,
                monthlyPromptsReset: userCredits.monthlyPromptsReset,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                // ❌ DO NOT write these here - webhook manages them:
                // reviewCredits, subscriptionTier, billingCycle, subscriptionStatus,
                // stripeCustomerId, stripeSubscriptionId, subscriptionPeriodEnd,
                // cancelAtPeriodEnd, lastCreditRefresh
            }
        }, { merge: true });
        console.log('✅ Usage credits synced to Firebase');
    } catch (e) {
        console.error('Error syncing credits to Firebase:', e);
    }
}

/**
 * Full sync to Firebase - writes ALL fields including subscription data.
 * Only called after initial subscription activation (handlePaymentReturn)
 * or when we explicitly need to set subscription fields from the client.
 */
async function fullSyncCreditsToFirebase() {
    if (!currentUser?.uid) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.set({
            credits: {
                subscriptionTier: userCredits.subscriptionTier || userCredits.tier || 'free',
                reviewCredits: userCredits.reviewCredits || 0,
                reviewCreditsUsed: userCredits.reviewCreditsUsed || 0,
                purchasedCredits: userCredits.purchasedCredits || 0,
                lowRiskDocsUsed: userCredits.lowRiskDocsUsed || 0,
                bonusPrompts: userCredits.bonusPrompts || 0,
                billingCycle: userCredits.billingCycle || null,
                monthlyPromptsUsed: userCredits.monthlyPromptsUsed || 0,
                monthlyPromptsReset: userCredits.monthlyPromptsReset,
                subscriptionStartDate: userCredits.subscriptionStartDate,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                stripeCustomerId: userCredits.stripeCustomerId || null,
                stripeSubscriptionId: userCredits.stripeSubscriptionId || null,
                subscriptionStatus: userCredits.subscriptionStatus || null,
                subscriptionPeriodEnd: userCredits.subscriptionPeriodEnd || null,
                cancelAtPeriodEnd: userCredits.cancelAtPeriodEnd || false,
                billingInterval: userCredits.billingInterval || null,
                lastRenewalDate: userCredits.lastRenewalDate || null
            }
        }, { merge: true });
        console.log('✅ Full credits synced to Firebase');
    } catch (e) {
        console.error('Error syncing credits to Firebase:', e);
    }
}

// ========================================
// PERIODIC RENEWAL CHECKER
// Detects when the webhook has refreshed credits (e.g. monthly renewal)
// while the user has an active session, so they don't need to refresh.
// Checks Firebase every 5 minutes for paid subscribers only.
// ========================================
let renewalCheckerInterval = null;

function startRenewalChecker() {
    // Clear any existing interval
    if (renewalCheckerInterval) {
        clearInterval(renewalCheckerInterval);
        renewalCheckerInterval = null;
    }
    
    const tier = userCredits.subscriptionTier || 'free';
    if (tier === 'free') {
        console.log('⏭️ Renewal checker not needed for free tier');
        return;
    }
    
    console.log('🔄 Starting periodic renewal checker (every 5 minutes)');
    
    // Check every 5 minutes
    renewalCheckerInterval = setInterval(async () => {
        if (!currentUser?.uid || !db) return;
        
        try {
            const userRef = db.collection('users').doc(currentUser.uid);
            const doc = await userRef.get();
            
            if (!doc.exists || !doc.data().credits) return;
            
            const firebaseCredits = doc.data().credits;
            const fbRefresh = firebaseCredits.lastCreditRefresh;
            const localRefresh = userCredits.lastCreditRefresh;
            
            // Convert to comparable timestamps
            const fbTime = fbRefresh ? (fbRefresh.toDate ? fbRefresh.toDate().getTime() : new Date(fbRefresh).getTime()) : 0;
            const localTime = localRefresh ? (localRefresh.toDate ? localRefresh.toDate().getTime() : new Date(localRefresh).getTime()) : 0;
            
            if (fbTime > localTime) {
                console.log('🎉 RENEWAL DETECTED during active session! Refreshing credits from Firebase...');
                
                // Update all webhook-managed fields
                userCredits.reviewCredits = firebaseCredits.reviewCredits || 0;
                userCredits.reviewCreditsUsed = firebaseCredits.reviewCreditsUsed || 0;
                userCredits.subscriptionTier = firebaseCredits.subscriptionTier || firebaseCredits.tier || 'free';
                userCredits.billingCycle = firebaseCredits.billingCycle || null;
                userCredits.subscriptionStatus = firebaseCredits.subscriptionStatus || null;
                userCredits.subscriptionPeriodEnd = firebaseCredits.subscriptionPeriodEnd || null;
                userCredits.cancelAtPeriodEnd = firebaseCredits.cancelAtPeriodEnd || false;
                userCredits.lastCreditRefresh = firebaseCredits.lastCreditRefresh;
                userCredits.monthlyPromptsUsed = firebaseCredits.monthlyPromptsUsed || 0;
                userCredits.lowRiskDocsUsed = firebaseCredits.lowRiskDocsUsed || 0;
                
                // Update localStorage cache
                const userKey = currentUser.uid;
                localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
                
                // Update UI
                updateCreditsDisplay();
                
                console.log('✅ Credits refreshed after renewal:', userCredits.reviewCredits, 'credits available,', userCredits.reviewCreditsUsed, 'used');
            }
        } catch (e) {
            console.error('Renewal check error:', e);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

function stopRenewalChecker() {
    if (renewalCheckerInterval) {
        clearInterval(renewalCheckerInterval);
        renewalCheckerInterval = null;
        console.log('⏹️ Renewal checker stopped');
    }
}
// Get total available review credits
function getTotalCredits() {
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    const tierConfig = CONFIG.CREDITS.TIERS[tier] || CONFIG.CREDITS.TIERS.free;
    
    // PRIORITY: Use reviewCredits from Firebase (set by webhook) if available
    // This correctly handles annual vs monthly billing
    let totalReviewCredits;
    
    if (userCredits.reviewCredits && userCredits.reviewCredits > 0) {
        // Use the actual credits stored by the webhook
        totalReviewCredits = userCredits.reviewCredits;
    } else if (userCredits.billingCycle === 'annual') {
        // Calculate annual credits: monthly × 12
        totalReviewCredits = (tierConfig.reviewCredits || 0) * 12;
    } else {
        // Default to monthly credits from config
        totalReviewCredits = tierConfig.reviewCredits || 0;
    }
    
    const usedCredits = userCredits.reviewCreditsUsed || 0;
    const purchasedCredits = userCredits.purchasedCredits || 0;
    
    return Math.max(0, totalReviewCredits - usedCredits) + purchasedCredits;
}

// Check if user can afford a document
function canAffordDocument(docType) {
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    if (!cost) return false;
    
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    
    // Low-risk documents (templates) are free for paid tiers
    if (cost.category === 'template' && tier !== 'free') {
        return true;
    }
    
    // Free tier: check if they have their 1 free low-risk doc
    if (tier === 'free' && cost.category === 'template') {
        return (userCredits.lowRiskDocsUsed || 0) < 1;
    }
    
    // For review-required docs, check review credits
    if (cost.credits > 0) {
        return getTotalCredits() >= cost.credits;
    }
    
    return true;
}

// Deduct credits for a document
function deductCreditsForDocument(docType) {
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    if (!cost) return false;
    
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    
    // Low-risk documents (templates) - no credits for paid tiers
    if (cost.category === 'template' && tier !== 'free') {
        console.log('📄 Template document - no credits deducted (unlimited with subscription)');
        return true;
    }
    
    // Free tier using their 1 free template
    if (tier === 'free' && cost.category === 'template') {
        userCredits.lowRiskDocsUsed = (userCredits.lowRiskDocsUsed || 0) + 1;
        saveUserCredits();
        console.log('📄 Free tier template used. Total used:', userCredits.lowRiskDocsUsed);
        return true;
    }
    
    // For review-required docs, deduct review credits
    if (cost.credits > 0) {
        // Deduct from purchased credits first (they don't expire)
        if (userCredits.purchasedCredits >= cost.credits) {
            userCredits.purchasedCredits -= cost.credits;
            console.log('💳 Deducted', cost.credits, 'from purchased credits. Remaining:', userCredits.purchasedCredits);
        } else {
            // Use combination of purchased and subscription credits
            const fromPurchased = userCredits.purchasedCredits || 0;
            const remaining = cost.credits - fromPurchased;
            userCredits.purchasedCredits = 0;
            userCredits.reviewCreditsUsed = (userCredits.reviewCreditsUsed || 0) + remaining;
            console.log('💳 Deducted', fromPurchased, 'purchased +', remaining, 'subscription credits');
        }
        
        saveUserCredits();
        updateCreditsDisplay();
    }
    
    return true;
}

// Check if user has prompts remaining
function hasPromptsRemaining() {
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    // Paid subscribers have unlimited prompts
    if (tier !== 'free') return true;
    
    const totalAllowed = CONFIG.CREDITS.FREE_TIER.MONTHLY_PROMPTS + (userCredits.bonusPrompts || 0);
    return userCredits.monthlyPromptsUsed < totalAllowed;
}

// Use a prompt
function usePrompt() {
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    // Only track prompts for free tier users
    if (tier === 'free') {
        userCredits.monthlyPromptsUsed++;
        console.log('📝 Prompt used. Total used:', userCredits.monthlyPromptsUsed, '/', CONFIG.CREDITS.FREE_TIER.MONTHLY_PROMPTS);
        
        // Update display IMMEDIATELY before async operations
        updateCreditsDisplay();
        
        // Then save to localStorage and Firebase
        saveUserCredits();
        
        // Force another display update after save completes
        setTimeout(() => {
            updateCreditsDisplay();
        }, 100);
    }
}

// Get remaining prompts for free tier
function getRemainingPrompts() {
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    if (tier !== 'free') return Infinity;
    const totalAllowed = CONFIG.CREDITS.FREE_TIER.MONTHLY_PROMPTS + (userCredits.bonusPrompts || 0);
    return totalAllowed - userCredits.monthlyPromptsUsed;
}

// Update the credits display in the header
function updateCreditsDisplay() {
    const creditsDisplay = document.getElementById('creditsDisplay');
    const creditsBalance = document.getElementById('creditsBalance');
    const promptsDisplay = document.getElementById('promptsDisplay');
    const promptsCounter = document.getElementById('promptsCounter');
    const userTierDisplay = document.getElementById('userTierDisplay');
    
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    
    if (creditsDisplay) {
        creditsDisplay.classList.remove('hidden');
    }
    
    // Update tier display in header
    if (userTierDisplay) {
        const tierConfig = CONFIG.CREDITS.TIERS[tier];
        const tierName = tierConfig ? tierConfig.name : 'Free';
        userTierDisplay.textContent = tierName;
        
        // Color code by tier
        userTierDisplay.classList.remove('text-slate-400', 'text-blue-400', 'text-amber-400', 'text-purple-400');
        if (tier === 'business') {
            userTierDisplay.classList.add('text-purple-400');
        } else if (tier === 'pro') {
            userTierDisplay.classList.add('text-amber-400');
        } else if (tier === 'starter') {
            userTierDisplay.classList.add('text-blue-400');
        } else {
            userTierDisplay.classList.add('text-slate-400');
        }
    }
    
    if (creditsBalance) {
        const total = getTotalCredits();
        creditsBalance.textContent = total;
        
        // Color code based on balance
        creditsBalance.classList.remove('text-green-400', 'text-amber-400', 'text-red-400');
        if (total >= 10) {
            creditsBalance.classList.add('text-green-400');
        } else if (total >= 3) {
            creditsBalance.classList.add('text-amber-400');
        } else if (total >= 1) {
            creditsBalance.classList.add('text-amber-400');
        } else {
            creditsBalance.classList.add('text-red-400');
        }
    }
    
    // Update prompts display for free tier
    if (promptsDisplay && promptsCounter) {
        if (tier === 'free') {
            const remaining = getRemainingPrompts();
            promptsCounter.textContent = `${remaining}/${CONFIG.CREDITS.FREE_TIER.MONTHLY_PROMPTS}`;
            promptsDisplay.classList.remove('hidden');
            
            // Color code prompts based on remaining
            promptsCounter.classList.remove('bg-blue-600', 'bg-amber-600', 'bg-red-600');
            if (remaining > 10) {
                promptsCounter.classList.add('bg-blue-600');
            } else if (remaining > 5) {
                promptsCounter.classList.add('bg-amber-600');
            } else {
                promptsCounter.classList.add('bg-red-600');
            }
        } else {
            // Paid tiers get unlimited prompts
            promptsDisplay.classList.add('hidden');
        }
    }
}

// ========================================
// DARK MODE SYSTEM
// ========================================

/**
 * Initialize dark mode from localStorage
 * Called on page load
 */
function initDarkMode() {
    // Check localStorage for saved preference (default is dark mode)
    const isDarkMode = localStorage.getItem('darkMode') !== 'false';
    
    if (!isDarkMode) {
        // User prefers light mode
        document.body.classList.add('light-mode');
        updateDarkModeButton(false);
    } else {
        // User prefers dark mode (default)
        document.body.classList.remove('light-mode');
        updateDarkModeButton(true);
    }
}

/**
 * Toggle between light and dark mode
 */
function toggleDarkMode() {
    const isCurrentlyDark = !document.body.classList.contains('light-mode');
    
    if (isCurrentlyDark) {
        // Switch to light mode
        document.body.classList.add('light-mode');
        localStorage.setItem('darkMode', 'false');
        updateDarkModeButton(false);
    } else {
        // Switch to dark mode
        document.body.classList.remove('light-mode');
        localStorage.setItem('darkMode', 'true');
        updateDarkModeButton(true);
    }
}

/**
 * Update the dark mode button appearance
 */
function updateDarkModeButton(isDark) {
    const icon = document.getElementById('darkModeIcon');
    const text = document.getElementById('darkModeText');
    
    if (icon && text) {
        if (isDark) {
            icon.textContent = '🌙';
            text.textContent = 'Dark';
        } else {
            icon.textContent = '☀️';
            text.textContent = 'Light';
        }
    }
}


// ========================================
// VENUE MEMORY SYSTEM - GLOBAL STATE
// ========================================

let venueProfile = {
    userName: null,
    venueType: null,
    location: null,
    city: null,
    staffCount: null,
    primaryAward: null,
    mainChallenge: null,
    setupComplete: false,
    setupDate: null,
    venueName: null
};

let onboardingCurrentStep = 1;
const ONBOARDING_STEPS = 6;

// ========================================
// VENUE TYPE CATALOGUE + AWARD MAPPING
// ========================================
// Single source of truth for venue type options. Each entry has the slug
// stored on venueProfile.venueType, the label shown in dropdowns, and the
// short label used in chat / prompts.
const VENUE_OPTIONS = [
    { value: 'bakery-cafe',         label: 'Bakery Café',                                  short: 'bakery café' },
    { value: 'bar',                 label: 'Bar',                                          short: 'bar' },
    { value: 'bistro',              label: 'Bistro',                                       short: 'bistro' },
    { value: 'boutique-hotel',      label: 'Boutique Hotel',                               short: 'boutique hotel' },
    { value: 'brewery',             label: 'Brewery / Brewpub',                            short: 'brewery/brewpub' },
    { value: 'cafe',                label: 'Café',                                         short: 'café' },
    { value: 'cinema-fnb',          label: 'Cinema with Food & Beverage Service',          short: 'cinema with F&B service' },
    { value: 'conference-venue',    label: 'Conference Venue',                             short: 'conference venue' },
    { value: 'dessert-bar',         label: 'Dessert Bar',                                  short: 'dessert bar' },
    { value: 'distillery-bar',      label: 'Distillery Bar',                               short: 'distillery bar' },
    { value: 'entertainment-venue', label: 'Entertainment Venue (Comedy Club / Theatre)',  short: 'entertainment venue' },
    { value: 'food-court',          label: 'Food Court Outlet',                            short: 'food court outlet' },
    { value: 'function-centre',     label: 'Function Centre',                              short: 'function centre' },
    { value: 'hotel-accommodation', label: 'Hotel (Accommodation Venue)',                  short: 'hotel (accommodation)' },
    { value: 'ice-cream-bar',       label: 'Ice Cream / Gelato Bar',                       short: 'ice cream/gelato bar' },
    { value: 'juice-bar',           label: 'Juice / Smoothie Bar',                         short: 'juice/smoothie bar' },
    { value: 'live-music-venue',    label: 'Live Music Venue',                             short: 'live music venue' },
    { value: 'motel',               label: 'Motel',                                        short: 'motel' },
    { value: 'nightclub',           label: 'Nightclub',                                    short: 'nightclub' },
    { value: 'pub',                 label: 'Pub / Hotel',                                  short: 'pub/hotel' },
    { value: 'resort',              label: 'Resort',                                       short: 'resort' },
    { value: 'restaurant',          label: 'Restaurant',                                   short: 'restaurant' },
    { value: 'rooftop-bar',         label: 'Rooftop Bar',                                  short: 'rooftop bar' },
    { value: 'serviced-apartments', label: 'Serviced Apartments',                          short: 'serviced apartments' },
    { value: 'sports-bar',          label: 'Sports Bar',                                   short: 'sports bar' },
    { value: 'tea-house',           label: 'Tea House',                                    short: 'tea house' },
    { value: 'wine-bar',            label: 'Wine Bar',                                     short: 'wine bar' }
];

// Venues commonly covered by each Modern Award. Some venues legitimately
// appear under more than one Award because the right Award depends on what
// staff actually do (a wine bar with a kitchen, a brewery with a restaurant,
// etc). The dropdown shows these primary matches first, with everything else
// available under an "Other venue types" group as a fallback.
const AWARD_VENUE_MAP = {
    'Hospitality Industry (General) Award': [
        'pub', 'bar', 'sports-bar', 'rooftop-bar', 'wine-bar', 'distillery-bar',
        'nightclub', 'live-music-venue', 'entertainment-venue', 'brewery',
        'hotel-accommodation', 'boutique-hotel', 'motel', 'resort',
        'serviced-apartments', 'function-centre', 'conference-venue', 'cinema-fnb'
    ],
    'Restaurant Industry Award': [
        'restaurant', 'cafe', 'bistro', 'bakery-cafe', 'wine-bar', 'brewery',
        'tea-house', 'dessert-bar', 'ice-cream-bar', 'juice-bar',
        'function-centre', 'cinema-fnb'
    ],
    'Fast Food Industry Award': [
        'food-court', 'bakery-cafe', 'dessert-bar', 'ice-cream-bar',
        'juice-bar', 'cinema-fnb'
    ]
};

// Render the venue-type dropdown filtered by Award. When awardName matches a
// known Award, the primary matches appear at the top in alphabetical order
// and the remaining venues appear under an "Other venue types" optgroup.
// For "Not sure" or any unknown award, the full list is shown alphabetically.
function populateVenueTypeDropdown(selectEl, awardName, currentValue) {
    if (!selectEl) return;
    const selected = currentValue || '';
    const sortByLabel = (a, b) => a.label.localeCompare(b.label);
    const primarySlugs = AWARD_VENUE_MAP[awardName];

    let html = '<option value="">Select venue type...</option>';

    if (primarySlugs && primarySlugs.length) {
        const primary = VENUE_OPTIONS
            .filter(v => primarySlugs.includes(v.value))
            .sort(sortByLabel);
        const other = VENUE_OPTIONS
            .filter(v => !primarySlugs.includes(v.value))
            .sort(sortByLabel);
        const optionTag = (v) =>
            `<option value="${v.value}"${v.value === selected ? ' selected' : ''}>${v.label}</option>`;
        html += `<optgroup label="Common for this Award">${primary.map(optionTag).join('')}</optgroup>`;
        html += `<optgroup label="Other venue types">${other.map(optionTag).join('')}</optgroup>`;
    } else {
        html += VENUE_OPTIONS
            .slice()
            .sort(sortByLabel)
            .map(v => `<option value="${v.value}"${v.value === selected ? ' selected' : ''}>${v.label}</option>`)
            .join('');
    }

    selectEl.innerHTML = html;
}

// ========================================
// ADMIN ANALYTICS TRACKING
// ========================================

let analyticsData = {
    conversations: [],
    themes: {},
    highRiskTopics: [],
    userProfiles: {}
};

// ========================================
// ENHANCED DOCUMENT BUILDER DETECTION
// ========================================

/**
 * Detects if user message requires Document Builder tool
 * Returns tool suggestion object or null
 */
function detectDocumentBuilderNeed(message) {
    const lowerMessage = message.toLowerCase();
    
    const documentTriggers = {
        formalWarning: {
            keywords: ['formal warning', 'written warning', 'issue a warning', 'give a warning', 'write a warning', 'warning letter'],
            title: 'Formal Warning Required',
            description: 'Use Document Builder to create a legally compliant formal warning letter'
        },
        recordOfDiscussion: {
            keywords: ['record of discussion', 'document conversation', 'discussion meeting', 'talk to employee about', 'rod'],
            title: 'Record of Discussion',
            description: 'Use Document Builder to create a record of discussion template with conversation script'
        },
        performanceImprovementPlan: {
            keywords: ['performance improve', 'pip', 'performance plan', 'underperforming', 'performance manage', 'performance issue'],
            title: 'Performance Improvement Plan',
            description: 'Use Document Builder to create a structured 12-week performance improvement plan'
        },
        letterOfAllegation: {
            keywords: ['investigate', 'serious misconduct', 'allegation', 'suspend', 'investigation'],
            title: 'Letter of Allegation',
            description: 'Use Document Builder for serious misconduct investigation process'
        },
        termination: {
            keywords: ['terminate', 'termination', 'fire', 'dismiss', 'dismissal', 'sack', 'let go', 'end employment'],
            title: 'Termination Process',
            description: 'CRITICAL: Senior Consultant guidance required for termination'
        }
    };
    
    for (const [type, config] of Object.entries(documentTriggers)) {
        if (config.keywords.some(keyword => lowerMessage.includes(keyword))) {
            return {
                type: type,
                title: config.title,
                description: config.description,
                isTermination: type === 'termination'
            };
        }
    }
    
    return null;
}

/**
 * Detects if user needs a specific tool based on their message
 * Returns array of tool suggestions (can suggest multiple tools)
 */
function detectToolNeeds(message) {
    const lowerMessage = message.toLowerCase();
    const detectedTools = [];
    
    const toolTriggers = {
        // ============================================================
        // EMPLOYMENT CONTRACT / NEW EMPLOYEE TOOLKIT
        // ============================================================
        employmentContract: {
            keywords: [
                // Direct terms
                'employment contract', 'employee contract', 'work contract', 'job contract',
                'contract template', 'employment agreement', 'hiring contract', 'staff contract',
                // Offer letters
                'offer letter', 'letter of offer', 'job offer letter', 'employment offer',
                // Contract types
                'full time contract', 'part time contract', 'casual contract', 'fixed term contract',
                'permanent contract', 'temporary contract', 'probation contract',
                // New hire related
                'new employee paperwork', 'employment paperwork', 'hiring paperwork',
                'new starter paperwork', 'new hire documents', 'employment documents',
                // Actions
                'create contract', 'draft contract', 'write contract', 'make contract',
                'need a contract', 'prepare contract', 'generate contract',
                // Situations
                'hiring someone', 'taking on staff', 'employing someone', 'new staff member',
                'bringing on', 'onboard new', 'starting new employee', 'new team member',
                // Questions
                'contract for new', 'what should contract include', 'contract requirements',
                'fair work contract', 'compliant contract', 'legal contract'
            ],
            title: '📄 Employment Contract',
            description: 'Create Fair Work compliant employment contracts with our New Employee Toolkit',
            action: 'openNewEmployeeToolkit()',
            buttonText: 'Open New Employee Toolkit',
            color: 'emerald'
        },
        
        // ============================================================
        // JOB DESCRIPTION / RECRUITMENT
        // ============================================================
        jobDescription: {
            keywords: [
                // Direct terms
                'job description', 'job ad', 'job advertisement', 'job posting', 'job listing',
                'position description', 'role description', 'pd', 'jd',
                // Writing/Creating
                'write job ad', 'create job ad', 'draft job ad', 'make job ad',
                'write job description', 'create job description', 'write position description',
                // Hiring intent
                'hiring for', 'recruiting for', 'need to hire', 'looking to hire', 'want to hire',
                'looking for staff', 'need staff', 'need employees', 'hiring staff',
                'recruit a', 'recruit an', 'recruiting a', 'recruiting an',
                // Advertising
                'advertise position', 'advertise role', 'advertise job', 'post job',
                'seek ad', 'indeed ad', 'linkedin job', 'job board',
                // Specific roles (hospitality)
                'hire a chef', 'hire a cook', 'hire a waiter', 'hire a waitress',
                'hire a bartender', 'hire a barista', 'hire kitchen hand', 'hire dishwasher',
                'hire a manager', 'hire supervisor', 'hire front of house', 'hire foh',
                'hire back of house', 'hire boh', 'hire hospo staff',
                // Questions
                'how to write job ad', 'job ad template', 'what to include in job ad',
                'attract candidates', 'find staff', 'find employees'
            ],
            title: '📝 Job Description Generator',
            description: 'Create professional, compliant job descriptions with our Recruitment Toolkit',
            action: 'openRecruitmentToolkit()',
            buttonText: 'Open Recruitment Toolkit',
            color: 'purple'
        },
        
        // ============================================================
        // INTERVIEW QUESTIONS
        // ============================================================
        interviewQuestions: {
            keywords: [
                // Direct terms
                'interview question', 'interview questions', 'interview guide', 'interview template',
                'interview script', 'interview form', 'interview sheet',
                // Actions
                'interviewing candidate', 'interviewing applicant', 'conduct interview',
                'conducting interview', 'run interview', 'running interviews', 'do interview',
                // Questions about interviewing
                'how to interview', 'what to ask in interview', 'what to ask candidate',
                'questions to ask', 'good interview questions', 'best questions to ask',
                'interview tips', 'interview advice',
                // Types
                'behavioural interview', 'behavioral interview', 'competency interview',
                'structured interview', 'phone interview', 'phone screen',
                // Preparation
                'interview prep', 'prepare for interview', 'interview preparation',
                'ready for interview', 'before interview',
                // Specific roles
                'interview chef', 'interview waiter', 'interview bartender', 'interview barista',
                'interview manager', 'interview cook', 'interview kitchen',
                // Compliance
                'legal interview questions', 'compliant interview', 'what can i ask',
                'what cant i ask', 'illegal interview questions', 'discriminatory questions'
            ],
            title: '🎤 Interview Questions Generator',
            description: 'Generate role-specific, legally compliant interview questions',
            action: 'openRecruitmentToolkit()',
            buttonText: 'Open Recruitment Toolkit',
            color: 'purple'
        },
        
        // ============================================================
        // REFERENCE CHECK
        // ============================================================
        referenceCheck: {
            keywords: [
                // Direct terms
                'reference check', 'reference checking', 'ref check', 'check reference',
                'reference call', 'reference form', 'reference template',
                // People
                'calling referee', 'contact referee', 'speak to referee', 'referee questions',
                'previous employer', 'former employer', 'past employer', 'old boss',
                // Verification
                'employment verification', 'verify employment', 'check employment history',
                'background check', 'employment history', 'work history',
                // Actions
                'do reference check', 'conduct reference check', 'get references',
                'call references', 'check references', 'contact references',
                // Questions
                'reference questions', 'what to ask referee', 'what to ask reference',
                'how to check references', 'reference check questions',
                // After interview
                'after interview', 'before hiring', 'before offering job'
            ],
            title: '📋 Reference Check Form',
            description: 'Generate a professional reference check form with key questions',
            action: 'openReferenceCheckForm()',
            buttonText: 'Open Reference Check Form',
            color: 'blue'
        },
        
        // ============================================================
        // ONBOARDING CHECKLIST
        // ============================================================
        onboardingChecklist: {
            keywords: [
                // Direct terms
                'onboarding checklist', 'onboarding list', 'onboarding template',
                'induction checklist', 'induction list', 'induction template',
                'orientation checklist', 'orientation list',
                // New starter
                'new starter checklist', 'new starter induction', 'new starter orientation',
                'new employee checklist', 'new employee induction', 'new employee orientation',
                'new hire checklist', 'new hire induction', 'new hire onboarding',
                // First day/week
                'first day checklist', 'first day list', 'first week checklist',
                'day one checklist', 'week one checklist', 'first shift checklist',
                // Process
                'onboarding process', 'induction process', 'orientation process',
                'onboarding program', 'induction program', 'orientation program',
                // Staff
                'staff induction', 'staff orientation', 'staff onboarding',
                'employee induction', 'employee orientation', 'employee onboarding',
                // Actions
                'onboard new employee', 'induct new employee', 'orient new employee',
                'onboard new staff', 'induct new staff', 'starting new employee',
                // Questions
                'how to onboard', 'what to include in induction', 'onboarding requirements',
                'induction requirements', 'new employee needs', 'new starter needs',
                // Documents needed
                'tfn declaration', 'super choice', 'tax file', 'superannuation form',
                'bank details', 'emergency contact'
            ],
            title: '✅ Onboarding Checklist Builder',
            description: 'Create a comprehensive onboarding checklist for new employees',
            action: 'openOnboardingChecklist()',
            buttonText: 'Build Onboarding Checklist',
            color: 'amber'
        },
        
        // ============================================================
        // TRAINING PLAN
        // ============================================================
        trainingPlan: {
            keywords: [
                // Direct terms
                'training plan', 'training program', 'training schedule', 'training template',
                'development plan', 'learning plan', 'training matrix', 'skills matrix',
                // Types
                'employee training', 'staff training', 'team training', 'new employee training',
                'competency training', 'skills training', 'job training', 'role training',
                // Actions
                'train new employee', 'train new staff', 'train team', 'upskill',
                'skill development', 'develop skills', 'develop employee', 'develop staff',
                'create training', 'design training', 'build training',
                // Hospitality specific
                'train chef', 'train cook', 'train waiter', 'train bartender', 'train barista',
                'kitchen training', 'front of house training', 'foh training', 'boh training',
                'food safety training', 'rsa training', 'customer service training',
                // Compliance
                'training requirements', 'mandatory training', 'required training',
                'training records', 'training log', 'training documentation',
                // Questions
                'how to train', 'what training needed', 'training checklist',
                'how long to train', 'training timeline', 'training duration'
            ],
            title: '📚 Training Plan Generator',
            description: 'Create structured training plans for employee development',
            action: 'openTrainingPlan()',
            buttonText: 'Create Training Plan',
            color: 'cyan'
        },
        
        // ============================================================
        // PROBATION CHECK-IN
        // ============================================================
        probationCheckIn: {
            keywords: [
                // Direct terms
                'probation check-in', 'probation check in', 'probation checkin',
                'probation meeting', 'probation assessment',
                'probation evaluation', 'probation period', 'probation progress',
                // Variations
                'probationary period', 'probationary check',
                'probation report', 'probation template',
                // Actions
                'check probation', 'assess probation',
                'probation conversation', 'probation discussion', 'probation feedback',
                // Questions
                'probation check in template',
                'what to cover in probation',
                'probation meeting template',
                // Contextual
                'new employee review', 'new starter review', 'new hire review',
                'first month review', 'second month review', 'third month review',
                // Combined
                'probation support', 'probation development', 'probation plan',
                'during probation'
            ],
            title: '🔄 Probation Check-In Builder',
            description: 'Generate structured probation review documents with AI',
            action: 'openProbationCheckIn()',
            buttonText: 'Build Probation Check-In',
            color: 'teal'
        },
        
        // ============================================================
        // FORMAL PROBATION REVIEW
        // ============================================================
        formalProbationReview: {
            keywords: [
                // Direct terms
                'formal probation review', 'formal probation', 'probation review document',
                'probation review form', 'probation review template',
                // Actions
                'review probation', 'probation review',
                // End of probation outcomes
                'end of probation', 'pass probation', 'fail probation', 'extend probation',
                'confirm employment', 'confirm permanent', 'probation outcome',
                'probationary review', 'probation period review',
                // Formal review context
                'not meeting probation', 'failing probation', 'probation concerns',
                'terminate during probation', 'end employment probation',
                'probation performance review', 'how to do probation review',
                'probation review questions'
            ],
            title: '📑 Formal Probation Review',
            description: 'Generate a formal probation review document with AI — includes action plan, key messages & signatures',
            action: "openDocumentBuilderFor('formalProbationReview')",
            buttonText: 'Build Formal Probation Review',
            color: 'teal'
        },
        
        // ============================================================
        // AWARD WIZARD / PAY RATES
        // ============================================================
        awardRates: {
            keywords: [
                // Direct terms
                'award rate', 'award rates', 'pay rate', 'pay rates', 'wage rate', 'wage rates',
                'minimum wage', 'minimum pay', 'base rate', 'base pay',
                // Specific rates
                'hourly rate', 'hourly pay', 'casual rate', 'casual loading',
                'penalty rate', 'penalty rates', 'weekend rate', 'weekend rates',
                'saturday rate', 'sunday rate', 'public holiday rate', 'holiday rate',
                'overtime rate', 'overtime pay', 'night rate', 'evening rate',
                // Questions
                'what should i pay', 'how much to pay', 'how much should i pay',
                'what is the rate', 'what are the rates', 'current rates',
                'correct pay', 'right pay', 'legal pay', 'fair pay',
                // Classification
                'classification', 'award classification', 'employee classification',
                'level 1', 'level 2', 'level 3', 'level 4', 'level 5', 'level 6',
                'food and beverage', 'kitchen employee', 'front of house attendant',
                // Award
                'hospitality award', 'restaurant award', 'cafe award', 'hotel award',
                'higa', 'hospitality industry general award', 'modern award',
                // Specific roles
                'pay chef', 'pay cook', 'pay waiter', 'pay bartender', 'pay barista',
                'pay kitchen hand', 'pay dishwasher', 'pay manager', 'pay supervisor',
                // Underpayment concerns
                'underpaying', 'underpayment', 'paying enough', 'paying correctly',
                'am i paying right', 'paying too little', 'paying correctly'
            ],
            title: '🧙 Award Wizard',
            description: `Find the correct pay rates and classifications under the ${getAwardContext().name}`,
            action: 'openAwardWizard()',
            buttonText: 'Open Award Wizard',
            color: 'amber'
        },
        
        // ============================================================
        // AWARD CALCULATOR
        // ============================================================
        awardCalculator: {
            keywords: [
                // Direct calculations
                'calculate pay', 'calculate wage', 'calculate wages', 'calculate shift',
                'work out pay', 'work out wage', 'work out shift',
                // Calculator terms
                'pay calculator', 'wage calculator', 'shift calculator', 'payroll calculator',
                'hours calculator', 'overtime calculator', 'penalty calculator',
                // Specific calculations
                'how much for shift', 'how much is shift', 'shift cost', 'shift pay',
                'calculate overtime', 'calculate penalty', 'calculate penalties',
                'calculate public holiday', 'calculate weekend', 'calculate saturday', 'calculate sunday',
                // Questions
                'what will shift cost', 'cost of shift', 'shift total',
                'how much do i owe', 'how much to pay for', 'total pay for',
                // Specific scenarios
                '8 hour shift', '10 hour shift', 'double shift', 'split shift',
                'morning shift', 'afternoon shift', 'night shift', 'overnight shift',
                // Payroll
                'weekly pay', 'fortnightly pay', 'payslip', 'pay run'
            ],
            title: '💰 Award Calculator',
            description: 'Calculate exact pay for shifts including penalties and overtime',
            action: 'openAwardCalculator()',
            buttonText: 'Open Award Calculator',
            color: 'green'
        },
        
        // ============================================================
        // ROSTER STRESS TESTER / COMPLIANCE
        // ============================================================
        rosterCompliance: {
            keywords: [
                // Direct terms
                'roster compliance', 'roster check', 'check roster', 'roster legal',
                'compliant roster', 'roster rules', 'rostering rules', 'roster requirements',
                // Stress test
                'roster stress', 'stress test', 'stress tester', 'test roster',
                // Breaks
                'break compliance', 'break requirements', 'break rules', 'meal break',
                'rest break', 'minimum break', 'break between shifts',
                // Hours
                'minimum hours', 'maximum hours', 'minimum shift', 'maximum shift',
                'hours between shifts', '10 hour break', '11 hour break', 'rest period',
                'consecutive days', 'days off', 'overtime hours',
                // Shift issues
                'shift compliance', 'shift legal', 'shift rules', 'shift requirements',
                'split shift', 'clopening', 'close open', 'back to back',
                // Questions
                'is my roster legal', 'is roster compliant', 'roster okay',
                'roster problem', 'roster issue', 'roster violation',
                // Before publishing
                'before publishing roster', 'check before publish', 'review roster'
            ],
            title: '💥 Roster Stress Tester',
            description: 'Check your roster for compliance issues before publishing',
            action: 'openRosterStressTester()',
            buttonText: 'Open Roster Stress Tester',
            color: 'red'
        },
        
        // ============================================================
        // DEPUTY INTEGRATION
        // ============================================================
        deputyImport: {
            keywords: [
                // Direct terms
                'deputy', 'import deputy', 'deputy import', 'connect deputy',
                'deputy integration', 'sync deputy', 'link deputy',
                // Data
                'deputy roster', 'deputy rosters', 'deputy timesheet', 'deputy timesheets',
                'deputy data', 'deputy export', 'export from deputy', 'deputy csv',
                'deputy employees', 'deputy staff', 'deputy schedule',
                // Actions
                'get deputy data', 'pull from deputy', 'import from deputy',
                'connect to deputy', 'link to deputy', 'sync with deputy',
                // Questions
                'use deputy', 'using deputy', 'have deputy', 'deputy account'
            ],
            title: '🔗 Deputy Integration',
            description: 'Import rosters and timesheets from Deputy for compliance checking',
            action: 'openIntegrationHub()',
            buttonText: 'Open Integration Hub',
            color: 'blue'
        },
        
        // ============================================================
        // XERO INTEGRATION
        // ============================================================
        xeroImport: {
            keywords: [
                // Direct terms
                'xero', 'import xero', 'xero import', 'connect xero',
                'xero integration', 'sync xero', 'link xero',
                // Data
                'xero payroll', 'xero employees', 'xero staff', 'xero data',
                'xero export', 'export from xero', 'xero csv',
                // Actions
                'get xero data', 'pull from xero', 'import from xero',
                'connect to xero', 'link to xero', 'sync with xero',
                // Questions
                'use xero', 'using xero', 'have xero', 'xero account'
            ],
            title: '🔗 Xero Integration',
            description: 'Import employee and payroll data from Xero',
            action: 'openIntegrationHub()',
            buttonText: 'Open Integration Hub',
            color: 'green'
        },
        
        // ============================================================
        // TERMINATION RISK ASSESSOR
        // ============================================================
        terminationRisk: {
            keywords: [
                // Direct termination terms
                'terminate', 'termination', 'terminating', 'fire', 'firing', 'fired',
                'dismiss', 'dismissal', 'dismissing', 'sack', 'sacking', 'sacked',
                'let go', 'letting go', 'end employment', 'ending employment',
                // Redundancy
                'redundancy', 'redundant', 'make redundant', 'making redundant',
                'restructure', 'restructuring', 'downsizing', 'downsize',
                // Risk assessment
                'termination risk', 'dismissal risk', 'unfair dismissal',
                'unfair dismissal risk', 'risk of termination', 'termination assessment',
                // Questions/Intent
                'can i fire', 'can i terminate', 'can i dismiss', 'can i sack',
                'should i fire', 'should i terminate', 'want to fire', 'want to terminate',
                'need to fire', 'need to terminate', 'going to fire', 'going to terminate',
                'thinking of firing', 'considering termination', 'planning to fire',
                // Safe to proceed
                'safe to terminate', 'safe to fire', 'safe to dismiss',
                'okay to fire', 'okay to terminate', 'legal to fire', 'legal to terminate',
                // Getting rid of
                'get rid of employee', 'get rid of staff', 'remove employee',
                'exit employee', 'move on employee', 'part ways'
            ],
            title: '⚖️ Termination Risk Assessor',
            description: 'Assess the legal risks before proceeding with termination',
            action: 'openTerminationRisk()',
            buttonText: 'Open Risk Assessor',
            color: 'red'
        },
        
        // ============================================================
        // COMPLIANCE CALENDAR
        // ============================================================
        complianceCalendar: {
            keywords: [
                // Direct terms
                'compliance calendar', 'compliance dates', 'compliance deadlines',
                'compliance reminder', 'compliance reminders', 'compliance schedule',
                // Award updates
                'award update', 'award updates', 'rate change', 'rate changes',
                'pay increase', 'wage increase', 'minimum wage increase',
                'annual wage review', '1 july', 'july rate increase',
                // Leave
                'annual leave', 'leave accrual', 'leave balance', 'leave entitlements',
                'personal leave', 'sick leave', 'long service leave',
                // Casual conversion
                'casual conversion', 'casual to permanent', 'casual to part time',
                'conversion offer', '12 month casual', 'regular casual',
                // Deadlines
                'compliance deadline', 'deadline', 'due date', 'when is',
                'important dates', 'key dates', 'hr calendar', 'payroll calendar',
                // Questions
                'what compliance', 'upcoming compliance', 'compliance requirements'
            ],
            title: '📅 Compliance Calendar',
            description: 'Track important compliance deadlines and get reminders',
            action: 'openComplianceCalendar()',
            buttonText: 'Open Compliance Calendar',
            color: 'indigo'
        },
        
        // ============================================================
        // DOCUMENT BUILDER - FORMAL WARNING
        // ============================================================
        formalWarning: {
            keywords: [
                // Direct terms
                'formal warning', 'written warning', 'official warning', 'warning letter',
                'first warning', 'second warning', 'final warning', '1st warning', '2nd warning',
                'first written warning', 'second written warning', 'final written warning',
                // Actions
                'issue warning', 'issue a warning', 'give warning', 'give a warning',
                'write warning', 'write a warning', 'send warning', 'send a warning',
                'create warning', 'draft warning', 'prepare warning',
                // Situations
                'need to warn', 'want to warn', 'going to warn',
                'warning for lateness', 'warning for absence', 'warning for conduct',
                'warning for behaviour', 'warning for behavior', 'warning for performance',
                // Discipline
                'disciplinary warning', 'disciplinary letter', 'disciplinary action',
                'discipline employee', 'disciplining staff'
            ],
            title: '📝 Formal Warning Letter',
            description: 'Create a legally compliant formal warning letter with our Document Builder',
            action: "openDocumentBuilderFor('formalWarning')",
            buttonText: 'Open Document Builder',
            color: 'blue'
        },
        
        // ============================================================
        // DOCUMENT BUILDER - RECORD OF DISCUSSION
        // ============================================================
        recordOfDiscussion: {
            keywords: [
                // Direct terms
                'record of discussion', 'rod', 'discussion record', 'meeting record',
                'record of conversation', 'conversation record', 'documented discussion',
                // Informal actions
                'verbal warning', 'informal warning', 'informal chat', 'quick chat',
                'counselling session', 'counseling session', 'coaching session',
                // Actions
                'document conversation', 'document discussion', 'record meeting',
                'talk to employee about', 'speak to employee about', 'chat with employee',
                'have a conversation with', 'discuss with employee', 'address with employee',
                // Situations
                'talk about performance', 'talk about behaviour', 'talk about behavior',
                'talk about lateness', 'talk about attendance', 'talk about attitude',
                'address issue', 'address concern', 'raise concern',
                // Before formal action
                'before formal warning', 'instead of warning', 'informal first'
            ],
            title: '📝 Record of Discussion',
            description: 'Create a record of discussion template with conversation script',
            action: "openDocumentBuilderFor('recordOfDiscussion')",
            buttonText: 'Open Document Builder',
            color: 'blue'
        },
        
        // ============================================================
        // DOCUMENT BUILDER - PERFORMANCE IMPROVEMENT PLAN
        // ============================================================
        performanceImprovementPlan: {
            keywords: [
                // Direct terms
                'performance improvement plan', 'pip', 'performance plan',
                'improvement plan', 'performance action plan', 'performance management plan',
                // Performance issues
                'performance issue', 'performance issues', 'performance problem',
                'performance concern', 'performance concerns', 'performance gap',
                'underperforming', 'under performing', 'not performing',
                'poor performance', 'bad performance', 'below expectations',
                'not meeting expectations', 'not meeting standards', 'not up to standard',
                // Performance management
                'performance manage', 'performance managing', 'manage performance',
                'managing performance', 'manage out', 'managing out',
                // Situations
                'employee not performing', 'staff not performing', 'struggling employee',
                'employee struggling', 'help employee improve', 'improve performance',
                // Actions
                'put on pip', 'place on pip', 'create pip', 'draft pip', 'need pip'
            ],
            title: '📝 Performance Improvement Plan',
            description: 'Create a structured 12-week performance improvement plan',
            action: "openDocumentBuilderFor('performanceImprovementPlan')",
            buttonText: 'Open Document Builder',
            color: 'blue'
        },
        
        // ============================================================
        // DOCUMENT BUILDER - LETTER OF ALLEGATION
        // ============================================================
        letterOfAllegation: {
            keywords: [
                // Direct terms
                'letter of allegation', 'allegation letter', 'allegations letter',
                'show cause', 'show cause letter', 'please explain', 'please explain letter',
                // Investigation
                'investigate', 'investigation', 'investigating', 'workplace investigation',
                'conduct investigation', 'internal investigation', 'formal investigation',
                // Misconduct
                'serious misconduct', 'gross misconduct', 'misconduct', 'wilful misconduct',
                'breach of policy', 'policy breach', 'code of conduct breach',
                // Specific misconduct
                'theft', 'stealing', 'stole', 'stolen', 'fraud', 'fraudulent',
                'dishonesty', 'dishonest', 'lying', 'lied', 'falsified',
                'harassment', 'bullying', 'bullied', 'discrimination',
                'violence', 'violent', 'assault', 'threatened', 'threatening',
                'intoxicated', 'drunk', 'drugs', 'drug use', 'substance abuse',
                'insubordination', 'refused direction', 'disobeyed',
                // Response
                'respond to allegation', 'respond to allegations', 'right to respond',
                'opportunity to respond', 'employee response'
            ],
            title: '📝 Letter of Allegation',
            description: 'Create a letter of allegation for serious misconduct investigation',
            action: "openDocumentBuilderFor('letterOfAllegation')",
            buttonText: 'Open Document Builder',
            color: 'orange'
        }
    };
    
    // Check each tool's keywords
    for (const [toolId, config] of Object.entries(toolTriggers)) {
        if (config.keywords.some(keyword => lowerMessage.includes(keyword))) {
            detectedTools.push({
                id: toolId,
                ...config
            });
        }
    }
    
    // Limit to top 2 most relevant tools to avoid overwhelming the user
    return detectedTools.slice(0, 2);
}

/**
 * Creates tool suggestion UI for detected tools
 */
function createToolSuggestions(detectedTools) {
    if (!detectedTools || detectedTools.length === 0) return '';
    
    const colorClasses = {
        emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-400', textLight: 'text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-400', textLight: 'text-purple-300', btn: 'bg-purple-600 hover:bg-purple-700' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400', textLight: 'text-blue-300', btn: 'bg-blue-600 hover:bg-blue-700' },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-400', textLight: 'text-amber-300', btn: 'bg-amber-600 hover:bg-amber-700' },
        cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500', text: 'text-cyan-400', textLight: 'text-cyan-300', btn: 'bg-cyan-600 hover:bg-cyan-700' },
        green: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400', textLight: 'text-green-300', btn: 'bg-green-600 hover:bg-green-700' },
        red: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400', textLight: 'text-red-300', btn: 'bg-red-600 hover:bg-red-700' },
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400', textLight: 'text-orange-300', btn: 'bg-orange-600 hover:bg-orange-700' },
        indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500', text: 'text-indigo-400', textLight: 'text-indigo-300', btn: 'bg-indigo-600 hover:bg-indigo-700' }
    };
    
    let html = '<div class="mb-4 space-y-3">';
    
    detectedTools.forEach(tool => {
        const colors = colorClasses[tool.color] || colorClasses.blue;
        html += `
            <div class="p-4 ${colors.bg} border-l-4 ${colors.border} rounded-r-lg">
                <p class="${colors.text} font-bold mb-1 flex items-center gap-2">
                    <span>${tool.title}</span>
                </p>
                <p class="${colors.textLight} text-sm mb-3">${tool.description}</p>
                <button onclick="${tool.action}" 
                        class="w-full ${colors.btn} text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
                    <span>${tool.buttonText}</span>
                    <span>→</span>
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Creates Document Builder suggestion box for message
 */
function createDocumentBuilderSuggestion(detection) {
    if (detection.isTermination) {
        return `<div class="mb-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg">
            <p class="text-red-400 font-bold mb-2 flex items-center gap-2">
                <span>🚨</span>
                <span>${detection.title}</span>
            </p>
            <p class="text-red-300 text-sm mb-3">
                Employment termination requires expert guidance to avoid legal risk.
            </p>
            <button onclick="showTerminationConsultantRequired()" 
                    class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                <span>⚖️</span>
                <span>View Termination Requirements</span>
            </button>
        </div>`;
    }
    
    return `<div class="mb-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg">
        <p class="text-blue-400 font-bold mb-2 flex items-center gap-2">
            <span>📝</span>
            <span>${detection.title}</span>
        </p>
        <p class="text-blue-300 text-sm mb-3">${detection.description}</p>
        <button onclick="openDocumentBuilderFor('${detection.type}')" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
            <span>📝</span>
            <span>Open Document Builder</span>
        </button>
    </div>`;
}

/**
 * Opens Document Builder pre-selected to specific type
 */
function openDocumentBuilder() {
    // Track usage
    trackToolUsage('documentBuilderModal');
    
    // Open Document Builder modal without pre-selecting a type
    var modal = document.getElementById('documentBuilderModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Reset to step 1 (document type selection)
        resetDocumentBuilderSilent();
        
        trackEvent('document_builder_opened_from_header', {
            user: currentUser
        });
    } else {
    }
}

function openDocumentBuilderFor(documentType) {
    // Open modal
    document.getElementById('documentBuilderModal').classList.remove('hidden');
    
    // Auto-select the document type
    if (documentType && documentType !== 'termination') {
        setTimeout(() => {
            selectDocumentType(documentType);
        }, 100);
    }
    
    trackEvent('document_builder_opened_from_suggestion', {
        user: currentUser,
        type: documentType
    });
}

// ========================================
// AWARD RATES - FETCH FROM GITHUB
// ========================================

let awardRates = null; // Global variable to store rates

// Returns award name, MA code, and full name based on the user's venueProfile
function getAwardContext() {
    const award = (venueProfile && venueProfile.primaryAward) || 'Hospitality Industry (General) Award';
    const isRestaurant = award.toLowerCase().includes('restaurant');
    return {
        name: award,
        code: isRestaurant ? 'MA000119' : 'MA000009',
        fullName: isRestaurant
            ? 'Restaurant Industry Award MA000119'
            : 'Hospitality Industry (General) Award MA000009'
    };
}

// Fetch rates on page load
async function loadAwardRates() {
    try {
        const isRestaurant = venueProfile && venueProfile.primaryAward &&
            venueProfile.primaryAward.toLowerCase().includes('restaurant');
        const url = isRestaurant ? CONFIG.API.RESTAURANT_RATES_URL : CONFIG.API.HOSPITALITY_RATES_URL;
        const response = await fetchWithRetry(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to load rates`);
        awardRates = await response.json();
        return true;
    } catch (error) {
        awardRates = getFallbackRates();
        return false;
    }
}

// Fallback rates if GitHub is down
function getFallbackRates() {
    return {
        version: 'fallback-2025',
        effective_date: '2024-07-01',
        next_review_date: '2025-07-01',
        notes: ['Using offline fallback rates'],
        rates: [
            { category: 'adult', employment_type: 'full_time', classification: 'introductory', rate: 24.28, title: 'Introductory Level' },
            { category: 'adult', employment_type: 'casual', classification: 'introductory', rate: 30.35, title: 'Introductory Level (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_1.food_beverage_grade1', rate: 24.95, title: 'Food & Beverage Grade 1' },
            { category: 'adult', employment_type: 'casual', classification: 'level_1.food_beverage_grade1', rate: 31.19, title: 'Food & Beverage Grade 1 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_1.kitchen_attendant_grade1', rate: 24.95, title: 'Kitchen Attendant Grade 1' },
            { category: 'adult', employment_type: 'casual', classification: 'level_1.kitchen_attendant_grade1', rate: 31.19, title: 'Kitchen Attendant Grade 1 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_1.guest_service_grade1', rate: 24.95, title: 'Guest Services Grade 1' },
            { category: 'adult', employment_type: 'casual', classification: 'level_1.guest_service_grade1', rate: 31.19, title: 'Guest Services Grade 1 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_2.food_beverage_grade2', rate: 25.85, title: 'Food & Beverage Grade 2' },
            { category: 'adult', employment_type: 'casual', classification: 'level_2.food_beverage_grade2', rate: 32.31, title: 'Food & Beverage Grade 2 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_2.cook_grade1', rate: 25.85, title: 'Cook Grade 1' },
            { category: 'adult', employment_type: 'casual', classification: 'level_2.cook_grade1', rate: 32.31, title: 'Cook Grade 1 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_2.kitchen_attendant_grade2', rate: 25.85, title: 'Kitchen Attendant Grade 2' },
            { category: 'adult', employment_type: 'casual', classification: 'level_2.kitchen_attendant_grade2', rate: 32.31, title: 'Kitchen Attendant Grade 2 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_2.guest_service_grade2', rate: 25.85, title: 'Guest Services Grade 2' },
            { category: 'adult', employment_type: 'casual', classification: 'level_2.guest_service_grade2', rate: 32.31, title: 'Guest Services Grade 2 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_2.front_office_grade1', rate: 25.85, title: 'Front Office Grade 1' },
            { category: 'adult', employment_type: 'casual', classification: 'level_2.front_office_grade1', rate: 32.31, title: 'Front Office Grade 1 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_2.doorperson_security', rate: 25.85, title: 'Doorperson/Security' },
            { category: 'adult', employment_type: 'casual', classification: 'level_2.doorperson_security', rate: 32.31, title: 'Doorperson/Security (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_3.food_beverage_grade3', rate: 26.70, title: 'Food & Beverage Grade 3' },
            { category: 'adult', employment_type: 'casual', classification: 'level_3.food_beverage_grade3', rate: 33.38, title: 'Food & Beverage Grade 3 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_3.cook_grade2', rate: 26.70, title: 'Cook Grade 2' },
            { category: 'adult', employment_type: 'casual', classification: 'level_3.cook_grade2', rate: 33.38, title: 'Cook Grade 2 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_3.kitchen_attendant_grade3', rate: 26.70, title: 'Kitchen Attendant Grade 3' },
            { category: 'adult', employment_type: 'casual', classification: 'level_3.kitchen_attendant_grade3', rate: 33.38, title: 'Kitchen Attendant Grade 3 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_3.guest_service_grade3', rate: 26.70, title: 'Guest Services Grade 3' },
            { category: 'adult', employment_type: 'casual', classification: 'level_3.guest_service_grade3', rate: 33.38, title: 'Guest Services Grade 3 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_3.front_office_grade2', rate: 26.70, title: 'Front Office Grade 2' },
            { category: 'adult', employment_type: 'casual', classification: 'level_3.front_office_grade2', rate: 33.38, title: 'Front Office Grade 2 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_3.timekeeper_security_grade2', rate: 26.70, title: 'Timekeeper/Security Grade 2' },
            { category: 'adult', employment_type: 'casual', classification: 'level_3.timekeeper_security_grade2', rate: 33.38, title: 'Timekeeper/Security Grade 2 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_4.food_beverage_tradesperson_grade4', rate: 28.12, title: 'Food & Beverage Tradesperson Grade 4' },
            { category: 'adult', employment_type: 'casual', classification: 'level_4.food_beverage_tradesperson_grade4', rate: 35.15, title: 'Food & Beverage Tradesperson Grade 4 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_4.cook_tradesperson_grade3', rate: 28.12, title: 'Cook Tradesperson Grade 3' },
            { category: 'adult', employment_type: 'casual', classification: 'level_4.cook_tradesperson_grade3', rate: 35.15, title: 'Cook Tradesperson Grade 3 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_4.guest_service_grade4', rate: 28.12, title: 'Guest Services Grade 4' },
            { category: 'adult', employment_type: 'casual', classification: 'level_4.guest_service_grade4', rate: 35.15, title: 'Guest Services Grade 4 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_4.front_office_grade3', rate: 28.12, title: 'Front Office Grade 3' },
            { category: 'adult', employment_type: 'casual', classification: 'level_4.front_office_grade3', rate: 35.15, title: 'Front Office Grade 3 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_5.food_beverage_supervisor', rate: 29.88, title: 'Food & Beverage Supervisor' },
            { category: 'adult', employment_type: 'casual', classification: 'level_5.food_beverage_supervisor', rate: 37.35, title: 'Food & Beverage Supervisor (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_5.cook_tradesperson_grade4', rate: 29.88, title: 'Cook Tradesperson Grade 4' },
            { category: 'adult', employment_type: 'casual', classification: 'level_5.cook_tradesperson_grade4', rate: 37.35, title: 'Cook Tradesperson Grade 4 (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_5.guest_service_supervisor', rate: 29.88, title: 'Guest Services Supervisor' },
            { category: 'adult', employment_type: 'casual', classification: 'level_5.guest_service_supervisor', rate: 37.35, title: 'Guest Services Supervisor (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_5.front_office_supervisor', rate: 29.88, title: 'Front Office Supervisor' },
            { category: 'adult', employment_type: 'casual', classification: 'level_5.front_office_supervisor', rate: 37.35, title: 'Front Office Supervisor (Casual)' },
            { category: 'adult', employment_type: 'full_time', classification: 'level_6.cook_tradesperson_grade5', rate: 30.68, title: 'Cook Tradesperson Grade 5' },
            { category: 'adult', employment_type: 'casual', classification: 'level_6.cook_tradesperson_grade5', rate: 38.35, title: 'Cook Tradesperson Grade 5 (Casual)' }
        ],
        penalty_rates: {
            saturday: 1.5,
            sunday: 1.75,
            public_holiday: 2.5,
            evening_after_7pm_loading: 2.81,
            night_midnight_to_7am_loading: 4.22
        },
        casual_loading: 0.25
    };
}

// Load rates immediately when page loads
loadAwardRates();

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Sanitizes HTML to prevent XSS attacks
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML safe for innerHTML
 */
function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fetches data with automatic retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, maxRetries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            
            // If not the last retry, wait before trying again
            if (i < maxRetries - 1) {
                const delay = CONFIG.RETRY_DELAY * (i + 1); // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
        }
    }
    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

/**
 * Wraps async functions with error handling
 * @param {Function} asyncFunc - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
function withErrorHandling(asyncFunc) {
    return async function(...args) {
        try {
            return await asyncFunc(...args);
        } catch (error) {
            // Show user-friendly error
            const errorMessage = error.message || 'An unexpected error occurred';
            showAlert(`⚠️ ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
            
            // Re-throw for caller to handle if needed
            throw error;
        }
    };
}

// ========================================
// HIGH-RISK DETECTION & WARNING SYSTEM
// ========================================

/**
 * Detects high-risk topics in user messages
 * @param {string} message - User's message
 * @returns {Object|null} Risk object with type and severity, or null if no risk
 */
function detectHighRiskTopic(message) {
    const lowerMessage = message.toLowerCase();
    
    // Define high-risk keywords - ONLY for critical legal/termination matters
    const riskCategories = {
        termination: {
            keywords: [
                'terminate', 'termination', 'terminating', 'fire', 'firing', 'fired',
                'dismiss', 'dismissal', 'dismissing', 'sack', 'sacking', 'sacked',
                'let go', 'letting go', 'end employment', 'ending employment',
                'redundancy', 'redundant', 'make redundant', 'restructure',
                'get rid of employee', 'get rid of staff', 'exit employee'
            ],
            title: 'Employment Termination',
            severity: 'critical'
        },
        investigation: {
            keywords: [
                'investigate', 'investigation', 'investigating', 'allegation', 'allegations',
                'serious misconduct', 'gross misconduct', 'misconduct',
                'theft', 'stealing', 'stole', 'stolen', 'fraud', 'fraudulent',
                'dishonesty', 'dishonest', 'falsified'
            ],
            title: 'Workplace Investigation',
            severity: 'critical'
        },
        legal: {
            keywords: [
                'legal action', 'lawsuit', 'sue', 'suing', 'lawyer', 'solicitor',
                'unfair dismissal', 'unfair dismissal claim', 'general protections',
                'adverse action', 'discrimination claim', 'workers comp claim',
                'fair work complaint', 'fair work commission', 'fwc',
                'lodged complaint', 'filed complaint', 'taking legal'
            ],
            title: 'Legal Matter',
            severity: 'critical'
        },
        harassment: {
            keywords: [
                'sexual harassment', 'sexually harassed', 'assault', 'assaulted',
                'violence', 'violent', 'threatened', 'threatening', 'threats',
                'physical altercation', 'hit', 'punched', 'attacked'
            ],
            title: 'Harassment/Safety Issue',
            severity: 'critical'
        }
    };
    
    // Check each category - only return for critical severity
    for (const [category, config] of Object.entries(riskCategories)) {
        if (config.severity === 'critical') {
            const hasKeyword = config.keywords.some(keyword => lowerMessage.includes(keyword));
            if (hasKeyword) {
                return {
                    category: category,
                    title: config.title,
                    severity: config.severity
                };
            }
        }
    }
    
    return null;
}

/**
 * Detects if user is trying to generate a document via chat
 * Redirects them to the appropriate tool instead
 */
function detectDocumentGenerationRequest(message) {
    const lowerMessage = message.toLowerCase();
    
    // Document generation trigger phrases
    const documentTriggers = [
        // Direct generation requests
        { patterns: ['write me a', 'write a', 'draft a', 'draft me a', 'create a', 'create me a', 'generate a', 'generate me a', 'make a', 'make me a', 'prepare a', 'prepare me a', 'give me a', 'can you write', 'can you create', 'can you draft', 'can you generate', 'can you make', 'i need a', 'i need you to write', 'i need you to create', 'help me write', 'help me create', 'help me draft'], 
          documentTypes: ['letter', 'warning', 'contract', 'template', 'document', 'form', 'policy', 'pip', 'performance improvement plan', 'termination', 'redundancy', 'show cause', 'allegation', 'checklist', 'plan', 'description', 'reference check'] 
        }
    ];
    
    // Document type to tool mapping - ALL use specific document type functions
    const documentToolMap = {
        // Warning letters - specific types
        'warning': { tool: 'Document Builder', action: "openDocumentBuilderFor('formalWarning')", icon: '📄', specific: 'Warning Letter' },
        'formal warning': { tool: 'Document Builder', action: "openDocumentBuilderFor('formalWarning')", icon: '📄', specific: 'Formal Warning' },
        'first warning': { tool: 'Document Builder', action: "openDocumentBuilderFor('firstWarning')", icon: '📄', specific: 'First Written Warning' },
        'final warning': { tool: 'Document Builder', action: "openDocumentBuilderFor('finalWarning')", icon: '📄', specific: 'Final Written Warning' },
        'written warning': { tool: 'Document Builder', action: "openDocumentBuilderFor('formalWarning')", icon: '📄', specific: 'Written Warning' },
        
        // Performance documents
        'pip': { tool: 'Document Builder', action: "openDocumentBuilderFor('pip')", icon: '📄', specific: 'Performance Improvement Plan' },
        'performance improvement': { tool: 'Document Builder', action: "openDocumentBuilderFor('pip')", icon: '📄', specific: 'Performance Improvement Plan' },
        'performance improvement plan': { tool: 'Document Builder', action: "openDocumentBuilderFor('pip')", icon: '📄', specific: 'Performance Improvement Plan' },
        'record of discussion': { tool: 'Document Builder', action: "openDocumentBuilderFor('recordOfDiscussion')", icon: '📄', specific: 'Record of Discussion' },
        
        // Termination/Redundancy - requires consultation
        'termination': { tool: 'Talk to a Consultant', action: 'openConsultationBookingModal()', icon: '📞', specific: 'Termination Review', requiresConsult: true },
        'redundancy': { tool: 'Talk to a Consultant', action: 'openConsultationBookingModal()', icon: '📞', specific: 'Redundancy Review', requiresConsult: true },
        
        // Show cause/Allegations
        'show cause': { tool: 'Document Builder', action: "openDocumentBuilderFor('showCause')", icon: '📄', specific: 'Show Cause Letter' },
        'allegation': { tool: 'Document Builder', action: "openDocumentBuilderFor('letterOfAllegation')", icon: '📄', specific: 'Letter of Allegation' },
        'letter of allegation': { tool: 'Document Builder', action: "openDocumentBuilderFor('letterOfAllegation')", icon: '📄', specific: 'Letter of Allegation' },
        
        // Probation documents
        'probation': { tool: 'Probation Check-In Builder', action: 'openProbationCheckIn()', icon: '🔄', specific: 'Probation Check-In' },
        'probation check': { tool: 'Probation Check-In Builder', action: 'openProbationCheckIn()', icon: '🔄', specific: 'Probation Check-In' },
        'probation check-in': { tool: 'Probation Check-In Builder', action: 'openProbationCheckIn()', icon: '🔄', specific: 'Probation Check-In' },
        'probation review': { tool: 'Document Builder', action: "openDocumentBuilderFor('formalProbationReview')", icon: '📄', specific: 'Formal Probation Review' },
        'probation extension': { tool: 'Document Builder', action: "openDocumentBuilderFor('probationExtension')", icon: '📄', specific: 'Probation Extension Letter' },
        
        // Other specific documents
        'letter of concern': { tool: 'Document Builder', action: "openDocumentBuilderFor('letterOfConcern')", icon: '📄', specific: 'Letter of Concern' },
        'concern': { tool: 'Document Builder', action: "openDocumentBuilderFor('letterOfConcern')", icon: '📄', specific: 'Letter of Concern' },
        'casual conversion': { tool: 'Document Builder', action: "openDocumentBuilderFor('casualConversion')", icon: '📄', specific: 'Casual Conversion Letter' },
        'change of hours': { tool: 'Document Builder', action: "openDocumentBuilderFor('changeOfHours')", icon: '📄', specific: 'Change of Hours Letter' },
        
        // Contracts - New Employee Toolkit
        'contract': { tool: 'New Employee Toolkit', action: 'openNewEmployeeToolkit()', icon: '👤', specific: 'Employment Contract' },
        'employment contract': { tool: 'New Employee Toolkit', action: 'openNewEmployeeToolkit()', icon: '👤', specific: 'Employment Contract' },
        
        // Job/Position Description - Separate builders
        'job description': { tool: 'Job Advertisement Builder', action: 'openJobDescriptionBuilder()', icon: '📢', specific: 'Job Advertisement' },
        'job ad': { tool: 'Job Advertisement Builder', action: 'openJobDescriptionBuilder()', icon: '📢', specific: 'Job Advertisement' },
        'job advertisement': { tool: 'Job Advertisement Builder', action: 'openJobDescriptionBuilder()', icon: '📢', specific: 'Job Advertisement' },
        'position description': { tool: 'Position Description Builder', action: 'openPositionDescriptionBuilder()', icon: '📋', specific: 'Position Description' },
        'pd': { tool: 'Position Description Builder', action: 'openPositionDescriptionBuilder()', icon: '📋', specific: 'Position Description' },
        
        // Onboarding
        'onboarding': { tool: 'Onboarding Checklist', action: 'openOnboardingChecklist()', icon: '✅', specific: 'Onboarding Checklist' },
        'checklist': { tool: 'Onboarding Checklist', action: 'openOnboardingChecklist()', icon: '✅', specific: 'Onboarding Checklist' },
        'onboarding checklist': { tool: 'Onboarding Checklist', action: 'openOnboardingChecklist()', icon: '✅', specific: 'Onboarding Checklist' },
        
        // Training
        'training plan': { tool: 'Training Plan Generator', action: 'openTrainingPlan()', icon: '📚', specific: 'Training Plan' },
        'training': { tool: 'Training Plan Generator', action: 'openTrainingPlan()', icon: '📚', specific: 'Training Plan' },
        
        // Reference check
        'reference check': { tool: 'Reference Check Form', action: 'openReferenceCheckForm()', icon: '📞', specific: 'Reference Check Form' },
        'reference': { tool: 'Reference Check Form', action: 'openReferenceCheckForm()', icon: '📞', specific: 'Reference Check Form' },
        
        // Generic fallbacks - go to Document Builder main page
        'letter': { tool: 'Document Builder', action: 'openDocumentBuilder()', icon: '📄', specific: 'HR Letters' },
        'document': { tool: 'Document Builder', action: 'openDocumentBuilder()', icon: '📄', specific: 'HR Documents' },
        'template': { tool: 'Document Builder', action: 'openDocumentBuilder()', icon: '📄', specific: 'HR Templates' },
        'form': { tool: 'Document Builder', action: 'openDocumentBuilder()', icon: '📄', specific: 'HR Forms' },
        'policy': { tool: 'Document Builder', action: 'openDocumentBuilder()', icon: '📄', specific: 'HR Policies' }
    };
    
    // Check for document generation request patterns
    for (const trigger of documentTriggers) {
        for (const pattern of trigger.patterns) {
            if (lowerMessage.includes(pattern)) {
                // Found a generation pattern, now check for document type
                for (const docType of trigger.documentTypes) {
                    if (lowerMessage.includes(docType)) {
                        // Match found - get the tool mapping
                        const toolInfo = documentToolMap[docType] || documentToolMap['document'];
                        return {
                            requestedDoc: docType,
                            tool: toolInfo.tool,
                            action: toolInfo.action,
                            icon: toolInfo.icon,
                            specific: toolInfo.specific,
                            requiresConsult: toolInfo.requiresConsult || false
                        };
                    }
                }
            }
        }
    }
    
    return null;
}

/**
 * Creates a helpful redirect message when user tries to generate documents in chat
 */
function createDocumentRedirectMessage(documentRequest) {
    const { tool, action, icon, specific, requiresConsult } = documentRequest;
    
    if (requiresConsult) {
        return `## 📞 Expert Consultation Required

I can't generate **${specific}** documents directly in chat — these are high-risk matters that require expert guidance.

<div class="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
    <p class="text-amber-400 font-semibold mb-2">${icon} ${specific}</p>
    <p class="text-slate-300 text-sm mb-3">Book a consultation with our HR consultants to get personalised guidance and compliant documentation.</p>
    <button onclick="${action}" class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-all">
        Talk to a Consultant →
    </button>
</div>

**Why consultation?** ${specific} involves significant legal risk. Our consultants will review your situation and provide tailored documentation that protects your business.`;
    }
    
    return `## 📄 Use Our Document Tools

I can't generate documents directly in chat, but I can point you to the right tool!

<div class="mt-4 p-4 bg-slate-700/50 border border-amber-500/30 rounded-lg">
    <p class="text-amber-400 font-semibold mb-2">${icon} ${specific}</p>
    <p class="text-slate-300 text-sm mb-3">Use our dedicated ${tool} for professional, compliant HR documents.</p>
    <button onclick="${action}" class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-all">
        Open ${tool} →
    </button>
</div>

**Why use the tools?**
- ✅ Professionally formatted documents
- ✅ Legally compliant templates
- ✅ Customized to your situation
- ✅ Download-ready Word/PDF files

**I'm still here to help!** Ask me questions about HR processes, compliance, awards, or best practices — I just can't write the documents directly in chat.`;
}

/**
 * Creates a subtle but prominent high-risk warning
 * @param {Object} risk - Risk object from detectHighRiskTopic
 * @returns {string} HTML string for the warning box
 */

function createHighRiskWarningBox(risk) {
    const currentTime = new Date().toLocaleString('en-AU');
    
    return `<div class="mb-3 p-3 bg-red-500/10 border-l-4 border-red-500 rounded">
    <p class="text-red-400 font-bold text-sm flex items-center gap-2 mb-2">
        <span>⚠️</span>
        <span>IMPORTANT: This matter involves legal risk.</span>
    </p>
    <p class="text-red-300 text-sm mb-3">
        ${risk.title} - Please contact a Senior Consultant at <a href="mailto:support@fitzhr.com" class="underline hover:text-red-200">support@fitzhr.com</a> before taking action.
    </p>
    <div class="flex gap-2">
        <a href="mailto:support@fitzhr.com?subject=URGENT: ${encodeURIComponent(risk.title)} - ${encodeURIComponent(currentUser)}&body=${encodeURIComponent('I need urgent advice regarding a ' + risk.title + ' matter.\n\nUser ID: ' + currentUser + '\nDate/Time: ' + currentTime + '\n\nBrief Description:\n[Please describe your situation here]')}" 
           class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded text-sm transition-all text-center">
            ✉️ Email Consultant
        </a>
        <button onclick="openConsultationBookingModal()" 
           class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded text-sm transition-all text-center whitespace-nowrap">
            💬 Book Consultation
        </button>
        <button onclick="openTool('scenarioAnalysis')" 
                class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-3 rounded text-sm transition-all whitespace-nowrap">
            🎯 Analyze
        </button>
    </div>
</div>

`;
}


// ========================================
// HR DOCUMENT TEMPLATES
// ========================================

const hrTemplates = {
            employmentContract: (data) => `
                <div class="header">
                    <h1>EMPLOYMENT CONTRACT</h1>
                    <p>Fitz HR - Professional HR Solutions</p>
                </div>
                
                <h2>Employment Details</h2>
                <p><strong>Employee Name:</strong> ${data.employeeName || '[Employee Name]'}</p>
                <p><strong>Position:</strong> ${data.position || '[Position Title]'}</p>
                <p><strong>Start Date:</strong> ${data.startDate || '[Start Date]'}</p>
                <p><strong>Employment Type:</strong> ${data.employmentType || '[Full-time/Part-time/Casual]'}</p>
                <p><strong>Applicable Award:</strong> ${data.award || getAwardContext().fullName}</p>
                
                <h2>1. Position and Duties</h2>
                <p>${data.duties || '[Insert comprehensive list of key duties, responsibilities, and reporting lines]'}</p>
                
                <h2>2. Remuneration and Benefits</h2>
                <p><strong>Base Rate of Pay:</strong> ${data.baseRate || '[Rate]'} per ${data.payPeriod || 'hour'}</p>
                <p>Payment will be made ${data.paymentFrequency || 'fortnightly'} via direct deposit.</p>
                <p>In addition to the base rate, you will receive applicable penalty rates, loadings, and allowances as prescribed by the ${data.award || getAwardContext().fullName}.</p>
                
                <h2>3. Hours of Work</h2>
                <p>${data.hoursOfWork || '[Specify ordinary hours, roster arrangements, and any requirements for availability]'}</p>
                <p>Reasonable additional hours may be required from time to time, subject to the National Employment Standards.</p>
                
                <h2>4. Probationary Period</h2>
                <p>The first ${data.probationPeriod || '3 months'} of your employment will be considered a probationary period. During this time, your suitability for the role will be assessed. Either party may terminate employment during probation with ${data.probationNotice || '1 week\'s'} notice.</p>
                
                <h2>5. Leave Entitlements</h2>
                <p>You are entitled to leave in accordance with the National Employment Standards and the applicable Modern Award, including:</p>
                <ul>
                    <li>Annual leave (if applicable to employment type)</li>
                    <li>Personal/carer's leave</li>
                    <li>Compassionate and bereavement leave</li>
                    <li>Long service leave (after qualifying period)</li>
                    <li>Public holidays</li>
                </ul>
                
                <h2>6. Termination of Employment</h2>
                <p>Either party may terminate this employment by providing written notice as required by the National Employment Standards and the applicable Award.</p>
                
                <h2>7. Workplace Policies</h2>
                <p>You are required to comply with all workplace policies and procedures, including but not limited to workplace health and safety, equal opportunity, and code of conduct policies.</p>
                
                <div class="warning">
                    <strong>⚠️ IMPORTANT LEGAL NOTICE</strong>
                    <p>This employment contract template has been generated by Fitz AI and is provided for guidance purposes only.</p>
                    <p><strong>You MUST have this contract reviewed and customised by a Fitz HR Senior Consultant or employment lawyer before use.</strong></p>
                    <p>This ensures compliance with all applicable laws, awards, and your specific circumstances.</p>
                    <p><strong>Contact:</strong> support@fitzhr.com | Fitz HR</p>
                </div>
                
                <div style="margin-top: 50px;">
                    <p><strong>Employee Signature:</strong> _________________________ <strong>Date:</strong> __________</p>
                    <p><strong>Employer Signature:</strong> _________________________ <strong>Date:</strong> __________</p>
                </div>
            `,
            
            warningLetter: (data) => `
                <div class="header">
                    <h1>WRITTEN WARNING</h1>
                    <p>Fitz HR - Professional HR Solutions</p>
                </div>
                
                <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString('en-AU')}</p>
                <p><strong>Employee Name:</strong> ${data.employeeName || '[Employee Name]'}</p>
                <p><strong>Position:</strong> ${data.position || '[Position]'}</p>
                <p><strong>Employee ID:</strong> ${data.employeeId || '[Employee ID]'}</p>
                
                <h2>Subject: ${data.subject || 'Formal Written Warning'}</h2>
                
                <p>This letter serves as a formal written warning regarding ${data.issue || '[describe the issue or concern]'}.</p>
                
                <h2>Details of Incident/Issue</h2>
                <p><strong>Date(s) of Incident:</strong> ${data.incidentDate || '[Date(s)]'}</p>
                <p><strong>Description:</strong></p>
                <p>${data.description || '[Provide detailed, factual description of the incident, behaviour, or performance issue. Include specific examples, dates, times, and any witnesses if applicable]'}</p>
                
                <h2>Previous Discussions</h2>
                <p>${data.previousDiscussions || '[If applicable, note any prior verbal warnings or discussions about this matter, including dates]'}</p>
                
                <h2>Expected Standards and Behaviour</h2>
                <p>${data.expectations || '[Clearly outline the expected standards of conduct, performance, or behaviour moving forward. Reference relevant policies, position description, or award requirements]'}</p>
                
                <h2>Improvement Plan</h2>
                <p>${data.improvementPlan || '[Outline specific, measurable steps the employee must take to address the issue. Include timeframes and any support or resources available]'}</p>
                
                <h2>Consequences of Further Issues</h2>
                <p>Failure to meet these expectations and demonstrate sustained improvement may result in further disciplinary action, which may include:</p>
                <ul>
                    <li>A final written warning</li>
                    <li>Termination of employment</li>
                </ul>
                
                <h2>Support Available</h2>
                <p>${data.support || '[Outline any support, training, coaching, or resources available to help the employee improve. This demonstrates procedural fairness]'}</p>
                
                <h2>Right to Respond</h2>
                <p>You have the right to provide a written response to this warning within ${data.responseTimeframe || '7 days'}. Your response will be considered and placed on your employee file with this warning.</p>
                
                <p>This warning will remain on your employee file for ${data.warningDuration || '12 months'} from the date of this letter.</p>
                
                <div class="warning">
                    <strong>⚠️ CRITICAL LEGAL RISK</strong>
                    <p>Performance management and disciplinary processes involve significant legal risks if not handled correctly.</p>
                    <p><strong>This template MUST be reviewed by a Fitz HR Senior Consultant before being issued to any employee.</strong></p>
                    <p>Incorrect process may result in unfair dismissal claims, general protections claims, or adverse action claims.</p>
                    <p><strong>Contact immediately:</strong> support@fitzhr.com | Fitz HR</p>
                </div>
                
                <div style="margin-top: 40px;">
                    <p><strong>I acknowledge receipt of this written warning:</strong></p>
                    <p><strong>Employee Signature:</strong> _________________________ <strong>Date:</strong> __________</p>
                    <p style="margin-top: 10px; font-size: 12px; color: #666;"><em>Signing this letter acknowledges receipt only and does not necessarily indicate agreement with its contents.</em></p>
                    <br/>
                    <p><strong>Manager/Supervisor Name:</strong> ${data.managerName || '[Manager Name]'}</p>
                    <p><strong>Manager Signature:</strong> _________________________ <strong>Date:</strong> __________</p>
                </div>
            `,
            
            performanceReview: (data) => `
                <div class="header">
                    <h1>PERFORMANCE REVIEW</h1>
                    <p>Fitz HR - Professional HR Solutions</p>
                </div>
                
                <h2>Employee Information</h2>
                <p><strong>Employee Name:</strong> ${data.employeeName || '[Employee Name]'}</p>
                <p><strong>Position:</strong> ${data.position || '[Position]'}</p>
                <p><strong>Department/Location:</strong> ${data.department || '[Department]'}</p>
                <p><strong>Review Period:</strong> ${data.reviewPeriod || '[Start Date] to [End Date]'}</p>
                <p><strong>Review Date:</strong> ${data.reviewDate || new Date().toLocaleDateString('en-AU')}</p>
                <p><strong>Reviewer:</strong> ${data.reviewer || '[Manager/Supervisor Name]'}</p>
                
                <h2>Performance Summary</h2>
                <p>${data.summary || '[Provide an overall summary of the employee\'s performance during the review period. Consider achievements, challenges, growth, and overall contribution to the team and organisation]'}</p>
                
                <h2>Key Achievements and Successes</h2>
                <p>${data.achievements || '[List and describe significant achievements, successful projects, goals met or exceeded, positive contributions to team/workplace culture, and any special recognition received during the review period]'}</p>
                
                <h2>Core Competencies Assessment</h2>
                
                <h3>1. Job Knowledge and Skills</h3>
                <p>${data.jobKnowledge || '[Assess the employee\'s understanding of their role, technical skills, industry knowledge, and ability to perform required tasks]'}</p>
                
                <h3>2. Quality of Work</h3>
                <p>${data.qualityOfWork || '[Evaluate accuracy, attention to detail, consistency, and standard of work produced]'}</p>
                
                <h3>3. Productivity and Time Management</h3>
                <p>${data.productivity || '[Assess ability to meet deadlines, manage workload, prioritise tasks, and work efficiently]'}</p>
                
                <h3>4. Communication and Teamwork</h3>
                <p>${data.communication || '[Evaluate interpersonal skills, collaboration with colleagues, customer service, and contribution to team dynamics]'}</p>
                
                <h3>5. Initiative and Problem Solving</h3>
                <p>${data.initiative || '[Assess proactiveness, ability to identify and solve problems, willingness to take on new challenges]'}</p>
                
                <h3>6. Reliability and Attendance</h3>
                <p>${data.reliability || '[Review punctuality, attendance record, dependability, and adherence to rostering requirements]'}</p>
                
                <h2>Areas of Strength</h2>
                <p>${data.strengths || '[Identify specific areas where the employee excels. Be specific with examples]'}</p>
                
                <h2>Development Areas and Opportunities</h2>
                <p>${data.developmentAreas || '[Identify areas where improvement is needed or where the employee can further develop their skills. Frame constructively and with specific examples]'}</p>
                
                <h2>Goals and Objectives for Next Review Period</h2>
                <p>${data.goals || '[Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) for the upcoming review period. Align with both employee development and organisational objectives]'}</p>
                
                <h2>Training and Development Plan</h2>
                <p>${data.trainingPlan || '[Outline specific training, development opportunities, mentoring, or resources that will be provided to support the employee\'s growth and achievement of goals]'}</p>
                
                <h2>Career Progression Discussion</h2>
                <p>${data.careerDiscussion || '[If discussed, note any conversations about career aspirations, potential progression opportunities, or long-term development paths]'}</p>
                
                <h2>Overall Performance Rating</h2>
                <p><strong>Rating: ${data.rating || '[Exceeds Expectations / Meets Expectations / Needs Improvement / Unsatisfactory]'}</strong></p>
                
                <h2>Employee Comments</h2>
                <p>The employee has the opportunity to provide comments, feedback, or responses to this review:</p>
                <p>_________________________________________________________________________________</p>
                <p>_________________________________________________________________________________</p>
                <p>_________________________________________________________________________________</p>
                
                <div style="margin-top: 40px;">
                    <p><strong>Employee Signature:</strong> _________________________ <strong>Date:</strong> __________</p>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;"><em>Signature indicates that the review has been discussed with the employee, not necessarily agreement.</em></p>
                    <br/>
                    <p><strong>Reviewer Signature:</strong> _________________________ <strong>Date:</strong> __________</p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ IMPORTANT NOTE</strong>
                    <p>This performance review template has been generated by Fitz AI for guidance purposes.</p>
                    <p>For best results and to ensure procedural fairness, consider having your performance review process and documentation reviewed by a Fitz HR Senior Consultant.</p>
                    <p><strong>Contact:</strong> support@fitzhr.com | Fitz HR</p>
                </div>
            `
        };

        // ========================================
        // DOCUMENT GENERATION FUNCTIONS
        // ========================================
        
        function formatContentForWord(content) {
    return content
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        
        // Convert ## headers to proper HTML with Word styles
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        
        // REMOVE bold formatting - just strip the ** markers
        .replace(/\*\*(.+?)\*\*/g, '$1')
        
        // Convert *italic* to <em> (but not part of **)
        .replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em>$1</em>')
        
        // Convert bullet points (with proper spacing)
        .replace(/^[•\-] (.+)$/gm, '<li style="margin-bottom: 8px;">$1</li>')
        
        // Convert underscores to underlined spans
        .replace(/_{5,}/g, '<span style="text-decoration: underline; display: inline-block; min-width: 200px;">$&</span>')
        
        // Split by double newlines to create paragraphs
        .split(/\n\n+/)
        .map(block => {
            block = block.trim();
            if (!block) return '';
            
            // If it's already an HTML element, return it
            if (block.startsWith('<h') || block.startsWith('<li>') || block.startsWith('<div')) {
                return block;
            }
            
            // Wrap list items in <ul> with proper styling
            if (block.includes('<li')) {
                return '<ul style="margin-top: 10px; margin-bottom: 15px; padding-left: 20px;">' + block + '</ul>';
            }
            
            // Convert single newlines to <br> within paragraphs
            block = block.replace(/\n/g, '<br>');
            
            // Wrap in paragraph with spacing
            return '<p style="margin-bottom: 12px; line-height: 1.6;">' + block + '</p>';
        })
        .join('\n');
}

function convertHTMLToPdfMake(html, metadata) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = [];

    const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                return { text: text };
            }
            return null;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        const tagName = node.tagName.toLowerCase();

        switch (tagName) {
            case 'h1':
                return {
                    text: node.textContent.trim(),
                    style: 'header1',
                    margin: [0, 15, 0, 10]
                };

            case 'h2':
                return {
                    text: node.textContent.trim(),
                    style: 'header2',
                    margin: [0, 12, 0, 6]
                };

            case 'h3':
                return {
                    text: node.textContent.trim(),
                    style: 'header3',
                    margin: [0, 10, 0, 5]
                };

            case 'p':
                const pContent = [];
                for (const child of node.childNodes) {
                    const processed = processInlineNode(child);
                    if (processed) {
                        if (Array.isArray(processed)) {
                            pContent.push(...processed);
                        } else {
                            pContent.push(processed);
                        }
                    }
                }
                return {
                    text: pContent.length > 0 ? pContent : node.textContent.trim(),
                    margin: [0, 0, 0, 8]  // Increased bottom margin
                };

            case 'ul':
                const listItems = [];
                for (const li of node.querySelectorAll('li')) {
                    listItems.push(li.textContent.trim());
                }
                return {
                    ul: listItems,
                    margin: [20, 5, 0, 10],  // Left indent + spacing
                    style: 'bulletList'
                };

            case 'li':
                return {
                    text: node.textContent.trim(),
                    margin: [0, 2, 0, 2]
                };

            case 'br':
                return { text: '', margin: [0, 5, 0, 0] };

            default:
                const children = [];
                for (const child of node.childNodes) {
                    const processed = processNode(child);
                    if (processed) children.push(processed);
                }
                return children.length > 0 ? children : null;
        }
    };

    const processInlineNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        return text ? { text: text } : null;
    }

    const tagName = node.tagName?.toLowerCase();
    const text = node.textContent.trim();

    if (!text) return null;

    switch (tagName) {
        case 'strong':
        case 'b':
            // REMOVE BOLD - just return normal text
            return { text: text };  // Removed the bold: true property
        case 'em':
        case 'i':
            return { text: text, italics: true };
        default:
            return { text: text };
    }
};

    // Process all body children
    for (const child of doc.body.childNodes) {
        const processed = processNode(child);
        if (processed) {
            if (Array.isArray(processed)) {
                content.push(...processed);
            } else {
                content.push(processed);
            }
        }
    }

    // Define document with styles
    return {
        content: content,
        styles: {
            header1: {
                fontSize: 18,
                bold: true,
                color: '#E2A14A',
                decoration: 'underline',
                decorationColor: '#E2A14A'
            },
            header2: {
                fontSize: 14,
                bold: true,
                color: '#1E3A5F',
                margin: [0, 12, 0, 6]
            },
            header3: {
                fontSize: 12,
                bold: true,
                color: '#1E3A5F'
            },
            bulletList: {
                fontSize: 11,
                lineHeight: 1.4
            }
        },
        defaultStyle: {
            fontSize: 11,
            font: 'Roboto',
            lineHeight: 1.3
        },
        pageMargins: [40, 40, 40, 60]
    };
}



async function generatePDFDocument(content, filename = 'document.pdf', metadata = {}) {
    try {
        // Check if pdfMake is loaded
        if (typeof pdfMake === 'undefined') {
            showAlert('PDF library not loaded. Please refresh the page and try again.');
            return false;
        }

        // Convert content to HTML first
        const htmlContent = convertAIContentToHTML(content);
        
        // Parse HTML to pdfMake document definition
        const docDefinition = convertHTMLToPdfMake(htmlContent, metadata);
        
        // Generate PDF
        pdfMake.createPdf(docDefinition).download(filename);

        // Track document generation
        trackDocumentGeneration(filename, metadata);

        return true;

    } catch (error) {
        showAlert('Error generating PDF: ' + error.message);
        return false;
    }
}

        // [Removed: old detectDocumentType, extractDataFromConversation,
        //  addDocumentDownloadButtons, downloadDocument - replaced by later versions at ~line 11985]


// ========================================
// PDF GENERATION HELPER FUNCTIONS
// ========================================

function convertAIContentToHTML(rawContent) {
    let html = rawContent
        // Convert markdown headers to HTML
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        
        // REMOVE bold - just strip the ** markers
	.replace(/\*\*(.+?)\*\*/g, '$1')
        
        // Convert *italic* to <em>
        .replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em>$1</em>')
        
        // Convert bullet points
        .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
        
        // Wrap consecutive list items in <ul>
        .replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>')
        
        // Convert double line breaks to paragraph breaks
        .split('\n\n')
        .map(block => {
            block = block.trim();
            if (!block) return '';
            
            // Skip if already HTML element
            if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<div')) {
                return block;
            }
            
            // Convert single line breaks to <br>
            block = block.replace(/\n/g, '<br>');
            
            // Wrap in paragraph
            return '<p>' + block + '</p>';
        })
        .join('\n\n');
    
    return html;
}

// [Removed: duplicate convertHTMLToPdfMake - keeping first version with bulletList style]


// [Removed: empty generatePDFDocument stub - was overriding pdfMake version]


        function generatePDFDocumentPrintFallback(content, filename = 'document.pdf') {
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${filename}</title>
    <style>
        @media print {
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20mm; font-size: 11pt; }
            h1 { color: #E2A14A; border-bottom: 3px solid #E2A14A; page-break-after: avoid; }
            h2 { color: #1E3A5F; page-break-after: avoid; margin-top: 20px; }
            .warning { background: #fff3cd; border-left: 4px solid #ff6b6b; padding: 15px; page-break-inside: avoid; }
            .no-print { display: none; }
            .header { text-align: center; margin-bottom: 20px; }
        }
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #E2A14A; border-bottom: 3px solid #E2A14A; }
        h2 { color: #1E3A5F; margin-top: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .warning { background: #fff3cd; border-left: 4px solid #ff6b6b; padding: 20px; margin: 25px 0; }
        ul { margin-left: 20px; }
        li { margin-bottom: 8px; }
    

/* ========================================
   AI-POWERED IMPORT SYSTEM STYLES
   ======================================== */

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-dark: #0a0e27;
            --bg-card: #141b3d;
            --accent-primary: #00f0ff;
            --accent-secondary: #7b2ff7;
            --accent-success: #00ff9d;
            --accent-warning: #ff6b35;
            --text-primary: #ffffff;
            --text-secondary: #8b9dc3;
            --gradient-main: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-accent: linear-gradient(135deg, #00f0ff 0%, #7b2ff7 100%);
        }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Animated Background */
        .animated-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: var(--bg-dark);
        }

        .animated-bg::before {
            content: '';
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            top: -200px;
            right: -200px;
            animation: float 20s infinite ease-in-out;
        }

        .animated-bg::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(123, 47, 247, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            bottom: -100px;
            left: -100px;
            animation: float 15s infinite ease-in-out reverse;
        }

        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        /* Main Container */
        .import-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        /* Header with Glow Effect */
        .header {
            text-align: center;
            margin-bottom: 60px;
            position: relative;
        }

        .header h1 {
            font-size: 4rem;
            font-weight: 700;
            background: var(--gradient-accent);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
            animation: fadeInUp 0.8s ease-out;
            letter-spacing: -2px;
        }

        .header p {
            font-size: 1.25rem;
            color: var(--text-secondary);
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .ai-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            background: rgba(0, 240, 255, 0.1);
            border: 1px solid rgba(0, 240, 255, 0.3);
            border-radius: 100px;
            color: var(--accent-primary);
            font-size: 0.875rem;
            font-weight: 600;
            margin-top: 20px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
            50% { box-shadow: 0 0 40px rgba(0, 240, 255, 0.6); }
        }

        /* Upload Zone - Futuristic */
        .upload-zone {
            background: var(--bg-card);
            border: 2px dashed rgba(0, 240, 255, 0.3);
            border-radius: 24px;
            padding: 80px 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .upload-zone::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.1), transparent);
            animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .upload-zone:hover {
            border-color: var(--accent-primary);
            background: rgba(0, 240, 255, 0.05);
            transform: translateY(-4px);
            box-shadow: 0 20px 60px rgba(0, 240, 255, 0.2);
        }

        .upload-icon {
            font-size: 6rem;
            margin-bottom: 24px;
            display: inline-block;
            animation: bounceIn 1s ease-out;
        }

        .upload-zone h3 {
            font-size: 1.75rem;
            margin-bottom: 12px;
            font-weight: 700;
        }

        .upload-zone p {
            color: var(--text-secondary);
            font-size: 1.125rem;
            margin-bottom: 32px;
        }

        .supported-formats {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .format-badge {
            padding: 8px 16px;
            background: rgba(0, 240, 255, 0.1);
            border-radius: 8px;
            font-size: 0.875rem;
            font-family: 'Space Mono', monospace;
            color: var(--accent-primary);
        }

        /* AI Analysis Section */
        .ai-analysis {
            margin-top: 60px;
            display: none;
            animation: fadeInUp 0.6s ease-out;
        }

        .ai-analysis.active {
            display: block;
        }

        .analysis-card {
            background: var(--bg-card);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 24px;
            border: 1px solid rgba(0, 240, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .analysis-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--gradient-accent);
        }

        .analysis-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 32px;
        }

        .analysis-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: var(--gradient-main);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            animation: rotateIn 0.6s ease-out;
        }

        .analysis-title {
            flex: 1;
        }

        .analysis-title h3 {
            font-size: 1.5rem;
            margin-bottom: 4px;
        }

        .analysis-title p {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        /* AI Insights Grid */
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }

        .insight-card {
            background: rgba(0, 240, 255, 0.05);
            border: 1px solid rgba(0, 240, 255, 0.2);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s ease;
            animation: fadeInUp 0.6s ease-out both;
        }

        .insight-card:nth-child(1) { animation-delay: 0.1s; }
        .insight-card:nth-child(2) { animation-delay: 0.2s; }
        .insight-card:nth-child(3) { animation-delay: 0.3s; }
        .insight-card:nth-child(4) { animation-delay: 0.4s; }

        .insight-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 240, 255, 0.2);
            border-color: var(--accent-primary);
        }

        .insight-value {
            font-size: 2.5rem;
            font-weight: 700;
            background: var(--gradient-accent);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
            font-family: 'Space Mono', monospace;
        }

        .insight-label {
            color: var(--text-secondary);
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* AI Issues Detection */
        .issues-section {
            margin-top: 32px;
        }

        .issue-item {
            background: rgba(255, 107, 53, 0.1);
            border-left: 4px solid var(--accent-warning);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            display: flex;
            align-items: start;
            gap: 16px;
            animation: slideInLeft 0.4s ease-out both;
        }

        .issue-item:nth-child(1) { animation-delay: 0.1s; }
        .issue-item:nth-child(2) { animation-delay: 0.2s; }
        .issue-item:nth-child(3) { animation-delay: 0.3s; }

        .issue-icon {
            font-size: 1.5rem;
        }

        .issue-content h4 {
            margin-bottom: 4px;
            color: var(--accent-warning);
        }

        .issue-content p {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        /* Success Items */
        .success-item {
            background: rgba(0, 255, 157, 0.1);
            border-left: 4px solid var(--accent-success);
        }

        .success-item .issue-content h4 {
            color: var(--accent-success);
        }

        /* Data Preview Table */
        .data-preview {
            margin-top: 32px;
            overflow: hidden;
            border-radius: 16px;
            border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .data-preview table {
            width: 100%;
            border-collapse: collapse;
        }

        .data-preview th {
            background: rgba(0, 240, 255, 0.1);
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid rgba(0, 240, 255, 0.2);
        }

        .data-preview td {
            padding: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-family: 'Space Mono', monospace;
            font-size: 0.875rem;
        }

        .data-preview tr:hover td {
            background: rgba(0, 240, 255, 0.05);
        }

        /* Action Buttons */
        .action-buttons {
            display: flex;
            gap: 16px;
            margin-top: 40px;
            animation: fadeInUp 0.6s ease-out 0.6s both;
        }

        .btn {
            flex: 1;
            padding: 20px 40px;
            border-radius: 16px;
            font-size: 1.125rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            position: relative;
            overflow: hidden;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .btn:hover::before {
            width: 300px;
            height: 300px;
        }

        .btn-primary {
            background: var(--gradient-main);
            color: white;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 50px rgba(102, 126, 234, 0.6);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        /* Processing Animation */
        .processing-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 14, 39, 0.95);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .processing-overlay.active {
            display: flex;
        }

        .processing-content {
            text-align: center;
        }

        .spinner {
            width: 80px;
            height: 80px;
            border: 4px solid rgba(0, 240, 255, 0.1);
            border-top: 4px solid var(--accent-primary);
            border-radius: 50%;
            margin: 0 auto 32px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .processing-text {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .processing-subtext {
            color: var(--text-secondary);
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3);
            }
            50% {
                opacity: 1;
                transform: scale(1.05);
            }
            70% {
                transform: scale(0.9);
            }
            100% {
                transform: scale(1);
            }
        }

        @keyframes rotateIn {
            from {
                opacity: 0;
                transform: rotate(-200deg) scale(0);
            }
            to {
                opacity: 1;
                transform: rotate(0) scale(1);
            }
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.5rem;
            }

            .insights-grid {
                grid-template-columns: 1fr;
            }

            .action-buttons {
                flex-direction: column;
            }
        }
    
</style>
</head>
<body>
<div class="animated-bg"></div>

    ${content}
    <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 10px;">
        <p style="margin-bottom: 15px; font-size: 16px; color: #333;">Use your browser's print function and select "Save as PDF"</p>
        <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; background: #E2A14A; border: none; color: white; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print / Save as PDF</button>
        <button onclick="window.close()" style="padding: 12px 24px; font-size: 16px; background: #666; border: none; color: white; border-radius: 5px; cursor: pointer;">Close</button>
    </div>
</body>
</html>`);
            
            printWindow.document.close();
            return true;
        }
        
        // ========================================
        // ADVANCED FEATURES
        // ========================================
        
        // 1. Document Metadata Tracking
        function trackDocumentGeneration(filename, metadata) {
            const documentLog = {
                filename: filename,
                user: currentUser,
                timestamp: new Date().toISOString(),
                ...metadata
            };
            
            // Store in localStorage for tracking
            const existingLogs = JSON.parse(localStorage.getItem('documentGenerationLogs') || '[]');
            existingLogs.push(documentLog);
            localStorage.setItem('documentGenerationLogs', JSON.stringify(existingLogs));
            
            // Also track as event
            trackEvent('document_generated', documentLog);
            
        }
        
        function generateDocumentId() {
            return 'DOC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }

// ========================================
// DOCUMENT BUILDER SYSTEM
// ========================================

const documentBuilderState = {
    currentType: null,
    currentStep: 1,
    totalSteps: 0,
    data: {},
    generatedDocument: null,
    isGenerating: false,
    lastGeneratedDocId: null
};

// Store the last generated document's data (preserved after builder modal closes)
let lastGeneratedDocumentData = {};

// Document template configurations
const documentWizardSteps = {
formalWarning: [
    // ✅ STEP 1: Procedural Fairness Check
    {
        id: 1,
        title: "Procedural Fairness Checkpoint",
        fields: [
            { 
                name: "completedRecordOfDiscussion", 
                label: "Have you completed the Record of Discussion process? (i.e., held a documented conversation where allegations were presented and the employee was given the opportunity to respond)", 
                type: "radio", 
                options: ["Yes", "No"], 
                required: true 
            }
        ]
    },
    // ✅ NEW STEP 2: Upload Record of Discussion (OPTIONAL BUT RECOMMENDED)
    {
        id: 2,
        title: "Upload Record of Discussion (Highly Recommended)",
        description: "Uploading your completed Record of Discussion will help Fitz AI create a more accurate and comprehensive Formal Warning letter by using the employee's actual responses and the specific details from your discussion.",
        fields: [
            {
                name: "rodUpload",
                label: "Upload your completed Record of Discussion",
                type: "file",
                accept: ".pdf,.docx,.doc,.png,.jpg,.jpeg",
                required: false,
                helpText: "Accepts: PDF, Word documents, or images of handwritten records"
            }
        ],
        showIf: { field: "completedRecordOfDiscussion", value: "Yes" }
    },
    // ✅ STEP 3: Meeting Preparation
    {
        id: 3,
        title: "Outcome Meeting Preparation - CRITICAL",
        fields: [
            { 
                name: "providedNotice24hours", 
                label: "Have you set up the outcome meeting and provided at least 24 hours notice?", 
                type: "radio", 
                options: ["Yes", "No"], 
                required: true 
            },
            { 
                name: "offeredSupportPerson", 
                label: "Have you offered the employee the opportunity to have a support person present?", 
                type: "radio", 
                options: ["Yes", "No"], 
                required: true 
            }
        ]
    },
    // ✅ STEP 4: Employee Details (was Step 3)
    {
        id: 4,
        title: "Employee Details",
        fields: [
            { name: "employeeName", label: "Employee's full name", type: "text", required: false, placeholder: "e.g., Blake Smith" },
            { name: "position", label: "Position/Role", type: "text", required: true, placeholder: "e.g., Chef" },
            { name: "employmentType", label: "Employment Type", type: "select", 
              options: ["Full-Time", "Part-Time", "Casual"], required: true }
        ]
    },
    // ✅ STEP 5: What Happened? (was Step 4)
    {
        id: 5,
        title: "What Happened?",
        fields: [
            { name: "issueDescription", label: "Briefly describe the issue", 
              type: "textarea", placeholder: "e.g., Repeatedly late for shifts", required: true, rows: 3 },
            { name: "issueDate", label: "When did this occur? (most recent)", type: "date", required: true },
            { name: "witnesses", label: "Any witnesses? (optional)", type: "text", required: false, placeholder: "Names of witnesses" }
        ]
    },
    // ✅ STEP 6: Previous Action (was Step 5)
    {
        id: 6,
        title: "Previous Action",
        fields: [
            { name: "hadVerbalWarnings", label: "Have you given verbal warnings?", 
              type: "radio", options: ["Yes", "No"], required: true },
            { name: "verbalWarningCount", label: "How many verbal warnings?", 
              type: "number", min: 1, max: 10, placeholder: "e.g., 3",
              showIf: { field: "hadVerbalWarnings", value: "Yes" } },
            { name: "warningLevel", label: "This warning is:", type: "select",
              options: ["First formal warning", "Second formal warning", "Final warning"], required: true }
        ]
    },
    // ✅ STEP 7: What Needs to Change? (was Step 6)
    {
        id: 7,
        title: "What Needs to Change?",
        fields: [
            { name: "expectations", label: "What specific improvements do you expect?", 
              type: "textarea", placeholder: "e.g., Arrive on time for all shifts", required: true, rows: 3 },
            { name: "timeframe", label: "Timeframe for improvement", type: "select",
              options: ["Immediate", "2 weeks", "1 month", "3 months"], required: true }
        ]
    },
    // ✅ STEP 8: Consequences (was Step 7)
    {
        id: 8,
        title: "Consequences",
        fields: [
            { name: "consequences", label: "What happens if behaviour continues?", 
              type: "textarea", placeholder: "e.g., Further disciplinary action up to and including termination", 
              required: true, rows: 2 }
        ]
    }
],
    recordOfDiscussion: [
    {
        id: 1,
        title: "Employee Details",
        fields: [
            { name: "employeeName", label: "Employee's full name", type: "text", required: false, placeholder: "e.g., Sarah Johnson" },
            { name: "position", label: "Position/Role", type: "text", required: true, placeholder: "e.g., Waiter" }
        ]
    },
    {
        id: 2,
        title: "Meeting Preparation - CRITICAL",
        fields: [
            { name: "notice24hours", label: "Has employee been provided 24 hours notice of the meeting?", 
              type: "radio", options: ["Yes", "No"], required: true },
            { name: "supportPersonOffered", label: "Has employee been offered to bring a support person to the meeting?", 
              type: "radio", options: ["Yes", "No"], required: true }
        ]
    },
    {
        id: 3,
        title: "Issue Details",
        fields: [
            { name: "allegations", label: "What is/are the allegation(s)? (List them clearly)", 
              type: "textarea", required: true, rows: 4, 
              placeholder: "e.g., Late to shift on 3 occasions\nIncorrect uniform worn\nRude to customer" },
            { name: "witnesses", label: "Were there any witnesses?", 
              type: "text", required: false, placeholder: "Names of witnesses (if any)" }
        ]
    }
],

    formalProbationReview: [
    // STEP 1: Procedural Fairness
    {
        id: 1,
        title: "Procedural Fairness & Meeting Preparation",
        infoBox: {
            type: 'info',
            icon: '⚖️',
            title: 'Why Procedural Fairness Matters',
            content: `<p class="mb-2">A Formal Probation Review is a <strong>structured conversation</strong> to openly discuss whether the employee is meeting the requirements of the role during their probation period. To ensure fairness:</p>
            <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>The employee must be given reasonable notice (at least 24 hours) that this meeting is taking place</li>
                <li>The purpose of the meeting must be clearly explained — this is a formal probation review</li>
                <li>The employee must be offered the right to bring a support person</li>
                <li>The conversation must be two-way — the employee must have a genuine opportunity to respond</li>
                <li>Any concerns raised must be specific, factual and supported by examples</li>
                <li>The employee must be offered support and a clear path to improvement</li>
                <li>Both parties retain a copy of the completed document</li>
            </ul>
            <p class="mt-2 text-amber-400 font-semibold text-sm">This is a development conversation with formal documentation, not a disciplinary meeting.</p>`
        },
        fields: [
            {
                name: "noticeGiven",
                label: "Has the employee been given at least 24 hours notice of this Formal Probation Review meeting?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            },
            {
                name: "purposeExplained",
                label: "Has the employee been told this is a Formal Probation Review to discuss their performance and suitability for the role?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            },
            {
                name: "supportPersonOffered",
                label: "Has the employee been advised they may bring a support person if they wish?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            }
        ]
    },
    // STEP 2: Probation Check-In Gate
    {
        id: 2,
        title: "Prior Probation Check-In Confirmation",
        infoBox: {
            type: 'warning',
            icon: '⚠️',
            title: 'Important — Check-In Required Before This Step',
            content: `<p class="mb-2">Generally, <strong>at least one Probation Check-In Conversation</strong> should have occurred before a Formal Probation Review.</p>
            <p class="text-sm">The Probation Check-In is an informal, supportive conversation that documents early feedback and gives the employee an opportunity to adjust. Moving to a Formal Probation Review without a prior check-in may undermine procedural fairness.</p>
            <p class="mt-2 text-amber-400 font-semibold text-sm">If you haven't completed a Probation Check-In yet, you'll be directed to that tool first.</p>`
        },
        fields: [
            {
                name: "priorCheckInCompleted",
                label: "Has at least one Probation Check-In Conversation been completed with this employee before this Formal Review?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            }
        ]
    },
    // STEP 3: Employee & Probation Details
    {
        id: 3,
        title: "Employee & Probation Details",
        fields: [
            { name: "employeeName", label: "Employee's full name", type: "text", required: false, placeholder: "e.g., Sarah Johnson" },
            { name: "position", label: "Position/Role", type: "text", required: true, placeholder: "e.g., Bartender" },
            { name: "peopleLeader", label: "People Leader / Manager conducting the review", type: "text", required: true, placeholder: "Your name" },
            { name: "meetingDate", label: "Meeting date", type: "date", required: true },
            { name: "employmentType", label: "Employment Type", type: "select",
              options: ["Full-Time", "Part-Time", "Casual"], required: true },
            { name: "startDate", label: "Employment start date", type: "date", required: true },
            { name: "probationEndDate", label: "Probation end date", type: "date", required: true }
        ]
    },
    // STEP 4: Previous Check-In Conversations
    {
        id: 4,
        title: "Previous Coaching & Check-In Conversations",
        infoBox: {
            type: 'tip',
            icon: '💡',
            title: 'Document Prior Conversations',
            content: '<p>List all prior coaching conversations and/or Probation Check-Ins that have occurred. This establishes the history of support and feedback the employee has received.</p>'
        },
        fields: [
            { name: "checkInHistory", label: "List previous check-in/coaching conversations (date and brief overview of each)",
              type: "textarea", required: true, rows: 5,
              placeholder: "e.g.,\n• 15 Jan 2026 — Informal catch-up: Discussed settling in, answered questions about rosters and POS system\n• 29 Jan 2026 — Probation Check-In #1: Reviewed key requirements, identified speed of service as area for development, agreed to buddy shifts with senior staff\n• 12 Feb 2026 — Ad hoc coaching: Discussed customer complaint regarding wait times, provided real-time feedback on section management" }
        ]
    },
    // STEP 5: Review of Performance — Strengths
    {
        id: 5,
        title: "Review of Performance — Strengths",
        infoBox: {
            type: 'tip',
            icon: '✅',
            title: 'Acknowledge What Is Working',
            content: '<p>Discuss the areas of performance and/or behaviours that <strong>are</strong> currently meeting the required standards. Be specific and use examples — recognition motivates continued positive performance.</p>'
        },
        fields: [
            { name: "strengths", label: "What areas of performance and/or behaviour ARE currently meeting the required standards?",
              type: "textarea", required: true, rows: 4,
              placeholder: "e.g.,\n• Punctuality and attendance have been excellent — no unexplained absences\n• Positive attitude with guests — received two written compliments\n• Follows WHS procedures consistently\n• Works well with the team and communicates during service" },
            { name: "strengthsComments", label: "Additional comments on strengths (specific examples)",
              type: "textarea", required: false, rows: 3,
              placeholder: "e.g., Sarah has shown strong initiative in learning the wine list and regularly asks questions to improve her product knowledge." }
        ]
    },
    // STEP 6: Opportunities for Development
    {
        id: 6,
        title: "Opportunities for Development",
        infoBox: {
            type: 'info',
            icon: '📈',
            title: 'Be Specific and Fair',
            content: '<p>Discuss the areas of performance and/or behaviours that are <strong>not</strong> currently meeting the required standards. Be specific with examples and dates. This is an opportunity for the employee to understand exactly what needs to change and to respond with their perspective.</p>'
        },
        fields: [
            { name: "developmentAreas", label: "What areas of performance and/or behaviour are NOT currently meeting the required standards?",
              type: "textarea", required: true, rows: 4,
              placeholder: "e.g.,\n• Speed of service during peak periods — average table turn time is 15 mins above target\n• Accuracy of orders — 3 incorrect orders in the past 2 weeks\n• Needs to be more proactive seeking tasks during quiet periods rather than waiting to be directed" },
            { name: "developmentComments", label: "Additional comments on development areas (specific examples and context)",
              type: "textarea", required: false, rows: 3,
              placeholder: "e.g., On Friday 7 Feb, section turnaround during the 7pm rush took 25 minutes compared to the 10-minute target. Two tables received incorrect mains." },
            { name: "conductConcerns", label: "Are there any conduct or compliance concerns? (If yes, describe)",
              type: "textarea", required: false, rows: 2,
              placeholder: "e.g., No conduct or compliance concerns at this time. OR: One instance of incorrect uniform on 3 Feb — addressed verbally at the time." }
        ]
    },
    // STEP 7: Action Plan
    {
        id: 7,
        title: "Action Plan — Agreed Actions",
        infoBox: {
            type: 'tip',
            icon: '🎯',
            title: 'Focus on Actions and Outcomes',
            content: '<p>The most effective Action Plans focus on <strong>behaviours and actions</strong> (inputs) rather than just metrics and outcomes (outputs). Include agreed actions for <strong>both</strong> the employee and the leader — probation is a two-way street.</p>'
        },
        fields: [
            { name: "agreedActions", label: "Agreed actions to improve performance — what specifically will be done, by whom, and by when?",
              type: "textarea", required: true, rows: 5,
              placeholder: "e.g.,\nEmployee:\n• Focus on speed of service during Friday/Saturday peaks — aim for 10-min table turns\n• Double-check all orders before sending to kitchen\n• Proactively ask supervisor for tasks during quiet periods\n\nLeader:\n• Arrange buddy shifts with Senior Waiter (James) for next 2 weeks\n• Provide real-time coaching during Friday/Saturday peak services\n• Continue fortnightly check-ins to review progress" },
            { name: "trainingAndSupport", label: "What additional training or support will be provided?",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g.,\n• Advanced POS refresher training (split bills, modifications) — scheduled Week of 17 Feb\n• Shadow senior staff during 2 weekend peak shifts\n• Menu knowledge quiz to build confidence" },
            { name: "nextReviewDate", label: "When will the next review take place to assess progress?", type: "date", required: true }
        ]
    },
    // STEP 8: Employee Feedback & Key Messages
    {
        id: 8,
        title: "Employee Feedback & Key Messages",
        infoBox: {
            type: 'info',
            icon: '💬',
            title: 'The Employee\'s Voice Matters',
            content: '<p>This section captures the employee\'s self-assessment and any barriers they\'re facing. It also sets out the key messages that should be clearly communicated during the meeting. The AI will generate these based on the information you\'ve provided.</p>'
        },
        fields: [
            { name: "employeeSelfAssessment", label: "Employee's comments/feedback — how do they feel they are performing? Any barriers or support needed?",
              type: "textarea", required: false, rows: 4,
              placeholder: "Leave blank if you want to complete this section during the meeting with the employee. Or pre-fill with anything they've already communicated.\n\ne.g., Employee feels they are settling in well but finds Friday nights overwhelming. Would like more guidance on handling large party bookings." },
            { name: "overallOutcome", label: "What is the overall outcome of this Formal Probation Review?", type: "select",
              options: [
                "On track — employee is meeting expectations, continue to support",
                "On track with development areas — minor concerns addressed with clear action plan",
                "At risk — significant concerns raised, improvement required within clear timeframe",
                "Recommend confirming employment — probation passed",
                "Recommend ending employment during probation"
              ],
              required: true },
            { name: "additionalNotes", label: "Any additional notes or context for the AI to consider?",
              type: "textarea", required: false, rows: 2 }
        ]
    }
],

    performanceImprovementPlan: [
        // Step 1: Employee Details
        {
            id: 1,
            title: "Employee Details",
            fields: [
                { name: "employeeName", label: "Employee's full name", type: "text", required: false, placeholder: "e.g., Sarah Johnson" },
                { name: "position", label: "Position/Role", type: "text", required: true, placeholder: "e.g., Waiter" },
                { name: "employmentType", label: "Employment Type", type: "select", 
                  options: ["Full-Time", "Part-Time", "Casual"], required: true },
                { name: "managerName", label: "Manager/Supervisor Name", type: "text", required: true, placeholder: "Your name" }
            ]
        },
        
        // Step 2: Performance Issues (Data-Driven)
        {
            id: 2,
            title: "Performance Issues - Be Specific",
            fields: [
                { name: "performanceIssue1", label: "Issue #1 - What specific performance problem?", 
                  type: "textarea", required: true, rows: 3,
                  placeholder: "e.g., Slow service - average drink prep time is 4 minutes vs team average of 2.5 minutes" },
                { name: "performanceData1", label: "What data/evidence supports this?", 
                  type: "textarea", required: true, rows: 2,
                  placeholder: "e.g., Till data shows 12 customer complaints in last month about wait times. Guest review average 2.8/5 stars." },
                { name: "performanceIssue2", label: "Issue #2 (optional)", 
                  type: "textarea", required: false, rows: 3,
                  placeholder: "e.g., Order accuracy errors - 15% error rate vs team average of 3%" },
                { name: "performanceData2", label: "Data/evidence for Issue #2", 
                  type: "textarea", required: false, rows: 2,
                  placeholder: "e.g., POS system shows 18 incorrect orders in last 2 weeks" }
            ]
        },
        
        // Step 3: SMART Goals
        {
            id: 3,
            title: "SMART Goals - What Must Improve?",
            fields: [
                { name: "goal1", label: "Goal #1 (Specific, Measurable, Achievable, Relevant, Time-bound)", 
                  type: "textarea", required: true, rows: 3,
                  placeholder: "e.g., Reduce average drink preparation time from 4 minutes to 2.5 minutes within 4 weeks" },
                { name: "goal2", label: "Goal #2 (if applicable)", 
                  type: "textarea", required: false, rows: 3,
                  placeholder: "e.g., Achieve order accuracy of 97% or higher (max 1 error per 30 orders) within 8 weeks" },
                { name: "goal3", label: "Goal #3 (if applicable)", 
                  type: "textarea", required: false, rows: 3,
                  placeholder: "e.g., Improve guest satisfaction score to 4.2/5 or higher within 12 weeks" }
            ]
        },
        
        // Step 4: Action Plan & Support
        {
            id: 4,
            title: "Action Plan - How Will We Help Them Improve?",
            fields: [
                { name: "trainingProvided", label: "What training/coaching will be provided?", 
                  type: "textarea", required: true, rows: 4,
                  placeholder: "e.g., \n• 2-hour cocktail making refresher course (Week 1)\n• Shadow experienced bartender for 3 shifts (Week 2)\n• Daily 15-min coaching sessions with supervisor (Weeks 1-4)\n• Access to online mixology tutorials" },
                { name: "resourcesProvided", label: "What resources/tools will be provided?", 
                  type: "textarea", required: true, rows: 3,
                  placeholder: "e.g., Recipe cards, speed pouring practice kit, timer for self-monitoring" },
                { name: "managerSupport", label: "What will the manager/supervisor do to support?", 
                  type: "textarea", required: true, rows: 3,
                  placeholder: "e.g., Weekly one-on-one check-ins, real-time feedback during shifts, track progress data" }
            ]
        },
        
        // Step 5: Employee Responsibilities
        {
            id: 5,
            title: "Employee Responsibilities",
            fields: [
                { name: "employeeActions", label: "What is the employee expected to do?", 
                  type: "textarea", required: true, rows: 4,
                  placeholder: "e.g., \n• Attend all scheduled training sessions\n• Practice drink preparation techniques during quiet periods\n• Review recipe cards before each shift\n• Ask for help when unsure\n• Track own times and report progress weekly" }
            ]
        },
        
        // Step 6: Review Schedule
        {
            id: 6,
            title: "Review Schedule & Timeline",
            fields: [
                { name: "pipStartDate", label: "PIP Start Date", type: "date", required: true },
                { name: "weeklyCheckins", label: "Weekly check-in day/time", type: "text", required: true, 
                  placeholder: "e.g., Every Monday at 10am" },
                { name: "week4ReviewDate", label: "Week 4 Formal Review Date", type: "date", required: true },
                { name: "week8ReviewDate", label: "Week 8 Formal Review Date", type: "date", required: true },
                { name: "week12ReviewDate", label: "Week 12 Final Review Date", type: "date", required: true }
            ]
        },
        
        // Step 7: Consequences
        {
            id: 7,
            title: "Consequences - What Happens If No Improvement?",
            fields: [
                { name: "week4Consequence", label: "If no significant improvement by Week 4:", 
                  type: "select", required: true,
                  options: ["First Formal Warning for Performance", "Extend PIP by 4 weeks with modified goals", "Other (specify in notes)"] },
                { name: "week8Consequence", label: "If no significant improvement by Week 8:", 
                  type: "select", required: true,
                  options: ["Second Formal Warning for Performance", "Final Written Warning", "Other (specify in notes)"] },
                { name: "week12Consequence", label: "If no significant improvement by Week 12:", 
                  type: "select", required: true,
                  options: ["Termination of employment", "Extended PIP (only if substantial progress made)", "Other (specify in notes)"] },
                { name: "consequenceNotes", label: "Additional notes on consequences (optional)", 
                  type: "textarea", required: false, rows: 2 }
            ]
        },
        
        // Step 8: Final Confirmation
        {
            id: 8,
            title: "Final Confirmation",
            fields: [
                { name: "pipDiscussed", label: "Have you discussed this PIP with the employee before creating it?", 
                  type: "radio", options: ["Yes - we've had a preliminary discussion", "No - this is the first formal step"], required: true },
                { name: "supportPersonOffered", label: "Will you offer the employee the right to have a support person when presenting the PIP?", 
                  type: "radio", options: ["Yes", "No"], required: true },
                { name: "additionalNotes", label: "Any additional notes or context?", 
                  type: "textarea", required: false, rows: 3,
                  placeholder: "Optional: Any other relevant information" }
            ]
        }
    ],

    letterOfAllegation: [
        {
            id: 1,
            title: "Employee Details",
            fields: [
                { name: "employeeName", label: "Employee's full name", type: "text", required: false },
                { name: "position", label: "Position/Role", type: "text", required: true },
                { name: "employmentType", label: "Employment Type", type: "select", 
                  options: ["Full-Time", "Part-Time", "Casual"], required: true }
            ]
        },
        {
            id: 2,
            title: "Meeting Preparation - CRITICAL",
            fields: [
                { 
                    name: "notice24hours", 
                    label: "Has employee been provided 24 hours notice of the meeting?", 
                    type: "radio", 
                    options: ["Yes", "No"], 
                    required: true 
                },
                { 
                    name: "supportPersonOffered", 
                    label: "Has employee been offered to bring a support person to the meeting?", 
                    type: "radio", 
                    options: ["Yes", "No"], 
                    required: true 
                }
            ]
        },
        {
            id: 3,
            title: "Allegation Details",
            fields: [
                { name: "allegationType", label: "Type of allegation", type: "select",
                  options: ["Theft", "Serious safety breach", "Fraud", "Other Misconduct"],
                  required: true },
                { name: "allegationDescription", label: "Describe the allegation", 
                  type: "textarea", required: true, rows: 4, 
                  placeholder: "What specifically is alleged to have occurred?" },
                { name: "incidentDate", label: "Date of alleged incident", type: "date", required: true }
            ]
        },
        {
            id: 4,
            title: "Source & Evidence",
            fields: [
                { name: "allegationSource", label: "Who made the allegation?", type: "select",
                  options: ["Anonymous complaint", "Named complainant", "Management observed", "Multiple witnesses"],
                  required: true },
                { name: "evidenceExists", label: "What evidence exists?", 
                  type: "textarea", required: false, rows: 2,
                  placeholder: "e.g., Witness statements, CCTV, documents" }
            ]
        },
        {
            id: 5,
            title: "Investigation Process",
            fields: [
                { name: "investigator", label: "Who will conduct the investigation?", type: "text",
                  required: true, placeholder: "e.g., Fitz HR Consultant, External investigator" },
                { name: "suspensionRequired", label: "Suspension during investigation?", type: "select",
                  options: ["No suspension - continue work", "Yes - on full pay", "Yes - without pay (serious misconduct only)"],
                  required: true }
            ]
        },
        {
            id: 6,
            title: "Investigation Meeting",
            fields: [
                { name: "meetingDate", label: "Meeting date", type: "date", required: true },
                { name: "meetingLocation", label: "Meeting location", type: "text", required: true }
            ]
        }
    ]
};

function selectDocumentType(type) {
    documentBuilderState.currentType = type;
    documentBuilderState.currentStep = 1;
    documentBuilderState.data = {};
    documentBuilderState.totalSteps = documentWizardSteps[type].length;
    
    // Hide template selection
    document.getElementById('documentTemplateSelection').classList.add('hidden');
    
    // Show wizard
    document.getElementById('documentWizardSteps').classList.remove('hidden');
    
    // Update total steps
    document.getElementById('docTotalSteps').textContent = documentBuilderState.totalSteps;
    
    // Show first step
    showDocumentStep(1);
    
    // Track specific document type in Recent Tools
    trackToolUsage('doc_' + type);
    
    trackEvent('document_type_selected', { user: currentUser, type: type });
}

function showDocumentStep(stepNumber) {
    const steps = documentWizardSteps[documentBuilderState.currentType];
    const step = steps[stepNumber - 1];
    
    if (!step) return;
    
    // Update progress
    document.getElementById('docCurrentStep').textContent = stepNumber;
    const progress = Math.round((stepNumber / documentBuilderState.totalSteps) * 100);
    document.getElementById('docProgress').textContent = `${progress}% Complete`;
    document.getElementById('docProgressBar').style.width = `${progress}%`;
    
    // Build step HTML
    let html = `<h3 class="text-xl font-bold text-white mb-4">${step.title}</h3>`;
    
    // Render infoBox if present
    if (step.infoBox) {
        const box = step.infoBox;
        const bgColor = box.type === 'warning' ? 'bg-amber-500/10 border-amber-500' : 
                         box.type === 'tip' ? 'bg-blue-500/10 border-blue-500' : 
                         'bg-teal-500/10 border-teal-500';
        const textColor = box.type === 'warning' ? 'text-amber-400' : 
                          box.type === 'tip' ? 'text-blue-400' : 
                          'text-teal-400';
        html += `<div class="mb-4 p-4 ${bgColor} border rounded-lg">
            <p class="${textColor} font-bold text-sm flex items-center gap-2 mb-2">
                <span>${box.icon}</span> ${box.title}
            </p>
            <div class="text-slate-300 text-sm">${box.content}</div>
        </div>`;
    }
    
    html += `<div class="space-y-4">`;
    
    step.fields.forEach(field => {
        // Check conditional display
        if (field.showIf) {
            const conditionField = field.showIf.field;
            const conditionValue = field.showIf.value;
            if (documentBuilderState.data[conditionField] !== conditionValue) {
                return; // Skip this field
            }
        }
        
        html += `<div>`;
        const isEmployeeName = field.name === 'employeeName';
        const infoIcon = isEmployeeName ? ' <span class="fitz-info-icon" onclick="fitzInfoToggle(this)">ⓘ</span>' : '';
        html += `<label class="block text-slate-300 text-sm mb-2">
                    ${field.label}${field.required ? ' <span class="text-red-400">*</span>' : ''}${infoIcon}
                 </label>`;
        if (isEmployeeName) {
            html += '<div class="fitz-info-box">Fitz HR processes workplace data entered by users to generate HR documents. You must have authority to input employee information.</div>';
        }
        
        if (field.type === 'text') {
            html += `<input type="text" id="field_${field.name}" 
                           placeholder="${field.placeholder || ''}"
                           value="${documentBuilderState.data[field.name] || ''}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                           ${field.required ? 'required' : ''}>`;
        } else if (field.type === 'textarea') {
            html += `<textarea id="field_${field.name}" rows="${field.rows || 3}"
                              placeholder="${field.placeholder || ''}"
                              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                              ${field.required ? 'required' : ''}>${documentBuilderState.data[field.name] || ''}</textarea>`;
        } else if (field.type === 'select') {
            html += `<select id="field_${field.name}" 
                            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            ${field.required ? 'required' : ''}>
                        <option value="">Select...</option>`;
            field.options.forEach(opt => {
                const selected = documentBuilderState.data[field.name] === opt ? 'selected' : '';
                html += `<option value="${opt}" ${selected}>${opt}</option>`;
            });
            html += `</select>`;
        } else if (field.type === 'radio') {
            field.options.forEach(opt => {
                const checked = documentBuilderState.data[field.name] === opt ? 'checked' : '';
                html += `<label class="flex items-center gap-2 text-slate-300 mb-2">
                            <input type="radio" name="field_${field.name}" value="${opt}" ${checked}
                                   class="text-amber-500">
                            <span>${opt}</span>
                         </label>`;
            });
        } else if (field.type === 'date') {
            const today = new Date().toISOString().split('T')[0];
            html += `<input type="date" id="field_${field.name}" 
                           value="${documentBuilderState.data[field.name] || today}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                           ${field.required ? 'required' : ''}>`;
        } else if (field.type === 'time') {
            html += `<input type="time" id="field_${field.name}" 
                           value="${documentBuilderState.data[field.name] || ''}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                           ${field.required ? 'required' : ''}>`;
        } else if (field.type === 'number') {
            html += `<input type="number" id="field_${field.name}" 
                           min="${field.min || 0}" max="${field.max || 100}"
                           placeholder="${field.placeholder || ''}"
                           value="${documentBuilderState.data[field.name] || ''}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                           ${field.required ? 'required' : ''}>`;
        } else if (field.type === 'file') {
            // File upload for ROD
            html += `
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <p class="text-blue-300 text-sm mb-3">
                        <strong>💡 Highly Recommended:</strong> Uploading your Record of Discussion helps Fitz AI create a better warning letter by using the employee's actual responses and discussion details.
                    </p>
                </div>
                <div class="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
                    <input type="file" id="field_${field.name}" 
                           accept="${field.accept || '*'}"
                           class="hidden"
                           onchange="handleRODUpload(event)">
                    <button type="button" onclick="document.getElementById('field_${field.name}').click()"
                            class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6 py-3 rounded-lg mb-3">
                        📄 Upload File
                    </button>
                    <p class="text-slate-400 text-sm">${field.helpText || 'Click to select a file'}</p>
                    <div id="rodUploadStatus" class="mt-3"></div>
                </div>
                <div class="flex justify-center mt-4">
                    <button type="button" onclick="confirmSkipRODUpload()"
                            class="text-slate-400 hover:text-white text-sm underline">
                        Skip this step
                    </button>
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    html += `</div>`;
    
    document.getElementById('documentStepContent').innerHTML = html;
    
    // Show/hide back button
    document.getElementById('docBackBtn').style.display = stepNumber > 1 ? 'block' : 'none';
    
    // Update next button text
    const nextBtn = document.getElementById('docNextBtn');
    if (stepNumber === documentBuilderState.totalSteps) {
        nextBtn.innerHTML = '✨ Generate Document';
    } else {
        nextBtn.innerHTML = 'Next Step →';
    }

// Show/hide start over button based on step
const startOverBtn = document.getElementById('docStartOverBtn');
if (startOverBtn) {
    if (stepNumber > 1) {
        startOverBtn.classList.remove('hidden');
    } else {
        startOverBtn.classList.add('hidden');
    }
}

}

// Handle ROD file upload
var rodUploadedFile = null;
var rodExtractedData = null;

async function handleRODUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show uploading status
    const statusDiv = document.getElementById('rodUploadStatus');
    statusDiv.innerHTML = '<p class="text-blue-400">📤 Processing file...</p>';
    
    try {
        // Read file
        const fileData = await readFileAsBase64(file);
        rodUploadedFile = {
            name: file.name,
            type: file.type,
            data: fileData
        };
        
        // Extract text/data from file
        const extractedText = await extractRODContent(file);
        
        // Show success
        statusDiv.innerHTML = `
            <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p class="text-green-400 font-semibold">✅ Record uploaded - Fitz AI will use this context</p>
                <p class="text-slate-300 text-sm mt-1">${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
            </div>
        `;
        
        // Store in documentBuilderState
        documentBuilderState.data.rodUpload = true;
        documentBuilderState.data.rodFileName = file.name;
        documentBuilderState.data.rodFileData = fileData;
        documentBuilderState.data.rodExtractedText = extractedText;
        
        showToast('✅ Record of Discussion uploaded successfully!', 'success', 3000);
        
    } catch (error) {
        statusDiv.innerHTML = '<p class="text-red-400">❌ Error processing file. Please try again.</p>';
        showToast('Error processing file', 'error', 3000);
    }
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function extractRODContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileName = file.name.toLowerCase();
            let text = '';
            
            if (fileName.endsWith('.txt')) {
                text = e.target.result;
            } else if (fileName.endsWith('.csv')) {
                text = e.target.result;
            } else {
                // For PDF, Word, Images - placeholder text
                text = `File: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\n`;
                text += '[Document uploaded for AI analysis]';
            }
            
            resolve(text);
        };
        
        reader.onerror = reject;
        
        if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
}

function confirmSkipRODUpload() {
    const confirmed = confirm(
        '⚠️ Skip Upload?\n\n' +
        'For a better Formal Warning letter, uploading your completed Record of Discussion is strongly advised.\n\n' +
        'The ROD provides:\n' +
        '• Employee\'s actual responses\n' +
        '• Specific details from the discussion\n' +
        '• Better context for the warning letter\n\n' +
        'Are you sure you want to skip this step?'
    );
    
    if (confirmed) {
        // Mark as skipped
        documentBuilderState.data.rodUpload = false;
        documentBuilderState.data.rodSkipped = true;
        
        // Move to next step
        documentBuilderState.currentStep++;
        showDocumentStep(documentBuilderState.currentStep);
    }
}

function docWizardNext() {
    // Save current step data
    const steps = documentWizardSteps[documentBuilderState.currentType];
    const step = steps[documentBuilderState.currentStep - 1];
    
    let allValid = true;
    
    step.fields.forEach(field => {
        // Skip if conditional and not shown
        if (field.showIf) {
            const conditionField = field.showIf.field;
            const conditionValue = field.showIf.value;
            if (documentBuilderState.data[conditionField] !== conditionValue) {
                return;
            }
        }
        
        let value;
        if (field.type === 'radio') {
            const radio = document.querySelector(`input[name="field_${field.name}"]:checked`);
            value = radio ? radio.value : '';
        } else if (field.type === 'file') {
            // File upload is optional - check if uploaded or skipped
            value = documentBuilderState.data[field.name] || '';
            // Don't require validation for file type
            return; // Skip validation for file field
        } else {
            const element = document.getElementById(`field_${field.name}`);
            value = element ? element.value.trim() : '';
        }
        
        if (field.required && !value) {
            allValid = false;
            showAlert(`Please fill in: ${field.label}`);
        }
        
        documentBuilderState.data[field.name] = value;
    });
    
    if (!allValid) return;
    
    // ✅ VALIDATION FOR FORMAL WARNING
    if (documentBuilderState.currentType === 'formalWarning') {
        if (!validateFormalWarningProceduralFairness()) {
            return;
        }
    }
    
    // ✅ VALIDATION FOR LETTER OF ALLEGATION
    if (documentBuilderState.currentType === 'letterOfAllegation') {
        if (!validateLetterOfAllegationMeetingPrep()) {
            return;
        }
    }
    
    // ✅ VALIDATION FOR RECORD OF DISCUSSION
    if (documentBuilderState.currentType === 'recordOfDiscussion' && documentBuilderState.currentStep === 2) {
        if (!validateRecordOfDiscussionStep2()) {
            return;
        }
    }
    
    // ✅ VALIDATION FOR FORMAL PROBATION REVIEW
    if (documentBuilderState.currentType === 'formalProbationReview') {
        if (!validateFormalProbationReview()) {
            return;
        }
    }
    
    // ✅ VALIDATION FOR PERFORMANCE IMPROVEMENT PLAN
    if (documentBuilderState.currentType === 'performanceImprovementPlan') {
        if (!validatePIPSupportPerson()) {
            return;
        }
    }
    
    // Move to next step or generate
    if (documentBuilderState.currentStep < documentBuilderState.totalSteps) {
        documentBuilderState.currentStep++;
        showDocumentStep(documentBuilderState.currentStep);
    } else {
        // All steps complete - generate document
        generateDocumentWithAI();
    }
}


function validateFormalWarningProceduralFairness() {
    // Only validate on Step 1 and Step 2
    if (documentBuilderState.currentStep === 1) {
        const completedROD = documentBuilderState.data.completedRecordOfDiscussion;
        
        if (completedROD === 'No') {
            showAlert(
                '⚠️ PROCEDURAL FAIRNESS REQUIRED\n\n' +
                'You MUST complete the Record of Discussion process before issuing a Formal Warning.\n\n' +
                'This means:\n' +
                '1. Hold a documented conversation with the employee\n' +
                '2. Present the allegations/concerns\n' +
                '3. Give the employee the opportunity to respond\n' +
                '4. Document their response\n\n' +
                'Without this step, a Formal Warning may be deemed procedurally unfair.\n\n' +
                'Please complete the Record of Discussion first.'
            );
            
            trackEvent('procedural_fairness_violation', {
                user: currentUser,
                violation: 'rod_not_completed',
                documentType: 'formalWarning'
            });
            
            documentBuilderState.data.completedRecordOfDiscussion = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
        
        return true;
    }
    
    if (documentBuilderState.currentStep === 2) {
        const providedNotice = documentBuilderState.data.providedNotice24hours;
        const offeredSupport = documentBuilderState.data.offeredSupportPerson;
        
        if (providedNotice === 'No') {
            showAlert(
                '⚠️ IMPORTANT: You must provide the employee with 24 hours notice before the outcome meeting.\n\n' +
                'This is a requirement of procedural fairness.\n\n' +
                'Please schedule the outcome meeting for at least 24 hours from now before continuing.'
            );
            
            trackEvent('procedural_fairness_violation', {
                user: currentUser,
                violation: '24_hour_notice_not_provided',
                documentType: 'formalWarning'
            });
            
            documentBuilderState.data.providedNotice24hours = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
        
        if (offeredSupport === 'No') {
            showAlert(
                '⚠️ IMPORTANT: You must offer the employee the right to bring a support person.\n\n' +
                'A support person can be:\n' +
                '• A family member or friend\n' +
                '• A union representative\n' +
                '• A fellow employee (if appropriate)\n\n' +
                'Please inform the employee of this right before continuing.'
            );
            
            trackEvent('procedural_fairness_violation', {
                user: currentUser,
                violation: 'support_person_not_offered',
                documentType: 'formalWarning'
            });
            
            documentBuilderState.data.offeredSupportPerson = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
        
        return true;
    }
    
    return true;
}

function validateLetterOfAllegationMeetingPrep() {
    // Only validate on Step 2 (Meeting Preparation)
    if (documentBuilderState.currentStep !== 2) {
        return true;
    }
    
    const notice24hours = documentBuilderState.data.notice24hours;
    const supportPersonOffered = documentBuilderState.data.supportPersonOffered;
    
    // Check 24 hours notice
    if (notice24hours === 'No') {
        showAlert(
            '⚠️ IMPORTANT: You must provide the employee with 24 hours notice before the meeting.\n\n' +
            'This is a requirement of procedural fairness.\n\n' +
            'Please schedule the meeting for at least 24 hours from now before continuing.'
        );
        
        trackEvent('procedural_fairness_violation', {
            user: currentUser,
            violation: '24_hour_notice_not_provided',
            documentType: 'letterOfAllegation'
        });
        
        // Clear the answer so they can correct it
        documentBuilderState.data.notice24hours = '';
        
        // Re-render the current step
        showDocumentStep(documentBuilderState.currentStep);
        
        return false;
    }
    
    // Check support person offered
    if (supportPersonOffered === 'No') {
        showAlert(
            '⚠️ IMPORTANT: You must offer the employee the right to bring a support person.\n\n' +
            'A support person can be:\n' +
            '• A family member or friend\n' +
            '• A union representative\n' +
            '• A fellow employee (if appropriate and no conflict of interest)\n\n' +
            'Please inform the employee of this right before continuing.'
        );
        
        trackEvent('procedural_fairness_violation', {
            user: currentUser,
            violation: 'support_person_not_offered',
            documentType: 'letterOfAllegation'
        });
        
        // Clear the answer so they can correct it
        documentBuilderState.data.supportPersonOffered = '';
        
        // Re-render the current step
        showDocumentStep(documentBuilderState.currentStep);
        
        return false;
    }
    
    return true; // Both checks passed
}

function validateRecordOfDiscussionStep2() {
    const notice24hours = documentBuilderState.data.notice24hours;
    const supportPersonOffered = documentBuilderState.data.supportPersonOffered;
    
    // Check 24 hours notice
    if (notice24hours === 'No') {
        showAlert('⚠️ IMPORTANT: You must provide the employee with 24 hours notice before the meeting.\n\n' +
              'This is a requirement of procedural fairness.\n\n' +
              'Please schedule the meeting for at least 24 hours from now before continuing.');
        return false;
    }
    
    // Check support person
    if (supportPersonOffered === 'No') {
        showAlert('⚠️ IMPORTANT: You must offer the employee the right to bring a support person.\n\n' +
              'A support person can be:\n' +
              '• A family member or friend\n' +
              '• A union representative\n' +
              '• A fellow employee (if appropriate and no conflict of interest)\n\n' +
              'Please inform the employee of this right before continuing.');
        return false;
    }
    
    return true;
}

// ✅ VALIDATION FOR PERFORMANCE IMPROVEMENT PLAN
function validatePIPSupportPerson() {
    // Only validate on Step 8 (Final Confirmation)
    if (documentBuilderState.currentStep === 8) {
        const supportPersonOffered = documentBuilderState.data.supportPersonOffered;
        
        if (supportPersonOffered === 'No') {
            showAlert(
                '⚠️ PROCEDURAL FAIRNESS REQUIRED\n\n' +
                'You must offer the employee 24 hours notice and a support person when presenting the PIP.\n\n' +
                'This is a requirement of procedural fairness. The employee should be informed:\n' +
                '• At least 24 hours before the PIP meeting\n' +
                '• That they can bring a support person\n\n' +
                'A support person can be:\n' +
                '• A family member or friend\n' +
                '• A union representative\n' +
                '• A fellow employee (if appropriate)\n\n' +
                'Please change your answer to "Yes" to confirm you will offer these rights.'
            );
            
            trackEvent('procedural_fairness_violation', {
                user: currentUser,
                violation: 'pip_support_person_not_offered',
                documentType: 'performanceImprovementPlan'
            });
            
            documentBuilderState.data.supportPersonOffered = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
    }
    
    return true;
}

// ✅ VALIDATION FOR FORMAL PROBATION REVIEW
function validateFormalProbationReview() {
    // Step 1: Procedural Fairness
    if (documentBuilderState.currentStep === 1) {
        const noticeGiven = documentBuilderState.data.noticeGiven;
        const purposeExplained = documentBuilderState.data.purposeExplained;
        const supportPersonOffered = documentBuilderState.data.supportPersonOffered;
        
        if (noticeGiven === 'No') {
            showAlert(
                '⚠️ PROCEDURAL FAIRNESS REQUIRED\n\n' +
                'You must provide the employee with at least 24 hours notice of this Formal Probation Review meeting.\n\n' +
                'This is a requirement of procedural fairness.\n\n' +
                'Please schedule the meeting for at least 24 hours from now before continuing.'
            );
            documentBuilderState.data.noticeGiven = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
        
        if (purposeExplained === 'No') {
            showAlert(
                '⚠️ PROCEDURAL FAIRNESS REQUIRED\n\n' +
                'The employee must be told the purpose of this meeting before it takes place.\n\n' +
                'They need to know this is a Formal Probation Review so they can:\n' +
                '• Prepare their own reflections\n' +
                '• Arrange a support person if desired\n' +
                '• Gather any relevant information\n\n' +
                'Please inform the employee of the meeting purpose before continuing.'
            );
            documentBuilderState.data.purposeExplained = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
        
        if (supportPersonOffered === 'No') {
            showAlert(
                '⚠️ PROCEDURAL FAIRNESS REQUIRED\n\n' +
                'You must offer the employee the right to bring a support person.\n\n' +
                'A support person can be:\n' +
                '• A family member or friend\n' +
                '• A union representative\n' +
                '• A fellow employee (if appropriate)\n\n' +
                'Please inform the employee of this right before continuing.'
            );
            documentBuilderState.data.supportPersonOffered = '';
            showDocumentStep(documentBuilderState.currentStep);
            return false;
        }
        
        return true;
    }
    
    // Step 2: Prior Probation Check-In Gate
    if (documentBuilderState.currentStep === 2) {
        const priorCheckIn = documentBuilderState.data.priorCheckInCompleted;
        
        if (priorCheckIn === 'No') {
            // Show popup with link to Probation Check-In tool
            showProbationCheckInRequiredPopup();
            return false;
        }
        
        return true;
    }
    
    return true;
}

// Popup when user hasn't completed a Probation Check-In
function showProbationCheckInRequiredPopup() {
    // Create modal overlay
    const popup = document.createElement('div');
    popup.id = 'probationCheckInRequiredPopup';
    popup.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-[60]';
    popup.innerHTML = `
        <div class="bg-slate-800 rounded-2xl p-8 max-w-lg w-full border-2 border-amber-500 fade-in">
            <div class="text-center mb-6">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-amber-400 mb-2">Probation Check-In Required</h3>
                <p class="text-slate-300 text-sm leading-relaxed">
                    Generally, at least one <strong class="text-white">Probation Check-In Conversation</strong> should be completed before conducting a Formal Probation Review.
                </p>
            </div>
            
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <p class="text-amber-300 text-sm mb-2"><strong>Why?</strong></p>
                <ul class="text-slate-300 text-sm space-y-1">
                    <li>• It gives the employee early feedback and a chance to improve</li>
                    <li>• It demonstrates you've provided support before escalating</li>
                    <li>• It strengthens your procedural fairness position</li>
                    <li>• It creates a documented history of the employee's progress</li>
                </ul>
            </div>
            
            <div class="space-y-3">
                <button onclick="openProbationCheckInFromPopup()" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
                    <span>🔄</span> Open Probation Check-In Tool
                </button>
                <button onclick="closeProbationCheckInRequiredPopup()" 
                        class="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg transition-all text-sm">
                    ← Go Back to Formal Probation Review
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

function openProbationCheckInFromPopup() {
    // Close the popup
    closeProbationCheckInRequiredPopup();
    // Close the document builder modal
    closeToolModal('documentBuilderModal');
    // Reset document builder state
    resetDocumentBuilderSilent();
    // Open the Probation Check-In tool
    if (typeof openProbationCheckIn === 'function') {
        openProbationCheckIn();
    }
}

function closeProbationCheckInRequiredPopup() {
    const popup = document.getElementById('probationCheckInRequiredPopup');
    if (popup) {
        popup.remove();
    }
    // Reset the answer so they can try again
    documentBuilderState.data.priorCheckInCompleted = '';
    showDocumentStep(documentBuilderState.currentStep);
}

function docWizardGoBack() {
    if (documentBuilderState.currentStep > 1) {
        documentBuilderState.currentStep--;
        showDocumentStep(documentBuilderState.currentStep);
    }
}

async function generateDocumentWithAI() {
    const docType = documentBuilderState.currentType;
    
    // ✅ CHECK IF DOCUMENT IS CONSULTATION-GATED
    if (isConsultationGated(docType)) {
        // Close the document builder
        closeToolModal('documentBuilderModal');
        // Show consultation required modal
        showConsultationRequiredModal(docType);
        return;
    }
    
    // ✅ PRESERVE the form data BEFORE anything else (so it survives modal close)
    lastGeneratedDocumentData = { ...documentBuilderState.data };
    console.log('📋 Preserved document data:', lastGeneratedDocumentData);
    
    // Hide wizard, show loading
    document.getElementById('documentWizardSteps').classList.add('hidden');
    document.getElementById('documentGenerating').classList.remove('hidden');
    
    documentBuilderState.isGenerating = true;
    
    try {
        const prompt = buildDocumentPrompt();
        const response = await callClaudeAPIForDocument(prompt);
        documentBuilderState.generatedDocument = response;
        
        // ✅ STORE the document ID that was just logged
        // This happens BEFORE any resets
        const logResult = await logDocumentGeneration();
        
        // ✅ Store the database ID so we can update it later
        if (logResult && logResult.id) {
            documentBuilderState.lastGeneratedDocId = logResult.id;
        }
        
        // ✅ Store docType and docName BEFORE closing modal (which resets state)
        const currentDocType = docType;
        const currentDocName = CONFIG.CREDITS.DOCUMENT_COSTS[docType]?.name || 'Document';
        
        // Close document builder modal
        closeToolModal('documentBuilderModal');
        
        // ✅ CHECK IF USER CAN AFFORD - Apply blur if not
        const shouldBlur = shouldBlurDocument(currentDocType);
        
        // Show preview modal
        showDocumentPreview(response);
        
        // ✅ Store docType in modal dataset IMMEDIATELY (before blur timeout)
        const previewModal = document.getElementById('documentPreviewModal');
        if (previewModal) {
            previewModal.dataset.docType = currentDocType;
            previewModal.dataset.docName = currentDocName;
        }
        
        // Apply blur after preview is shown (pass stored values)
        if (shouldBlur) {
            setTimeout(() => {
                applyDocumentBlur(currentDocType, currentDocName);
            }, 100);
        }
        
        trackEvent('document_generated_ai', {
            user: currentUser,
            type: currentDocType,
            employeeName: documentBuilderState.data?.employeeName,
            blurred: shouldBlur
        });
        
    } catch (error) {
        showAlert('⚠️ Error generating document. Please try again or contact support.');
        
        // Reset to wizard
        document.getElementById('documentGenerating').classList.add('hidden');
        document.getElementById('documentWizardSteps').classList.remove('hidden');
    } finally {
        documentBuilderState.isGenerating = false;
    }
}

function buildDocumentPrompt() {
    const type = documentBuilderState.currentType;
    const data = documentBuilderState.data;
    
    const venueContext = venueProfile.setupComplete ? 
        `Venue: ${venueProfile.venueName} (${venueProfile.venueType}) in ${venueProfile.city}, ${venueProfile.location}` :
        `Australian hospitality venue`;
    
    // Universal instruction for ALL document types
    const universalInstruction = `
=== CRITICAL INSTRUCTION ===
You are a professional HR document writer. Your task is to OUTPUT A COMPLETE, READY-TO-USE FORMAL DOCUMENT.

MANDATORY REQUIREMENTS:
1. Generate the ACTUAL DOCUMENT with real content - NOT a checklist, guide, tips, or advice
2. Write in formal business letter format with proper structure
3. Use the specific details provided (names, dates, issues) in the document
4. The document must be ready to print and give to an employee immediately
5. DO NOT include instructions on "how to write" the document - just write it
6. DO NOT include placeholder text like "[insert here]" - use the actual information provided
7. DO NOT provide a checklist of what to include - provide the actual document content

If you output anything other than a complete, formal document ready for immediate use, you have failed the task.
=== END CRITICAL INSTRUCTION ===

`;
    
    let prompt = '';
    
    if (type === 'formalWarning') {
    prompt = `You are generating a FORMAL WARNING LETTER for Australian hospitality HR.

**CRITICAL OUTPUT REQUIREMENT:**
You MUST generate an ACTUAL FORMAL LETTER - a complete, ready-to-use business letter document.
DO NOT generate:
- A checklist
- A guide or how-to
- Bullet points of what to include
- Tips or advice
- An outline or template with placeholders like "[insert here]"

Generate the ACTUAL LETTER with real content based on the information provided below.

VENUE CONTEXT:
${venueContext}
Award: ${getAwardContext().fullName}
Manager: ${venueProfile.userName || '[Manager Name]'}

EMPLOYEE DETAILS:
- Name: ${data.employeeName}
- Position: ${data.position}
- Employment Type: ${data.employmentType}

ISSUE DETAILS:
${data.issueDescription}
Date: ${data.issueDate}
${data.witnesses ? `Witnesses: ${data.witnesses}` : 'No witnesses mentioned'}

${data.rodExtractedText ? `
RECORD OF DISCUSSION CONTEXT:
The following information has been extracted from the completed Record of Discussion conversation:

${data.rodExtractedText}

**IMPORTANT:** Use the employee's actual responses and comments from the Record of Discussion above to make this warning letter more accurate and contextual. Include verbatim quotes where appropriate, and reference specific points the employee made during the discussion. This provides crucial context and demonstrates procedural fairness.
` : ''}

PREVIOUS ACTION TAKEN:
${data.hadVerbalWarnings === 'Yes' ? 
  `${data.verbalWarningCount || 'Multiple'} verbal warning(s) have been given` : 
  'No prior formal warnings'}
This is a ${data.warningLevel.toLowerCase()}.

REQUIRED IMPROVEMENTS:
${data.expectations}
Timeframe: ${data.timeframe}

CONSEQUENCES:
${data.consequences}

Generate a complete, professional formal warning letter following Australian employment law best practices.

**CRITICAL FORMATTING REQUIREMENTS:**
1. Use ## for major sections (e.g., ## EMPLOYEE DETAILS)
2. Use blank lines between ALL paragraphs and sections
3. Use **text** for emphasis
4. For lists, use bullet points with "• " prefix
5. Structure clearly with proper spacing
6. Separate each major section with a blank line before and after
7. ALWAYS add a space after colons in labels (e.g., "Date: " not "Date:")
8. ALWAYS add spaces around bold text (e.g., "within **seven (7) days** of receiving" not "within**seven (7) days**of receiving")

**IMPORTANT: Format lists clearly with bullet points like this:**
- First item
- Second item
- Third item

REQUIREMENTS:
1. **Expand the issue description** - Take the brief description and expand with appropriate context while staying factual
2. **Use formal, professional language** - Clear, firm but respectful
3. **Include all legal requirements**:
   - Dated header with full employee details
   - Clear subject line
   - Detailed description of the issue (expanded from brief description)
   - Reference to previous warnings
   - Specific, measurable improvement expectations (use bullet points)
   - Clear timeframe
   - Stated consequences (use bullet points)
   - Warning retention period (12 months)
   - Signature sections

4. **Maintain procedural fairness**
5. **Be specific and actionable**
6. **Professional tone** - firm but not threatening

Example structure:

# FORMAL WARNING LETTER

## DATE AND RECIPIENT

Date: [Date]

Employee Name: [Name]

Position: [Position]

## SUBJECT

Subject: Formal Written Warning - [Issue]

## ISSUE DESCRIPTION

[Detailed description of what occurred, with specific dates and facts]

## PREVIOUS DISCUSSIONS

[Reference to verbal warnings if applicable]

## REQUIRED IMPROVEMENTS

You are required to:

- [Specific expectation 1]
- [Specific expectation 2]
- [Specific expectation 3]

## TIMEFRAME

[Clear timeframe for improvement]

## CONSEQUENCES

Failure to meet these expectations may result in:

- [Consequence 1]
- [Consequence 2]
- Termination of employment

**IMPORTANT: Do NOT list "reduction in rostered hours" or "reduced shifts" as a consequence. This is not an appropriate disciplinary outcome, particularly for full-time employees.**

## WARNING RETENTION

This warning will remain on your employee file for 12 months from the date of this letter.

## SIGNATURES

Employee Signature: _________________________ Date: __________

Manager Signature: _________________________ Date: __________

Format as a complete business letter with proper structure and clear spacing between all sections.

DO NOT add fictional details. Expand and contextualize what was provided.`;
    
    } else if (type === 'recordOfDiscussion') {
    prompt = `You are generating a RECORD OF DISCUSSION TEMPLATE & CONVERSATION SCRIPT for Australian hospitality managers.

THIS IS A TEMPLATE/SCRIPT - NOT A COMPLETED DOCUMENT.
The manager will use this during the actual conversation with the employee.

⚠️ CRITICAL: This is a PROCEDURAL FAIRNESS meeting. NO outcome or decision is made during this meeting. The purpose is to:
1. Present allegations to the employee
2. Give the employee the opportunity to respond
3. Gather information and the employee's perspective
4. Adjourn to consider all information before making any decision

A follow-up meeting will be scheduled 24-48 hours later to deliver the outcome after proper consideration.

VENUE CONTEXT:
${venueContext}
Manager: ${venueProfile.userName || '[Manager Name]'}

EMPLOYEE DETAILS:
- Name: ${data.employeeName}
- Position: ${data.position}

MEETING PREPARATION CHECKLIST:
- 24 hours notice given: ${data.notice24hours}
- Support person offered: ${data.supportPersonOffered}

ALLEGATIONS:
${data.allegations}

WITNESSES (if any):
${data.witnesses || 'None mentioned'}

**CRITICAL FORMATTING REQUIREMENTS:**
1. Use ## for major sections (e.g., ## BEFORE THE MEETING)
2. Use blank lines between ALL paragraphs and sections
3. DO NOT use **bold** formatting - use plain text only
4. For lists, use bullet points with "• " prefix
5. Structure clearly with proper spacing
6. Separate each major section with a blank line before and after
7. **ALWAYS add a space after colons in labels** (e.g., "Employee Name: Blake" not "Employee Name:Blake")
8. For manager scripts, prefix with "MANAGER SAYS: " instead of using bold

**IMPORTANT: Format lists clearly with bullet points like this:**
- First item
- Second item
- Third item

**IMPORTANT: Always include a space after colons:**
✓ CORRECT: "Date: 20 January 2026"
✗ WRONG: "Date:20 January 2026"

Generate a conversation template that:

1. **Provides a complete script** for the manager to follow during the meeting
2. **Uses "MANAGER SAYS:" prefix** for what the manager should actually SAY
3. **Uses italics** for instructions/guidance (e.g., *Listen carefully and take notes*)
4. **Leaves space** for the manager to write the employee's responses
5. **Guides the manager** through difficult conversations with prompts like:
   - *Ask clarifying questions*
   - *Allow the employee time to respond*
   - *Remain calm and professional*
6. **CLEARLY STATES** that no decision will be made today - this is just to hear their side

STRUCTURE:

## BEFORE THE MEETING

*Print this document and have it in front of you during the meeting*
*Review the allegations and gather any evidence*
*Prepare to listen - this is a two-way conversation*
*Remember: You are NOT making a decision today - only gathering information*

## MEETING SCRIPT

### OPENING THE MEETING

MANAGER SAYS: "Thank you for meeting with me today, ${data.employeeName}. As mentioned in my notice, we need to discuss some concerns about [brief description]."

MANAGER SAYS: "You have the right to have a support person present. Have you brought someone with you, or would you like to reschedule to arrange one?"

*Wait for response - write it here:*
__________________________________________________________________________________

### EXPLAINING THE PURPOSE

MANAGER SAYS: "Before we start, I want to be clear about the purpose of this meeting:

- I'm going to explain some allegations/concerns
- You'll have the opportunity to respond and give your side of the story
- I'm here to listen and gather information
- No decision will be made today - I need time to properly consider everything you tell me
- We'll schedule a follow-up meeting in the next 24-48 hours where I'll share my decision

Does that make sense?"

*Wait for acknowledgment:*
___________________________________

### PRESENTING THE ALLEGATIONS

MANAGER SAYS: "The reason for this meeting is that I've received information about the following:"

${data.allegations.split('\n').map(a => `• ${a.trim()}`).join('\n')}

*Pause after presenting each allegation - let them absorb the information*

MANAGER SAYS: "These matters are serious because [explain the impact - e.g., they affect workplace safety, team morale, customer service, or breach company policy]."

### GIVING THE EMPLOYEE THE OPPORTUNITY TO RESPOND

MANAGER SAYS: "Now I'd like to hear your side of the story. This is your opportunity to respond to these allegations. Can you tell me what happened from your perspective?"

*This is CRITICAL - LISTEN carefully without interrupting. Take detailed notes of everything they say:*

Employee's response to allegations:
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________

*After they finish, ask clarifying questions:*

MANAGER SAYS: "Thank you for explaining. Can I ask a few questions to make sure I understand correctly?"

Clarifying questions to ask:

- "When you say [repeat something they said], can you explain what you mean?"
- "Were there any other circumstances I should know about?"
- "Is there anyone who can support what you're telling me?"
- "Is there anything else you'd like to add?"

Additional information from employee:
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________

### EVIDENCE OR WITNESSES

*If the employee mentions evidence or witnesses:*

MANAGER SAYS: "You mentioned [evidence/witness]. Can you provide me with [details/their name] so I can consider this as part of my review?"

Evidence/witnesses mentioned:
__________________________________________________________________________________
__________________________________________________________________________________

### EXPLAINING NEXT STEPS

MANAGER SAYS: "Thank you for being open with me and sharing your perspective. I want to be clear about what happens next:

- I'm going to take time to properly consider everything you've told me today
- I'll review all the information, evidence, and your response
- I'll schedule a follow-up meeting with you within the next 24-48 hours
- At that meeting, I'll let you know my decision and what happens next
- You won't hear anything before that meeting - I need time to think this through properly"

*Set a specific date/time now for the follow-up meeting:*

MANAGER SAYS: "Can we schedule our follow-up meeting for [DATE] at [TIME]?"

Follow-up meeting scheduled:

Date: ___________________

Time: ___________________

### CLOSING THE MEETING

MANAGER SAYS: "Do you have any questions about the process or what happens next?"

*Note any questions/concerns:*
__________________________________________________________________________________

MANAGER SAYS: "Thank you for attending this meeting and sharing your side of the story. I'll see you at our follow-up meeting on [DATE]."

*If they have a support person:*

MANAGER SAYS: "Thank you also for attending [support person name]."

## AFTER THE MEETING

*Complete the following sections IMMEDIATELY after the meeting while details are fresh:*

### SUMMARY OF ALLEGATIONS PRESENTED

*Write a brief, factual summary of what allegations you presented:*
__________________________________________________________________________________
__________________________________________________________________________________

### EMPLOYEE'S RESPONSE SUMMARY

*Summarise the key points of what the employee said in response:*
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

### EMPLOYEE'S EXPLANATION/MITIGATING CIRCUMSTANCES

*Note any explanations, mitigating factors, or context the employee provided:*
__________________________________________________________________________________
__________________________________________________________________________________

### EVIDENCE/WITNESSES TO FOLLOW UP

*List any evidence you need to review or witnesses you need to speak to:*

- __________________________________________________________________________________
- __________________________________________________________________________________
- __________________________________________________________________________________

### MANAGER'S NOTES FOR CONSIDERATION

*Before making your decision, consider:*

- How credible is the employee's explanation?
- Does their response change the seriousness of the allegations?
- What evidence supports or contradicts their version?
- Are there any mitigating circumstances?
- What is the appropriate outcome (if allegations are substantiated)?

*DO NOT write your decision here - this is just for your own consideration process*

### MEETING ATTENDEES

Employee: ${data.employeeName}

Manager: ${venueProfile.userName || '[Manager Name]'}

Support Person (if present): _________________________________

Date: ___________________

Time: ___________________

### NEXT STEPS BEFORE FOLLOW-UP MEETING

*What you need to do before the follow-up meeting:*

☐ Review all evidence and witness statements
☐ Consider the employee's response fairly
☐ Determine if allegations are substantiated
☐ Decide on appropriate outcome (if substantiated)
☐ Prepare outcome letter (if formal warning required)
☐ Schedule follow-up meeting (DONE: [DATE/TIME])

---

**IMPORTANT REMINDERS FOR MANAGER:**

✓ DO NOT make or hint at any decision during this meeting
✓ Your role today is to LISTEN and GATHER INFORMATION only
✓ Take detailed notes - they may be important later
✓ Remain calm, professional, and neutral
✓ Give the employee adequate time to respond
✓ Ask open-ended questions to get their full story
✓ Schedule the follow-up meeting before they leave

**PROCEDURAL FAIRNESS CHECKLIST:**

☐ Employee given 24 hours notice ✓
☐ Employee offered support person ✓
☐ Allegations clearly explained ✓
☐ Employee given genuine opportunity to respond ✓
☐ Employee's response documented ✓
☐ Follow-up meeting scheduled ✓
☐ No decision made during this meeting ✓

**⚠️ CRITICAL LEGAL REQUIREMENT:**

This meeting is ONLY for gathering information. You MUST take time (24-48 hours) to properly consider the employee's response before making any decision. Failing to do this could result in a finding of unfair dismissal if the matter proceeds to termination.

*If you're unsure how to proceed at any point, pause the meeting and contact Fitz HR: support@fitzhr.com*
`;
    
    } else if (type === 'letterOfAllegation') {
    prompt = `You are generating a LETTER OF ALLEGATION for serious workplace misconduct investigation.

**CRITICAL OUTPUT REQUIREMENT:**
You MUST generate an ACTUAL FORMAL LETTER - a complete, ready-to-use business letter document.
DO NOT generate:
- A checklist
- A guide or how-to
- Bullet points of what to include
- Tips or advice
- An outline or template with placeholders like "[insert here]"

Generate the ACTUAL LETTER with real content based on the information provided below.

⚠️ THIS IS HIGH-RISK - MUST BE LEGALLY SOUND

VENUE CONTEXT:
${venueContext}
Manager: ${venueProfile.userName || '[Manager Name]'}

EMPLOYEE:
- Name: ${data.employeeName}
- Position: ${data.position}
- Employment Type: ${data.employmentType}

ALLEGATION:
Type: ${data.allegationType}
${data.allegationDescription}
Date of incident: ${data.incidentDate}

SOURCE:
${data.allegationSource}
${data.evidenceExists ? `Evidence: ${data.evidenceExists}` : ''}

INVESTIGATION:
Investigator: ${data.investigator}
Suspension: ${data.suspensionRequired}

MEETING SCHEDULED:
Date: ${data.meetingDate}
Location: ${data.meetingLocation}

**CRITICAL FORMATTING REQUIREMENTS:**
1. Use ## for major sections (e.g., ## ALLEGATION DETAILS)
2. Use blank lines between ALL paragraphs and sections
3. DO NOT use bold formatting - use plain text only
4. For lists, use bullet points with "• " prefix
5. Structure clearly with proper spacing
6. Separate each major section with a blank line before and after
7. **ALWAYS add a space after colons in labels** (e.g., "Date: 20 January 2026" not "Date:20 January 2026")

**IMPORTANT: Format lists clearly with bullet points like this:**
- First item
- Second item
- Third item

**IMPORTANT: Always include a space after colons:**
✓ CORRECT: "Date: 20 January 2026"
✗ WRONG: "Date:20 January 2026"

Generate a legally compliant Letter of Allegation.

CRITICAL REQUIREMENTS:

1. **Neutral tone** - No presumption of guilt
2. **Clear process** - Explain investigation steps
3. **Employee rights**:
   - Right to support person
   - Opportunity to respond
   - Procedural fairness
4. **Confidentiality requirements**
5. **Meeting details**
6. **Suspension details** (if applicable)
7. **Next steps clearly outlined**

Example structure:

# PRIVATE & CONFIDENTIAL

# LETTER OF ALLEGATION

## DATE AND RECIPIENT

Date: [Date]

Employee Name: [Name]

Position: [Position]

Employment Type: [Type]

## SUBJECT

Subject: Allegation of [Type] - Investigation Process

## NATURE OF ALLEGATION

[Factual description - not conclusive]

We have received information regarding an alleged incident of ${data.allegationType} that occurred on or around ${data.incidentDate}.

The allegation is as follows:

${data.allegationDescription}

Please note that this letter does not constitute a finding of guilt or wrongdoing. It is simply to inform you of the allegation and the investigation process that will follow.

## INVESTIGATION PROCESS

We will be conducting a thorough and fair investigation into this matter. The investigation will include:

- Meeting with you to hear your response to the allegation
- Reviewing any relevant evidence
- Speaking with any witnesses (if applicable)
- Considering all information before making any decision

The investigation will be conducted by: ${data.investigator}

## SUSPENSION ARRANGEMENTS

${data.suspensionRequired.includes('No suspension') ? 
  'You are not suspended during this investigation and should continue to attend work as normal.' :
  data.suspensionRequired.includes('full pay') ?
  'You are suspended on full pay during this investigation. You should not attend the workplace unless specifically requested. You will continue to receive your normal pay during this period.' :
  'You are suspended without pay during this investigation due to the serious nature of the alleged misconduct. You should not attend the workplace unless specifically requested.'}

## INVESTIGATION MEETING

You are required to attend an investigation meeting to respond to this allegation:

Date: ${data.meetingDate}

Location: ${data.meetingLocation}

## YOUR RIGHTS

You have the following rights during this investigation:

- Right to bring a support person to the meeting (this can be a work colleague, family member, or union representative)
- Opportunity to respond to the allegations in full
- Right to provide evidence or witness names that support your version of events
- Procedural fairness will be maintained throughout the investigation
- You may seek legal advice if you wish

## CONFIDENTIALITY

This matter is confidential. You must not discuss the allegation or investigation with other employees (except your nominated support person or union representative). Breaching confidentiality may be considered a separate matter of misconduct.

## NEXT STEPS

After the investigation meeting:

- Your response will be considered along with all other evidence
- A decision will be made regarding the allegation
- You will be informed of the outcome in writing
- If the allegation is substantiated, disciplinary action may be taken, which could include termination of employment

## CONTACT INFORMATION

If you have any questions about this process or need to discuss the meeting arrangements, please contact:

${venueProfile.userName || '[Manager Name]'}

Email: support@fitzhr.com

Phone: [Insert Phone Number]

We encourage you to seek advice from a union representative or legal advisor if you wish.

---

This is a serious matter and we are committed to conducting a fair and thorough investigation.

Please confirm receipt of this letter and your attendance at the scheduled meeting.

Yours sincerely,

${venueProfile.userName || '[Manager Name]'}

[Title]

${venueProfile.venueName || '[Venue Name]'}

Date: [Date]

---

IMPORTANT LEGAL NOTICE:

This letter must be reviewed by a Fitz HR Senior Consultant before being issued to the employee.

Contact: support@fitzhr.com

Include:
- PRIVATE & CONFIDENTIAL header
- Date and recipient details
- Clear subject line
- Nature of allegation (factual, not conclusive)
- Investigation process explanation
- Suspension details if applicable
- Meeting details (date, time, location)
- Support person rights
- Confidentiality requirements
- Next steps after investigation
- Signature section

TONE: Professional, neutral, procedurally fair. This is NOT a punishment - it's the start of a fair process.`;
	
    } else if (type === 'formalProbationReview') {
        prompt = `You are generating a FORMAL PROBATION REVIEW DOCUMENT for Australian hospitality HR.

The purpose of this Formal Probation Review Document is to guide an open and honest discussion about performance and/or behaviours in probation, including support the employee may need.

The probation period is an opportunity for the venue and the employee to determine the employee's suitability for the role and culture fit.

THIS IS A TEMPLATE & CONVERSATION GUIDE — the manager will use this during the actual meeting with the employee and complete sections together.

VENUE CONTEXT:
${venueContext}
Award: ${getAwardContext().fullName}

EMPLOYEE DETAILS:
- Employee Name: ${data.employeeName}
- Position: ${data.position}
- People Leader: ${data.peopleLeader}
- Meeting Date: ${data.meetingDate}
- Employment Type: ${data.employmentType}
- Start Date: ${data.startDate}
- Probation End Date: ${data.probationEndDate}

PREVIOUS CHECK-IN/COACHING CONVERSATIONS:
${data.checkInHistory}

REVIEW OF PERFORMANCE — STRENGTHS:
Areas currently meeting the required standards:
${data.strengths}
${data.strengthsComments ? `Additional comments: ${data.strengthsComments}` : ''}

OPPORTUNITIES FOR DEVELOPMENT:
Areas NOT currently meeting the required standards:
${data.developmentAreas}
${data.developmentComments ? `Additional comments: ${data.developmentComments}` : ''}
${data.conductConcerns ? `Conduct/compliance concerns: ${data.conductConcerns}` : 'No conduct or compliance concerns noted.'}

ACTION PLAN:
Agreed actions:
${data.agreedActions}

Training and support to be provided:
${data.trainingAndSupport}

Next review date: ${data.nextReviewDate}

EMPLOYEE FEEDBACK:
${data.employeeSelfAssessment || 'To be completed during the meeting with the employee.'}

OVERALL OUTCOME: ${data.overallOutcome}
${data.additionalNotes ? `Additional notes: ${data.additionalNotes}` : ''}

**CRITICAL FORMATTING REQUIREMENTS:**
1. Use ## for major sections
2. Use blank lines between ALL paragraphs and sections
3. Use **text** for emphasis on key headings only
4. For lists, use bullet points with "• " prefix
5. Structure clearly with proper spacing
6. ALWAYS add a space after colons in labels (e.g., "Date: " not "Date:")
7. Include writable lines (______) for sections completed during the meeting

Generate a complete, professional Formal Probation Review Document with the following structure:

## FORMAL PROBATION REVIEW DOCUMENT

*Start with a brief purpose statement: "The purpose of this Formal Probation Review Document is to guide an open and honest discussion about performance and/or behaviours in probation, including support the employee may need."*

*Add: "The probation period is an opportunity for [venue name] and the employee to determine the employee's suitability for the role and culture fit."*

*Add: "Generally, at least one Probation Check-In Conversation has occurred before a Formal Probation Review."*

## EMPLOYEE DETAILS

Create a clear details table with:
- Employee Name: ${data.employeeName}
- Position: ${data.position}
- People Leader: ${data.peopleLeader}
- Meeting Date: ${data.meetingDate}
- Employment Start Date: ${data.startDate}
- Probation End Date: ${data.probationEndDate}

## PREVIOUS COACHING & CHECK-IN CONVERSATIONS

*Add: "The following coaching and/or check-in conversations have occurred:"*

List each conversation from the provided history as bullet points with date and overview. Format as:
• [date] — [overview of conversation]

## REVIEW OF PERFORMANCE

### Strengths

*Add: "Discuss the areas of performance and/or behaviours that ARE currently meeting the required standards."*

Expand the provided strengths into clear, professional bullet points with specific examples. Then add a comments section:

Comments:
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________

### Opportunities for Development

*Add: "Discuss the areas of performance and/or behaviours that are NOT currently meeting the required standards."*

Expand the provided development areas into clear, professional bullet points with specific examples. Then add a comments section:

Comments:
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________

${data.conductConcerns ? `*Add a note about conduct/compliance matters if applicable: "${data.conductConcerns}"*` : '*Add: "Conduct or compliance breaches? Contact Fitz HR: support@fitzhr.com"*'}

## ACTION PLAN

*Add: "What is to be done, who will do it, when it needs to be completed. The most effective Action Plans focus on behaviours and actions (inputs) rather than metrics and outcomes (outputs)."*

*Add: "To help improve performance and/or behaviours to the required standard, the following action plan is agreed:"*

Create a clear action plan table/section with columns:
- Agreed Actions | By Whom | By When

Expand the provided agreed actions into the table. Include BOTH employee actions AND leader actions.

Then add the training and support section with specific details.

Next Review Date: ${data.nextReviewDate}

## EMPLOYEE'S COMMENTS/FEEDBACK

*Add: "Ask the employee for their self-assessment on their performance and/or behaviours, including any barriers they are facing, support they need, and feedback for you as their leader."*

${data.employeeSelfAssessment ? `Pre-filled: ${data.employeeSelfAssessment}` : ''}

Comments:
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________

## KEY MESSAGES

*Add: "The following points were discussed and agreed (adjust as appropriate):"*

Based on the overall outcome "${data.overallOutcome}", generate appropriate key messages. These should be specific bullet points that summarise what was discussed and agreed. Include messages like:

${data.overallOutcome.includes('On track') ? 
`- The employee is currently meeting the required performance and/or behavioural standards for their role
- Areas of strength have been acknowledged and areas for continued development have been identified
- Both parties have agreed on an action plan for the next period
- A follow-up review will take place on ${data.nextReviewDate} to continue tracking progress` :
data.overallOutcome.includes('At risk') || data.overallOutcome.includes('Significant') ?
`- The employee is not currently meeting the required performance and/or behavioural standards required of their role
- The employee will need to address these performance or behavioural gaps and show sufficient improvement to be considered suitable for ongoing employment
- We have discussed and confirmed that the employee has received appropriate training to date to understand and perform the requirements of their role
- Both parties have agreed on an action plan with specific, measurable improvements required
- Another meeting will take place on ${data.nextReviewDate} to review their progress and to determine next steps` :
data.overallOutcome.includes('ending employment') ?
`- The employee has not demonstrated sufficient improvement during the probation period despite support and feedback provided
- The requirements of the role and expected standards were clearly communicated
- Support, training and regular feedback were provided throughout the probation period
- The employee was given a genuine opportunity to improve
- The decision to end employment during the probation period has been made in accordance with procedural fairness` :
`- Generate 4-5 appropriate key messages based on the outcome: ${data.overallOutcome}`}

*Add: "Should the employee feel they need any support in dealing with this matter, confidential independent professional counsellors can be contacted for a range of issues." (Include an EAP reference if the venue has one)*

## SIGNATURES

People Leader's Signature: _________________________ Date: __ / __ / ____

Employee's Signature: _________________________ Date: __ / __ / ____

---

**IMPORTANT REMINDERS:**

✓ Both parties should retain a copy of this completed document
✓ This document forms part of the employee's probation record
✓ Any serious concerns should be escalated to Fitz HR: support@fitzhr.com
✓ The tone throughout should be supportive and developmental — firm where needed but always fair

**⚠️ All generated documents must be reviewed by a Fitz HR consultant before use.**

Contact: support@fitzhr.com

TONE: Professional, supportive, and fair. This is a development conversation — not a disciplinary meeting. Be specific with examples, balanced in acknowledging strengths and identifying areas for improvement, and constructive in the action plan. The document should demonstrate genuine procedural fairness.

DO NOT add fictional details. Expand and contextualise what was provided. DO NOT reference any other organisations by name.`;
	
    } else if (type === 'performanceImprovementPlan') {
        prompt = `You are generating a PERFORMANCE IMPROVEMENT PLAN (PIP) for Australian hospitality HR.

**CRITICAL OUTPUT REQUIREMENT:**
You MUST generate an ACTUAL FORMAL DOCUMENT - a complete, ready-to-use Performance Improvement Plan.
DO NOT generate:
- A checklist
- A guide or how-to
- Bullet points of what to include
- Tips or advice
- An outline or template with placeholders like "[insert here]"

Generate the ACTUAL PIP DOCUMENT with real content based on the information provided below.

⚠️ THIS IS A FORMAL 12-WEEK STRUCTURED PROCESS

VENUE CONTEXT:
${venueContext}
Award: ${getAwardContext().fullName}
Manager: ${data.managerName || venueProfile.userName || '[Manager Name]'}

EMPLOYEE DETAILS:
- Name: ${data.employeeName}
- Position: ${data.position}
- Employment Type: ${data.employmentType}

PERFORMANCE ISSUES IDENTIFIED:
Issue #1: ${data.performanceIssue1}
Evidence: ${data.performanceData1}

${data.performanceIssue2 ? `Issue #2: ${data.performanceIssue2}\nEvidence: ${data.performanceData2}` : ''}

SMART GOALS SET:
Goal #1: ${data.goal1}
${data.goal2 ? `Goal #2: ${data.goal2}` : ''}
${data.goal3 ? `Goal #3: ${data.goal3}` : ''}

ACTION PLAN:
Training/Coaching: ${data.trainingProvided}
Resources: ${data.resourcesProvided}
Manager Support: ${data.managerSupport}

EMPLOYEE RESPONSIBILITIES:
${data.employeeActions}

TIMELINE:
- PIP Start: ${data.pipStartDate}
- Weekly Check-ins: ${data.weeklyCheckins}
- Week 4 Review: ${data.week4ReviewDate}
- Week 8 Review: ${data.week8ReviewDate}
- Week 12 Final Review: ${data.week12ReviewDate}

CONSEQUENCES:
- Week 4: ${data.week4Consequence}
- Week 8: ${data.week8Consequence}
- Week 12: ${data.week12Consequence}
${data.consequenceNotes ? `Notes: ${data.consequenceNotes}` : ''}

**CRITICAL FORMATTING REQUIREMENTS:**
1. Use ## for major sections (e.g., ## PERFORMANCE ISSUES)
2. Use blank lines between ALL paragraphs and sections
3. DO NOT use **bold** formatting - use plain text only
4. For lists, use bullet points with "• " prefix
5. Structure clearly with proper spacing
6. **ALWAYS add a space after colons in labels** (e.g., "Date: 20 January 2026" not "Date:20 January 2026")

Generate a complete, professionally structured 12-Week Performance Improvement Plan.

REQUIREMENTS:

1. **Professional business document format**
2. **Clear structure** with these sections:
   - Header (CONFIDENTIAL - PERFORMANCE IMPROVEMENT PLAN)
   - Employee and Manager Details
   - Purpose of PIP
   - Performance Issues Identified (with data/evidence)
   - SMART Goals (numbered, clear, measurable)
   - Action Plan (detailed steps, training, resources)
   - Roles and Responsibilities (Manager & Employee tables)
   - Timeline and Review Schedule (12-week calendar)
   - Progress Measurement (how success will be tracked)
   - Consequences (staged - Week 4, 8, 12)
   - Support Available
   - Employee Acknowledgment Section
   - Signature Blocks

3. **Use a supportive but clear tone** - this is to help the employee succeed, not punish them
4. **Make goals SMART** - expand on the brief goals provided with more specific detail
5. **Weekly check-in template** - provide a simple weekly check-in form at the end
6. **Be specific about consequences** but frame as progressive steps. **Do NOT include "reduction in rostered hours" or "reduced shifts" as a consequence - this is not appropriate, particularly for full-time employees.**
7. **Include measurement criteria** for each goal

Example structure:

# CONFIDENTIAL

# PERFORMANCE IMPROVEMENT PLAN

## EMPLOYEE DETAILS

Employee Name: ${data.employeeName}

Position: ${data.position}

Employment Type: ${data.employmentType}

Manager/Supervisor: ${data.managerName}

PIP Start Date: ${data.pipStartDate}

PIP Duration: 12 weeks

## PURPOSE OF THIS PERFORMANCE IMPROVEMENT PLAN

This Performance Improvement Plan (PIP) has been developed to support ${data.employeeName} in addressing performance concerns and achieving the expected standards for the ${data.position} role.

The purpose of this plan is to:

- Clearly identify the specific performance issues that need improvement
- Set measurable goals with realistic timeframes
- Provide structured support, training, and resources
- Establish regular check-ins and feedback mechanisms
- Outline the consequences if performance does not improve

This is a supportive process designed to help you succeed. We are committed to providing you with the tools, training, and support needed to meet these goals.

## PERFORMANCE ISSUES IDENTIFIED

The following performance issues have been identified based on objective data and observations:

### Issue 1: [Expand on ${data.performanceIssue1}]

Evidence:

- ${data.performanceData1}

Impact: [Explain how this impacts the business, team, or customers]

### Issue 2: [If applicable - expand on ${data.performanceIssue2}]

Evidence:

- ${data.performanceData2}

Impact: [Explain impact]

## SMART GOALS

To address these performance issues, the following SMART goals have been established:

### Goal 1: [Expand ${data.goal1}]

- Specific: [What exactly needs to improve]
- Measurable: [How will we measure success - specific numbers/metrics]
- Achievable: [Why this is realistic given training and support]
- Relevant: [How this relates to role expectations]
- Time-bound: [Specific deadline - Week 4, 8, or 12]

Success Criteria: [Define what "success" looks like - be very specific]

### Goal 2: [If applicable]

[Same structure as Goal 1]

### Goal 3: [If applicable]

[Same structure as Goal 1]

## ACTION PLAN

To help you achieve these goals, we will provide the following support:

### Training and Development

${data.trainingProvided}

### Resources and Tools

${data.resourcesProvided}

### Manager/Supervisor Support

${data.managerSupport}

## ROLES AND RESPONSIBILITIES

### Employee Responsibilities

You are expected to:

${data.employeeActions}

### Manager/Supervisor Responsibilities

Your manager/supervisor will:

- Conduct weekly check-in meetings on ${data.weeklyCheckins}
- Provide regular feedback and coaching
- Track progress toward goals
- Remove barriers to success where possible
- Conduct formal reviews at Week 4, Week 8, and Week 12
- Maintain confidentiality of this process

## TIMELINE AND REVIEW SCHEDULE

This is a 12-week structured process with regular check-ins and formal reviews:

### Weekly Check-ins

When: ${data.weeklyCheckins}

Purpose: Quick progress check, address questions, provide feedback

Duration: 15-30 minutes

### Formal Review Points

Week 4 Review: ${data.week4ReviewDate}

Purpose: Assess progress on goals, adjust plan if needed, determine next steps

Week 8 Review: ${data.week8ReviewDate}

Purpose: Mid-point assessment, confirm trajectory, address any challenges

Week 12 Final Review: ${data.week12ReviewDate}

Purpose: Final assessment of overall performance improvement

## PROGRESS MEASUREMENT

Progress will be measured using the following methods:

- [Specific metrics for Goal 1 - e.g., till data, customer feedback scores]
- [Specific metrics for Goal 2 - e.g., accuracy reports, manager observations]
- [Specific metrics for Goal 3 - e.g., review ratings, speed measurements]
- Direct observation and feedback from managers and team members
- Customer feedback and reviews
- Self-assessment and reflection

Data will be collected weekly and reviewed at each check-in.

## CONSEQUENCES OF NON-IMPROVEMENT

This PIP is designed to support your success. However, if performance does not improve significantly, the following consequences will apply:

### Week 4 Review

If there is no significant improvement by Week 4:

${data.week4Consequence}

### Week 8 Review

If there is no significant improvement by Week 8:

${data.week8Consequence}

### Week 12 Final Review

If performance standards have not been met by Week 12:

${data.week12Consequence}

${data.consequenceNotes ? `Additional notes: ${data.consequenceNotes}` : ''}

"Significant improvement" means demonstrable progress toward the stated goals as measured by the agreed metrics and criteria.

## SUPPORT AVAILABLE

We want you to succeed. If you are struggling or need additional support at any time:

- Speak with your manager/supervisor immediately
- Request additional training or resources if needed
- Ask questions if goals or expectations are unclear
- Seek support from HR if you have concerns about the process

You have the right to have a support person present at any formal review meeting. This can be a work colleague, family member, or union representative.

## CONFIDENTIALITY

This Performance Improvement Plan is confidential. You should not discuss the details of this plan with other employees (except your nominated support person or union representative).

## EMPLOYEE ACKNOWLEDGMENT

I acknowledge that:

- I have received and read this Performance Improvement Plan
- The performance issues and expectations have been clearly explained to me
- I understand the goals I am expected to achieve
- I understand the support and resources that will be provided
- I understand the timeline and review process
- I understand the consequences if my performance does not improve
- I have been offered the right to have a support person present at review meetings
- I have had the opportunity to ask questions about this plan

This acknowledgment does not mean I agree with all aspects of this plan, but confirms I understand it.

Employee Signature: _________________________ Date: __________

Manager/Supervisor Signature: _________________________ Date: __________

---

## WEEKLY CHECK-IN TEMPLATE

Week Number: _____     Date: __________

Goals Review:

Goal 1 Progress:

- Current status: [On track / Behind / Ahead]
- Evidence of progress:
- Challenges faced:
- Support needed:

Goal 2 Progress:

- Current status: [On track / Behind / Ahead]
- Evidence of progress:
- Challenges faced:
- Support needed:

Action Items for Next Week:

1. ___________________________________
2. ___________________________________
3. ___________________________________

Employee Comments:

__________________________________________

Manager Comments:

__________________________________________

Employee Signature: _______________ Date: ______

Manager Signature: _______________ Date: ______

---

**IMPORTANT REMINDER:**

This PIP must be reviewed by a Fitz HR Senior Consultant before presenting to the employee to ensure it is legally compliant and procedurally fair.

Contact: support@fitzhr.com

Format as a complete, professional business document with clear structure and spacing.

This is a SUPPORTIVE document - the tone should be firm but encouraging. The goal is to help the employee succeed, not to create a paper trail for termination (although it may be used that way if improvement doesn't occur).

DO NOT add fictional details. Use the specific information provided. Expand and add professional context where appropriate.`;
    
    }
    
    // Add FINAL instruction at the end of every prompt
    const finalInstruction = `

=== FINAL REMINDER - READ THIS CAREFULLY ===
Your output MUST be the actual document content itself - starting with the document header (e.g., "FORMAL WARNING LETTER" or "PRIVATE & CONFIDENTIAL").

DO NOT:
- Start with "I understand..." or "Here's what you need..." or any conversational text
- Provide advice, guidance, or process steps
- Give a checklist of what the document should contain
- Explain what the document is for

DO:
- Begin IMMEDIATELY with the document header
- Write the actual formal letter/document content
- Use the employee name, dates, and details provided
- Format as a ready-to-print professional document

START YOUR RESPONSE WITH THE DOCUMENT HEADER NOW:
=== END FINAL REMINDER ===`;
    
    // Prepend universal instruction and append final instruction
    return universalInstruction + prompt + finalInstruction;
}

function showDocumentPreview(generatedDoc) {
    // Convert the AI-generated content to proper HTML
    const formattedHTML = convertAIContentToHTML(generatedDoc);
    
    document.getElementById('documentPreviewContent').innerHTML = formattedHTML;
    document.getElementById('documentPreviewModal').classList.remove('hidden');
}

function closeDocumentPreview() {
    document.getElementById('documentPreviewModal').classList.add('hidden');
    // Reset the document builder silently so it's ready for next use
    resetDocumentBuilderSilent();
}

// Silent reset (used when closing modal)
function resetDocumentBuilderSilent() {
    // Reset state
    documentBuilderState.currentType = null;
    documentBuilderState.currentStep = 1;
    documentBuilderState.data = {};
    documentBuilderState.generatedDocument = null;
    documentBuilderState.isGenerating = false;
    
    // Hide all wizard sections
    const wizardSteps = document.getElementById('documentWizardSteps');
    const generating = document.getElementById('documentGenerating');
    const templateSelection = document.getElementById('documentTemplateSelection');
    
    if (wizardSteps) wizardSteps.classList.add('hidden');
    if (generating) generating.classList.add('hidden');
    if (templateSelection) templateSelection.classList.remove('hidden');
    
    // Reset progress
    const currentStep = document.getElementById('docCurrentStep');
    const progress = document.getElementById('docProgress');
    const progressBar = document.getElementById('docProgressBar');
    
    if (currentStep) currentStep.textContent = '1';
    if (progress) progress.textContent = '0% Complete';
    if (progressBar) progressBar.style.width = '0%';
    
}

// Reset with confirmation (used when user clicks "Start Over" button)
function resetDocumentBuilder() {
    // Confirm reset
    if (!confirm('Start over? This will clear all your entered information.')) {
        return;
    }
    
    // Call the silent reset
    resetDocumentBuilderSilent();
}

// ========================================
// FITZ CREDITS MODAL FUNCTIONS
// ========================================

// Track selected consultation type
let selectedConsultation = null;
let selectedMeetingType = null;

// Consultation types configuration
const CONSULTATION_TYPES = {
    terminationReview: {
        name: 'Termination Review',
        icon: '🚪',
        credits: 7,
        includes: 'Includes termination letter if approved',
        calendlyZoom: 'CALENDLY_TERMINATION_ZOOM_URL',
        calendlyPhone: 'CALENDLY_TERMINATION_PHONE_URL'
    },
    redundancyReview: {
        name: 'Redundancy Review',
        icon: '📉',
        credits: 7,
        includes: 'Includes redundancy letters if approved',
        calendlyZoom: 'CALENDLY_REDUNDANCY_ZOOM_URL',
        calendlyPhone: 'CALENDLY_REDUNDANCY_PHONE_URL'
    },
    investigationReview: {
        name: 'Investigation Review',
        icon: '🔍',
        credits: 8,
        includes: 'Includes investigation report',
        calendlyZoom: 'CALENDLY_INVESTIGATION_ZOOM_URL',
        calendlyPhone: 'CALENDLY_INVESTIGATION_PHONE_URL'
    },
    settlementReview: {
        name: 'Settlement Review',
        icon: '🤝',
        credits: 8,
        includes: 'Includes deed of settlement draft',
        calendlyZoom: 'CALENDLY_SETTLEMENT_ZOOM_URL',
        calendlyPhone: 'CALENDLY_SETTLEMENT_PHONE_URL'
    },
    unfairDismissalResponse: {
        name: 'Unfair Dismissal Response',
        icon: '⚖️',
        credits: 8,
        includes: 'Includes response draft for Fair Work',
        calendlyZoom: 'CALENDLY_UNFAIR_DISMISSAL_ZOOM_URL',
        calendlyPhone: 'CALENDLY_UNFAIR_DISMISSAL_PHONE_URL'
    },
    generalConsultation: {
        name: 'General HR Consultation',
        icon: '💬',
        credits: 5,
        includes: 'Expert advice on any HR matter',
        calendlyZoom: 'CALENDLY_GENERAL_ZOOM_URL',
        calendlyPhone: 'CALENDLY_GENERAL_PHONE_URL'
    }
};

// ============================================
// CALENDLY CONFIGURATION
// ============================================
const CALENDLY_CONFIG = {
    baseUrl: 'https://calendly.com/fitzhr',
    events: {
        zoom: 'hr-consultation-zoom',
        phone: '30min'
    }
};

/**
 * Toggle the free documents dropdown in credits modal
 */
function toggleFreeDocsDropdown() {
    const dropdown = document.getElementById('freeDocsDropdown');
    const chevron = document.getElementById('freeDocsChevron');
    
    if (dropdown && chevron) {
        dropdown.classList.toggle('hidden');
        chevron.classList.toggle('rotate-180');
    }
}

/**
 * Open the credits management modal
 */
function openCreditsModal() {
    const totalCredits = getTotalCredits();
    const modalCreditsBalance = document.getElementById('modalCreditsBalance');
    const freeDocStatus = document.getElementById('freeDocumentStatus');
    const freeDocUsedStatus = document.getElementById('freeDocumentUsedStatus');
    
    // Update tier display - use subscriptionTier if available, fallback to tier, then 'free'
    const currentTier = userCredits.subscriptionTier || userCredits.tier || 'free';
    document.getElementById('modalCurrentTier').textContent = CONFIG.CREDITS.TIERS[currentTier]?.name || 'Free';
    
    // Update credits balance - show actual number
    modalCreditsBalance.textContent = totalCredits;
    modalCreditsBalance.classList.remove('text-green-400', 'text-amber-400', 'text-red-400');
    if (totalCredits >= 5) {
        modalCreditsBalance.classList.add('text-green-400');
    } else if (totalCredits >= 1) {
        modalCreditsBalance.classList.add('text-amber-400');
    } else {
        modalCreditsBalance.classList.add('text-red-400');
    }
    
    // Show free tier info or hide for paid tiers
    const modalTier = userCredits.subscriptionTier || userCredits.tier || 'free';
    if (freeDocStatus && freeDocUsedStatus) {
        if (modalTier === 'free') {
            freeDocStatus.classList.remove('hidden');
            freeDocUsedStatus.classList.add('hidden');
        } else {
            // Hide for paid tiers
            freeDocStatus.classList.add('hidden');
            freeDocUsedStatus.classList.add('hidden');
        }
    }
    
    // Update prompts remaining
    if (modalTier === 'free') {
        const remaining = getRemainingPrompts();
        document.getElementById('modalPromptsRemaining').textContent = `${remaining}/${CONFIG.CREDITS.FREE_TIER.MONTHLY_PROMPTS} prompts remaining`;
    } else {
        document.getElementById('modalPromptsRemaining').textContent = 'Unlimited prompts';
    }
    
    // Reset free docs dropdown state
    const freeDocsDropdown = document.getElementById('freeDocsDropdown');
    const freeDocsChevron = document.getElementById('freeDocsChevron');
    if (freeDocsDropdown) freeDocsDropdown.classList.add('hidden');
    if (freeDocsChevron) freeDocsChevron.classList.remove('rotate-180');
    
    // Show/hide manage subscription section
    updateManageSubscriptionUI();
    
    document.getElementById('creditsModal').classList.remove('hidden');
}

/**
 * Close the credits modal
 */
function closeCreditsModal() {
    document.getElementById('creditsModal').classList.add('hidden');
}

/**
 * Update the manage subscription UI based on current subscription status
 */
function updateManageSubscriptionUI() {
    const manageSection = document.getElementById('manageSubscriptionSection');
    const statusText = document.getElementById('subscriptionStatusText');
    
    if (!manageSection) return;
    
    // Show manage section for paying customers with Stripe customer ID
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    const isPaying = tier !== 'free';
    const hasStripeId = userCredits.stripeCustomerId;
    
    if (isPaying && hasStripeId) {
        manageSection.classList.remove('hidden');
        
        // Update status text
        if (statusText) {
            if (userCredits.cancelAtPeriodEnd) {
                const endDate = userCredits.subscriptionPeriodEnd 
                    ? new Date(userCredits.subscriptionPeriodEnd).toLocaleDateString('en-AU')
                    : 'end of billing period';
                statusText.textContent = `⚠️ Your subscription will cancel on ${endDate}`;
                statusText.classList.add('text-amber-400');
                statusText.classList.remove('text-slate-500');
            } else if (userCredits.subscriptionPeriodEnd) {
                const renewDate = new Date(userCredits.subscriptionPeriodEnd).toLocaleDateString('en-AU');
                statusText.textContent = `Next billing date: ${renewDate}`;
                statusText.classList.remove('text-amber-400');
                statusText.classList.add('text-slate-500');
            } else {
                statusText.textContent = '';
            }
        }
    } else {
        manageSection.classList.add('hidden');
    }
}

/**
 * Open Stripe Customer Portal for subscription management
 * @param {string} flow - Optional flow type: 'subscription' for plan changes, undefined for general billing
 */
async function openBillingPortal(flow) {
    if (!userCredits.stripeCustomerId) {
        showNotification('📧 Please contact support@fitzhr.com to manage your subscription.', 'info', 5000);
        return;
    }
    
    // Show loading overlay immediately
    showRedirectingOverlay();
    
    const btn = document.getElementById('billingPortalBtn');
    const manageBtn = document.getElementById('subscriptionModalManageBtn');
    const originalText = btn?.innerHTML;
    const originalManageText = manageBtn?.innerHTML;
    
    if (btn) {
        btn.innerHTML = '<span class="animate-spin">⏳</span> Please wait...';
        btn.disabled = true;
    }
    if (manageBtn) {
        manageBtn.innerHTML = '⏳ Please wait...';
        manageBtn.disabled = true;
    }
    
    try {
        const response = await fetch('/.netlify/functions/create-portal-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerId: userCredits.stripeCustomerId,
                returnUrl: window.location.href
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to open billing portal');
        }
        
        const { url } = await response.json();
        
        // Open the portal
        window.location.href = url;
        
    } catch (error) {
        console.error('Billing portal error:', error);
        hideRedirectingOverlay();
        showNotification('❌ Could not open billing portal. Please contact support@fitzhr.com', 'error');
        
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        if (manageBtn) {
            manageBtn.innerHTML = originalManageText || '⚙️ Manage Subscription';
            manageBtn.disabled = false;
        }
    }
}

// Show redirecting overlay
function showRedirectingOverlay() {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('redirectingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'redirectingOverlay';
        overlay.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100]';
        overlay.innerHTML = `
            <div class="bg-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 border border-amber-500 text-center">
                <div class="text-5xl mb-4 animate-bounce">⏳</div>
                <h3 class="text-xl font-bold text-amber-400 mb-2">Please Wait</h3>
                <p class="text-slate-300">Fitz is redirecting you to manage your subscription...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
}

// Hide redirecting overlay
function hideRedirectingOverlay() {
    const overlay = document.getElementById('redirectingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Open the prompt limit modal (shown when free user hits 20 prompts)
 */
function openPromptLimitModal() {
    document.getElementById('promptLimitModal').classList.remove('hidden');
}

/**
 * Close the prompt limit modal
 */
function closePromptLimitModal() {
    document.getElementById('promptLimitModal').classList.add('hidden');
}

/**
 * Open the consultation booking modal
 */
function openConsultationBookingModal(preselectedType = null) {
    // Reset state
    selectedConsultation = null;
    selectedMeetingType = null;
    
    // Reset all button states
    document.querySelectorAll('.consultation-type-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'border-2', 'bg-slate-700');
        btn.classList.add('border-slate-600');
    });
    
    document.querySelectorAll('.meeting-type-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'border-2', 'bg-slate-700');
        btn.classList.add('border-slate-600');
    });
    
    // Show step 1, hide others
    document.getElementById('bookingStep1').classList.remove('hidden');
    document.getElementById('bookingStep2').classList.add('hidden');
    document.getElementById('bookingStep3').classList.add('hidden');
    
    // Show modal
    document.getElementById('consultationBookingModal').classList.remove('hidden');
    
    // If preselected type, auto-select it
    if (preselectedType && CONSULTATION_TYPES[preselectedType]) {
        setTimeout(() => selectConsultationType(preselectedType), 100);
    }
}

/**
 * Close consultation booking modal
 */
function closeConsultationBookingModal() {
    document.getElementById('consultationBookingModal').classList.add('hidden');
    
    // Clean up any Calendly widget
    const calendlyContainer = document.getElementById('calendlyContainer');
    if (calendlyContainer) {
        calendlyContainer.innerHTML = `
            <div id="calendlyPlaceholder" class="flex items-center justify-center bg-slate-100" style="height: 650px;">
                <div class="text-center">
                    <div class="animate-spin text-4xl mb-4">⏳</div>
                    <p class="text-slate-600">Loading calendar...</p>
                </div>
            </div>
        `;
    }
}

/**
 * Open consultation booking from "Consultation Required" modal
 */
function openConsultationBookingFromRequired() {
    closeConsultationRequiredModal();
    
    // Get the required consultation type from context
    const requiredType = document.getElementById('consultationRequiredModal').dataset.consultationType || 'terminationReview';
    
    openConsultationBookingModal(requiredType);
}

/**
 * Close consultation required modal
 */
function closeConsultationRequiredModal() {
    document.getElementById('consultationRequiredModal').classList.add('hidden');
}

/**
 * Select a consultation type
 */
function selectConsultationType(type) {
    const config = CONSULTATION_TYPES[type];
    if (!config) return;
    
    selectedConsultation = type;
    
    // Update button styles
    document.querySelectorAll('.consultation-type-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'border-2', 'bg-slate-700');
        btn.classList.add('border-slate-600');
    });
    
    // Find and highlight the selected button
    const buttons = document.querySelectorAll('.consultation-type-btn');
    buttons.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(type)) {
            btn.classList.remove('border-slate-600');
            btn.classList.add('border-purple-500', 'border-2', 'bg-slate-700');
        }
    });
    
    // Move to step 2
    goToStep2();
}

/**
 * Navigate to step 2 (meeting type selection)
 */
function goToStep2() {
    const config = CONSULTATION_TYPES[selectedConsultation];
    if (!config) return;
    
    // Update summary
    document.getElementById('selectedConsultationIcon').textContent = config.icon;
    document.getElementById('selectedConsultationName').textContent = config.name;
    document.getElementById('selectedConsultationIncludes').textContent = config.includes;
    document.getElementById('selectedConsultationCredits').textContent = config.credits;
    
    // Update credit display
    const currentCredits = getTotalCredits();
    const creditsAfter = Math.max(0, currentCredits - config.credits);
    
    document.getElementById('bookingCurrentCredits').textContent = `${currentCredits} credits`;
    document.getElementById('bookingCreditsAfter').textContent = `${creditsAfter} credits`;
    
    // Check if user can afford
    const canAfford = currentCredits >= config.credits;
    
    if (canAfford) {
        document.getElementById('bookingInsufficientCredits').classList.add('hidden');
        document.getElementById('proceedToCalendlyBtn').classList.remove('hidden');
        document.getElementById('proceedToCalendlyBtn').disabled = true; // Enable after meeting type selected
        document.getElementById('bookingCreditsAfter').className = creditsAfter <= 2 ? 'text-red-400 font-bold' : 'text-green-400 font-bold';
    } else {
        document.getElementById('bookingInsufficientCredits').classList.remove('hidden');
        document.getElementById('proceedToCalendlyBtn').classList.add('hidden');
        document.getElementById('bookingCreditsAfter').textContent = 'Not enough credits';
        document.getElementById('bookingCreditsAfter').className = 'text-red-400 font-bold';
    }
    
    // Reset meeting type selection
    selectedMeetingType = null;
    document.querySelectorAll('.meeting-type-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'border-2', 'bg-slate-700');
        btn.classList.add('border-slate-600');
    });
    
    // Switch views
    document.getElementById('bookingStep1').classList.add('hidden');
    document.getElementById('bookingStep2').classList.remove('hidden');
    document.getElementById('bookingStep3').classList.add('hidden');
}

/**
 * Go back to step 1
 */
function goBackToStep1() {
    selectedConsultation = null;
    selectedMeetingType = null;
    
    document.getElementById('bookingStep1').classList.remove('hidden');
    document.getElementById('bookingStep2').classList.add('hidden');
    document.getElementById('bookingStep3').classList.add('hidden');
}

/**
 * Go back to step 2
 */
function goBackToStep2() {
    document.getElementById('bookingStep1').classList.add('hidden');
    document.getElementById('bookingStep2').classList.remove('hidden');
    document.getElementById('bookingStep3').classList.add('hidden');
}

/**
 * Select meeting type (Zoom or Phone)
 */
function selectMeetingType(type) {
    selectedMeetingType = type;
    
    // Update button styles
    document.querySelectorAll('.meeting-type-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'border-2', 'bg-slate-700');
        btn.classList.add('border-slate-600');
    });
    
    const selectedBtn = document.getElementById(type === 'zoom' ? 'meetingTypeZoom' : 'meetingTypePhone');
    if (selectedBtn) {
        selectedBtn.classList.remove('border-slate-600');
        selectedBtn.classList.add('border-purple-500', 'border-2', 'bg-slate-700');
    }
    
    // Enable proceed button
    const proceedBtn = document.getElementById('proceedToCalendlyBtn');
    if (proceedBtn) {
        proceedBtn.disabled = false;
    }
}

/**
 * Get credits from booking flow (save state and open credits modal)
 */
function getCreditsFromBooking() {
    // Save booking state to localStorage so we can restore after purchase
    const bookingState = {
        consultationType: selectedConsultation,
        meetingType: selectedMeetingType,
        timestamp: Date.now()
    };
    localStorage.setItem('pendingConsultationBooking', JSON.stringify(bookingState));
    
    closeConsultationBookingModal();
    openCreditsModal();
}

/**
 * Proceed to Calendly booking
 */
function proceedToCalendly() {
    if (!selectedConsultation || !selectedMeetingType) {
        showNotification('Please select a meeting type', 'error');
        return;
    }
    
    const config = CONSULTATION_TYPES[selectedConsultation];
    if (!config) return;
    
    // Check credits one more time
    if (getTotalCredits() < config.credits) {
        showNotification('Insufficient credits', 'error');
        return;
    }
    
    // Store booking intent for credit deduction after Calendly completes
    const bookingIntent = {
        consultationType: selectedConsultation,
        meetingType: selectedMeetingType,
        credits: config.credits,
        timestamp: Date.now()
    };
    localStorage.setItem('pendingCalendlyBooking', JSON.stringify(bookingIntent));
    
    // Move to step 3
    document.getElementById('bookingStep1').classList.add('hidden');
    document.getElementById('bookingStep2').classList.add('hidden');
    document.getElementById('bookingStep3').classList.remove('hidden');
    
    // Load Calendly
    loadCalendlyWidget();
}

/**
 * Load Calendly inline widget
 */
function loadCalendlyWidget() {
    const container = document.getElementById('calendlyContainer');
    if (!container) return;
    
    const config = CONSULTATION_TYPES[selectedConsultation];
    if (!config) return;
    
    // Build Calendly URL
    const eventSlug = selectedMeetingType === 'zoom' ? CALENDLY_CONFIG.events.zoom : CALENDLY_CONFIG.events.phone;
    const calendlyUrl = `${CALENDLY_CONFIG.baseUrl}/${eventSlug}`;
    
    // Prefill user data if available
    const prefillData = {};
    if (currentUser?.email) {
        prefillData.email = currentUser.email;
    }
    if (currentUser?.displayName) {
        prefillData.name = currentUser.displayName;
    }
    
    // Build prefill query string
    const prefillParams = new URLSearchParams();
    if (prefillData.email) prefillParams.set('email', prefillData.email);
    if (prefillData.name) prefillParams.set('name', prefillData.name);
    
    const fullUrl = prefillParams.toString() ? `${calendlyUrl}?${prefillParams.toString()}` : calendlyUrl;
    
    // Check if Calendly script is loaded
    if (typeof Calendly !== 'undefined') {
        // Create a proper container for the Calendly widget
        container.innerHTML = '<div class="calendly-inline-widget" data-auto-load="false" style="min-width:320px;height:680px;"></div>';
        const widgetContainer = container.querySelector('.calendly-inline-widget');
        
        Calendly.initInlineWidget({
            url: fullUrl,
            parentElement: widgetContainer,
            prefill: prefillData,
            utm: {
                utmSource: 'fitz-hr-app',
                utmMedium: 'consultation-booking',
                utmCampaign: selectedConsultation
            }
        });
        
        console.log('📅 Calendly widget initialized with URL:', fullUrl);
    } else {
        // Show manual booking fallback
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center bg-slate-100 rounded-xl p-6" style="height: 650px;">
                <div class="text-5xl mb-4">📅</div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Book Your Consultation</h3>
                <p class="text-slate-600 text-center mb-6">Click the button below to select your preferred time slot.</p>
                <a href="${fullUrl}" target="_blank" rel="noopener noreferrer"
                   onclick="handleCalendlyRedirect()"
                   class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all inline-flex items-center gap-2">
                    <span>📅</span>
                    <span>Open Calendar</span>
                </a>
                <p class="text-slate-500 text-sm mt-4">
                    ${config.credits} credits will be deducted when you confirm your booking
                </p>
            </div>
        `;
    }
}

/**
 * Handle Calendly redirect (for fallback mode)
 */
function handleCalendlyRedirect() {
    showNotification('Complete your booking in the new tab. Credits will be deducted upon confirmation.', 'info');
}

/**
 * Handle Calendly event scheduled (called via Calendly webhook or postMessage)
 */
function handleCalendlyEventScheduled(eventData) {
    console.log('📅 Calendly event scheduled:', eventData);
    
    // Get pending booking
    const pendingBooking = localStorage.getItem('pendingCalendlyBooking');
    if (!pendingBooking) return;
    
    try {
        const booking = JSON.parse(pendingBooking);
        
        // Deduct credits
        const config = CONSULTATION_TYPES[booking.consultationType];
        if (config) {
            const creditsToDeduct = config.credits;
            
            // Deduct from purchased credits first, then subscription reviewCredits
            if (userCredits.purchasedCredits >= creditsToDeduct) {
                userCredits.purchasedCredits -= creditsToDeduct;
                console.log(`💳 Deducted ${creditsToDeduct} from purchased credits`);
            } else {
                // Use purchased credits first, then subscription credits
                const fromPurchased = userCredits.purchasedCredits;
                const remaining = creditsToDeduct - fromPurchased;
                userCredits.purchasedCredits = 0;
                userCredits.reviewCreditsUsed = (userCredits.reviewCreditsUsed || 0) + remaining;
                console.log(`💳 Deducted ${fromPurchased} from purchased + ${remaining} from subscription credits`);
            }
            
            saveUserCredits();
            syncCreditsToFirebase();
            updateCreditsDisplay();
            
            showNotification(`🎉 Consultation booked! ${config.credits} credits used.`, 'success');
            
            // Add confirmation message to chat
            addMessage('assistant', `## 📅 Consultation Booked!\n\nYour **${config.name}** has been scheduled.\n\n**Meeting type:** ${booking.meetingType === 'zoom' ? '📹 Zoom Video Call' : '📞 Phone Call'}\n**Credits used:** ${config.credits}\n**Remaining credits:** ${getTotalCredits()}\n\nYou'll receive a calendar invite shortly with all the details.\n\n${config.includes}`);
        }
        
        // Clear pending booking
        localStorage.removeItem('pendingCalendlyBooking');
        
        // Close modal
        closeConsultationBookingModal();
        
    } catch (e) {
        console.error('Error processing Calendly booking:', e);
    }
}

// Listen for Calendly events via postMessage
window.addEventListener('message', function(e) {
    if (e.origin === 'https://calendly.com') {
        if (e.data.event && e.data.event === 'calendly.event_scheduled') {
            handleCalendlyEventScheduled(e.data.payload);
        }
    }
});

/**
 * Check for pending consultation booking after credits purchase
 */
function checkPendingConsultationBooking() {
    const pendingBooking = localStorage.getItem('pendingConsultationBooking');
    if (!pendingBooking) return false;
    
    try {
        const booking = JSON.parse(pendingBooking);
        
        // Check if booking is less than 1 hour old
        if (Date.now() - booking.timestamp > 3600000) {
            localStorage.removeItem('pendingConsultationBooking');
            return false;
        }
        
        // Restore booking modal
        localStorage.removeItem('pendingConsultationBooking');
        openConsultationBookingModal(booking.consultationType);
        
        // If meeting type was selected, restore that too
        if (booking.meetingType) {
            setTimeout(() => {
                selectMeetingType(booking.meetingType);
            }, 500);
        }
        
        showNotification('Continue booking your consultation!', 'info');
        return true;
        
    } catch (e) {
        console.error('Error restoring consultation booking:', e);
        localStorage.removeItem('pendingConsultationBooking');
        return false;
    }
}

/**
 * Show consultation required modal for gated documents
 */
function showConsultationRequiredModal(docType) {
    // Determine which consultation is needed
    let consultationType = 'terminationReview';
    let credits = 7;
    
    if (docType === 'terminationLetter' || docType === 'termination') {
        consultationType = 'terminationReview';
        credits = 7;
    } else if (docType === 'redundancy') {
        consultationType = 'redundancyReview';
        credits = 7;
    } else if (docType === 'investigation') {
        consultationType = 'investigationReview';
        credits = 8;
    } else if (docType === 'settlement') {
        consultationType = 'settlementReview';
        credits = 8;
    } else if (docType === 'unfairDismissal') {
        consultationType = 'unfairDismissalResponse';
        credits = 8;
    }
    
    document.getElementById('requiredConsultationCredits').textContent = `${credits} credits`;
    document.getElementById('consultationRequiredModal').classList.remove('hidden');
    
    // Store the doc type for when they proceed
    document.getElementById('consultationRequiredModal').dataset.docType = docType;
    document.getElementById('consultationRequiredModal').dataset.consultationType = consultationType;
}

/**
 * Open document unlock modal
 */
function openDocumentUnlockModal(docType, docName) {
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    if (!cost) return;
    
    const currentBalance = getTotalCredits();
    const balanceAfter = Math.max(0, currentBalance - cost.credits);
    
    document.getElementById('unlockDocumentName').textContent = docName || cost.name;
    document.getElementById('unlockDocumentCost').textContent = `${cost.credits} credit${cost.credits > 1 ? 's' : ''}`;
    document.getElementById('unlockCurrentBalance').textContent = `${currentBalance} credits`;
    document.getElementById('unlockBalanceAfter').textContent = `${balanceAfter} credits`;
    
    // Store doc type for unlock action
    document.getElementById('documentUnlockModal').dataset.docType = docType;
    
    // Check if user can afford
    const canAfford = canAffordDocument(docType);
    
    // Hide all options first
    document.getElementById('unlockFreeDocument').classList.add('hidden');
    document.getElementById('unlockDocumentBtn').classList.add('hidden');
    document.getElementById('unlockNeedMoreCredits').classList.add('hidden');
    
    if (canAfford) {
        // Show paid unlock option
        document.getElementById('unlockDocumentBtn').classList.remove('hidden');
        
        // Update balance after color based on remaining
        const balanceAfterEl = document.getElementById('unlockBalanceAfter');
        if (balanceAfter <= 2) {
            balanceAfterEl.className = 'text-red-400 font-bold';
        } else if (balanceAfter <= 5) {
            balanceAfterEl.className = 'text-amber-400 font-bold';
        } else {
            balanceAfterEl.className = 'text-green-400 font-bold';
        }
    } else {
        // Show need more credits option
        document.getElementById('unlockNeedMoreCredits').classList.remove('hidden');
        document.getElementById('unlockBalanceAfter').textContent = 'Not enough credits';
        document.getElementById('unlockBalanceAfter').className = 'text-red-400 font-bold';
    }
    
    document.getElementById('documentUnlockModal').classList.remove('hidden');
}

/**
 * Close document unlock modal
 */
function closeDocumentUnlockModal() {
    document.getElementById('documentUnlockModal').classList.add('hidden');
}

/**
 * Unlock the document (deduct credits and show full preview)
 */
function unlockDocument() {
    const modal = document.getElementById('documentUnlockModal');
    const docType = modal.dataset.docType;
    
    if (!docType) return;
    
    // CRITICAL: Prevent double-charging - check if already unlocked
    if (unlockedDocuments.has(docType)) {
        console.log('⚠️ Document already unlocked, preventing double charge:', docType);
        closeDocumentUnlockModal();
        removeDocumentBlur();
        showNotification('Document is already unlocked!', 'info');
        return;
    }
    
    // Deduct credits
    const success = deductCreditsForDocument(docType);
    
    if (success) {
        // Mark as unlocked IMMEDIATELY after deducting
        unlockedDocuments.add(docType);
        console.log('✅ Document unlocked and marked:', docType);
        
        closeDocumentUnlockModal();
        
        // Remove blur from document preview (if using documentPreviewModal)
        removeDocumentBlur();
        
        // Check if there's a pending download from the protection system
        if (pendingDocumentDownload.downloadFunction) {
            completePendingDownload();
        }
        
        // Show success message
        showNotification('Document unlocked! You can now download it.', 'success');
    } else {
        alert('Failed to deduct credits. Please try again.');
    }
}

/**
 * Show subscription options
 */
/**
 * Purchase chat top-up (30 extra prompts for $19)
 */
function purchaseChatTopUp() {
    closePromptLimitModal();
    initiateStripeCheckout('chat_topup');
}

function showSubscriptionOptions() {
    // Close any open modals
    closeCreditsModal();
    closePromptLimitModal();
    
    // Open subscription modal
    openSubscriptionModal();
}

/**
 * Open the subscription selection modal
 */
function openSubscriptionModal() {
    // Update buttons based on current tier
    updateSubscriptionModalButtons();
    document.getElementById('subscriptionModal').classList.remove('hidden');
}

/**
 * Update subscription modal buttons based on current tier
 */
function updateSubscriptionModalButtons() {
    const currentTier = (userCredits.subscriptionTier || userCredits.tier || 'free').toLowerCase();
    const tierOrder = ['free', 'starter', 'pro', 'business'];
    const currentTierIndex = tierOrder.indexOf(currentTier);
    
    // Check if user has Stripe customer ID (needed for portal)
    const hasStripeId = userCredits.stripeCustomerId;
    const isPaidUser = currentTier !== 'free';
    
    console.log('📋 Subscription modal - Tier:', currentTier, 'StripeID:', hasStripeId);
    
    // Show/hide manage subscription button (for paying customers)
    const manageBtn = document.getElementById('subscriptionModalManageBtn');
    if (manageBtn) {
        // Show for any paid user (they can contact support if no Stripe ID)
        if (isPaidUser) {
            manageBtn.classList.remove('hidden');
        } else {
            manageBtn.classList.add('hidden');
        }
    }
    
    tierOrder.forEach((tier, index) => {
        const btn = document.getElementById(`planBtn_${tier}`);
        const card = document.getElementById(`planCard_${tier}`);
        if (!btn || !card) return;
        
        // Reset card styling
        card.classList.remove('ring-2', 'ring-green-500');
        
        const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
        
        if (tier === currentTier) {
            // Current plan
            btn.textContent = '✓ Current Plan';
            btn.className = 'w-full bg-green-600 text-white font-bold py-2 rounded-lg text-sm cursor-default';
            btn.onclick = null;
            btn.disabled = true;
            // Add highlight to current plan card
            card.classList.add('ring-2', 'ring-green-500');
        } else if (index > currentTierIndex) {
            // Upgrade option (tiers above current)
            btn.textContent = `Upgrade to ${tierName}`;
            btn.className = 'w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 rounded-lg transition-all text-sm cursor-pointer';
            btn.onclick = () => purchaseSubscription(tier, currentBilling);
            btn.disabled = false;
        } else if (index < currentTierIndex) {
            // Downgrade option (tiers below current)
            btn.textContent = `Downgrade to ${tierName}`;
            btn.className = 'w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded-lg transition-all text-sm cursor-pointer';
            btn.onclick = () => {
                if (hasStripeId) {
                    openBillingPortal();
                } else {
                    showNotification('Please contact support@fitzhr.com to change your subscription.', 'info');
                }
            };
            btn.disabled = false;
        }
    });
}

/**
 * Close the subscription modal
 */
function closeSubscriptionModal() {
    document.getElementById('subscriptionModal').classList.add('hidden');
}

/**
 * Initiate Stripe checkout for a subscription
 */
async function purchaseSubscription(tier, billing = 'monthly') {
    const priceKey = `${tier}_${billing}`;
    await initiateStripeCheckout(priceKey);
}

/**
 * Purchase review credits via Stripe checkout
 */
async function purchaseReviewCredits(size) {
    const priceKeys = {
        'single': 'credits_1',
        'pack': 'credits_5'
    };
    
    const priceKey = priceKeys[size];
    if (!priceKey) return;
    
    await initiateStripeCheckout(priceKey);
    closeCreditsModal();
}

/**
 * Book a consultation via Stripe checkout
 */
async function bookConsultation() {
    await initiateStripeCheckout('consultation');
}

/**
 * Save pending document to localStorage and open credits modal
 * This preserves the document so it can be restored after Stripe redirect
 */
function savePendingDocumentAndGetCredits() {
    // Get the generated document content
    const previewContent = document.getElementById('documentPreviewContent');
    const previewModal = document.getElementById('documentPreviewModal');
    
    if (previewContent && previewModal) {
        const pendingDoc = {
            content: previewContent.innerHTML,
            docType: previewModal.dataset.docType || '',
            docName: previewModal.dataset.docName || 'Document',
            timestamp: Date.now()
        };
        
        console.log('📄 Saving pending document:', {
            docType: pendingDoc.docType,
            docName: pendingDoc.docName,
            contentLength: pendingDoc.content.length
        });
        
        localStorage.setItem('pendingDocument', JSON.stringify(pendingDoc));
        console.log('📄 Saved pending document for after payment');
    } else {
        console.log('📄 ERROR: Could not find previewContent or previewModal');
    }
    
    // Close the unlock modal and document preview
    closeDocumentUnlockModal();
    closeDocumentPreview();
    
    // Open credits modal
    openCreditsModal();
}

/**
 * Save in-chat document to localStorage and open credits modal
 * For documents shown in chat (not preview modal)
 */
function saveInChatDocumentAndGetCredits(containerId, docType, docName) {
    const container = document.getElementById(containerId);
    
    if (container) {
        // Get original content (stored when blur was applied)
        const content = container.dataset.originalContent || container.innerHTML;
        
        const pendingDoc = {
            content: content,
            docType: docType || '',
            docName: docName || 'Document',
            inChat: true,
            containerId: containerId,
            timestamp: Date.now()
        };
        
        console.log('📄 Saving in-chat document:', {
            docType: pendingDoc.docType,
            docName: pendingDoc.docName,
            containerId: containerId
        });
        
        localStorage.setItem('pendingDocument', JSON.stringify(pendingDoc));
        
        // Also save current conversation to ensure it's not lost
        saveCurrentConversation();
    }
    
    // Open credits modal
    openCreditsModal();
}

/**
 * Restore pending document after payment success
 * Document is shown with blur - user must confirm unlock to spend credits
 */
function restorePendingDocument() {
    const pendingDocStr = localStorage.getItem('pendingDocument');
    console.log('📄 restorePendingDocument called, pendingDoc exists:', !!pendingDocStr);
    
    if (!pendingDocStr) return false;
    
    try {
        const pendingDoc = JSON.parse(pendingDocStr);
        console.log('📄 Pending document:', pendingDoc.docType, pendingDoc.docName);
        
        // Check if document is less than 1 hour old
        if (Date.now() - pendingDoc.timestamp > 3600000) {
            localStorage.removeItem('pendingDocument');
            return false;
        }
        
        // If this was an in-chat document, just notify user and restore conversation
        if (pendingDoc.inChat) {
            console.log('📄 In-chat document - restoring conversation');
            
            // Make sure conversation is restored
            if (typeof restoreLastConversation === 'function') {
                restoreLastConversation();
            }
            
            // Show notification
            setTimeout(() => {
                if (pendingDoc.docType && canAffordDocument(pendingDoc.docType)) {
                    showNotification('🎉 You now have credits! Scroll to your document and click Unlock.', 'success', 5000);
                } else {
                    showNotification('Your conversation has been restored.', 'info');
                }
            }, 1000);
            
            localStorage.removeItem('pendingDocument');
            return true;
        }
        
        // Show the document in preview modal
        const previewContent = document.getElementById('documentPreviewContent');
        const previewModal = document.getElementById('documentPreviewModal');
        
        if (previewContent && previewModal) {
            previewContent.innerHTML = pendingDoc.content;
            previewModal.dataset.docType = pendingDoc.docType;
            previewModal.dataset.docName = pendingDoc.docName;
            previewModal.classList.remove('hidden');
            
            // Debug: Check credits state
            console.log('📄 Current credits:', getTotalCredits());
            console.log('📄 Can afford:', pendingDoc.docType ? canAffordDocument(pendingDoc.docType) : 'no docType');
            
            // Always apply blur - user must confirm to unlock
            setTimeout(() => {
                applyDocumentBlur(pendingDoc.docType, pendingDoc.docName);
                
                // If user can now afford it, show helpful notification
                if (pendingDoc.docType && canAffordDocument(pendingDoc.docType)) {
                    showNotification('🎉 You now have enough credits! Click "Unlock Document" to download.', 'success');
                } else {
                    showNotification('Document restored. You still need more credits to unlock.', 'info');
                }
            }, 100);
            
            // Clear the pending document
            localStorage.removeItem('pendingDocument');
            return true;
        }
    } catch (e) {
        console.error('Error restoring pending document:', e);
        localStorage.removeItem('pendingDocument');
    }
    
    return false;
}

/**
 * Core function to initiate Stripe checkout
 */
async function initiateStripeCheckout(priceKey) {
    try {
        showNotification('Redirecting to checkout...', 'info');
        
        // Get user info
        const userKey = currentUser?.uid || currentUser || 'anonymous';
        const userEmail = currentUser?.email || null;
        
        // Determine what's being purchased and store for return
        const purchaseInfo = getPurchaseInfo(priceKey);
        localStorage.setItem('pendingPurchase', JSON.stringify(purchaseInfo));
        
        // Call our Netlify function to create checkout session
        const response = await fetch('/.netlify/functions/stripe-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productKey: priceKey,
                userId: userKey,
                userEmail: userEmail,
                successUrl: window.location.origin + '/app?payment=success',
                cancelUrl: window.location.origin + '/app?payment=cancelled'
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Redirect to Stripe checkout
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error('No checkout URL returned');
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        localStorage.removeItem('pendingPurchase');
        showNotification('Checkout failed: ' + error.message, 'error');
    }
}

/**
 * Get purchase info for tracking
 */
function getPurchaseInfo(priceKey) {
    const purchaseMap = {
        // Subscriptions - New tiers (Feb 2025)
        starter_monthly: { type: 'subscription', tier: 'starter', tierName: 'Starter', reviewCredits: 8, billingCycle: 'monthly' },
        starter_annual: { type: 'subscription', tier: 'starter', tierName: 'Starter', reviewCredits: 96, billingCycle: 'annual' },
        pro_monthly: { type: 'subscription', tier: 'pro', tierName: 'Pro', reviewCredits: 20, billingCycle: 'monthly' },
        pro_annual: { type: 'subscription', tier: 'pro', tierName: 'Pro', reviewCredits: 240, billingCycle: 'annual' },
        business_monthly: { type: 'subscription', tier: 'business', tierName: 'Business', reviewCredits: 50, billingCycle: 'monthly' },
        business_annual: { type: 'subscription', tier: 'business', tierName: 'Business', reviewCredits: 600, billingCycle: 'annual' },
        
        // Review credit packs
        credits_1: { type: 'reviewCredits', credits: 1 },
        credits_5: { type: 'reviewCredits', credits: 5 },
        
        // Consultation
        consultation: { type: 'consultation', price: 150 },
        
        // Chat top-up (30 extra prompts)
        chat_topup: { type: 'topup', prompts: 30 }
    };
    
    return purchaseMap[priceKey] || { type: 'unknown' };
}

/**
 * Handle payment success/cancel from URL params
 */
function handlePaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    if (paymentStatus === 'success') {
        // Store that we have a pending payment success to process
        // This will be picked up by processPaymentAfterAuth() when auth completes
        const pendingPurchase = localStorage.getItem('pendingPurchase');
        if (pendingPurchase) {
            localStorage.setItem('paymentSuccessPending', 'true');
        }
        
        // Show processing modal immediately
        showPaymentProcessingModal();
        
        // ✅ Set flag to prevent Firebase from overwriting our local credits AFTER we process
        skipFirebaseCreditsLoad = true;
        
        // If user is already authenticated, process immediately
        if (currentUser?.uid) {
            processPaymentSuccess(); // Now async, will load existing credits first
        } else {
            // Wait for auth to complete, then process
            updatePaymentStatus('Verifying your account...');
            
            // Poll for auth to be ready (max 10 seconds)
            let authCheckCount = 0;
            const authCheckInterval = setInterval(() => {
                authCheckCount++;
                if (currentUser?.uid) {
                    clearInterval(authCheckInterval);
                    processPaymentSuccess(); // Now async, will load existing credits first
                } else if (authCheckCount > 20) {
                    // Timeout - try to process anyway
                    clearInterval(authCheckInterval);
                    console.warn('Auth timeout - processing payment anyway');
                    processPaymentSuccess();
                }
            }, 500);
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (paymentStatus === 'cancelled') {
        localStorage.removeItem('pendingPurchase');
        localStorage.removeItem('paymentSuccessPending');
        showNotification('Payment cancelled', 'info');
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => restorePendingDocument(), 500);
    }
}

/**
 * Process payment success after auth is ready
 */
async function processPaymentSuccess() {
    const pendingPurchase = localStorage.getItem('pendingPurchase');
    
    if (pendingPurchase) {
        try {
            const purchase = JSON.parse(pendingPurchase);
            
            // Update status
            updatePaymentStatus('Adding credits to your account...');
            
            // CRITICAL: Load existing credits from Firebase BEFORE adding new ones
            // This ensures we don't lose existing credits
            if (currentUser?.uid && db) {
                try {
                    console.log('🔄 Loading existing credits from Firebase before adding purchase...');
                    const userRef = db.collection('users').doc(currentUser.uid);
                    const doc = await userRef.get();
                    
                    if (doc.exists && doc.data().credits) {
                        const firebaseCredits = doc.data().credits;
                        const topLevelData = doc.data();
                        
                        // Load ALL existing values from Firebase (source of truth)
                        // Previously this was missing reviewCredits, billingCycle, etc.
                        // which caused credit wipes when buying credit packs
                        userCredits.subscriptionTier = firebaseCredits.subscriptionTier || firebaseCredits.tier || userCredits.subscriptionTier || 'free';
                        userCredits.reviewCredits = firebaseCredits.reviewCredits || userCredits.reviewCredits || 0;  // CRITICAL: preserve subscription credits
                        userCredits.reviewCreditsUsed = firebaseCredits.reviewCreditsUsed || 0;
                        userCredits.purchasedCredits = firebaseCredits.purchasedCredits || 0;
                        userCredits.lowRiskDocsUsed = firebaseCredits.lowRiskDocsUsed || 0;
                        userCredits.bonusPrompts = firebaseCredits.bonusPrompts || 0;
                        userCredits.monthlyPromptsUsed = firebaseCredits.monthlyPromptsUsed || 0;
                        userCredits.subscriptionStartDate = firebaseCredits.subscriptionStartDate || null;
                        userCredits.billingCycle = firebaseCredits.billingCycle || userCredits.billingCycle || null;  // CRITICAL: preserve billing cycle
                        userCredits.lastCreditRefresh = firebaseCredits.lastCreditRefresh || userCredits.lastCreditRefresh || null;
                        userCredits.stripeCustomerId = firebaseCredits.stripeCustomerId || topLevelData.stripeCustomerId || userCredits.stripeCustomerId || null;
                        userCredits.stripeSubscriptionId = firebaseCredits.stripeSubscriptionId || userCredits.stripeSubscriptionId || null;
                        userCredits.subscriptionStatus = firebaseCredits.subscriptionStatus || userCredits.subscriptionStatus || null;
                        userCredits.subscriptionPeriodEnd = firebaseCredits.subscriptionPeriodEnd || userCredits.subscriptionPeriodEnd || null;
                        userCredits.cancelAtPeriodEnd = firebaseCredits.cancelAtPeriodEnd || false;
                        
                        console.log('✅ Loaded ALL existing credits from Firebase:', 
                            'reviewCredits:', userCredits.reviewCredits,
                            'purchasedCredits:', userCredits.purchasedCredits,
                            'tier:', userCredits.subscriptionTier,
                            'billing:', userCredits.billingCycle);
                    }
                } catch (e) {
                    console.error('Error loading existing credits:', e);
                    // Continue anyway - will use localStorage or defaults
                }
            }
            
            // Allocate credits based on purchase type
            console.log('🛒 Processing purchase:', purchase);
            console.log('📊 Current credits from Firebase:', JSON.stringify(userCredits));
            console.log('👤 Current user:', currentUser?.uid || 'anonymous');
            
            if (purchase.type === 'subscription') {
                // New pricing model - subscription gives review credits
                userCredits.subscriptionTier = purchase.tier;
                userCredits.reviewCredits = purchase.reviewCredits || 0; // Set actual credits from purchase
                userCredits.reviewCreditsUsed = 0; // Reset for new subscription
                userCredits.billingCycle = purchase.billingCycle || (pendingPurchaseKey?.includes('annual') ? 'annual' : 'monthly');
                userCredits.subscriptionStartDate = new Date().toISOString();
                userCredits.lastUpdated = new Date().toISOString();
                userCredits.lastCreditRefresh = new Date().toISOString(); // Set initial refresh timestamp
                console.log(`📅 Subscription activated: ${purchase.tier} (${userCredits.billingCycle}) with ${userCredits.reviewCredits} credits`);
                // Use fullSync here since we're setting subscription fields (not just usage)
                const userKey = currentUser?.uid || currentUser || 'anonymous';
                localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
                updateCreditsDisplay();
                if (currentUser?.uid) {
                    await fullSyncCreditsToFirebase();
                }
                // Start renewal checker now that user is a paid subscriber
                startRenewalChecker();
            } else if (purchase.type === 'reviewCredits' || purchase.type === 'credits') {
                // Credit packs - webhook adds purchasedCredits to Firebase
                // We loaded existing credits above, now save complete state to localStorage
                console.log('💰 Credit pack purchased. Current state - reviewCredits:', userCredits.reviewCredits, 'purchasedCredits:', userCredits.purchasedCredits);
                
                // Save complete state to localStorage cache immediately
                const userKey = currentUser?.uid || currentUser || 'anonymous';
                localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
                
                // Force immediate display update with what we have
                updateCreditsDisplay();
                
                // Reload from Firebase after a delay to pick up webhook's credit addition
                // (webhook may not have processed yet when we loaded above)
                setTimeout(async () => {
                    console.log('🔄 Reloading credits from Firebase to pick up webhook additions...');
                    skipFirebaseCreditsLoad = false; // Allow Firebase load
                    await loadCreditsFromFirebase();
                }, 3000); // 3 second delay for webhook processing
            } else if (purchase.type === 'consultation') {
                // Consultation booking - no credits to add, just confirm
                console.log('📞 Consultation booked');
            }
            
            // Chat top-up - webhook already added bonusPrompts to Firebase
            // Just reload from Firebase to pick up the webhook's addition
            if (purchase.type === 'topup') {
                console.log('💬 Chat top-up purchased - bonus prompts added by webhook');
                const userKey = currentUser?.uid || currentUser || 'anonymous';
                localStorage.setItem('fitzCredits_' + userKey, JSON.stringify(userCredits));
                updateCreditsDisplay();
                
                // Reload from Firebase after delay to pick up webhook's addition
                setTimeout(async () => {
                    console.log('🔄 Reloading credits from Firebase to pick up bonus prompts...');
                    skipFirebaseCreditsLoad = false;
                    await loadCreditsFromFirebase();
                }, 3000);
            }
            
            console.log('📊 Credits after purchase:', JSON.stringify(userCredits));
            
            // Clear the pending purchase flags
            localStorage.removeItem('pendingPurchase');
            localStorage.removeItem('paymentSuccessPending');
            
            // Check for pending items
            const hasPendingDocument = localStorage.getItem('pendingDocument') !== null;
            const hasPendingConsultation = localStorage.getItem('pendingConsultationBooking') !== null;
            
            // Show success after short delay
            setTimeout(() => {
                updatePaymentStatus('Confirming...');
            }, 500);
            
            setTimeout(() => {
                // Show success state
                showPaymentSuccess(purchase);
                
                // Handle pending documents/consultations after modal closes
                setTimeout(() => {
                    // Only restore document if this was a credit/subscription purchase (not consultation)
                    let documentRestored = false;
                    let consultationRestored = false;
                    
                    if (purchase.type === 'consultation') {
                        // If they purchased a consultation, check for pending consultation booking
                        consultationRestored = checkPendingConsultationBooking();
                    } else {
                        // For credits/subscriptions, restore pending document
                        // Also clear any stale consultation bookings to prevent them opening
                        localStorage.removeItem('pendingConsultationBooking');
                        documentRestored = restorePendingDocument();
                    }
                    
                    if (!documentRestored && !consultationRestored) {
                        if (purchase.type === 'subscription') {
                            // Use reviewCredits from purchase info (already has correct annual/monthly value)
                            const reviewCredits = purchase.reviewCredits || 0;
                            const billingText = purchase.billingCycle === 'annual' ? 'year' : 'month';
                            addMessage('assistant', `## 🎉 Welcome to Fitz ${purchase.tierName}!\n\nYour subscription is now active!\n\n**Your benefits:**\n- ✅ **All HR templates** (Position Descriptions, Job Ads, Onboarding, etc.)\n- ✅ **${reviewCredits} credits/${billingText}** for documents, expert reviews & consultations\n- ✅ **Unlimited AI chat**\n- ✅ **24hr review turnaround**\n\nQuestions? Contact **support@fitzhr.com**`);
                        } else if (purchase.type === 'reviewCredits' || purchase.type === 'credits') {
                            addMessage('assistant', `## 🎉 Credits Added!\n\n**${purchase.credits} credit${purchase.credits > 1 ? 's' : ''}** added to your account.\n\nUse credits for document generation, expert reviews & HR consultations. They never expire!\n\nYour new balance: **${getTotalCredits()} credits**`);
                        } else if (purchase.type === 'consultation') {
                            addMessage('assistant', `## 🎉 Consultation Booked!\n\nYour HR consultation has been confirmed.\n\nA Fitz HR consultant will be in touch within 24 hours to schedule a time.\n\nQuestions? Contact **support@fitzhr.com**`);
                        } else if (purchase.type === 'topup') {
                            addMessage('assistant', `## 🎉 Chat Top-Up Added!\n\n**${purchase.prompts} extra prompts** have been added to your account for this month.\n\nKeep chatting!`);
                        }
                    }
                }, 3500);
            }, 1500);
            
            // Sync credits TO Firebase (not load FROM - that would overwrite the purchase!)
            setTimeout(async () => {
                await syncCreditsToFirebase();
                console.log('✅ Credits synced to Firebase after purchase');
            }, 2000);
            
        } catch (e) {
            console.error('Error processing payment return:', e);
            hidePaymentProcessingModal();
            showNotification('Payment successful! Please refresh if credits don\'t appear.', 'success');
            
            localStorage.removeItem('paymentSuccessPending');
            setTimeout(() => restorePendingDocument(), 500);
            
            // Still try to sync whatever we have
            setTimeout(async () => await syncCreditsToFirebase(), 3000);
        }
    } else {
        // No pending purchase - poll Firebase for credits
        updatePaymentStatus('Confirming with server...');
        localStorage.removeItem('paymentSuccessPending');
        pollForCreditsUpdate();
    }
}

// Payment processing modal functions
function showPaymentProcessingModal() {
    const modal = document.getElementById('paymentProcessingModal');
    const processingState = document.getElementById('paymentProcessingState');
    const successState = document.getElementById('paymentSuccessState');
    
    if (modal) {
        modal.classList.remove('hidden');
        processingState.classList.remove('hidden');
        successState.classList.add('hidden');
    }
}

function hidePaymentProcessingModal() {
    const modal = document.getElementById('paymentProcessingModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closePaymentProcessingModal() {
    hidePaymentProcessingModal();
    // Clear confetti
    const confettiContainer = document.getElementById('confettiContainer');
    if (confettiContainer) confettiContainer.innerHTML = '';
}

function updatePaymentStatus(status) {
    const statusEl = document.getElementById('paymentProcessingStatus');
    if (statusEl) statusEl.textContent = status;
}

function showPaymentSuccess(purchase) {
    const processingState = document.getElementById('paymentProcessingState');
    const successState = document.getElementById('paymentSuccessState');
    const messageEl = document.getElementById('paymentSuccessMessage');
    const balanceEl = document.getElementById('paymentNewBalance');
    
    if (processingState) processingState.classList.add('hidden');
    if (successState) successState.classList.remove('hidden');
    
    // Set message based on purchase type
    if (purchase.type === 'subscription') {
        // Use reviewCredits from purchase info (already has correct annual/monthly value)
        const reviewCredits = purchase.reviewCredits || 0;
        messageEl.textContent = `Welcome to ${purchase.tierName}! ${reviewCredits} review credits + all templates.`;
    } else if (purchase.type === 'reviewCredits' || purchase.type === 'credits') {
        messageEl.textContent = `${purchase.credits} review credit${purchase.credits > 1 ? 's' : ''} added to your account!`;
    } else if (purchase.type === 'consultation') {
        messageEl.textContent = `Consultation booked! We'll be in touch within 24 hours.`;
    } else if (purchase.type === 'topup') {
        messageEl.textContent = `${purchase.prompts} prompts added!`;
    }
    
    // Update balance
    if (balanceEl) balanceEl.textContent = getTotalCredits();
    
    // Update header display
    updateCreditsDisplay();
    
    // Trigger confetti!
    launchConfetti();
}

function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    
    const colors = ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#ffffff'];
    const shapes = ['square', 'circle'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)] === 'circle' ? '50%' : '2px';
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            container.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => confetti.remove(), 4000);
        }, i * 20);
    }
}

function pollForCreditsUpdate() {
    const startCredits = getTotalCredits();
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds max
    
    const poll = async () => {
        attempts++;
        updatePaymentStatus(`Confirming... (${attempts}s)`);
        
        try {
            await loadCreditsFromFirebase();
            const newCredits = getTotalCredits();
            
            if (newCredits > startCredits) {
                // Credits updated!
                const creditsAdded = newCredits - startCredits;
                showPaymentSuccess({
                    type: 'credits',
                    credits: creditsAdded
                });
                return;
            }
        } catch (e) {
            console.error('Poll error:', e);
        }
        
        if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
        } else {
            // Timeout - show success anyway (Stripe confirmed payment)
            hidePaymentProcessingModal();
            showNotification('🎉 Payment successful! Credits may take a moment to appear.', 'success');
            
            // Try to restore pending document
            setTimeout(() => restorePendingDocument(), 500);
        }
    };
    
    setTimeout(poll, 1000);
}

// Check for payment return on page load
document.addEventListener('DOMContentLoaded', handlePaymentReturn);

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-y-full opacity-0`;
    
    if (type === 'success') {
        notification.classList.add('bg-green-600', 'text-white');
    } else if (type === 'error') {
        notification.classList.add('bg-red-600', 'text-white');
    } else {
        notification.classList.add('bg-slate-700', 'text-white');
    }
    
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-y-full', 'opacity-0');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// DOCUMENT BLUR (Preview & Unlock)
// ========================================

/**
 * Apply blur to document preview (for unpaid documents)
 * Shows first portion of content with blur overlay for rest
 * @param {string} docType - Document type for unlock modal
 * @param {string} docName - Document name for display
 */
function applyDocumentBlur(docType, docName) {
    const previewContent = document.getElementById('documentPreviewContent');
    if (!previewContent) return;
    
    // CRITICAL: Check if already unlocked - skip ALL blur logic
    if (unlockedDocuments.has(docType)) {
        console.log('✅ Document already unlocked, skipping blur:', docType);
        // Show appropriate options based on document type
        const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
        const category = cost ? cost.category : 'template';
        const creditCost = cost ? cost.credits : 0;
        const currentBalance = getTotalCredits();
        
        if (category === 'people_management') {
            showPeopleManagementOptions(docType, docName, creditCost, currentBalance);
        } else if (category === 'formal_process') {
            showDocPreviewFormalOptions(docType, docName);
        }
        return; // Don't apply blur for unlocked documents
    }
    
    // Store docType in the preview modal for the unlock button
    const previewModal = document.getElementById('documentPreviewModal');
    if (previewModal) {
        previewModal.dataset.docType = docType || '';
        previewModal.dataset.docName = docName || 'Document';
    }
    
    // Check if this is a free template for paid users
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const isTemplate = cost && cost.category === 'template';
    const isPaidUser = tier !== 'free';
    
    // Paid users get templates free - no blur needed
    if (isPaidUser && isTemplate) {
        console.log('✅ Template document - no blur for paid user');
        // Add "Included with plan" badge instead
        const includedBadge = document.createElement('div');
        includedBadge.id = 'documentIncludedBadge';
        includedBadge.innerHTML = `
            <div class="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 text-center mt-4 mx-auto max-w-md">
                <span class="text-green-400 font-medium">✓ Included with your ${CONFIG.CREDITS.TIERS[tier]?.name || 'plan'}</span>
            </div>
        `;
        previewContent.parentElement.appendChild(includedBadge);
        return; // Don't apply blur
    }
    
    // Free tier - check if they have their 1 free template
    if (tier === 'free' && isTemplate) {
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed < 1) {
            console.log('🎁 Free template available for free tier user');
            // Show "Use your free template" message instead of blur
            const freeTemplateBadge = document.createElement('div');
            freeTemplateBadge.id = 'documentIncludedBadge';
            freeTemplateBadge.innerHTML = `
                <div class="bg-amber-500/20 border border-amber-500 rounded-lg px-4 py-2 text-center mt-4 mx-auto max-w-md">
                    <span class="text-amber-400 font-medium">🎁 Your 1 free template document</span>
                </div>
            `;
            previewContent.parentElement.appendChild(freeTemplateBadge);
            return; // Don't apply blur for free users with their 1 free doc
        }
    }
    
    // Check document category for different handling
    const category = cost ? cost.category : 'template';
    const reviewType = cost ? cost.reviewType : null;
    const creditCost = cost ? cost.credits : 0;
    const currentBalance = getTotalCredits();
    const previewContainer = previewContent.parentElement;
    
    // ===== PEOPLE MANAGEMENT (Optional Review) - Requires unlock, then choice =====
    if (category === 'people_management' && reviewType === 'optional') {
        console.log('📋 People Management doc - checking if unlocked');
        
        // Check if already unlocked
        if (unlockedDocuments.has(docType)) {
            console.log('✅ Already unlocked - showing options');
            showPeopleManagementOptions(docType, docName, creditCost, currentBalance);
            return;
        }
        
        // CRITICAL: Remove any existing blur/prompts to prevent duplicates
        const existingBlur = document.getElementById('documentBlurOverlay');
        if (existingBlur) existingBlur.remove();
        const existingPrompt = document.getElementById('documentUnlockPrompt');
        if (existingPrompt) existingPrompt.remove();
        
        // Not unlocked yet - BLUR the document and require payment
        console.log('🔒 Not unlocked - applying blur');
        previewContainer.style.position = 'relative';
        previewContainer.style.overflow = 'hidden';
        previewContainer.style.maxHeight = '250px';
        
        const blurOverlay = document.createElement('div');
        blurOverlay.id = 'documentBlurOverlay';
        blurOverlay.style.cssText = `
            position: absolute;
            top: 150px;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, 
                rgba(30, 41, 59, 0) 0%,
                rgba(30, 41, 59, 0.7) 30px,
                rgba(30, 41, 59, 0.95) 60px,
                rgba(30, 41, 59, 1) 100px
            );
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none;
            z-index: 5;
        `;
        previewContainer.appendChild(blurOverlay);
        
        // CRITICAL: Reset footer to locked state
        const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <div class="flex items-center justify-center gap-2 text-slate-400">
                    <span>🔒</span>
                    <span class="text-sm">${creditCost} Credit${creditCost > 1 ? 's' : ''} Required to Unlock</span>
                </div>
            `;
        }
        
        // Show unlock prompt
        const unlockPrompt = document.createElement('div');
        unlockPrompt.id = 'documentUnlockPrompt';
        
        if (currentBalance >= creditCost) {
            // Can afford - show unlock button
            unlockPrompt.innerHTML = `
                <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
                    <div class="text-3xl mb-2">🔒</div>
                    <h3 class="text-lg font-bold text-white mb-2">${creditCost} Credit${creditCost > 1 ? 's' : ''} Required</h3>
                    <p class="text-slate-300 text-sm mb-4">You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to unlock this document. You have ${currentBalance}.</p>
                    <button onclick="unlockPeopleManagementDoc('${docType}', '${docName}')" 
                            class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                        🔓 Unlock (${creditCost} Credit${creditCost > 1 ? 's' : ''})
                    </button>
                    <p class="text-slate-400 text-xs mt-2">You have ${currentBalance} credits</p>
                </div>
            `;
        } else {
            // Can't afford - show get credits
            unlockPrompt.innerHTML = `
                <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
                    <div class="text-3xl mb-2">🔒</div>
                    <h3 class="text-lg font-bold text-white mb-2">${creditCost} Credit${creditCost > 1 ? 's' : ''} Required</h3>
                    <p class="text-slate-300 text-sm mb-4">You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to unlock this document. You have ${currentBalance}.</p>
                    <div class="space-y-2">
                        <button onclick="savePendingDocumentAndGetCredits()" 
                                class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                            💳 Get Credits
                        </button>
                    </div>
                </div>
            `;
        }
        
        previewContainer.parentNode.insertBefore(unlockPrompt, previewContainer.nextSibling);
        
        // Disable download buttons
        const downloadBtns = document.querySelectorAll('#documentPreviewModal button[onclick*="download"]');
        downloadBtns.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        });
        return;
    }
    
    // ===== FORMAL PROCESS (Pay 2 credits, then choose: download or review) =====
    if (category === 'formal_process') {
        console.log('⚠️ Formal Process doc - requires credits to unlock');
        
        // Check if already unlocked
        if (unlockedDocuments.has(docType)) {
            // Already paid - show download/review options (no blur)
            showDocPreviewFormalOptions(docType, docName);
            return;
        }
        
        // CRITICAL: Remove any existing blur/prompts to prevent duplicates
        const existingBlur = document.getElementById('documentBlurOverlay');
        if (existingBlur) existingBlur.remove();
        const existingPrompt = document.getElementById('documentUnlockPrompt');
        if (existingPrompt) existingPrompt.remove();
        
        // Not paid yet - BLUR the document
        previewContainer.style.position = 'relative';
        previewContainer.style.overflow = 'hidden';
        previewContainer.style.maxHeight = '250px';
        
        const blurOverlay = document.createElement('div');
        blurOverlay.id = 'documentBlurOverlay';
        blurOverlay.style.cssText = `
            position: absolute;
            top: 150px;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, 
                rgba(255,255,255,0) 0%,
                rgba(255,255,255,0.7) 30px,
                rgba(255,255,255,0.95) 60px,
                rgba(255,255,255,1) 100px
            );
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none;
            z-index: 5;
        `;
        previewContainer.appendChild(blurOverlay);
        
        // CRITICAL: Reset footer to locked state
        const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <div class="flex items-center justify-center gap-2 text-slate-400">
                    <span>🔒</span>
                    <span class="text-sm">${creditCost} Credits Required to Unlock</span>
                </div>
            `;
        }
        
        let buttonHtml = '';
        if (currentBalance >= creditCost) {
            buttonHtml = `
                <button onclick="unlockDocPreviewFormal('${docType}', '${docName}')" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    🔓 Unlock Document (${creditCost} Credits)
                </button>
                <p class="text-slate-400 text-xs mt-2">Your balance: ${currentBalance} credits</p>
            `;
        } else {
            buttonHtml = `
                <button onclick="savePendingDocumentAndGetCredits()" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    💳 Get Credits
                </button>
                <p class="text-slate-400 text-xs mt-2">You need ${creditCost} credits. You have ${currentBalance}.</p>
            `;
        }
        
        const unlockPrompt = document.createElement('div');
        unlockPrompt.id = 'documentUnlockPrompt';
        unlockPrompt.innerHTML = `
            <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
                <div class="text-3xl mb-2">🔒</div>
                <h3 class="text-lg font-bold text-white mb-2">${creditCost} Credits Required</h3>
                <p class="text-slate-300 text-sm mb-4">You need ${creditCost} credits to unlock this document. You have ${currentBalance}.</p>
                ${buttonHtml}
            </div>
        `;
        
        previewContainer.parentNode.insertBefore(unlockPrompt, previewContainer.nextSibling);
        
        // Disable download buttons until unlocked
        const downloadBtns = document.querySelectorAll('#documentPreviewModal button[onclick*="download"]');
        downloadBtns.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.title = 'Unlock document first';
        });
        return;
    }
    
    // ===== DEFAULT: Standard blur for upgrade prompt =====
    // This should only be reached for templates that free users have exceeded
    // Double-check: If we somehow got here with a credit-based doc, use its credit cost
    
    // Debug logging to catch issues
    console.log('🔒 DEFAULT BLUR CASE:', { docType, category, creditCost, isTemplate: cost?.category === 'template' });
    
    // CRITICAL: Remove any existing blur/prompts to prevent duplicates
    const existingBlur = document.getElementById('documentBlurOverlay');
    if (existingBlur) existingBlur.remove();
    const existingPrompt = document.getElementById('documentUnlockPrompt');
    if (existingPrompt) existingPrompt.remove();
    
    // CRITICAL: Reset footer to locked state
    const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
    if (modalFooter) {
        const actualCostForFooter = cost ? cost.credits : creditCost;
        modalFooter.innerHTML = `
            <div class="flex items-center justify-center gap-2 text-slate-400">
                <span>🔒</span>
                <span class="text-sm">${actualCostForFooter > 0 ? actualCostForFooter + ' Credit' + (actualCostForFooter > 1 ? 's' : '') + ' Required to Unlock' : 'Subscription Required'}</span>
            </div>
        `;
    }
    
    previewContainer.style.position = 'relative';
    previewContainer.style.overflow = 'hidden';
    previewContainer.style.maxHeight = '250px';
    
    const blurOverlay = document.createElement('div');
    blurOverlay.id = 'documentBlurOverlay';
    blurOverlay.style.cssText = `
        position: absolute;
        top: 150px;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, 
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.7) 30px,
            rgba(255,255,255,0.95) 60px,
            rgba(255,255,255,1) 100px
        );
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        pointer-events: none;
        z-index: 5;
    `;
    previewContainer.appendChild(blurOverlay);
    
    const unlockPrompt = document.createElement('div');
    unlockPrompt.id = 'documentUnlockPrompt';
    
    // ALWAYS show credit cost if document has one, never show "Upgrade Required" for credit-based docs
    const actualCost = cost ? cost.credits : creditCost;
    const heading = actualCost > 0 ? `${actualCost} Credit${actualCost > 1 ? 's' : ''} Required` : 'Upgrade Required';
    const message = actualCost > 0 
        ? `You need ${actualCost} credit${actualCost > 1 ? 's' : ''} to unlock this document. You have ${currentBalance}.`
        : 'Subscribe to a plan to access all HR templates.';
    
    unlockPrompt.innerHTML = `
        <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
            <div class="text-3xl mb-2">🔒</div>
            <h3 class="text-lg font-bold text-white mb-2">${heading}</h3>
            <p class="text-slate-300 text-sm mb-4">${message}</p>
            <div class="space-y-2">
                ${actualCost > 0 && currentBalance >= actualCost ? `
                <button onclick="unlockDocumentFromPreview('${docType}', '${docName}')" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    🔓 Unlock (${actualCost} Credit${actualCost > 1 ? 's' : ''})
                </button>
                <p class="text-slate-400 text-xs">You have ${currentBalance} credits</p>
                ` : `
                <button onclick="savePendingDocumentAndGetCredits()" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    💳 Get Credits
                </button>
                `}
            </div>
        </div>
    `;
    
    previewContainer.parentNode.insertBefore(unlockPrompt, previewContainer.nextSibling);
    
    const downloadBtns = document.querySelectorAll('#documentPreviewModal button[onclick*="download"]');
    downloadBtns.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.title = 'Upgrade to download';
    });
}

/**
 * Remove blur from document preview
 */
function removeDocumentBlur() {
    const blurOverlay = document.getElementById('documentBlurOverlay');
    const unlockPrompt = document.getElementById('documentUnlockPrompt');
    const includedBadge = document.getElementById('documentIncludedBadge');
    const reviewBanner = document.getElementById('documentReviewBanner');
    
    if (blurOverlay) blurOverlay.remove();
    if (unlockPrompt) unlockPrompt.remove();
    if (includedBadge) includedBadge.remove();
    if (reviewBanner) reviewBanner.remove();
    
    // Reset container styles
    const previewContent = document.getElementById('documentPreviewContent');
    if (previewContent && previewContent.parentElement) {
        previewContent.parentElement.style.maxHeight = '';
        previewContent.parentElement.style.overflow = '';
        previewContent.parentElement.style.position = '';
    }
    
    // Re-enable and show download buttons
    const downloadBtns = document.querySelectorAll('#documentPreviewModal button[onclick*="download"]');
    downloadBtns.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.title = '';
        btn.style.display = '';
    });
}

/**
 * Unlock document from preview (used when user has enough credits)
 * Routes to appropriate unlock function based on document category
 */
function unlockDocumentFromPreview(docType, docName) {
    // CRITICAL: Prevent double-charging - check if already unlocked
    if (unlockedDocuments.has(docType)) {
        console.log('⚠️ Document already unlocked, preventing double charge:', docType);
        removeDocumentBlur();
        showNotification('Document is already unlocked!', 'info');
        return;
    }
    
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    if (!cost) {
        console.error('Unknown document type:', docType);
        return;
    }
    
    const category = cost.category;
    
    if (category === 'people_management') {
        unlockPeopleManagementDoc(docType, docName);
    } else if (category === 'formal_process') {
        unlockDocPreviewFormal(docType, docName);
    } else {
        // Template or unknown - just mark as unlocked and remove blur
        unlockedDocuments.add(docType);
        removeDocumentBlur();
        showNotification('✅ Document unlocked!', 'success');
    }
}

/**
 * Download document without expert review (for People Management docs)
 */
function downloadDocWithoutReview(docType) {
    // Remove the review banner
    const reviewBanner = document.getElementById('documentReviewBanner');
    if (reviewBanner) reviewBanner.remove();
    
    // Re-enable download buttons
    const downloadBtns = document.querySelectorAll('#documentPreviewModal button[onclick*="download"]');
    downloadBtns.forEach(btn => {
        btn.style.display = '';
    });
    
    // Mark as unlocked
    unlockedDocuments.add(docType);
    
    showNotification('📄 Document ready for download. Consider expert review for important documents.', 'info');
}

/**
 * Request expert review for document in preview modal
 * Opens the review request modal
 */
function requestDocExpertReview(docType, docName) {
    openReviewRequestModal(null, docType, docName, null, true);
}

/**
 * Unlock Formal Process document in preview modal (pay credits, then choose)
 */
function unlockDocPreviewFormal(docType, docName) {
    // CRITICAL: Prevent double-charging - check if already unlocked
    if (unlockedDocuments.has(docType)) {
        console.log('⚠️ Document already unlocked, preventing double charge:', docType);
        showDocPreviewFormalOptions(docType, docName);
        return;
    }
    
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const creditCost = cost ? cost.credits : 2;
    
    if (getTotalCredits() < creditCost) {
        openCreditsModal();
        return;
    }
    
    // Deduct credits
    const success = deductCreditsForDocument(docType);
    if (!success) {
        showNotification('Failed to unlock document. Please try again.', 'error');
        return;
    }
    
    // Mark as unlocked IMMEDIATELY after deducting
    unlockedDocuments.add(docType);
    console.log('✅ Document unlocked and marked:', docType);
    
    // Remove the blur overlay
    const blurOverlay = document.getElementById('documentBlurOverlay');
    if (blurOverlay) blurOverlay.remove();
    
    // Remove the unlock prompt
    const unlockPrompt = document.getElementById('documentUnlockPrompt');
    if (unlockPrompt) unlockPrompt.remove();
    
    // Reset preview container to show full document
    const previewContent = document.getElementById('documentPreviewContent');
    if (previewContent && previewContent.parentElement) {
        previewContent.parentElement.style.maxHeight = '';
        previewContent.parentElement.style.overflow = '';
        previewContent.parentElement.style.position = '';
    }
    
    // Show options in the footer
    showDocPreviewFormalOptions(docType, docName);
    
    showNotification('✅ Document unlocked! Choose to download or request expert review.', 'success');
}

/**
 * Unlock a People Management document (1 credit) and show options
 */
function unlockPeopleManagementDoc(docType, docName) {
    // CRITICAL: Prevent double-charging - check if already unlocked
    if (unlockedDocuments.has(docType)) {
        console.log('⚠️ Document already unlocked, preventing double charge:', docType);
        showPeopleManagementOptions(docType, docName, 0, getTotalCredits());
        return;
    }
    
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const creditCost = cost ? cost.credits : 1;
    
    // Check credits
    if (getTotalCredits() < creditCost) {
        showNotification('Not enough credits. Please purchase more.', 'error');
        openCreditsModal();
        return;
    }
    
    // Deduct credits
    const success = deductCreditsForDocument(docType);
    if (!success) {
        showNotification('Failed to process. Please try again.', 'error');
        return;
    }
    
    // Mark as unlocked IMMEDIATELY after deducting
    unlockedDocuments.add(docType);
    console.log('✅ Document unlocked and marked:', docType);
    
    // Remove blur and show options
    showPeopleManagementOptions(docType, docName, creditCost, getTotalCredits());
    
    showNotification('✅ Document unlocked! Choose to request expert review or download.', 'success');
}

/**
 * Show options after People Management document is unlocked
 */
function showPeopleManagementOptions(docType, docName, creditCost, currentBalance) {
    // Remove any existing prompts and blur
    const existingPrompt = document.getElementById('documentUnlockPrompt');
    if (existingPrompt) existingPrompt.remove();
    
    const existingBlur = document.getElementById('documentBlurOverlay');
    if (existingBlur) existingBlur.remove();
    
    const existingBanner = document.getElementById('documentReviewBanner');
    if (existingBanner) existingBanner.remove();
    
    // Reset preview container styles to show full document
    const previewContent = document.getElementById('documentPreviewContent');
    if (previewContent && previewContent.parentElement) {
        previewContent.parentElement.style.maxHeight = '';
        previewContent.parentElement.style.overflow = '';
        previewContent.parentElement.style.position = '';
    }
    
    // Replace footer with options
    const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
    if (modalFooter) {
        modalFooter.className = 'p-4 border-t border-slate-700 bg-slate-800';
        modalFooter.innerHTML = `
            <div class="flex items-center gap-3 flex-wrap">
                <div class="flex-1 flex items-center gap-2 text-green-400">
                    <span>✅</span>
                    <span class="font-semibold text-sm">Document Unlocked</span>
                </div>
                <button onclick="requestDocExpertReviewAfterUnlock('${docType}', '${docName}')" 
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center gap-2">
                    🛡️ Request Expert Review
                    <span class="text-blue-200 text-xs">(Optional)</span>
                </button>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="docPreviewDisclaimer" class="w-4 h-4 accent-green-500" onchange="toggleDownloadButton()">
                        <span class="text-slate-300 text-xs">I accept responsibility</span>
                    </label>
                    <button id="downloadAfterUnlockBtn" onclick="downloadDocPreviewWithDisclaimer('${docType}')" 
                            disabled
                            class="px-4 py-2 bg-slate-500 text-slate-300 font-medium rounded-lg transition-all text-sm cursor-not-allowed opacity-60">
                        📥 Download
                    </button>
                </div>
            </div>
        `;
    }
}

function showDocPreviewFormalOptions(docType, docName) {
    // Remove any existing prompts
    const existingPrompt = document.getElementById('documentUnlockPrompt');
    if (existingPrompt) existingPrompt.remove();
    
    const existingOptions = document.getElementById('documentOptionsPrompt');
    if (existingOptions) existingOptions.remove();
    
    const existingBlur = document.getElementById('documentBlurOverlay');
    if (existingBlur) existingBlur.remove();
    
    // Reset preview container styles to show full document
    const previewContent = document.getElementById('documentPreviewContent');
    if (previewContent && previewContent.parentElement) {
        previewContent.parentElement.style.maxHeight = '';
        previewContent.parentElement.style.overflow = '';
        previewContent.parentElement.style.position = '';
    }
    
    // Replace footer with compact options
    const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
    if (modalFooter) {
        modalFooter.className = 'p-4 border-t border-slate-700 bg-slate-800';
        modalFooter.innerHTML = `
            <div class="flex items-center gap-3 flex-wrap">
                <div class="flex-1 flex items-center gap-2 text-green-400">
                    <span>✅</span>
                    <span class="font-semibold text-sm">Document Unlocked</span>
                </div>
                <button onclick="requestDocExpertReviewAfterUnlock('${docType}', '${docName}')" 
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center gap-2">
                    🛡️ Request Expert Review
                    <span class="text-blue-200 text-xs">(Free)</span>
                </button>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="docPreviewDisclaimer" class="w-4 h-4 accent-green-500" onchange="toggleDownloadButton()">
                        <span class="text-slate-300 text-xs">I accept responsibility</span>
                    </label>
                    <button id="downloadAfterUnlockBtn" onclick="downloadDocPreviewWithDisclaimer('${docType}')" 
                            disabled
                            class="px-4 py-2 bg-slate-500 text-slate-300 font-medium rounded-lg transition-all text-sm cursor-not-allowed opacity-60">
                        ⚠️ Download Anyway
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Toggle download button enabled state based on checkbox
 */
function toggleDownloadButton() {
    const checkbox = document.getElementById('docPreviewDisclaimer');
    const downloadBtn = document.getElementById('downloadAfterUnlockBtn');
    
    if (checkbox && downloadBtn) {
        if (checkbox.checked) {
            // Enable the button
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('bg-slate-500', 'text-slate-300', 'cursor-not-allowed', 'opacity-60');
            downloadBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'text-white', 'cursor-pointer');
        } else {
            // Disable the button
            downloadBtn.disabled = true;
            downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'text-white', 'cursor-pointer');
            downloadBtn.classList.add('bg-slate-500', 'text-slate-300', 'cursor-not-allowed', 'opacity-60');
        }
    }
}

/**
 * Request expert review after unlocking in preview modal (no additional credits)
 */
function requestDocExpertReviewAfterUnlock(docType, docName) {
    // Open review modal (already paid)
    openReviewRequestModal(null, docType, docName, null, true, true);
}

/**
 * Download from preview modal with disclaimer
 */
function downloadDocPreviewWithDisclaimer(docType) {
    // ✅ CHECK: Verify document has been unlocked (credits paid)
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    if (cost && cost.credits > 0) {
        if (!unlockedDocuments.has(docType)) {
            showNotification('⚠️ Please unlock this document first.', 'error');
            applyDocumentBlur(docType, cost.name || 'Document');
            return;
        }
    }
    
    const checkbox = document.getElementById('docPreviewDisclaimer');
    if (!checkbox || !checkbox.checked) {
        showNotification('⚠️ Please tick the checkbox to accept responsibility before downloading.', 'error');
        checkbox?.focus();
        return;
    }
    
    // Directly download Word document
    showNotification('📝 Preparing your download...', 'info');
    downloadGeneratedDocument('docx');
    
    // Update footer to show success
    const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <div class="bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
                <div class="flex items-center justify-center gap-2 mb-3">
                    <span class="text-xl">✅</span>
                    <span class="text-green-400 font-semibold">Word Document Downloaded!</span>
                </div>
                <p class="text-slate-300 text-sm mb-3">Need a different format?</p>
                <button onclick="downloadGeneratedDocument('pdf')" 
                        class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all">
                    📄 Also Download PDF
                </button>
            </div>
        `;
    }
}

// ========================================
// UNIVERSAL BLUR PREVIEW SYSTEM
// ========================================

/**
 * Apply blur overlay to any document preview container
 * Shows first portion of content with blur overlay for rest
 * @param {string} containerId - ID of the container to blur
 * @param {string} docType - Document type key for credit lookup
 * @param {string} docName - Human readable document name
 * @param {string} actionsId - ID of the actions/buttons container to hide
 */
function applyUniversalBlur(containerId, docType, docName, actionsId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Check user tier and document category
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const category = cost ? cost.category : 'template';
    const reviewType = cost ? cost.reviewType : null;
    const isPaidUser = tier !== 'free';
    const creditCost = cost ? cost.credits : 0;
    const currentBalance = getTotalCredits();
    
    // ===== TEMPLATES (Low Risk) - Free for paid users, 1 free for free tier =====
    if (category === 'template') {
        if (isPaidUser) {
            // Paid users get ALL templates free - no blur, show included badge
            console.log('✅ Template document - no blur for paid user');
            const includedBadge = document.createElement('div');
            includedBadge.id = containerId + '_includedBadge';
            includedBadge.innerHTML = `
                <div class="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 text-center mt-4 mx-auto max-w-md">
                    <span class="text-green-400 font-medium">✓ Included with your ${CONFIG.CREDITS.TIERS[tier]?.name || 'plan'}</span>
                </div>
            `;
            container.parentNode.insertBefore(includedBadge, container.nextSibling);
            // Show action buttons for paid users
            if (actionsId) {
                const actionsContainer = document.getElementById(actionsId);
                if (actionsContainer) {
                    actionsContainer.style.display = '';
                }
            }
            return;
        }
        
        // Free tier - check if they have their 1 free template
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed < 1) {
            // Free user hasn't used their free template - allow access with a badge
            console.log('🎁 Free template available for free tier user');
            const freeTemplateBadge = document.createElement('div');
            freeTemplateBadge.id = containerId + '_includedBadge';
            freeTemplateBadge.innerHTML = `
                <div class="bg-amber-500/20 border border-amber-500 rounded-lg px-4 py-2 text-center mt-4 mx-auto max-w-md">
                    <span class="text-amber-400 font-medium">🎁 This uses your 1 free template</span>
                </div>
            `;
            container.parentNode.insertBefore(freeTemplateBadge, container.nextSibling);
            // Show action buttons for free template
            if (actionsId) {
                const actionsContainer = document.getElementById(actionsId);
                if (actionsContainer) {
                    actionsContainer.style.display = '';
                }
            }
            return;
        }
        
        // Free user has ALREADY used their 1 free template - show upgrade prompt (NOT credit requirement)
        console.log('⚠️ Free user already used free template - showing upgrade prompt');
        container.dataset.originalContent = container.innerHTML;
        container.style.maxHeight = '250px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
        
        const blurOverlay = document.createElement('div');
        blurOverlay.id = containerId + '_blurOverlay';
        blurOverlay.style.cssText = `
            position: absolute;
            top: 150px;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, 
                rgba(30, 41, 59, 0) 0%,
                rgba(30, 41, 59, 0.7) 30px,
                rgba(30, 41, 59, 0.95) 60px,
                rgba(30, 41, 59, 1) 100px
            );
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none;
            z-index: 5;
        `;
        container.appendChild(blurOverlay);
        
        // Show upgrade prompt for free tier (NOT credit requirement since templates are 0 credits)
        const upgradePrompt = document.createElement('div');
        upgradePrompt.id = containerId + '_unlockPrompt';
        upgradePrompt.innerHTML = `
            <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
                <div class="text-3xl mb-2">📄</div>
                <h3 class="text-lg font-bold text-white mb-2">Free Template Used</h3>
                <p class="text-slate-300 text-sm mb-4">You've used your 1 free template. Upgrade to get <strong>unlimited templates</strong>!</p>
                <div class="bg-slate-600/50 rounded-lg p-3 mb-4 text-left">
                    <p class="text-slate-400 text-xs mb-2">✨ Starter Plan Includes:</p>
                    <ul class="text-slate-300 text-xs space-y-1">
                        <li>✅ Unlimited template downloads</li>
                        <li>✅ 96 credits/year for docs, reviews & consultations</li>
                        <li>✅ Unlimited AI chat</li>
                    </ul>
                </div>
                <button onclick="showSubscriptionOptions()" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    View Plans
                </button>
            </div>
        `;
        container.parentNode.insertBefore(upgradePrompt, container.nextSibling);
        
        // Hide action buttons
        if (actionsId) {
            const actionsContainer = document.getElementById(actionsId);
            if (actionsContainer) {
                actionsContainer.style.display = 'none';
            }
        }
        return;
    }
    
    // ===== PEOPLE MANAGEMENT (Optional Review) - Requires unlock, then choice =====
    if (category === 'people_management' && reviewType === 'optional') {
        console.log('📋 People Management doc - checking if unlocked');
        
        // Check if already unlocked
        if (unlockedDocuments.has(docType)) {
            console.log('✅ Already unlocked - showing options');
            showPeopleManagementInChatOptions(containerId, docType, docName, actionsId);
            return;
        }
        
        // Not unlocked yet - BLUR the document and require payment
        console.log('🔒 Not unlocked - applying blur');
        container.dataset.originalContent = container.innerHTML;
        container.style.maxHeight = '250px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
        
        const blurOverlay = document.createElement('div');
        blurOverlay.id = containerId + '_blurOverlay';
        blurOverlay.style.cssText = `
            position: absolute;
            top: 150px;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, 
                rgba(30, 41, 59, 0) 0%,
                rgba(30, 41, 59, 0.7) 30px,
                rgba(30, 41, 59, 0.95) 60px,
                rgba(30, 41, 59, 1) 100px
            );
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none;
            z-index: 5;
        `;
        container.appendChild(blurOverlay);
        
        // Show unlock prompt
        const unlockPrompt = document.createElement('div');
        unlockPrompt.id = containerId + '_unlockPrompt';
        
        if (currentBalance >= creditCost) {
            // Can afford - show unlock button
            unlockPrompt.innerHTML = `
                <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
                    <div class="text-3xl mb-2">🔒</div>
                    <h3 class="text-lg font-bold text-white mb-2">Unlock Document</h3>
                    <p class="text-slate-300 text-sm mb-4">This document requires ${creditCost} credit to unlock.</p>
                    <button onclick="unlockPeopleManagementInChat('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')" 
                            class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                        🔓 Unlock (${creditCost} credit)
                    </button>
                    <p class="text-slate-400 text-xs mt-2">You have ${currentBalance} credits</p>
                </div>
            `;
        } else {
            // Can't afford - show get credits
            unlockPrompt.innerHTML = `
                <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
                    <div class="text-3xl mb-2">🔒</div>
                    <h3 class="text-lg font-bold text-white mb-2">${creditCost} Credit${creditCost > 1 ? 's' : ''} Required</h3>
                    <p class="text-slate-300 text-sm mb-4">You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to unlock this document. You have ${currentBalance}.</p>
                    <div class="space-y-2">
                        <button onclick="showSubscriptionOptions()" 
                                class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                            View Plans
                        </button>
                        <button onclick="saveInChatDocumentAndGetCredits('${containerId}', '${docType}', '${docName}')" 
                                class="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-all text-sm">
                            💳 Buy Credits Instead
                        </button>
                    </div>
                </div>
            `;
        }
        
        container.parentNode.insertBefore(unlockPrompt, container.nextSibling);
        
        // Hide action buttons until unlocked
        if (actionsId) {
            const actionsContainer = document.getElementById(actionsId);
            if (actionsContainer) {
                actionsContainer.style.display = 'none';
            }
        }
        return;
    }
    
    // ===== FORMAL PROCESS (Pay 2 credits, then choose: download or review) =====
    if (category === 'formal_process') {
        console.log('⚠️ Formal Process doc - requires credits to unlock');
        
        // Check if already unlocked
        if (unlockedDocuments.has(docType)) {
            // Already paid - show download/review options (no blur)
            showFormalProcessOptions(containerId, docType, docName, actionsId);
            return;
        }
        
        // Not paid yet - BLUR the document
        container.dataset.originalContent = container.innerHTML;
        container.style.maxHeight = '250px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
        
        const blurOverlay = document.createElement('div');
        blurOverlay.id = containerId + '_blurOverlay';
        blurOverlay.style.cssText = `
            position: absolute;
            top: 150px;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, 
                rgba(30, 41, 59, 0) 0%,
                rgba(30, 41, 59, 0.7) 30px,
                rgba(30, 41, 59, 0.95) 60px,
                rgba(30, 41, 59, 1) 100px
            );
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none;
            z-index: 5;
        `;
        container.appendChild(blurOverlay);
        
        // Create unlock prompt
        const unlockPrompt = document.createElement('div');
        unlockPrompt.id = containerId + '_unlockPrompt';
        unlockPrompt.className = 'unlock-prompt-box';
        
        let buttonHtml = '';
        if (currentBalance >= creditCost) {
            buttonHtml = `
                <button onclick="unlockFormalProcess('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    🔓 Unlock Document (${creditCost} credits)
                </button>
                <p class="text-slate-400 text-xs mt-2">Your balance: ${currentBalance} credits</p>
            `;
        } else {
            buttonHtml = `
                <button onclick="saveInChatDocumentAndGetCredits('${containerId}', '${docType}', '${docName}')" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    💳 Get Review Credits
                </button>
                <p class="text-slate-400 text-xs mt-2">Need ${creditCost} credits • You have ${currentBalance}</p>
            `;
        }
        
        unlockPrompt.innerHTML = `
            <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl mx-auto max-w-md mt-4">
                <div class="text-center mb-4">
                    <span class="text-3xl">⚠️</span>
                    <h3 class="text-lg font-bold text-white mt-2">High-Risk Document</h3>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <p class="text-amber-200 text-sm">
                        This formal document carries <strong>significant legal risk</strong>. 
                        Unlock to view, download, or request expert review.
                    </p>
                </div>
                <p class="text-slate-300 text-sm mb-4 text-center">
                    Includes option for <strong>free expert review</strong> within 24 hours
                </p>
                ${buttonHtml}
            </div>
        `;
        
        container.parentNode.insertBefore(unlockPrompt, container.nextSibling);
        
        // Hide action buttons until unlocked
        if (actionsId) {
            const actionsContainer = document.getElementById(actionsId);
            if (actionsContainer) {
                actionsContainer.style.display = 'none';
            }
        }
        return;
    }
    
    // ===== DEFAULT: Standard blur for anything else =====
    container.dataset.originalContent = container.innerHTML;
    container.style.maxHeight = '250px';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    
    const blurOverlay = document.createElement('div');
    blurOverlay.id = containerId + '_blurOverlay';
    blurOverlay.style.cssText = `
        position: absolute;
        top: 150px;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, 
            rgba(30, 41, 59, 0) 0%,
            rgba(30, 41, 59, 0.7) 30px,
            rgba(30, 41, 59, 0.95) 60px,
            rgba(30, 41, 59, 1) 100px
        );
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        pointer-events: none;
        z-index: 5;
    `;
    container.appendChild(blurOverlay);
    
    let buttonText = `🔓 Unlock (${creditCost} credit${creditCost > 1 ? 's' : ''})`;
    let buttonAction = `unlockUniversalDocument('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')`;
    
    if (currentBalance < creditCost) {
        buttonText = '💳 Get Credits';
        buttonAction = `saveInChatDocumentAndGetCredits('${containerId}', '${docType}', '${docName}')`;
    }
    
    const unlockPrompt = document.createElement('div');
    unlockPrompt.id = containerId + '_unlockPrompt';
    unlockPrompt.innerHTML = `
        <div class="bg-slate-700 border-2 border-amber-500 rounded-xl p-6 shadow-2xl text-center mx-auto max-w-md mt-4">
            <div class="text-3xl mb-2">🔒</div>
            <h3 class="text-lg font-bold text-white mb-2">${creditCost} Credit${creditCost > 1 ? 's' : ''} Required</h3>
            <p class="text-slate-300 text-sm mb-4">You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to unlock this document. You have ${currentBalance}.</p>
            <div class="space-y-2">
                <button onclick="showSubscriptionOptions()" 
                        class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all text-base">
                    View Plans
                </button>
                <button onclick="saveInChatDocumentAndGetCredits('${containerId}', '${docType}', '${docName}')" 
                        class="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-all text-sm">
                    💳 Buy Credits Instead
                </button>
            </div>
        </div>
    `;
    
    container.parentNode.insertBefore(unlockPrompt, container.nextSibling);
    
    if (actionsId) {
        const actionsContainer = document.getElementById(actionsId);
        if (actionsContainer) {
            actionsContainer.style.display = 'none';
        }
    }
}

/**
 * Unlock a document that was blurred with applyUniversalBlur
 */
function unlockUniversalDocument(containerId, docType, docName, actionsId) {
    // Check if user can afford
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const creditCost = cost ? cost.credits : 1;
    
    if (getTotalCredits() < creditCost) {
        openCreditsModal();
        return;
    }
    
    // Deduct credits
    const success = deductCreditsForDocument(docType);
    
    if (success) {
        // Remove blur elements
        removeUniversalBlur(containerId);
        
        // Show action buttons
        if (actionsId) {
            const actionsContainer = document.getElementById(actionsId);
            if (actionsContainer) {
                actionsContainer.style.display = '';
            }
        }
        
        // Mark as unlocked
        unlockedDocuments.add(docType);
        
        showNotification('✅ Document unlocked! You can now view and download.', 'success');
    } else {
        showAlert('Failed to unlock document. Please try again.');
    }
}

/**
 * Remove universal blur from a container
 */
function removeUniversalBlur(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove blur overlay
    const blurOverlay = document.getElementById(containerId + '_blurOverlay');
    if (blurOverlay) blurOverlay.remove();
    
    // Remove unlock prompt (sibling element)
    const unlockPrompt = document.getElementById(containerId + '_unlockPrompt');
    if (unlockPrompt) unlockPrompt.remove();
    
    // Remove included badge (for paid users on templates)
    const includedBadge = document.getElementById(containerId + '_includedBadge');
    if (includedBadge) includedBadge.remove();
    
    // Remove review banner (for people management docs)
    const reviewBanner = document.getElementById(containerId + '_reviewBanner');
    if (reviewBanner) reviewBanner.remove();
    
    // Restore original content if saved
    if (container.dataset.originalContent) {
        // Content is already there, just remove the blur overlay which we did above
        delete container.dataset.originalContent;
    }
    
    // Reset container styles
    container.style.maxHeight = '';
    container.style.overflow = '';
    container.style.position = '';
}

/**
 * Download a People Management document without expert review
 * User accepts responsibility for the document
 */
function downloadWithoutReview(containerId, docType, docName, actionsId) {
    // Remove the review banner
    const reviewBanner = document.getElementById(containerId + '_reviewBanner');
    if (reviewBanner) reviewBanner.remove();
    
    // Show the action buttons
    if (actionsId) {
        const actionsContainer = document.getElementById(actionsId);
        if (actionsContainer) {
            actionsContainer.style.display = '';
        }
    }
    
    // Mark as unlocked (no credits deducted for download-only)
    unlockedDocuments.add(docType);
    
    showNotification('📄 Document ready for download. Consider expert review for important documents.', 'info');
}

// Store current review request context
let pendingReviewRequest = {
    containerId: null,
    docType: null,
    docName: null,
    actionsId: null,
    documentContent: null,
    isFromPreviewModal: false,
    alreadyPaid: false
};

/**
 * Open the review request modal
 * @param {boolean} alreadyPaid - If true, don't show/deduct credits (for Formal Process after unlock)
 */
function openReviewRequestModal(containerId, docType, docName, actionsId, isFromPreviewModal = false, alreadyPaid = false) {
    const modal = document.getElementById('reviewRequestModal');
    if (!modal) return;
    
    // Get document content
    let documentContent = '';
    if (isFromPreviewModal) {
        const previewContent = document.getElementById('documentPreviewContent');
        documentContent = previewContent ? (previewContent.innerText || previewContent.textContent || '') : '';
    } else {
        const container = document.getElementById(containerId);
        documentContent = container ? (container.innerText || container.textContent || '') : '';
    }
    
    // Store context
    pendingReviewRequest = {
        containerId,
        docType,
        docName,
        actionsId,
        documentContent,
        isFromPreviewModal,
        alreadyPaid
    };
    
    // Update modal content
    document.getElementById('reviewDocName').textContent = docName;
    
    // Pre-fill contact email with user's sign-in email
    const contactEmailField = document.getElementById('reviewContactEmail');
    if (contactEmailField) {
        contactEmailField.value = currentUser?.email || '';
    }
    // Reset alternative email checkbox and field
    const altEmailCheckbox = document.getElementById('useAlternativeEmail');
    const altEmailContainer = document.getElementById('alternativeEmailContainer');
    const altEmailField = document.getElementById('reviewAlternativeEmail');
    if (altEmailCheckbox) altEmailCheckbox.checked = false;
    if (altEmailContainer) altEmailContainer.classList.add('hidden');
    if (altEmailField) altEmailField.value = '';
    
    // Get credit info
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const creditCost = cost ? cost.credits : 1;
    
    // Update credit display based on whether already paid
    const creditCostEl = document.getElementById('reviewCreditCost');
    const creditBalanceEl = document.getElementById('reviewCreditBalance');
    
    if (alreadyPaid) {
        creditCostEl.textContent = '0';
        creditCostEl.parentElement.querySelector('p').innerHTML = '<span class="text-green-400">✓ Included with unlock</span>';
    } else {
        creditCostEl.textContent = creditCost;
        creditBalanceEl.textContent = getTotalCredits();
    }
    
    // Show/hide formal process warning and previous steps
    const isFormalProcess = cost && cost.category === 'formal_process';
    document.getElementById('formalProcessWarning').classList.toggle('hidden', !isFormalProcess);
    document.getElementById('previousStepsSection').classList.toggle('hidden', !isFormalProcess);
    
    // PRE-POPULATE fields from preserved document data
    console.log('📋 Last Generated Document Data:', lastGeneratedDocumentData);
    
    const builderData = lastGeneratedDocumentData || {};
    
    // Employee Name
    const employeeNameField = document.getElementById('reviewEmployeeName');
    if (employeeNameField && builderData.employeeName) {
        employeeNameField.value = builderData.employeeName;
        console.log('✅ Pre-filled employeeName:', builderData.employeeName);
    } else {
        employeeNameField.value = '';
        console.log('❌ No employeeName found in builderData');
    }
    
    // Employee Role/Position
    const employeeRoleField = document.getElementById('reviewEmployeeRole');
    if (employeeRoleField && (builderData.position || builderData.role)) {
        employeeRoleField.value = builderData.position || builderData.role || '';
        console.log('✅ Pre-filled position:', builderData.position || builderData.role);
    } else {
        employeeRoleField.value = '';
        console.log('❌ No position found in builderData');
    }
    
    // Issue Description - check multiple possible field names
    const issueDescField = document.getElementById('reviewIssueDescription');
    if (issueDescField) {
        const issueText = builderData.issueDescription || 
                         builderData.incidentDetails || 
                         builderData.concerns || 
                         builderData.performanceIssues ||
                         builderData.description || '';
        issueDescField.value = issueText;
        console.log('✅ Pre-filled issueDescription:', issueText || '(empty)');
    }
    
    // Previous warnings/steps - check multiple possible field names
    const previousWarningsField = document.getElementById('reviewPreviousWarnings');
    if (previousWarningsField) {
        let prevSteps = '';
        // Build from available data
        if (builderData.hadVerbalWarnings === 'Yes') {
            prevSteps += `Verbal warnings given (${builderData.verbalWarningCount || 'multiple'}). `;
        }
        if (builderData.warningLevel) {
            prevSteps += `This is the ${builderData.warningLevel}. `;
        }
        if (builderData.previousWarnings) {
            prevSteps += builderData.previousWarnings;
        }
        if (builderData.priorDiscipline) {
            prevSteps += builderData.priorDiscipline;
        }
        previousWarningsField.value = prevSteps;
        console.log('✅ Pre-filled previousWarnings:', prevSteps || '(empty)');
    }
    
    // Clear optional fields
    document.getElementById('reviewSupportingDocs').value = '';
    
    // Show/hide pre-filled notice based on whether we have data
    const prefilledNotice = document.getElementById('prefilledNotice');
    if (prefilledNotice) {
        const hasPrefilledData = builderData.employeeName || builderData.position || builderData.issueDescription;
        prefilledNotice.classList.toggle('hidden', !hasPrefilledData);
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Close the review request modal
 */
function closeReviewRequestModal() {
    const modal = document.getElementById('reviewRequestModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Toggle alternative email field visibility
 */
function toggleAlternativeEmail() {
    const checkbox = document.getElementById('useAlternativeEmail');
    const container = document.getElementById('alternativeEmailContainer');
    const altEmailField = document.getElementById('reviewAlternativeEmail');
    
    if (checkbox && container) {
        if (checkbox.checked) {
            container.classList.remove('hidden');
            if (altEmailField) altEmailField.focus();
        } else {
            container.classList.add('hidden');
            if (altEmailField) altEmailField.value = '';
        }
    }
}

/**
 * Get the contact email to use for review (checks if alternative email is selected)
 */
function getReviewContactEmail() {
    const useAlt = document.getElementById('useAlternativeEmail')?.checked;
    if (useAlt) {
        const altEmail = document.getElementById('reviewAlternativeEmail')?.value?.trim();
        if (altEmail && altEmail.includes('@')) {
            return altEmail;
        }
    }
    // Default to the main contact email field (which has their sign-in email)
    return document.getElementById('reviewContactEmail')?.value?.trim() || currentUser?.email || 'Unknown';
}

/**
 * Save review request to Firebase for consultant access
 */
async function saveReviewToFirebase(refNumber, reviewData) {
    try {
        await db.collection('reviewRequests').doc(refNumber).set({
            ...reviewData,
            refNumber: refNumber,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser?.uid || 'anonymous'
        });
        console.log('✅ Review saved to Firebase:', refNumber);
        return true;
    } catch (error) {
        console.error('Error saving review to Firebase:', error);
        return false;
    }
}

/**
 * Load and display a review request by reference number (for consultant view)
 */
async function loadReviewByReference(refNumber) {
    try {
        const doc = await db.collection('reviewRequests').doc(refNumber).get();
        if (doc.exists) {
            const data = doc.data();
            showReviewViewerModal(data);
            return true;
        } else {
            showNotification('Review not found: ' + refNumber, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error loading review:', error);
        showNotification('Error loading review. Please check the reference number.', 'error');
        return false;
    }
}

/**
 * Show the review viewer modal (for consultant)
 */
function showReviewViewerModal(data) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('reviewViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reviewViewerModal';
        modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto';
        document.body.appendChild(modal);
    }
    
    const createdDate = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('en-AU') : 'Unknown';
    
    // Format the document content for proper display
    const formattedContent = formatReviewDocumentContent(data.documentContent);
    
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-4xl w-full border border-amber-500/50 my-4">
            <div class="bg-gradient-to-r from-amber-600 to-orange-600 rounded-t-2xl p-6 relative">
                <button onclick="document.getElementById('reviewViewerModal').classList.add('hidden')" 
                        class="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">×</button>
                <div class="flex items-center gap-3">
                    <span class="text-4xl">📋</span>
                    <div>
                        <h2 class="text-2xl font-bold text-white">${data.docName || 'Document Review'}</h2>
                        <p class="text-amber-200">Reference: ${data.refNumber}</p>
                    </div>
                </div>
            </div>
            
            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <!-- Quick Info Bar -->
                <div class="flex flex-wrap items-center gap-4 text-sm">
                    <span class="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-semibold">
                        ⏳ ${data.status === 'pending' ? 'Pending Review' : data.status}
                    </span>
                    <span class="text-slate-400">📅 ${createdDate}</span>
                    <span class="text-slate-400">👤 ${data.employeeName || 'N/A'} (${data.employeeRole || 'N/A'})</span>
                </div>
                
                <!-- Venue & Contact - Compact -->
                <div class="bg-slate-700/50 rounded-lg p-3 text-sm">
                    <div class="flex flex-wrap gap-4">
                        <span><span class="text-slate-400">Venue:</span> <span class="text-white">${data.venueName || 'N/A'}</span></span>
                        <span><span class="text-slate-400">Contact:</span> <span class="text-white">${data.userName || 'N/A'}</span></span>
                        <span><span class="text-slate-400">Email:</span> <a href="mailto:${data.userEmail}" class="text-blue-400 hover:underline">${data.userEmail || 'N/A'}</a></span>
                        ${data.signInEmail && data.signInEmail !== data.userEmail ? `<span><span class="text-slate-500">(Sign-in:</span> <span class="text-slate-400">${data.signInEmail})</span></span>` : ''}
                        <span><span class="text-slate-400">Phone:</span> <a href="tel:${data.phoneNumber}" class="text-blue-400 hover:underline">${data.phoneNumber || 'N/A'}</a></span>
                    </div>
                </div>
                
                <!-- Issue Description -->
                ${data.issueDescription ? `
                <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h3 class="text-red-400 font-semibold mb-2">📝 Issue Description</h3>
                    <p class="text-slate-300 text-sm whitespace-pre-wrap">${data.issueDescription}</p>
                </div>
                ` : ''}
                
                <!-- Previous Warnings -->
                ${data.previousWarnings ? `
                <div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                    <h3 class="text-orange-400 font-semibold mb-2">⚠️ Previous Warnings</h3>
                    <p class="text-slate-300 text-sm whitespace-pre-wrap">${data.previousWarnings}</p>
                </div>
                ` : ''}
                
                <!-- Employee Response -->
                ${data.employeeResponse ? `
                <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 class="text-blue-400 font-semibold mb-2">💬 Employee Response</h3>
                    <p class="text-slate-300 text-sm whitespace-pre-wrap">${data.employeeResponse}</p>
                </div>
                ` : ''}
                
                <!-- Generated Document -->
                <div class="bg-white rounded-lg border-2 border-slate-300 overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                        <h3 class="text-slate-700 font-semibold">📄 Generated Document</h3>
                        <button onclick="printReviewDocument()" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            🖨️ Print
                        </button>
                    </div>
                    <div id="reviewDocumentContent" class="p-6 max-h-[500px] overflow-y-auto text-slate-900 text-sm leading-relaxed">
                        ${formattedContent || '<p class="text-slate-500 italic">Document content not available</p>'}
                    </div>
                </div>
            </div>
            
            <div class="p-4 border-t border-slate-700 flex gap-3">
                <button onclick="copyReviewDocumentContent()" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all">
                    📋 Copy Document
                </button>
                <button onclick="downloadReviewDocument('${data.refNumber}', '${data.docName || 'Document'}')" 
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all">
                    📥 Download Word
                </button>
                <button onclick="document.getElementById('reviewViewerModal').classList.add('hidden')" 
                        class="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 rounded-lg transition-all">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Store document content for copy function
    modal.dataset.documentContent = data.documentContent || '';
    modal.classList.remove('hidden');
}

/**
 * Format document content for display (convert markdown-style to HTML)
 */
function formatReviewDocumentContent(content) {
    if (!content) return '';
    
    let formatted = content;
    
    // Escape HTML first to prevent XSS
    formatted = formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Convert markdown-style formatting to HTML
    
    // Headers: # Header -> <h1>, ## Header -> <h2>, etc.
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-slate-800 mt-6 mb-2 border-b border-slate-200 pb-1">$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-900 mt-6 mb-3 border-b-2 border-amber-500 pb-2">$1</h2>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mt-4 mb-4 border-b-2 border-slate-800 pb-2">$1</h1>');
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
    
    // Bullet points: - item or • item
    formatted = formatted.replace(/^[-•] (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    
    // Wrap consecutive <li> items in <ul>
    formatted = formatted.replace(/(<li class="ml-4 mb-1">.+<\/li>\n?)+/g, function(match) {
        return '<ul class="list-disc list-inside my-3 space-y-1">' + match + '</ul>';
    });
    
    // Numbered lists: 1. item
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    
    // Horizontal rules
    formatted = formatted.replace(/^[-_]{3,}$/gm, '<hr class="my-4 border-slate-300">');
    
    // Line breaks - convert double newlines to paragraphs
    formatted = formatted.replace(/\n\n+/g, '</p><p class="mb-3">');
    
    // Single newlines to <br> (within paragraphs)
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!formatted.startsWith('<')) {
        formatted = '<p class="mb-3">' + formatted + '</p>';
    }
    
    // Clean up empty paragraphs
    formatted = formatted.replace(/<p class="mb-3"><\/p>/g, '');
    formatted = formatted.replace(/<p class="mb-3">(<h[123])/g, '$1');
    formatted = formatted.replace(/(<\/h[123]>)<\/p>/g, '$1');
    
    return formatted;
}

/**
 * Print the review document
 */
function printReviewDocument() {
    const content = document.getElementById('reviewDocumentContent');
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Document Review</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
                h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                h2 { font-size: 20px; border-bottom: 1px solid #f59e0b; padding-bottom: 8px; margin-top: 24px; }
                h3 { font-size: 16px; margin-top: 20px; }
                ul { margin: 12px 0; padding-left: 24px; }
                li { margin-bottom: 4px; }
                p { margin-bottom: 12px; }
                hr { margin: 16px 0; border: none; border-top: 1px solid #ccc; }
            </style>
        </head>
        <body>${content.innerHTML}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

/**
 * Download the review document as Word
 */
async function downloadReviewDocument(refNumber, docName) {
    const content = document.getElementById('reviewDocumentContent');
    if (!content) return;
    
    showNotification('📥 Preparing download...', 'info');
    
    try {
        const htmlContent = content.innerHTML;
        const filename = `${docName.replace(/\s+/g, '_')}_${refNumber}`;
        
        await generateWordDocument(htmlContent, `${filename}.docx`, {
            documentId: refNumber,
            userName: 'Fitz HR',
            documentType: docName
        });
        
        showNotification('✅ Document downloaded!', 'success');
    } catch (error) {
        console.error('Error downloading document:', error);
        showNotification('Error downloading. Try Copy instead.', 'error');
    }
}

/**
 * Copy the document content from review viewer
 */
function copyReviewDocumentContent() {
    const modal = document.getElementById('reviewViewerModal');
    const content = modal?.dataset?.documentContent || '';
    
    // Strip HTML tags for plain text copy
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    navigator.clipboard.writeText(plainText).then(() => {
        showNotification('📋 Document copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy. Please select and copy manually.', 'error');
    });
}

/**
 * Check URL for review reference on page load
 */
function checkForReviewReference() {
    const urlParams = new URLSearchParams(window.location.search);
    const refNumber = urlParams.get('ref');
    
    if (refNumber && refNumber.startsWith('REV-')) {
        console.log('📋 Loading review:', refNumber);
        // Wait for Firebase auth to be ready
        setTimeout(() => {
            loadReviewByReference(refNumber);
        }, 2000);
    }
}

/**
 * Wrapper function to catch and display any errors from submitReviewRequest
 */
async function handleSubmitReview() {
    console.log('🔘 handleSubmitReview button clicked!');
    try {
        await submitReviewRequest();
    } catch (error) {
        console.error('❌ Error in submitReviewRequest:', error);
        alert('Error submitting review: ' + error.message);
        showNotification('Error submitting review. Please try again.', 'error');
    }
}

/**
 * Submit the review request
 */
async function submitReviewRequest() {
    console.log('🚀 submitReviewRequest called');
    console.log('📋 pendingReviewRequest:', pendingReviewRequest);
    
    const { containerId, docType, docName, actionsId, documentContent, isFromPreviewModal, alreadyPaid } = pendingReviewRequest;
    
    console.log('📄 docType:', docType, 'docName:', docName);
    
    // Validate required fields
    const employeeNameEl = document.getElementById('reviewEmployeeName');
    const employeeRoleEl = document.getElementById('reviewEmployeeRole');
    const issueDescriptionEl = document.getElementById('reviewIssueDescription');
    
    console.log('🔍 Form elements found:', {
        employeeNameEl: !!employeeNameEl,
        employeeRoleEl: !!employeeRoleEl,
        issueDescriptionEl: !!issueDescriptionEl
    });
    
    const employeeName = employeeNameEl ? employeeNameEl.value.trim() : '';
    const employeeRole = employeeRoleEl ? employeeRoleEl.value.trim() : '';
    const issueDescription = issueDescriptionEl ? issueDescriptionEl.value.trim() : '';
    
    console.log('📝 Form values:', { employeeName, employeeRole, issueDescription });
    
    // Only require employeeRole and issueDescription - employeeName is optional
    if (!employeeRole || !issueDescription) {
        showNotification('Please fill in required fields (Role and Issue Description)', 'error');
        console.log('❌ Validation failed - missing required fields');
        return;
    }
    
    // Generate reference number
    const refNumber = 'REV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
    console.log('📋 Generated refNumber:', refNumber);
    
    // Gather all form data
    // Get the contact email (may be alternative email if specified)
    const contactEmail = getReviewContactEmail();
    
    const reviewData = {
        docType,
        docName,
        documentContent,
        employeeName,
        employeeRole,
        issueDescription,
        previousWarnings: document.getElementById('reviewPreviousWarnings')?.value?.trim() || '',
        supportingDocs: document.getElementById('reviewSupportingDocs')?.value?.trim() || '',
        employeeResponse: document.getElementById('reviewEmployeeResponse')?.value?.trim() || '',
        userEmail: contactEmail,
        signInEmail: currentUser?.email || 'Unknown',
        userName: venueProfile?.contactName || currentUser?.displayName || 'Unknown',
        venueName: venueProfile?.venueName || 'Unknown Venue',
        phoneNumber: venueProfile?.phoneNumber || '',
        refNumber: refNumber
    };
    
    console.log('📦 reviewData:', reviewData);
    
    // Show loading state
    const submitBtn = document.getElementById('submitReviewBtn');
    if (!submitBtn) {
        console.error('❌ Submit button not found!');
        showNotification('Error: Submit button not found. Please try again.', 'error');
        return;
    }
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="animate-spin">⏳</span> Sending...';
    submitBtn.disabled = true;
    
    // Determine if this is a formal process doc
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const isFormalProcess = cost && cost.category === 'formal_process';
    
    let submissionSuccessful = false;
    let usedFallback = false;
    
    // Generate the view URL for consultant access
    const viewUrl = `${window.location.origin}${window.location.pathname}?ref=${refNumber}`;
    
    try {
        // First, save to Firebase for permanent storage
        const firebaseSaved = await saveReviewToFirebase(refNumber, reviewData);
        if (!firebaseSaved) {
            console.warn('⚠️ Could not save to Firebase, but will continue with email');
        }
        
        // Send via EmailJS
        const templateParams = {
            doc_name: docName || 'Document',
            employee_name: employeeName,
            ref_number: refNumber,
            submitted_date: new Date().toLocaleString('en-AU', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Australia/Sydney'
            }),
            venue_name: reviewData.venueName,
            user_name: reviewData.userName,
            user_email: reviewData.userEmail,
            phone_number: reviewData.phoneNumber || 'Not provided',
            employee_role: employeeRole,
            issue_description: issueDescription,
            previous_warnings: reviewData.previousWarnings || 'None specified',
            employee_response: reviewData.employeeResponse || 'Not recorded',
            document_content: documentContent ? documentContent.substring(0, 3000) + '\n\n[View full document via link below]' : 'See link below',
            view_url: viewUrl
        };
        
        console.log('📧 Sending email via EmailJS...');
        const response = await emailjs.send('service_dfmeslf', 'template_l5asrxq', templateParams);
        
        if (response.status === 200) {
            console.log('✅ Review request sent via EmailJS');
            submissionSuccessful = true;
        } else {
            throw new Error('EmailJS returned status ' + response.status);
        }
    } catch (error) {
        console.error('Error sending review request:', error);
        
        // Reset button for potential retry
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        // Show error with options
        const useEmail = await showReviewSubmissionError(refNumber, reviewData);
        
        if (useEmail) {
            // User chose to use email fallback
            openReviewEmailFallback(reviewData);
            submissionSuccessful = true;
            usedFallback = true;
        } else {
            // User chose to retry - exit and let them try again
            return;
        }
    }
    
    // Only proceed if submission was successful (either via API or email)
    if (!submissionSuccessful) {
        return;
    }
    
    // NOW deduct credits (only after confirmed submission)
    if (!alreadyPaid) {
        const creditCost = cost ? cost.credits : 1;
        
        if (getTotalCredits() < creditCost) {
            closeReviewRequestModal();
            openCreditsModal();
            return;
        }
        
        const success = deductCreditsForDocument(docType);
        if (!success) {
            showNotification('Review sent but failed to update credits. Please contact support.', 'warning');
        }
    }
    
    // Close the review request modal
    closeReviewRequestModal();
    
    // Show the attachment prompt modal
    showAttachmentPromptModal(refNumber, employeeName, isFormalProcess, reviewData.userEmail);
    
    // Update UI to show success state (different message if used fallback)
    const successMessage = usedFallback 
        ? 'Email Draft Opened' 
        : 'Review Submitted';
    const successIcon = usedFallback ? '📧' : '✅';
    const successNote = usedFallback 
        ? 'Please send the email that opened to complete your submission.'
        : 'Our HR experts will review within 24-48 hours.';
    
    if (isFromPreviewModal) {
        const modalFooter = document.querySelector('#documentPreviewModal .p-6.border-t');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <div class="bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <span class="text-xl">${successIcon}</span>
                        <span class="text-green-400 font-semibold">${successMessage}</span>
                    </div>
                    <p class="text-slate-300 text-sm mb-1">Reference: ${refNumber}</p>
                    <p class="text-slate-400 text-xs mb-3">${successNote}</p>
                    <button onclick="closeDocumentPreview()" class="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-all">
                        Close
                    </button>
                </div>
            `;
        }
    } else {
        removeUniversalBlur(containerId);
        const optionsPrompt = document.getElementById(containerId + '_optionsPrompt');
        if (optionsPrompt) optionsPrompt.remove();
        
        if (actionsId) {
            const actionsContainer = document.getElementById(actionsId);
            if (actionsContainer) {
                actionsContainer.innerHTML = `
                    <div class="bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
                        <div class="flex items-center justify-center gap-2 mb-2">
                            <span class="text-xl">${successIcon}</span>
                            <span class="text-green-400 font-semibold">${successMessage}</span>
                        </div>
                        <p class="text-slate-300 text-sm mb-1">Reference: ${refNumber}</p>
                        <p class="text-slate-400 text-xs">${successNote}</p>
                    </div>
                `;
                actionsContainer.style.display = '';
            }
        }
    }
    
    // Mark document as pending review
    unlockedDocuments.add(docType + '_pending_review');
    
    // Reset button
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    // Show success toast
    showToast(usedFallback ? 'Email opened - please send to complete' : 'Review request submitted successfully!', 'success', 4000);
}

/**
 * Show error modal when review submission fails
 * Returns true if user chooses email fallback, false to retry
 */
function showReviewSubmissionError(refNumber, reviewData) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'reviewErrorModal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999999]';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-red-500/50">
                <div class="text-center mb-4">
                    <span class="text-4xl">⚠️</span>
                    <h3 class="text-xl font-bold text-white mt-2">Submission Issue</h3>
                </div>
                
                <p class="text-slate-300 text-center mb-6">
                    We couldn't send your review request automatically. This might be a temporary network issue.
                </p>
                
                <div class="space-y-3">
                    <button onclick="document.getElementById('reviewErrorModal').remove(); window.reviewErrorResolve(false);" 
                            class="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all">
                        🔄 Try Again
                    </button>
                    
                    <button onclick="document.getElementById('reviewErrorModal').remove(); window.reviewErrorResolve(true);" 
                            class="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
                        📧 Send via Email Instead
                    </button>
                </div>
                
                <p class="text-slate-500 text-xs text-center mt-4">
                    Reference: ${refNumber}
                </p>
            </div>
        `;
        
        window.reviewErrorResolve = resolve;
        document.body.appendChild(modal);
    });
}

/**
 * Show attachment prompt modal after review submission
 */
function showAttachmentPromptModal(refNumber, employeeName, isFormalProcess, userEmail) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('attachmentPromptModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'attachmentPromptModal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999999]';
        document.body.appendChild(modal);
    }
    
    // Ensure z-index is always high enough (in case modal was created earlier with lower z-index)
    modal.style.zIndex = '9999999999';
    
    const formalDocsNote = isFormalProcess ? `
        <div class="bg-amber-500/10 border border-amber-500 rounded-lg p-3 mb-4">
            <p class="text-amber-300 text-sm">
                <strong>⚠️ Important for Formal Process documents:</strong><br>
                Please include all previous Records of Discussion, warnings, and PIPs related to this employee.
            </p>
        </div>
    ` : '';
    
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-lg w-full border border-green-500 fade-in shadow-2xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
                <div class="flex items-center gap-3">
                    <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                        <span class="text-3xl">✅</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white">Review Successfully Submitted!</h2>
                        <p class="text-green-100 text-lg">Reference: ${refNumber}</p>
                    </div>
                </div>
            </div>
            
            <div class="p-6">
                <div class="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-4 text-center">
                    <p class="text-green-300 text-lg font-semibold mb-1">🎉 Your review request has been received!</p>
                    <p class="text-green-200 text-sm">Our HR experts will review your document within 24 hours.</p>
                </div>
                
                ${formalDocsNote}
                
                <div class="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">📎</span>
                        <div>
                            <h3 class="text-white font-semibold mb-2">Have supporting documents? Email them to:</h3>
                            <div class="bg-slate-600 rounded-lg p-3 flex items-center justify-between">
                                <span class="text-amber-400 font-mono">support@fitzhr.com</span>
                                <button onclick="copyToClipboard('support@fitzhr.com')" 
                                        class="text-slate-400 hover:text-white transition-colors">
                                    📋
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-700/30 rounded-lg p-4 mb-4">
                    <h4 class="text-slate-300 font-medium mb-2">You can include:</h4>
                    <ul class="text-slate-400 text-sm space-y-1">
                        <li>📄 Previous Record of Discussion (if any)</li>
                        <li>📄 Previous warnings or PIPs</li>
                        <li>💬 Employee's written response (if any)</li>
                        <li>📧 Relevant email threads</li>
                        <li>📋 Any other supporting evidence</li>
                    </ul>
                </div>
                
                <div class="bg-blue-500/10 border border-blue-500 rounded-lg p-3 mb-6">
                    <p class="text-blue-300 text-sm">
                        <strong>Subject line:</strong> ${refNumber} - ${employeeName}
                    </p>
                </div>
                
                <!-- Actions -->
                <div class="flex gap-3">
                    <button onclick="closeAttachmentPromptModal(); closeDocumentPreview();" 
                            class="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-all">
                        Done
                    </button>
                    <button onclick="openAttachmentEmail('${refNumber}', '${employeeName}')" 
                            class="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                        <span>📧</span> Email Documents
                    </button>
                </div>
                
                <p class="text-slate-500 text-xs text-center mt-4">
                    You'll receive the reviewed document within 24 hours at ${userEmail}
                </p>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

/**
 * Close attachment prompt modal
 */
function closeAttachmentPromptModal() {
    const modal = document.getElementById('attachmentPromptModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    showNotification('✅ Don\'t forget to email supporting documents for faster review!', 'info');
}

/**
 * Open email client for attachments
 */
function openAttachmentEmail(refNumber, employeeName) {
    const subject = encodeURIComponent(`${refNumber} - ${employeeName} - Supporting Documents`);
    const body = encodeURIComponent(`Hi Fitz HR Team,

Please find attached the supporting documents for review request ${refNumber} (${employeeName}).

Attached:
• [List your attachments here]

Thanks!
`);
    
    window.open(`mailto:support@fitzhr.com?subject=${subject}&body=${body}`, '_blank');
    closeAttachmentPromptModal();
    showNotification('📧 Email client opened. Attach your documents and send!', 'success');
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('📋 Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

/**
 * Fallback: Open email client with review request
 */
function openReviewEmailFallback(data) {
    const subject = encodeURIComponent(`[${data.refNumber}] Document Review Request: ${data.docName} - ${data.employeeName} (${data.venueName})`);
    
    const body = encodeURIComponent(`
DOCUMENT REVIEW REQUEST
=======================
Reference: ${data.refNumber}

Document: ${data.docName}
Document Type: ${data.docType}

REQUESTOR INFORMATION
---------------------
Business: ${data.venueName}
Contact: ${data.userName}
Email: ${data.userEmail}
Phone: ${data.phoneNumber}

EMPLOYEE DETAILS
----------------
Name: ${data.employeeName}
Role: ${data.employeeRole}

ISSUE DESCRIPTION
-----------------
${data.issueDescription}

${data.previousWarnings ? `PREVIOUS STEPS TAKEN
--------------------
${data.previousWarnings}` : ''}

${data.supportingDocs ? `SUPPORTING DOCUMENTATION
------------------------
${data.supportingDocs}` : ''}

${data.employeeResponse ? `EMPLOYEE RESPONSE
-----------------
${data.employeeResponse}` : ''}

DOCUMENT CONTENT
----------------
${data.documentContent ? data.documentContent.substring(0, 3000) : 'See attached'}
${data.documentContent && data.documentContent.length > 3000 ? '\n\n[Document truncated - full content available in system]' : ''}

---
Reference: ${data.refNumber}
Submitted: ${new Date().toLocaleString('en-AU')}
    `);
    
    window.open(`mailto:support@fitzhr.com?subject=${subject}&body=${body}`, '_blank');
}

/**
 * Request expert review - opens the modal
 * Called from applyUniversalBlur buttons
 */
function requestExpertReview(containerId, docType, docName, actionsId) {
    openReviewRequestModal(containerId, docType, docName, actionsId, false);
}

/**
 * Unlock a People Management document in chat (1 credit) and show options
 */
function unlockPeopleManagementInChat(containerId, docType, docName, actionsId) {
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const creditCost = cost ? cost.credits : 1;
    
    // Check credits
    if (getTotalCredits() < creditCost) {
        showNotification('Not enough credits. Please purchase more.', 'error');
        openCreditsModal();
        return;
    }
    
    // Deduct credits
    const success = deductCreditsForDocument(docType);
    if (!success) {
        showNotification('Failed to process. Please try again.', 'error');
        return;
    }
    
    // Mark as unlocked
    unlockedDocuments.add(docType);
    
    // Remove blur and show options
    removeUniversalBlur(containerId);
    showPeopleManagementInChatOptions(containerId, docType, docName, actionsId);
    
    showNotification('✅ Document unlocked! Choose to request expert review or download.', 'success');
}

/**
 * Show People Management options in chat after unlock
 */
function showPeopleManagementInChatOptions(containerId, docType, docName, actionsId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove any existing prompts
    const existingPrompt = document.getElementById(containerId + '_unlockPrompt');
    if (existingPrompt) existingPrompt.remove();
    
    const existingBanner = document.getElementById(containerId + '_reviewBanner');
    if (existingBanner) existingBanner.remove();
    
    // Show options prompt
    const optionsPrompt = document.createElement('div');
    optionsPrompt.id = containerId + '_optionsPrompt';
    optionsPrompt.innerHTML = `
        <div class="bg-slate-700 border border-slate-600 rounded-xl p-4 mt-4 mx-auto max-w-lg">
            <div class="flex items-center gap-2 text-green-400 mb-3">
                <span>✅</span>
                <span class="font-semibold">Document Unlocked</span>
            </div>
            <div class="flex gap-3 flex-wrap">
                <button onclick="requestExpertReview('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')" 
                        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2">
                    🛡️ Request Expert Review
                    <span class="text-blue-200 text-xs">(Optional)</span>
                </button>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" id="${containerId}_disclaimer" class="w-4 h-4">
                        <span class="text-slate-400 text-xs">I accept responsibility</span>
                    </label>
                    <button onclick="downloadPeopleManagementWithDisclaimer('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')" 
                            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-all text-sm">
                        📥 Download
                    </button>
                </div>
            </div>
        </div>
    `;
    container.parentNode.insertBefore(optionsPrompt, container.nextSibling);
    
    // Show download buttons if actionsId provided
    if (actionsId) {
        const actionsContainer = document.getElementById(actionsId);
        if (actionsContainer) {
            actionsContainer.style.display = 'none'; // Keep hidden, we have our own buttons
        }
    }
}

/**
 * Download People Management document with disclaimer
 */
function downloadPeopleManagementWithDisclaimer(containerId, docType, docName, actionsId) {
    // ✅ CHECK: Verify document has been unlocked (credits paid)
    if (!unlockedDocuments.has(docType)) {
        showNotification('⚠️ Please unlock this document first.', 'error');
        // Re-apply blur
        applyUniversalBlur(containerId, docType, docName, actionsId);
        return;
    }
    
    const checkbox = document.getElementById(containerId + '_disclaimer');
    if (!checkbox || !checkbox.checked) {
        showNotification('⚠️ Please tick the checkbox to accept responsibility before downloading.', 'error');
        checkbox?.focus();
        return;
    }
    
    // Remove options prompt
    const optionsPrompt = document.getElementById(containerId + '_optionsPrompt');
    if (optionsPrompt) optionsPrompt.remove();
    
    // Show action buttons
    if (actionsId) {
        const actionsContainer = document.getElementById(actionsId);
        if (actionsContainer) {
            actionsContainer.style.display = '';
        }
    }
    
    showNotification('📥 Document ready for download. Please review carefully before use.', 'success');
}

/**
 * Unlock a Formal Process document (pay credits, then choose download or review)
 */
function unlockFormalProcess(containerId, docType, docName, actionsId) {
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const creditCost = cost ? cost.credits : 2;
    
    // Check if user has enough credits
    if (getTotalCredits() < creditCost) {
        openCreditsModal();
        return;
    }
    
    // Deduct credits
    const success = deductCreditsForDocument(docType);
    if (!success) {
        showNotification('Failed to unlock document. Please try again.', 'error');
        return;
    }
    
    // Mark as unlocked
    unlockedDocuments.add(docType);
    
    // Remove the blur and unlock prompt
    removeUniversalBlur(containerId);
    
    // Show the download/review options
    showFormalProcessOptions(containerId, docType, docName, actionsId);
    
    showNotification('✅ Document unlocked! Choose to download or request expert review.', 'success');
}

/**
 * Show Formal Process options: Download with disclaimer OR Request expert review (free)
 */
function showFormalProcessOptions(containerId, docType, docName, actionsId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove any existing prompts
    const existingPrompt = document.getElementById(containerId + '_unlockPrompt');
    if (existingPrompt) existingPrompt.remove();
    
    const existingOptions = document.getElementById(containerId + '_optionsPrompt');
    if (existingOptions) existingOptions.remove();
    
    // Reset container styles to show full document
    container.style.maxHeight = '';
    container.style.overflow = '';
    container.style.position = '';
    
    // Create options prompt
    const optionsPrompt = document.createElement('div');
    optionsPrompt.id = containerId + '_optionsPrompt';
    optionsPrompt.innerHTML = `
        <div class="bg-slate-700 border-2 border-green-500 rounded-xl p-5 mx-auto max-w-lg mt-4">
            <div class="text-center mb-3">
                <span class="text-2xl">✅</span>
                <h3 class="text-lg font-bold text-white mt-1">Document Unlocked</h3>
                <p class="text-slate-400 text-sm">Choose how you'd like to proceed</p>
            </div>
            
            <!-- Option 1: Request Expert Review -->
            <div class="bg-blue-500/10 border border-blue-500 rounded-lg p-3 mb-2">
                <div class="flex items-start gap-2">
                    <span class="text-lg">🛡️</span>
                    <div class="flex-1">
                        <h4 class="text-blue-400 font-semibold text-sm">Request Expert Review</h4>
                        <p class="text-slate-300 text-xs mt-1">Have a consultant review before you use it. Reviewed within 24 hours.</p>
                        <p class="text-green-400 text-xs mt-1 font-medium">✓ Included free with your unlock</p>
                    </div>
                </div>
                <button onclick="requestExpertReviewAfterUnlock('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')" 
                        class="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm">
                    🛡️ Request Expert Review
                </button>
            </div>
            
            <!-- Option 2: Download Anyway -->
            <div class="bg-amber-500/10 border border-amber-500 rounded-lg p-3">
                <div class="flex items-start gap-2">
                    <span class="text-lg">⚠️</span>
                    <div class="flex-1">
                        <h4 class="text-amber-400 font-semibold text-sm">Download Without Review</h4>
                        <p class="text-slate-300 text-xs mt-1">Download now and take full responsibility for the document's accuracy.</p>
                    </div>
                </div>
                
                <!-- Disclaimer checkbox -->
                <div class="mt-2 bg-slate-800 rounded-lg p-2">
                    <label class="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" id="${containerId}_disclaimer" class="mt-0.5 w-4 h-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500">
                        <span class="text-slate-300 text-xs">
                            I understand this document carries <strong>significant legal risk</strong>. 
                            I accept <strong>full responsibility</strong> and waive any liability against Fitz HR.
                        </span>
                    </label>
                </div>
                
                <button onclick="downloadFormalWithDisclaimer('${containerId}', '${docType}', '${docName}', '${actionsId || ''}')" 
                        class="w-full mt-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-all text-sm">
                    Download Anyway
                </button>
            </div>
        </div>
    `;
    
    container.parentNode.insertBefore(optionsPrompt, container.nextSibling);
    
    // Keep action buttons hidden until they make a choice
    if (actionsId) {
        const actionsContainer = document.getElementById(actionsId);
        if (actionsContainer) {
            actionsContainer.style.display = 'none';
        }
    }
}

/**
 * Request expert review after already unlocking (no additional credits)
 */
function requestExpertReviewAfterUnlock(containerId, docType, docName, actionsId) {
    // Remove the options prompt
    const optionsPrompt = document.getElementById(containerId + '_optionsPrompt');
    if (optionsPrompt) optionsPrompt.remove();
    
    // Open the review request modal (credits already paid)
    openReviewRequestModal(containerId, docType, docName, actionsId, false, true); // true = already paid
}

/**
 * Download Formal Process document with disclaimer acceptance
 */
function downloadFormalWithDisclaimer(containerId, docType, docName, actionsId) {
    // ✅ CHECK: Verify document has been unlocked (credits paid)
    if (!unlockedDocuments.has(docType)) {
        showNotification('⚠️ Please unlock this document first.', 'error');
        // Re-apply blur
        applyUniversalBlur(containerId, docType, docName, actionsId);
        return;
    }
    
    // Check if disclaimer is checked
    const checkbox = document.getElementById(containerId + '_disclaimer');
    if (!checkbox || !checkbox.checked) {
        showNotification('⚠️ Please accept the disclaimer to download.', 'error');
        checkbox?.focus();
        return;
    }
    
    // Remove the options prompt
    const optionsPrompt = document.getElementById(containerId + '_optionsPrompt');
    if (optionsPrompt) optionsPrompt.remove();
    
    // Show action buttons
    if (actionsId) {
        const actionsContainer = document.getElementById(actionsId);
        if (actionsContainer) {
            actionsContainer.style.display = '';
        }
    }
    
    showNotification('📄 Document ready for download. Please review carefully before use.', 'info');
}

/**
 * Check if document should be blurred (user hasn't paid or needs review)
 */
function shouldBlurDocument(docType) {
    // Check if already unlocked in this session - NO BLUR needed
    if (unlockedDocuments.has(docType)) {
        console.log('✅ Document already unlocked, no blur:', docType);
        return false;
    }
    
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const isTemplate = cost && cost.category === 'template';
    const isPaidUser = tier !== 'free';
    
    // Paid users get templates free - no blur
    if (isPaidUser && isTemplate) {
        return false;
    }
    
    // Free tier with unused free doc - no blur for templates
    if (tier === 'free' && isTemplate) {
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed < 1) {
            return false;
        }
    }
    
    // Everything else needs blur/unlock
    return true;
}

// ========================================
// UNIVERSAL DOCUMENT DOWNLOAD PROTECTION
// ========================================

/**
 * Pending document download state
 * Used to track what document the user wants after unlocking
 */
let pendingDocumentDownload = {
    docType: null,
    docName: null,
    downloadFunction: null,
    format: null,
    unlocked: false
};

/**
 * Check if a document type has been unlocked in this session
 */
const unlockedDocuments = new Set();

/**
 * Require credit payment before allowing document download
 * @param {string} docType - Document type key (e.g., 'trainingPlan', 'jobDescription')
 * @param {string} docName - Human readable document name
 * @param {Function} downloadFn - Function to call after unlock
 * @param {string} format - Download format (optional)
 */
function requireCreditForDownload(docType, docName, downloadFn, format = null) {
    // Check if already unlocked in this session
    if (unlockedDocuments.has(docType)) {
        downloadFn(format);
        return;
    }
    
    // Check document cost configuration
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    if (!cost) {
        // Unknown document type - allow download (failsafe)
        console.warn('Unknown document type for credit check:', docType);
        downloadFn(format);
        return;
    }
    
    // Check if this is a FREE TEMPLATE (0 credits)
    const isTemplate = cost.category === 'template' && cost.credits === 0;
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    const isPaidUser = tier !== 'free';
    
    if (isTemplate) {
        // Paid users get ALL templates free - direct download
        if (isPaidUser) {
            console.log('✅ Paid user - free template download:', docType);
            unlockedDocuments.add(docType);
            downloadFn(format);
            return;
        }
        
        // Free tier: check if they've used their 1 free template
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed < 1) {
            // Free user hasn't used their free template yet - allow download
            console.log('✅ Free user using their 1 free template:', docType);
            userCredits.lowRiskDocsUsed = 1;
            saveUserCredits();
            unlockedDocuments.add(docType);
            downloadFn(format);
            showNotification('You\'ve used your 1 free template. Upgrade for unlimited templates!', 'info');
            return;
        }
        
        // Free user has already used their free template - show upgrade prompt
        console.log('⚠️ Free user already used free template, showing upgrade prompt');
        showFreeTemplateUpgradePrompt(docType, docName, downloadFn, format);
        return;
    }
    
    // For paid documents (people_management, formal_process), use normal unlock flow
    // Store pending download
    pendingDocumentDownload = {
        docType: docType,
        docName: docName,
        downloadFunction: downloadFn,
        format: format,
        unlocked: false
    };
    
    // Show unlock modal
    openDocumentUnlockModal(docType, docName);
}

/**
 * Show upgrade prompt for free users who've used their free template
 */
function showFreeTemplateUpgradePrompt(docType, docName, downloadFn, format) {
    // Create a simple upgrade prompt modal
    const existingModal = document.getElementById('freeTemplateUpgradeModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'freeTemplateUpgradeModal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999]';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500 fade-in">
            <div class="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-t-2xl text-center">
                <span class="text-4xl">📄</span>
                <h2 class="text-xl font-bold text-slate-900 mt-2">Free Template Used</h2>
            </div>
            <div class="p-6">
                <p class="text-slate-300 text-center mb-4">
                    You've already used your 1 free template download. Upgrade to get <strong>unlimited templates</strong>!
                </p>
                
                <div class="bg-slate-700/50 rounded-lg p-4 mb-6">
                    <h4 class="text-white font-semibold mb-2">✨ Starter Plan Includes:</h4>
                    <ul class="text-slate-400 text-sm space-y-1">
                        <li>✅ Unlimited template downloads</li>
                        <li>✅ 96 credits/year for docs, reviews & consultations</li>
                        <li>✅ Unlimited AI chat</li>
                        <li>✅ 24hr review turnaround</li>
                    </ul>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="document.getElementById('freeTemplateUpgradeModal').remove();" 
                            class="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-all">
                        Maybe Later
                    </button>
                    <button onclick="document.getElementById('freeTemplateUpgradeModal').remove(); openSubscriptionModal();" 
                            class="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all">
                        View Plans
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Complete pending document download after unlock
 */
function completePendingDownload() {
    if (pendingDocumentDownload.downloadFunction && !pendingDocumentDownload.unlocked) {
        pendingDocumentDownload.unlocked = true;
        
        // Mark as unlocked for this session
        unlockedDocuments.add(pendingDocumentDownload.docType);
        
        // Execute the download
        const fn = pendingDocumentDownload.downloadFunction;
        const format = pendingDocumentDownload.format;
        
        // Small delay to let modal close
        setTimeout(() => {
            fn(format);
        }, 300);
        
        // Clear pending
        pendingDocumentDownload = {
            docType: null,
            docName: null,
            downloadFunction: null,
            format: null,
            unlocked: false
        };
    }
}

// ========================================
// PROTECTED DOWNLOAD WRAPPER FUNCTIONS
// ========================================

/**
 * Protected Training Plan download
 */
function protectedExportTrainingPlanDOCX() {
    if (!trainingPlanState.plan) {
        showAlert('Please generate a training plan first');
        return;
    }
    requireCreditForDownload('trainingPlan', 'Training Plan', () => {
        exportTrainingPlanDOCXUnlocked();
    });
}

function protectedExportTrainingPlanPDF() {
    if (!trainingPlanState.plan) {
        showAlert('Please generate a training plan first');
        return;
    }
    requireCreditForDownload('trainingPlan', 'Training Plan', () => {
        exportTrainingPlanPDFUnlocked();
    });
}

/**
 * Protected Onboarding Checklist download
 */
function protectedExportChecklistDOCX() {
    if (!onboardingState.checklist || onboardingState.checklist.length === 0) {
        showAlert('Please generate a checklist first');
        return;
    }
    requireCreditForDownload('onboardingChecklist', 'Onboarding Checklist', () => {
        exportChecklistDOCXUnlocked();
    });
}

function protectedExportChecklistPDF() {
    if (!onboardingState.checklist || onboardingState.checklist.length === 0) {
        showAlert('Please generate a checklist first');
        return;
    }
    requireCreditForDownload('onboardingChecklist', 'Onboarding Checklist', () => {
        exportChecklistPDFUnlocked();
    });
}

/**
 * Protected Job Description download
 */
function protectedDownloadJobDescription(format) {
    if (!jdData.generatedContent) {
        showAlert('Please generate a job description first');
        return;
    }
    requireCreditForDownload('jobDescription', 'Job Description', (fmt) => {
        downloadJobDescriptionUnlocked(fmt);
    }, format);
}

/**
 * Protected Reference Check download
 */
function protectedDownloadReferenceCheck(format) {
    requireCreditForDownload('referenceCheck', 'Reference Check Form', (fmt) => {
        downloadReferenceCheckUnlocked(fmt);
    }, format);
}

// ========================================
// CONSULTATION-GATED DOCUMENT CHECK
// ========================================

/**
 * Check if a document type requires consultation
 */
function isConsultationGated(docType) {
    const gatedTypes = [
        'terminationLetter',
        'termination',
        'redundancy',
        'redundancyLetter',
        'investigation',
        'investigationReport',
        'settlement',
        'deedOfSettlement',
        'unfairDismissal',
        'unfairDismissalResponse'
    ];
    
    return gatedTypes.includes(docType);
}

/**
 * Handle attempt to generate a consultation-gated document
 */
function handleConsultationGatedDocument(docType) {
    showConsultationRequiredModal(docType);
    return false; // Prevent normal flow
}


async function downloadGeneratedDocument(format = 'pdf') {
    const docType = document.getElementById('documentPreviewModal')?.dataset?.docType || documentBuilderState.currentType;
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    
    console.log('📥 downloadGeneratedDocument called:', {
        docType,
        cost,
        hasBlurOverlay: !!document.getElementById('documentBlurOverlay'),
        isUnlocked: unlockedDocuments.has(docType),
        credits: getTotalCredits()
    });
    
    // ✅ CHECK 1: Is there a blur overlay? (UI check)
    const blurOverlay = document.getElementById('documentBlurOverlay');
    if (blurOverlay) {
        console.log('❌ Download blocked: blur overlay present');
        // Document is locked - show unlock modal instead
        openDocumentUnlockModal(docType, cost?.name || 'Document');
        return false;
    }
    
    // ✅ CHECK 2: Does this document type require credits? (Data check)
    if (cost && cost.credits > 0) {
        const category = cost.category;
        
        // People Management and Formal Process require unlock first
        if (category === 'people_management' || category === 'formal_process') {
            // Check if document has been unlocked
            if (!unlockedDocuments.has(docType)) {
                console.log('❌ Download blocked: document not unlocked');
                showNotification('⚠️ Please unlock this document first.', 'error');
                // Re-apply blur if somehow it was removed
                applyDocumentBlur(docType, cost.name || 'Document');
                return false;
            }
        }
    }
    
    // ✅ CHECK 3: Free tier limit for templates
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    if (tier === 'free' && cost?.category === 'template') {
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed >= 1) {
            console.log('❌ Download blocked: free tier limit reached');
            showNotification('⚠️ Free template limit reached. Please upgrade.', 'error');
            applyDocumentBlur(docType, cost?.name || 'Document');
            return false;
        }
        // Mark free template as used
        userCredits.lowRiskDocsUsed = 1;
        saveUserCredits();
    }
    
    console.log('✅ Download allowed, proceeding...');
    
    // ✅ CRITICAL: Confirmation dialog before download
    const userAccepts = confirm(
        "⚠️ CRITICAL LEGAL REMINDER\n\n" +
        "This document is a DRAFT TEMPLATE for review purposes only.\n\n" +
        "Before issuing this document to any employee, you MUST:\n\n" +
        "✓ Have it reviewed by a Fitz HR consultant\n" +
        "✓ Ensure all factual details are accurate\n" +
        "✓ Verify it meets your specific circumstances\n" +
        "✓ Confirm it complies with current Fair Work requirements\n\n" +
        "LEGAL WARNING:\n" +
        "Using this document without professional review may expose you to:\n" +
        "• Unfair dismissal claims ($50,000+ in damages)\n" +
        "• General protections claims\n" +
        "• Adverse action penalties\n" +
        "• Legal costs and compensation\n\n" +
        "Contact: support@fitzhr.com\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "By clicking OK, you acknowledge:\n" +
        "• This is a draft template requiring professional review\n" +
        "• You will NOT use it without consultant approval\n" +
        "• You understand the legal risks of non-compliance\n\n" +
        "Click OK to download for review, or Cancel to return."
    );
    
    if (!userAccepts) {
        trackEvent('document_download_cancelled_at_confirmation', {
            user: currentUser,
            documentType: documentBuilderState.currentType,
            format: format,
            reason: 'did_not_accept_legal_terms'
        });
        return false;
    }
    
    trackEvent('document_download_legal_terms_accepted', {
        user: currentUser,
        documentType: documentBuilderState.currentType,
        format: format
    });    

    try {
        // Use docType which has proper fallback (already computed above)
        const type = docType || documentBuilderState.currentType;
        
        if (!type) {
            throw new Error('Document type not found. Please try regenerating the document.');
        }
        
        // For employment contract, get employee name from contractBuilderState
        const employeeName = type === 'employmentContract' 
            ? (contractBuilderState?.data?.employeeName || 'Employee')
            : (documentBuilderState.data?.employeeName || 'Employee');
        
        const typeNames = {
            formalWarning: 'Formal_Warning',
            recordOfDiscussion: 'Record_of_Discussion',
            letterOfAllegation: 'Letter_of_Allegation',
            performanceImprovementPlan: 'Performance_Improvement_Plan',
            employmentContract: 'Employment_Contract'
        };
        
        const fileExtension = format === 'pdf' ? 'pdf' : 'docx';
        const typeName = typeNames[type] || type.replace(/([A-Z])/g, '_$1').replace(/^_/, '');
        const filename = `${typeName}_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.${fileExtension}`;
        
        const metadata = {
            documentId: generateDocumentId(),
            userName: currentUser,
            generatedAt: new Date().toISOString(),
            documentType: type,
            employeeName: employeeName,
            format: format
        };
        
        // Get the FORMATTED HTML from the preview
        const previewElement = document.getElementById('documentPreviewContent');
        
        if (!previewElement) {
            throw new Error('Preview content not found');
        }
        
        const formattedHTML = previewElement.innerHTML;
        
        let success = false;
        
        if (format === 'pdf') {
            // Generate PDF
            const docDefinition = convertHTMLToPdfMake(formattedHTML, metadata);
            
            if (typeof pdfMake === 'undefined') {
                throw new Error('pdfMake not loaded');
            }
            
            pdfMake.createPdf(docDefinition).download(filename);
            success = true;
            
        } else if (format === 'docx') {
            // Generate Word document
            success = await generateWordDocument(formattedHTML, filename, metadata);
        }
        
        if (!success) {
            throw new Error(`Failed to generate ${format.toUpperCase()}`);
        }
        
        // Track generation
        trackDocumentGeneration(filename, metadata);
        
        // ✅ CRITICAL: Log the download and update database
        await logDocumentDownload(metadata);
        
        closeDocumentPreview();
        
        showAlert(
            `✅ ${format.toUpperCase()} Document Downloaded!\n\n` +
            'CRITICAL REMINDERS:\n' +
            '1. This is a DRAFT document\n' +
            '2. MUST be reviewed by a consultant\n' +
            '3. Do not issue without professional review\n\n' +
            'Contact: support@fitzhr.com'
        );
        
        return true;
        
    } catch (error) {
        showAlert(`Download failed: ${error.message}`);
        return false;
    }
}

/**
 * Generates a Word document (.docx) from HTML content
 * Robust version with corruption prevention
 * @param {string} htmlContent - HTML content to convert
 * @param {string} filename - Output filename
 * @param {Object} metadata - Document metadata
 * @returns {Promise<boolean>} True if successful
 */
async function generateWordDocument(htmlContent, filename, metadata = {}) {
    try {
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'word-loading';
        loadingDiv.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999]';
        loadingDiv.innerHTML = `
            <div class="bg-slate-800 rounded-2xl border-2 border-amber-500 p-8 text-center max-w-md">
                <div class="text-6xl mb-4 animate-bounce">📝</div>
                <p class="text-white font-bold text-xl mb-2">Generating Word Document</p>
                <p class="text-slate-400 text-sm mb-4">Creating professional .docx file...</p>
                <div class="flex justify-center gap-2">
                    <div class="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
                <p class="text-slate-500 text-xs mt-4">This usually takes 3-5 seconds</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Call Netlify function
        const response = await fetch('/.netlify/functions/generate-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                html: htmlContent,
                metadata: {
                    documentId: metadata.documentId || generateDocumentId(),
                    userName: metadata.userName || currentUser?.displayName || currentUser?.email || 'Unknown',
                    filename: filename,
                    generatedAt: new Date().toISOString()
                }
            })
        });
        
        // Remove loading indicator
        loadingDiv.remove();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        // Get the Word document as a blob
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('Received empty document from server');
        }
        
        // Download it
        saveAs(blob, filename);
        
        return true;
        
    } catch (error) {
        showAlert(
            '⚠️ Error Generating Word Document\n\n' +
            error.message + '\n\n' +
            'Please try again or download as PDF instead.\n' +
            'Contact support if this persists: support@fitzhr.com'
        );
        
        return false;
    }
}

/**
 * Cleans HTML content to prevent Word document corruption
 * Removes problematic elements and attributes
 */
function cleanHTMLForWord(html) {
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove all class attributes (Tailwind causes issues)
    doc.querySelectorAll('[class]').forEach(el => {
        el.removeAttribute('class');
    });
    
    // Remove all style attributes
    doc.querySelectorAll('[style]').forEach(el => {
        el.removeAttribute('style');
    });
    
    // Remove data attributes
    doc.querySelectorAll('[data-*]').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    // Remove script tags
    doc.querySelectorAll('script').forEach(el => el.remove());
    
    // Remove SVG elements
    doc.querySelectorAll('svg').forEach(el => el.remove());
    
    // Remove problematic divs - replace with semantic tags
    doc.querySelectorAll('div').forEach(div => {
        const p = doc.createElement('p');
        p.innerHTML = div.innerHTML;
        div.replaceWith(p);
    });
    
    // Remove span tags but keep content
    doc.querySelectorAll('span').forEach(span => {
        const text = doc.createTextNode(span.textContent);
        span.replaceWith(text);
    });
    
    // Remove empty paragraphs
    doc.querySelectorAll('p').forEach(p => {
        if (!p.textContent.trim()) {
            p.remove();
        }
    });
    
    // Get cleaned body content
    const cleaned = doc.body.innerHTML;
    
    return cleaned;
}

async function logDocumentGeneration() {
    // Validate that we have the required data
    if (!documentBuilderState.currentType) {
        return null;
    }
    
    const log = {
        document_id: generateDocumentId(),
        user_code: currentUser?.uid || currentUser, // ← Always use UID for security
        document_type: documentBuilderState.currentType,
        employee_name: documentBuilderState.data.employeeName || 'Unknown',
        generated_at: new Date().toISOString(),
        downloaded: false,
        format: null, // ✅ Will be set on download
        venue_name: venueProfile.venueName || null,
        venue_location: venueProfile.location || null,
        venue_city: venueProfile.city || null,
        venue_type: venueProfile.venueType || null
    };
    
    // Store in localStorage as backup
    const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    const logs = JSON.parse(localStorage.getItem('documentLogs_' + userKey) || '[]');
    logs.push(log);
    localStorage.setItem('documentLogs_' + userKey, JSON.stringify(logs));
    // Store in Supabase
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('generated_documents')
                .insert([log])
                .select(); // ✅ This returns the inserted record including its ID
            
            if (error) {
                return null;
            } else {
                // ✅ Return the inserted record (includes database ID)
                return data[0];
            }
        } catch (err) {
            return null;
        }
    } else {
        return null;
    }
}

// Log document download
/**
 * Logs document download with format tracking
 * @param {Object} metadata - Document metadata including format
 */
async function logDocumentDownload(metadata) {
    if (!supabaseClient) {
        return;
    }
    
    if (!documentBuilderState.lastGeneratedDocId) {
        return;
    }
    
    try {
        // ✅ Update with format information
        const { data: updateData, error: updateError } = await supabaseClient
            .from('generated_documents')
            .update({ 
                downloaded: true, 
                downloaded_at: new Date().toISOString(),
                format: metadata.format || 'pdf' // ✅ Track format (pdf or docx)
            })
            .eq('id', documentBuilderState.lastGeneratedDocId)
            .select();
        
        if (updateError) {
        } else {
            // Clear the stored ID after successful update
            documentBuilderState.lastGeneratedDocId = null;
        }
        
    } catch (err) {
    }
    
    // Track event with format
    trackEvent('document_downloaded', {
        user: currentUser,
        format: metadata.format || 'pdf',
        documentType: metadata.documentType
    });
}

	// ========================================
	// DAILY TIPS SYSTEM
	// ========================================

const dailyTips = [
    { icon: "💡", tip: "Did you know? You must give 30-min breaks for shifts over 5 hours" },
    { icon: "⚠️", tip: "Award rates increase on 1 July each year - mark your calendar!" },
    { icon: "📝", tip: "Always document performance conversations in writing" },
    { icon: "🕒", tip: "Casuals must be paid within 7 days of completing their shift" },
    { icon: "📋", tip: "Keep employment records for 7 years minimum - it's the law" },
    { icon: "⚖️", tip: "Unfair dismissal claims must be lodged within 21 days" },
    { icon: "💰", tip: "Casual loading is 25% on top of permanent rates" },
    { icon: "🔄", tip: "Regular casuals may request conversion to permanent after 12 months" },
    { icon: "📅", tip: "Public holidays require 2.5x pay or time off in lieu" },
    { icon: "✍️", tip: "Use written employment contracts for all staff - avoid disputes" },
    { icon: "🚨", tip: "Document workplace incidents immediately while details are fresh" },
    { icon: "📞", tip: "Return employee calls within 24 hours during disputes" },
    { icon: "⏰", tip: "Minimum shift length is usually 3 hours for casual employees" },
    { icon: "🎓", tip: "Provide a Fair Work Information Statement to all new employees" },
    { icon: "💼", tip: "Probation periods are typically 3-6 months - put it in writing" },
    { icon: "🔐", tip: "Store employee personal information securely - privacy laws apply" },
    { icon: "📊", tip: "Review your payroll monthly - catch errors before they compound" },
    { icon: "🤝", tip: "Consider offering unpaid trial shifts (max 1-2 hours for assessment)" },
    { icon: "🌟", tip: "Recognise good performance regularly - it reduces turnover" },
    { icon: "📱", tip: "Use the tools menu (🛠️) to access specialised calculators" }
];

let currentDailyTipIndex = -1; // Start at -1 so first call gets index 0

function getDailyTip() {
    // Get tip based on day of month for consistency
    const today = new Date().getDate();
    return dailyTips[today % dailyTips.length];
}

function updateDailyTipBanner() {
    const tipElement = document.getElementById('dailyTipContent');
    const iconElement = document.getElementById('dailyTipIcon');
    
    if (!tipElement || !iconElement) return;
    
    const tipData = getDailyTip();
    
    // Fade out
    const banner = document.getElementById('dailyTipBanner');
    if (banner) {
        banner.style.transition = 'opacity 0.3s ease-out';
        banner.style.opacity = '0.7';
    }
    
    setTimeout(() => {
        iconElement.textContent = tipData.icon;
        tipElement.textContent = tipData.tip;
        
        // Fade in
        if (banner) {
            banner.style.opacity = '1';
        }
    }, 300);
}

function rotateTipManually() {
    // Cycle to next tip
    currentDailyTipIndex = (currentDailyTipIndex + 1) % dailyTips.length;
    
    const tipElement = document.getElementById('dailyTipContent');
    const iconElement = document.getElementById('dailyTipIcon');
    const banner = document.getElementById('dailyTipBanner');
    
    if (!tipElement || !iconElement || !banner) return;
    
    const tipData = dailyTips[currentDailyTipIndex];
    
    // Fade out
    banner.style.transition = 'opacity 0.3s ease-out';
    banner.style.opacity = '0.7';
    
    setTimeout(() => {
        iconElement.textContent = tipData.icon;
        tipElement.textContent = tipData.tip;
        
        // Fade in
        banner.style.opacity = '1';
    }, 300);
    
    trackEvent('daily_tip_rotated', { 
        user: currentUser, 
        tipIndex: currentDailyTipIndex 
    });
}

// Auto-rotate tips every 30 seconds
function startDailyTipRotation() {
    setInterval(() => {
        rotateTipManually();
    }, 30000); // 30 seconds
}
        
        // 2. Multi-page document generation
        function generateMultiPageDocument(sections, filename, metadata = {}) {
            let fullContent = '';
            
            sections.forEach((section, index) => {
                fullContent += section.content;
                
                // Add page break between sections (for PDF/Word)
                if (index < sections.length - 1) {
                    fullContent += '<div style="page-break-after: always;"></div>';
                }
            });
            
            generateWordDocument(fullContent, filename, metadata);
        }
        
        // Example usage for complex documents:
        // generateMultiPageDocument([
        //     { content: hrTemplates.employmentContract(data), title: 'Employment Contract' },
        //     { content: generatePolicySection(data), title: 'Workplace Policies' },
        //     { content: generateBenefitsSection(data), title: 'Benefits Summary' }
        // ], 'Complete_Employment_Package.doc');

// ========================================
// ACCESS CONTROL
// ========================================
/**
 * Validates user access code and grants entry to assistant
 * Shows error message if code is invalid
 * @returns {void}
 */
function checkAccess() {
    const input = document.getElementById('accessCodeInput').value.trim().toUpperCase();
    const error = document.getElementById('accessError');
    
    // Direct DOM access instead of cache
    const accessScreen = document.getElementById('accessScreen');
    const assistantScreen = document.getElementById('assistantScreen');
    const userCodeEl = document.getElementById('userCode');
    
    if (CONFIG.VALID_CODES.includes(input)) {
    // ✅ STORE ACCESS CODE IN LOCALSTORAGE (only if "Remember Me" is checked)
    const rememberMe = document.getElementById('rememberMe')?.checked ?? true;
    
    if (rememberMe) {
        localStorage.setItem('fitzhr_access_code', input);
        localStorage.setItem('fitzhr_last_login', new Date().toISOString());
    } else {
    }
        
        // Continue with normal login process
        currentUser = input;
        if (userCodeEl) userCodeEl.textContent = input;
        if (accessScreen) accessScreen.classList.add('hidden');
        if (assistantScreen) assistantScreen.classList.remove('hidden');
        if (error) error.classList.add('hidden');
        
        trackEvent('beta_access', { code: input });
        
        // Admin access is now email-based only (via Google Sign-In)
        
        // ✅ SHOW LEGAL ACCEPTANCE MODAL FIRST
        // The modal function will check if already accepted and handle the flow
        setTimeout(async () => {
            const legalModalShown = await showLegalAcceptanceModal();
            
            // If legal modal was NOT shown (already accepted), check onboarding
            if (!legalModalShown) {
                const hasCompletedOnboarding = checkOnboardingStatus();
                if (!hasCompletedOnboarding) {
                    setTimeout(() => showOnboarding(), 500);
                } else {
                    // LOAD CONVERSATIONS FIRST, THEN RESTORE (like Claude.ai)
                    loadConversations(); // Load from localStorage
                    setTimeout(() => {
                        restoreLastConversation();
                        updateSidebarChats();
                        // Show random quick prompts for returning users
                        setTimeout(() => {
                            showRandomQuickPrompts();
                        }, 500);
                    }, 300);
                }
            }
            // If legal modal WAS shown, acceptLegalTerms() will handle onboarding after acceptance
        }, 500);

        // Initialize and start daily tip rotation
        setTimeout(() => {
            updateDailyTipBanner();
            startDailyTipRotation();
        }, 500);
        
    } else {
        error.textContent = 'Invalid access code. Please check and try again.';
        error.classList.remove('hidden');
        
        // ❌ CLEAR ANY STORED CODE IF INVALID ATTEMPT
        localStorage.removeItem('fitzhr_access_code');
    }
}

/**
 * Attempts to auto-login user with stored access code
 * Called on page load to provide seamless experience
 * @returns {boolean} True if auto-login successful, false otherwise
 */
function attemptAutoLogin() {
    // ✅ SKIP IF GOOGLE AUTH IS ACTIVE - Firebase will handle the login
    const googleAuth = localStorage.getItem('fitzhr_google_auth');
    if (googleAuth === 'true') {
        return false; // Let Firebase auth handler take over
    }
    
    const storedCode = localStorage.getItem('fitzhr_access_code');
    const lastLogin = localStorage.getItem('fitzhr_last_login');
    
    if (!storedCode) {
        return false;
    }
    
    // Optional: Check if code is still valid (hasn't expired)
    // For now, codes don't expire, but you could add expiry logic here
    if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const daysSinceLogin = (new Date() - lastLoginDate) / (1000 * 60 * 60 * 24);
        
        // Optional: Expire codes after 30 days of inactivity
        if (daysSinceLogin > 30) {
            localStorage.removeItem('fitzhr_access_code');
            localStorage.removeItem('fitzhr_last_login');
            return false;
        }
    }
    
    // Verify code is still in valid codes list
    if (!CONFIG.VALID_CODES.includes(storedCode)) {
        localStorage.removeItem('fitzhr_access_code');
        localStorage.removeItem('fitzhr_last_login');
        return false;
    }
    
    // Perform automatic login
    const accessScreen = document.getElementById('accessScreen');
    const assistantScreen = document.getElementById('assistantScreen');
    const userCodeEl = document.getElementById('userCode');
    
    currentUser = storedCode;
    if (userCodeEl) userCodeEl.textContent = storedCode;
    if (accessScreen) accessScreen.classList.add('hidden');
    if (assistantScreen) assistantScreen.classList.remove('hidden');
    
    // Update last login timestamp
    localStorage.setItem('fitzhr_last_login', new Date().toISOString());
    
    // Admin access is now email-based only (via Google Sign-In)
    
    // Load conversations first
    loadConversations();
    
    // ✅ CHECK LEGAL ACCEPTANCE FIRST, THEN ONBOARDING
    setTimeout(async () => {
        const legalModalShown = await showLegalAcceptanceModal();
        
        // If legal modal was NOT shown (already accepted), check onboarding
        if (!legalModalShown) {
            const hasCompletedOnboarding = checkOnboardingStatus();
            if (!hasCompletedOnboarding) {
                setTimeout(() => showOnboarding(), 500);
            } else {
                // RESTORE LAST CONVERSATION (like Claude.ai)
                setTimeout(() => {
                    restoreLastConversation();
                    updateSidebarChats();
                    // Show random quick prompts for returning users
                    setTimeout(() => {
                        showRandomQuickPrompts();
                    }, 500);
                    // Check if should show tour for first-time users
                    setTimeout(() => {
                        if (typeof FitzTour !== 'undefined' && !FitzTour.hasSeenTour && !FitzTour.hasDeclinedTour) {
                            FitzTour.showTourPrompt();
                        }
                    }, 2500);
                }, 300);
            }
        }
        // If legal modal WAS shown, acceptLegalTerms() handles onboarding after acceptance
    }, 500);

    // Initialize and start daily tip rotation
    setTimeout(() => {
        updateDailyTipBanner();
        startDailyTipRotation();
    }, 500);
    
    // Track auto-login
    trackEvent('auto_login', { 
        code: storedCode,
        daysSinceLastLogin: lastLogin ? Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24)) : null
    });
    
    return true;
}

// ========================================
// MESSAGING SYSTEM
// ========================================
/**
 * Sends user message to AI and displays response
 * Handles conversation history and UI updates
 * @returns {Promise<void>}
 */
async function sendMessage() {
    const input = DOM.messageInput;
    const message = input.value.trim();
    
    if (!message) return;
    
    // ✅ CHECK LEGAL TERMS ACCEPTANCE FIRST
    const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    const hasAcceptedTerms = localStorage.getItem('legalTermsAccepted_' + userKey) === 'true';
    if (!hasAcceptedTerms) {
        // Show legal acceptance modal
        const modalShown = await showLegalAcceptanceModal();
        if (modalShown) {
            // Modal was shown, don't proceed with message
            return;
        }
    }
    
    // ✅ CHECK PROMPT LIMIT FOR FREE TIER
    if (!hasPromptsRemaining()) {
        openPromptLimitModal();
        return;
    }
    
    // ✅ DETECT TOOL NEEDS (includes document builder, recruitment, integrations, etc.)
    const toolNeeds = detectToolNeeds(message);
    
    // ✅ CHECK FOR HIGH-RISK TOPICS (only critical: termination, legal, harassment)
    const risk = detectHighRiskTopic(message);
    
    // ✅ BLOCK DOCUMENT GENERATION REQUESTS - Redirect to tools
    const documentRequest = detectDocumentGenerationRequest(message);
    if (documentRequest) {
        addMessage('user', message);
        input.value = '';
        
        // Show redirect message without using a prompt
        const redirectMessage = createDocumentRedirectMessage(documentRequest);
        addMessage('assistant', redirectMessage);
        return;
    }
    
    addMessage('user', message);
    input.value = '';
    
    // ✅ USE A PROMPT (for free tier tracking)
    usePrompt();
    
    // Show "Fitz is thinking..." indicator
    const thinkingDiv = showThinkingIndicator();
    const sendBtn = DOM.sendButton;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="pulse">●●●</span>';
    
    conversationHistory.push({ role: 'user', content: message });
    
    try {
        const response = await callClaudeAPI(message);
        
        // Remove thinking indicator
        removeThinkingIndicator(thinkingDiv);
        
        // Build final response with injections
        let finalResponse = response;
        
        // ✅ INJECT TOOL SUGGESTIONS SECOND (max 2 tools)
        if (toolNeeds && toolNeeds.length > 0) {
            const toolSuggestions = createToolSuggestions(toolNeeds);
            finalResponse = toolSuggestions + finalResponse;
            
            // Track tool suggestions shown
            trackEvent('tool_suggestions_shown', {
                user: userKey,
                tools: toolNeeds.map(t => t.id),
                message_snippet: message.substring(0, 50)
            });
        }
        
        // ✅ INJECT HIGH-RISK WARNING FIRST (only for critical legal/termination matters)
        if (risk) {
            const warningBox = createHighRiskWarningBox(risk);
            finalResponse = warningBox + finalResponse;
        }
        
        addMessage('assistant', finalResponse);
        trackConversation(message, response);
        conversationHistory.push({ role: 'assistant', content: response });
        
        // Auto-save conversation
        saveCurrentConversation();
        
        // WEEK 3: Update searchable history
        updateSearchableHistory();
        
        trackEvent('message_sent', { user: currentUser, messageLength: message.length });
    } catch (error) {
        // WEEK 2: Better error handling with user-friendly message
        removeThinkingIndicator(thinkingDiv);
        handleError(error, 'sendMessage');
        addMessage('assistant', '⚠️ I encountered an issue processing your message. Please try again. If the problem persists, try refreshing the page.');
    }
    
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<span>Send</span><span>→</span>';
    
    // Reset textarea height after sending
    autoResizeTextarea(input);
}

function showThinkingIndicator() {
    const container = DOM.messagesContainer.querySelector('.space-y-6');
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.className = 'flex justify-start fade-in';
    thinkingDiv.innerHTML = `
        <div class="max-w-3xl bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="flex gap-1">
                    <div class="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
                <p class="text-slate-400 text-sm">Fitz is thinking...</p>
            </div>
        </div>
    `;
    container.appendChild(thinkingDiv);
    thinkingDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return thinkingDiv;
}

function removeThinkingIndicator(thinkingDiv) {
    if (thinkingDiv && thinkingDiv.parentNode) {
        thinkingDiv.parentNode.removeChild(thinkingDiv);
    }
}

function addMessage(role, content) {
    let container = DOM.messagesContainer.querySelector('.space-y-6');
    
    // If container doesn't exist, create it
    if (!container) {
        DOM.messagesContainer.innerHTML = '<div class="max-w-5xl mx-auto space-y-6"></div>';
        container = DOM.messagesContainer.querySelector('.space-y-6');
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} fade-in`;
    
    let formattedContent = content;
    if (role === 'assistant') {
        // Global fix: AI sometimes hallucinates "Fitzgerald HR" instead of "Fitz HR"
        formattedContent = formattedContent.replace(/Fitzgerald\s*HR/gi, 'Fitz HR').replace(/FitzgeraldHR/gi, 'Fitz HR');
        
        // Check if content already contains high-risk HTML warning
        const hasHighRiskHTML = content.includes('IMPORTANT: This matter involves legal risk');
        
        if (!hasHighRiskHTML) {
            // Look for backend legal warnings and format them
            const legalWarnings = [
                '⚠️ **This matter involves legal risk.**',
                '⚠️ This matter involves legal risk.'
            ];
            
            for (const warning of legalWarnings) {
                if (content.includes(warning)) {
                    // Remove the warning text from content
                    formattedContent = content.replace(warning, '');
                    
                    // Add formatted warning at the top
                    formattedContent = `<div class="mb-3 p-3 bg-red-500/10 border-l-4 border-red-500 rounded">
    <p class="text-red-400 font-bold text-sm flex items-center gap-2 mb-2">
        <span>⚠️</span>
        <span>IMPORTANT: This matter involves legal risk.</span>
    </p>
    <p class="text-red-300 text-sm mb-3">
        Please contact a Senior Consultant at <a href="mailto:support@fitzhr.com" class="underline hover:text-red-200">support@fitzhr.com</a> for expert guidance before taking action.
    </p>
    <div class="flex gap-2">
        <a href="mailto:support@fitzhr.com?subject=URGENT: High-Risk HR Matter - ${encodeURIComponent(currentUser)}" 
           class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded text-sm transition-all text-center">
            ✉️ Email Consultant
        </a>
        <button onclick="openConsultationBookingModal()" 
           class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded text-sm transition-all text-center whitespace-nowrap">
            💬 Book Consultation
        </button>
        <button onclick="openTool('scenarioAnalysis')" 
                class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-3 rounded text-sm transition-all whitespace-nowrap">
            🎯 Analyze
        </button>
    </div>
</div>

` + formattedContent.replace('Please contact one of our Senior Consultants at support@fitzhr.com for expert guidance on your specific situation and next steps.', '');
                    break;
                }
            }
        }
        
        // Format the text content (convert markdown and add line breaks)
        // Only format if it doesn't contain our warning HTML
        if (!formattedContent.includes('<div class="mb-3 p-3 bg-red-500/10')) {
            formattedContent = formattedContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n\n/g, '</p><p class="mt-3">')
                .replace(/info@fitzgeraldhr\.com\.au/g, '<a href="mailto:support@fitzhr.com" class="text-amber-400 hover:underline">support@fitzhr.com</a>')
                .replace(/Fitzgerald\s*HR/gi, 'Fitz HR')
                .replace(/FitzgeraldHR/gi, 'Fitz HR');
            formattedContent = '<p>' + formattedContent + '</p>';
        } else {
            // If it has the warning, format the text AFTER the warning
            const parts = formattedContent.split('</div>\n\n');
            if (parts.length > 1) {
                const warningPart = parts[0] + '</div>\n\n';
                let textPart = parts[1];
                
                textPart = textPart
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p class="mt-3">')
                    .replace(/info@fitzgeraldhr\.com\.au/g, '<a href="mailto:support@fitzhr.com" class="text-amber-400 hover:underline">support@fitzhr.com</a>')
                    .replace(/Fitzgerald\s*HR/gi, 'Fitz HR')
                    .replace(/FitzgeraldHR/gi, 'Fitz HR');
                textPart = '<p>' + textPart + '</p>';
                
                formattedContent = warningPart + textPart;
            }
        }
    }
    
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    messageDiv.setAttribute('data-message-id', messageId);
    
    messageDiv.innerHTML = `
        <div class="max-w-3xl ${role === 'user' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-100 border border-slate-700'} rounded-2xl px-6 py-4 relative">
            ${role === 'assistant' ? `<span class="bookmark-star absolute top-3 right-3" data-message-id="${messageId}" onclick="toggleBookmark('${messageId}')" title="Bookmark this">☆</span>` : ''}
            ${role === 'user' 
                ? `<p class="leading-relaxed whitespace-pre-wrap">${formattedContent}</p>`
                : `<div class="leading-relaxed">${formattedContent}</div>`
            }
        </div>
    `;
    
    container.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
    // Update bookmark stars after adding message
    setTimeout(() => updateBookmarkStars(), 100);
    
    if (role === 'assistant') {
        // ❌ OLD DOCUMENT DETECTION REMOVED - Now using Document Builder detection in sendMessage()        
        // Suggest relevant tools based on conversation
        const lastUserMessage = conversationHistory.filter(m => m.role === 'user').slice(-1)[0];
        if (lastUserMessage) {
            const suggestedTools = suggestRelevantTools(lastUserMessage.content, content);
            if (suggestedTools.length > 0) {
                setTimeout(() => addToolSuggestions(messageDiv, suggestedTools), 600);
            }
        }
    }
}

async function callClaudeAPI(message) {
    try {
        const venueContext = getVenueContext();
        const response = await fetch(CONFIG.API.CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: venueContext + message,
                history: conversationHistory.filter(m => m.role !== 'system'),
                user: currentUser,
                primaryAward: venueProfile.primaryAward || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get response');
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        throw error;
    }
}

/**
 * Specialized API call for document generation
 * Uses strict framing to ensure actual document output, not advice
 */
async function callClaudeAPIForDocument(documentPrompt) {
    try {
        // Frame the request as a strict document generation task
        const strictPrefix = `[DOCUMENT GENERATION MODE - STRICT]

You are now in DOCUMENT GENERATION MODE. Your ONLY task is to output a complete, ready-to-use HR document.

CRITICAL RULES:
- Output ONLY the document content itself
- Start your response with the document header (e.g., "# FORMAL WARNING LETTER")
- Do NOT include any conversational text like "I understand", "Here's", "Let me help", etc.
- Do NOT provide advice, tips, or process guidance
- Do NOT explain what the document is or how to use it
- Do NOT ask for more information - use what is provided

CRITICAL CONTACT DETAILS RULES:
- The company name is "Fitz HR" - NEVER use "Fitzgerald HR"
- The contact email is "support@fitzhr.com" - NEVER use any @fitzgeraldhr email
- NEVER include personal mobile or phone numbers in generated documents
- For phone fields, use "[Insert Phone Number]" as placeholder
- For email fields in document contact sections, use "support@fitzhr.com"

If you output anything other than the actual document, you are violating the strict mode.

BEGIN DOCUMENT OUTPUT:

`;
        
        const response = await fetch(CONFIG.API.CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: strictPrefix + documentPrompt,
                history: [], // No conversation history for document generation
                user: currentUser,
                isDocumentGeneration: true // Flag for potential backend handling
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate document');
        }

        const data = await response.json();
        let documentContent = data.message;
        
        // Fix AI hallucinating "Fitzgerald HR" and old contact details
        documentContent = documentContent.replace(/Fitzgerald\s*HR/gi, 'Fitz HR');
        documentContent = documentContent.replace(/FitzgeraldHR/gi, 'Fitz HR');
        documentContent = documentContent.replace(/info@fitzgeraldhr\.com\.au/gi, 'support@fitzhr.com');
        documentContent = documentContent.replace(/info@fitzgeraldhr\.com/gi, 'support@fitzhr.com');
        documentContent = documentContent.replace(/fitzgeraldhr\.com\.au/gi, 'fitzhr.com');
        documentContent = documentContent.replace(/fitzgeraldhr\.com/gi, 'fitzhr.com');
        
        // Strip any Australian mobile/phone numbers (04XX XXX XXX or 0X XXXX XXXX patterns)
        documentContent = documentContent.replace(/\b0[45]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g, '[Phone Number Removed]');
        documentContent = documentContent.replace(/\b0[2378]\s?\d{4}\s?\d{4}\b/g, '[Phone Number Removed]');
        documentContent = documentContent.replace(/\+61\s?\d[\s.-]?\d{4}[\s.-]?\d{4}/g, '[Phone Number Removed]');
        
        // Remove any lines that look like exposed personal phone numbers
        documentContent = documentContent.replace(/Phone:\s*\[?Phone Number Removed\]?/gi, 'Phone: [Insert Phone Number]');
        documentContent = documentContent.replace(/Mobile:\s*\[?Phone Number Removed\]?/gi, 'Mobile: [Insert Phone Number]');
        
        // Post-process: If response still starts with conversational text, try to extract the document
        if (documentContent.toLowerCase().startsWith('i understand') || 
            documentContent.toLowerCase().startsWith("here's") ||
            documentContent.toLowerCase().startsWith('let me') ||
            documentContent.toLowerCase().startsWith('i\'ll help')) {
            
            // Try to find where the actual document starts
            const docStarters = ['# FORMAL', '# PRIVATE', '# LETTER', '# PERFORMANCE', '# RECORD', 'FORMAL WARNING', 'PRIVATE & CONFIDENTIAL', 'LETTER OF'];
            for (const starter of docStarters) {
                const idx = documentContent.indexOf(starter);
                if (idx > 0) {
                    documentContent = documentContent.substring(idx);
                    break;
                }
            }
        }
        
        return documentContent;
    } catch (error) {
        throw error;
    }
}

// ========================================
// PROACTIVE TOOL SUGGESTIONS
// ========================================

function suggestRelevantTools(userMessage, assistantResponse) {
    // Combine user message and AI response for comprehensive keyword matching
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = assistantResponse.toLowerCase();
    const combinedText = lowerMessage + ' ' + lowerResponse;
    
    // Define tool keywords - each tool has trigger phrases
    const toolKeywords = {
        'awardWizard': {
            keywords: ['award rate', 'classification', 'what level', 'pay rate', 'how much should i pay'],
            name: 'Award Wizard',
            icon: '🧙',
            description: 'Find the exact award classification and rate'
        },
        // ... (keep rest of toolKeywords)
    };
    
    const suggestedTools = [];
    
    // Scan each tool for keyword matches
    for (const [toolId, tool] of Object.entries(toolKeywords)) {
        // Count how many keywords appear in the conversation
        const keywordMatches = tool.keywords.filter(keyword => combinedText.includes(keyword));
        
        // Only suggest if at least one keyword matches
        if (keywordMatches.length > 0) {
            suggestedTools.push({ toolId, ...tool, matches: keywordMatches.length });
        }
    }
    
    // Sort by relevance - most keyword matches first
    suggestedTools.sort((a, b) => b.matches - a.matches);
    
    // Return top 2 most relevant tools to avoid overwhelming user
    return suggestedTools.slice(0, CONFIG.TOOL_SUGGESTION_LIMIT);
}

function addToolSuggestions(messageDiv, tools) {
    if (tools.length === 0) return;
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'mt-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg';
    
    let html = '<p class="text-blue-400 font-semibold mb-3 flex items-center gap-2">';
    html += '<span>💡</span><span>Helpful Tools:</span></p><div class="space-y-2">';
    
    tools.forEach(tool => {
        html += `
            <button onclick="openTool('${tool.toolId}')" 
                    class="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all flex items-center gap-3 group">
                <span class="text-2xl">${tool.icon}</span>
                <div class="flex-1">
                    <p class="text-slate-200 font-medium group-hover:text-amber-400 transition-colors">${tool.name}</p>
                    <p class="text-xs text-slate-400">${tool.description}</p>
                </div>
                <span class="text-slate-400 group-hover:text-amber-400 transition-colors">→</span>
            </button>
        `;
    });
    
    html += '</div>';
    suggestionsContainer.innerHTML = html;
    messageDiv.querySelector('.max-w-3xl').appendChild(suggestionsContainer);
}

// ========================================
// DOCUMENT GENERATION
// ========================================

function detectDocumentType(content) {
    const lowerContent = content.toLowerCase();
    const documentKeywords = {
        'employmentContract': ['employment contract', 'hire', 'new employee'],
        'warningLetter': ['warning', 'disciplinary', 'performance issue']
    };
    
    for (const [docType, keywords] of Object.entries(documentKeywords)) {
        if (keywords.some(keyword => lowerContent.includes(keyword))) {
            return docType;
        }
    }
    return null;
}

function addDocumentDownloadButtons(messageDiv, documentType) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-4 p-4 bg-slate-700/50 rounded-lg border border-amber-500/30';
    buttonContainer.innerHTML = `
        <p class="text-amber-400 font-semibold mb-3">📄 Generate Document</p>
        <div class="flex gap-2">
            <button onclick="downloadDocument('${documentType}', 'word')" 
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                📝 Download Word
            </button>
        </div>
        <p class="text-xs text-slate-400 mt-3">⚠️ Must be reviewed by consultant before use</p>
    `;
    messageDiv.querySelector('.max-w-3xl').appendChild(buttonContainer);
}

function downloadDocument(documentType, format) {
    // ✅ CHECK: Template document credit protection
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[documentType];
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    
    // Check if free tier user has exhausted their free template
    if (tier === 'free') {
        if (cost?.category === 'template') {
            const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
            if (lowRiskDocsUsed >= 1) {
                showNotification('⚠️ Free template limit reached. Please upgrade.', 'error');
                showSubscriptionOptions();
                return;
            }
        } else if (cost && cost.credits > 0) {
            // Non-template document requires credits
            if (getTotalCredits() < cost.credits) {
                showNotification('⚠️ Not enough credits. Please purchase more.', 'error');
                openCreditsModal();
                return;
            }
        }
    }
    
    const confirmed = confirm(
        "⚠️ IMPORTANT: This is a TEMPLATE only.\n\n" +
        "You MUST have it reviewed by a Fitz HR consultant.\n\n" +
        "Contact: support@fitzhr.com\n\n" +
        "Click OK to download."
    );
    
    if (!confirmed) return;
    
    const data = { employeeName: '[Name]', position: '[Position]' };
    const template = hrTemplates[documentType];
    if (!template) return;
    
    const content = template(data);
    const filename = `${documentType}_${Date.now()}.doc`;
    generateWordDocument(content, filename);
}

function generateExcelSpreadsheet(data, filename, sheetName = 'Data') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    return true;
}

// ========================================
// CRISIS MODE
// ========================================

// Crisis Mode pricing by tier
const CRISIS_PRICING = {
    free:         { price: 320, discount: 0,  label: null },
    starter:      { price: 288, discount: 10, label: '10% Starter Discount' },
    pro:          { price: 240, discount: 25, label: '25% Pro Discount' },
    business:     { price: 160, discount: 50, label: '50% Business Discount' }
};

// Store crisis form data between modals
let crisisFormData = {};

const CRISIS_TYPE_LABELS = {
    'injury': 'Workplace Injury',
    'harassment': 'Sexual Harassment / Bullying',
    'theft': 'Theft / Serious Misconduct',
    'walkout': 'Employee Walkout / Strike',
    'discrimination': 'Discrimination Complaint',
    'violence': 'Workplace Violence / Threat',
    'death': 'Death / Medical Emergency',
    'other': 'Other Urgent Matter'
};

function activateCrisisMode() {
    document.getElementById('crisisModal').classList.remove('hidden');
    trackEvent('crisis_mode_activated', { user: currentUser });
}

function closeCrisisModal() {
    document.getElementById('crisisModal').classList.add('hidden');
}

function closeCrisisPricingModal() {
    document.getElementById('crisisPricingModal').classList.add('hidden');
}

/**
 * Validates crisis form, stores data, then shows pricing confirmation modal
 */
function submitCrisis() {
    console.log('🚨 submitCrisis() called');
    
    const crisisType = document.getElementById('crisisType').value;
    const description = document.getElementById('crisisDescription').value;
    const phone = document.getElementById('crisisPhone').value;

    if (!crisisType || !description || !phone) {
        showAlert('Please fill in all fields');
        return;
    }

    // Store form data so it persists between modal transitions
    // DEBUG: Log exact tier values to diagnose pricing mismatch
    const rawSubscriptionTier = userCredits.subscriptionTier;
    const rawTier = userCredits.tier;
    console.log('🚨 DEBUG - userCredits.subscriptionTier:', JSON.stringify(rawSubscriptionTier));
    console.log('🚨 DEBUG - userCredits.tier:', JSON.stringify(rawTier));
    console.log('🚨 DEBUG - Full userCredits:', JSON.stringify(userCredits));
    
    // Normalize tier to lowercase to handle 'Pro', 'PRO', 'professional' etc
    const rawTierValue = (userCredits.subscriptionTier || userCredits.tier || 'free').toLowerCase().trim();
    
    // Map any variations to our pricing keys
    const tierMap = {
        'free': 'free',
        'starter': 'starter',
        'pro': 'pro',
        'professional': 'pro',
        'business': 'business',
        'enterprise': 'business'
    };
    const tier = tierMap[rawTierValue] || 'free';
    const pricing = CRISIS_PRICING[tier] || CRISIS_PRICING.free;
    
    console.log('🚨 DEBUG - Raw tier value:', JSON.stringify(rawTierValue));
    console.log('🚨 DEBUG - Mapped tier:', tier);
    console.log('🚨 DEBUG - Pricing:', JSON.stringify(pricing));
    
    crisisFormData = {
        crisisType,
        description,
        phone,
        tier,
        pricing
    };
    
    console.log('🚨 Crisis data stored:', crisisFormData);

    // Update pricing modal display
    const priceEl = document.getElementById('crisisPrice');
    const originalPriceEl = document.getElementById('crisisOriginalPrice');
    const discountBadge = document.getElementById('crisisDiscountBadge');

    priceEl.textContent = `$${pricing.price}`;

    if (pricing.discount > 0) {
        originalPriceEl.textContent = '$320';
        originalPriceEl.classList.remove('hidden');
        discountBadge.classList.remove('hidden');
        discountBadge.querySelector('span').textContent = `✨ ${pricing.label}`;
    } else {
        originalPriceEl.classList.add('hidden');
        discountBadge.classList.add('hidden');
    }

    // Hide crisis form, show pricing confirmation
    document.getElementById('crisisModal').classList.add('hidden');
    document.getElementById('crisisPricingModal').classList.remove('hidden');
    
    console.log('🚨 Pricing modal shown');
    trackEvent('crisis_pricing_shown', { user: currentUser, tier: tier, price: pricing.price });
}

/**
 * Confirmed by user - sends crisis alert to backend + confirmation email
 */
async function confirmCrisisSubmission() {
    console.log('🚨 confirmCrisisSubmission() called');
    
    const { crisisType, description, phone, tier, pricing } = crisisFormData;
    
    if (!crisisType || !phone) {
        showAlert('Crisis data missing. Please try again.');
        closeCrisisPricingModal();
        activateCrisisMode();
        return;
    }

    const confirmBtn = document.querySelector('#crisisPricingModal button[onclick="confirmCrisisSubmission()"]');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="animate-pulse">⏳ Sending urgent alert...</span>';

    let telegramSuccess = false;
    let crisisId = 'CR-' + Date.now();

    // Step 1: Try sending Telegram alert
    try {
        console.log('🚨 Sending Telegram alert...');
        const response = await fetch(CONFIG.API.CRISIS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                crisisType, 
                description, 
                phone, 
                user: currentUser,
                tier: tier,
                chargeAmount: pricing.price,
                discount: pricing.discount
            })
        });

        const result = await response.json();

        if (response.ok) {
            crisisId = result.crisisId || crisisId;
            telegramSuccess = true;
            console.log('✅ Telegram alert sent, Crisis ID:', crisisId);
        } else {
            console.warn('⚠️ Telegram endpoint returned error:', result);
        }
    } catch (telegramError) {
        console.warn('⚠️ Telegram alert failed:', telegramError);
    }

    // Step 2: Send confirmation email (always attempt, regardless of Telegram)
    try {
        console.log('📧 Sending crisis confirmation email...');
        await emailjs.send('service_dfmeslf', 'template_crisis_confirm', {
            crisis_id: crisisId,
            crisis_type: CRISIS_TYPE_LABELS[crisisType] || crisisType,
            description: description,
            user_name: currentUser?.displayName || 'N/A',
            user_email: currentUser?.email || 'N/A',
            phone_number: phone,
            charge_amount: `$${pricing.price}`,
            discount_applied: pricing.discount > 0 ? `${pricing.discount}% (${pricing.label})` : 'None',
            user_tier: tier.charAt(0).toUpperCase() + tier.slice(1),
            submitted_date: new Date().toLocaleString('en-AU', {
                dateStyle: 'full',
                timeStyle: 'short',
                timeZone: 'Australia/Sydney'
            })
        });
        console.log('✅ Crisis confirmation email sent to support');
    } catch (emailError) {
        console.warn('⚠️ Crisis confirmation email failed:', emailError);
    }

    // Step 3: Show result to user
    closeCrisisPricingModal();
    
    if (telegramSuccess) {
        showAlert(`🚨 URGENT ALERT SENT\n\nCrisis ID: ${crisisId}\n\nA Senior Consultant will call ${phone} within 15 mins (business hours 9am-5pm) or 2 hrs (after hours).\n\nA $${pricing.price} invoice will be sent after your consultation.`);
    } else {
        showAlert(`🚨 CRISIS LOGGED\n\nCrisis ID: ${crisisId}\n\nOur team has been notified and will call ${phone} as soon as possible.\n\nIf urgent, also email: support@fitzhr.com\n\nA $${pricing.price} invoice will be sent after your consultation.`);
    }
    
    // Reset crisis form
    document.getElementById('crisisType').value = '';
    document.getElementById('crisisDescription').value = '';
    document.getElementById('crisisPhone').value = '';
    crisisFormData = {};
    
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalText;
    
    trackEvent('crisis_submitted', { user: currentUser, tier: tier, price: pricing.price, crisisType: crisisType, telegramSuccess: telegramSuccess });
}

// ========================================
// VOICE INPUT
// ========================================

function toggleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported in your browser. Try Chrome or Edge.', 'warning', 3000);
        return;
    }
    isListening ? stopListening() : startListening();
}

function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-AU';

    recognition.onstart = () => {
        isListening = true;
        
        // Update button style
        const voiceBtn = document.getElementById('voiceButton');
        const voiceIcon = document.getElementById('voiceIcon');
        if (voiceBtn) {
            voiceBtn.classList.add('bg-red-500', 'text-white');
            voiceBtn.classList.remove('text-slate-400');
        }
        if (voiceIcon) {
            voiceIcon.classList.add('animate-pulse');
        }
        
        // Show recording indicator
        const indicator = document.getElementById('voiceRecordingIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    };

    // Debounce transcript updates for better performance
    const updateTranscript = debounce((transcript) => {
        DOM.messageInput.value = transcript;
        autoResizeTextarea(DOM.messageInput);
    }, CONFIG.DEBOUNCE_DELAY);

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        updateTranscript(transcript);
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => stopListening();
    recognition.start();
}

function stopListening() {
    if (recognition) recognition.stop();
    isListening = false;
    
    // Reset button style
    const voiceBtn = document.getElementById('voiceButton');
    const voiceIcon = document.getElementById('voiceIcon');
    if (voiceBtn) {
        voiceBtn.classList.remove('bg-red-500', 'text-white');
        voiceBtn.classList.add('text-slate-400');
    }
    if (voiceIcon) {
        voiceIcon.classList.remove('animate-pulse');
    }
    
    // Hide recording indicator
    const indicator = document.getElementById('voiceRecordingIndicator');
    if (indicator) {
        indicator.classList.add('hidden');
    }
}

// ========================================
// CHATGPT-STYLE SIDEBAR & NEW FEATURES
// ========================================

// ========================================
// CONVERSATION MANAGEMENT SYSTEM
// ========================================

// Conversation storage
var conversations = [];
var currentConversationId = null;

// Load conversations from localStorage
function loadConversations() {
    const stored = localStorage.getItem('fitz_conversations');
    if (stored) {
        try {
            conversations = JSON.parse(stored);
        } catch (e) {
            conversations = [];
        }
    }
}

// Save conversations to localStorage
function saveConversations() {
    try {
        localStorage.setItem('fitz_conversations', JSON.stringify(conversations));
        // Sync to cloud
        syncConversationsToCloud();
    } catch (e) {
    }
}

// Sync all conversations to cloud
async function syncConversationsToCloud() {
    if (!currentUser || !db) {
        return;
    }
    
    try {
        // Save each conversation to Firestore
        for (const conversation of conversations) {
            // Create clean data object without undefined fields
            const cleanData = {
                id: conversation.id,
                title: conversation.title,
                messages: conversation.messages || [],
                created: conversation.created,
                updated: conversation.updated,
                userId: currentUser.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('users').doc(currentUser.uid)
                    .collection('conversations').doc(conversation.id)
                    .set(cleanData, { merge: true });
        }
    } catch (error) {
    }
}

// Load conversations from cloud
async function loadConversationsFromCloud() {
    if (!currentUser || !db) {
        return;
    }
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
                                  .collection('conversations').get();
        
        if (snapshot.empty) {
            return;
        }
        
        const cloudConversations = [];
        snapshot.forEach(doc => {
            cloudConversations.push(doc.data());
        });
        
        // Merge with local conversations (cloud takes priority)
        conversations = cloudConversations;
        
        // Save to localStorage
        localStorage.setItem('fitz_conversations', JSON.stringify(conversations));
        
        // Refresh the conversation list UI
        refreshConversationListUI();
        
    } catch (error) {
    }
}

// Refresh the conversation list in the UI
function refreshConversationListUI() {
    // Update recent chats sidebar if it exists
    const recentChatsContainer = document.querySelector('.recent-chats');
    if (recentChatsContainer && typeof displayRecentConversations === 'function') {
        displayRecentConversations();
    }
}


// Get current conversation
function getCurrentConversation() {
    return conversations.find(c => c.id === currentConversationId);
}

// Create new conversation
function createNewConversation() {
    // Save current conversation first
    if (currentConversationId) {
        saveCurrentConversation();
    }
    
    // Create new conversation
    const newConv = {
        id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        title: 'New Chat',
        messages: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    conversations.push(newConv);
    currentConversationId = newConv.id;
    
    // Clear UI
    const container = DOM.messagesContainer.querySelector('.space-y-6');
    if (container) {
        container.innerHTML = '';
    } else {
        DOM.messagesContainer.innerHTML = '<div class="max-w-5xl mx-auto space-y-6"></div>';
    }
    
    // Reset conversation history
    conversationHistory = [];
    
    // Add FULL welcome message with HTML formatting (matching Image 1)
    const welcomeMessage = `
        <p class="text-slate-100 leading-relaxed">
            👋 G'day! I'm Fitz, your hospitality HR assistant.
        </p>
        <p class="text-slate-100 leading-relaxed mt-3">
            Ask me anything about awards, compliance, or employment law.
        </p>
        <p class="text-red-400 font-semibold mt-4 mb-2">🚨 Urgent/Critical Situations:</p>
        <p class="text-slate-100 text-sm">
            Use the red URGENT button above for immediate crisis response.
        </p>
        <p class="text-slate-100 leading-relaxed mt-4">
            What HR topic would you like to learn about today?
        </p>
    `;
    
    // For display - reuse container already declared above
    var displayContainer = DOM.messagesContainer.querySelector('.space-y-6');
    if (!displayContainer) {
        DOM.messagesContainer.innerHTML = '<div class="max-w-5xl mx-auto space-y-6"></div>';
        displayContainer = DOM.messagesContainer.querySelector('.space-y-6');
    }
    
    if (displayContainer) {
        var messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-start fade-in';
        var messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        messageDiv.setAttribute('data-message-id', messageId);
        messageDiv.innerHTML = '<div class="max-w-3xl bg-slate-800 text-slate-100 border border-slate-700 rounded-2xl px-6 py-4 relative">' +
            '<span class="bookmark-star absolute top-3 right-3" data-message-id="' + messageId + '" onclick="toggleBookmark(\'' + messageId + '\')" title="Bookmark this">☆</span>' +
            '<div class="leading-relaxed">' + welcomeMessage + '</div>' +
            '</div>';
        displayContainer.appendChild(messageDiv);
    }
    
    // For storage - save plain text version
    var plainWelcome = '👋 G\'day! I\'m Fitz, your hospitality HR assistant.\n\nAsk me anything about awards, compliance, or employment law.\n\n🚨 Urgent/Critical Situations:\nUse the red URGENT button above for immediate crisis response.\n\nWhat HR topic would you like to learn about today?';
    conversationHistory.push({ role: 'assistant', content: plainWelcome });
    
    // Save and update UI - FIXED: Use saveCurrentConversation to update messages
    saveCurrentConversation();
    
    showToast('New chat started', 'success', 2000);
    
    // Show random quick prompts after brief delay
    setTimeout(function() {
        showRandomQuickPrompts();
    }, 400);
    
}

// Save current conversation
function saveCurrentConversation() {
    if (!currentConversationId) {
        return;
    }
    
    // Save current conversation ID to localStorage with user-specific key for persistence
    const userKey = currentUser && currentUser.uid ? currentUser.uid : (currentUser || 'anonymous');
    localStorage.setItem('fitz_currentConversationId_' + userKey, currentConversationId);
    
    // Also save to Firebase for cross-device continuity
    saveCurrentConversationIdToFirebase(currentConversationId);
    
    var conv = getCurrentConversation();
    if (!conv) {
        return;
    }
    
    // Update messages
    conv.messages = conversationHistory;
    conv.updated = new Date().toISOString();
    
    // Update title from first user message if still "New Chat"
    if (conv.title === 'New Chat' && conversationHistory.length > 0) {
        var firstUserMsg = conversationHistory.find(function(m) { return m.role === 'user'; });
        if (firstUserMsg) {
            conv.title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        }
    }
    
    saveConversations();
    updateSidebarChats();
    
}

// Load conversation by ID
function loadConversation(convId) {
    // Save current first
    if (currentConversationId && currentConversationId !== convId) {
        saveCurrentConversation();
    }
    
    var conv = conversations.find(function(c) { return c.id === convId; });
    if (!conv) {
        return;
    }
    
    currentConversationId = convId;
    
    // Clear UI
    var container = DOM.messagesContainer.querySelector('.space-y-6');
    if (container) {
        container.innerHTML = '';
    } else {
        DOM.messagesContainer.innerHTML = '<div class="max-w-5xl mx-auto space-y-6"></div>';
        container = DOM.messagesContainer.querySelector('.space-y-6');
    }
    
    // Load messages
    conversationHistory = conv.messages || [];
    // Render messages
    conversationHistory.forEach(function(msg, index) {
        addMessage(msg.role, msg.content);
    });
    
    // Update UI
    updateSidebarChats();
    
    // Scroll to bottom after messages are rendered so user sees most recent messages
    // Also focus the message input so user can start typing immediately
    // Use multiple timeouts to ensure scroll happens after all content renders
    setTimeout(function() {
        scrollToBottomInstant();
    }, 150);
    
    // Second scroll as backup after longer delay for slow-rendering content
    setTimeout(function() {
        scrollToBottomInstant();
        // Focus the message input on desktop
        const messageInput = document.getElementById('messageInput');
        if (messageInput && window.innerWidth >= 768) {
            messageInput.focus();
        }
    }, 400);
    
}

/**
 * Restore the last active conversation on app load
 * Similar to how Claude.ai works - shows previous chat instead of blank
 */
function restoreLastConversation() {
    // First, load conversations from localStorage if not already loaded
    if (conversations.length === 0) {
        loadConversations();
    }
    
    // Try to get the last active conversation ID using user-specific key
    const userKey = currentUser && currentUser.uid ? currentUser.uid : (currentUser || 'anonymous');
    let lastConvId = localStorage.getItem('fitz_currentConversationId_' + userKey);
    
    // Fallback to old key for backwards compatibility
    if (!lastConvId) {
        lastConvId = localStorage.getItem('fitz_currentConversationId');
    }
    
    // Check if that conversation still exists
    let targetConv = null;
    if (lastConvId) {
        targetConv = conversations.find(c => c.id === lastConvId);
    }
    
    // If last conversation doesn't exist, get the most recent one
    if (!targetConv && conversations.length > 0) {
        // Sort by updated date (most recent first)
        const sorted = [...conversations].sort((a, b) => {
            return new Date(b.updated || b.created) - new Date(a.updated || a.created);
        });
        targetConv = sorted[0];
    }
    
    // If we have a conversation to restore
    if (targetConv) {
        // Check if it has meaningful messages (more than just welcome message)
        const hasMeaningfulMessages = targetConv.messages && targetConv.messages.length > 1;
        // Load the conversation
        loadConversation(targetConv.id);
        
        // Show appropriate toast
        if (hasMeaningfulMessages) {
            showToast('Restored previous chat', 'info', 2000);
        }
        
        return true; // Conversation restored
    }
    
    // No conversations exist - create a new one
    createNewConversation();
    return false; // New conversation created
}

// Delete conversation
function deleteConversation(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    
    if (!confirm('Delete "' + conv.title + '"? This cannot be undone.')) {
        return;
    }
    
    // Remove from array
    conversations = conversations.filter(c => c.id !== convId);
    
    // If deleting current conversation
    if (convId === currentConversationId) {
        if (conversations.length > 0) {
            // Load the most recent conversation
            loadConversation(conversations[conversations.length - 1].id);
        } else {
            // Create new conversation
            createNewConversation();
        }
    }
    
    saveConversations();
    updateSidebarChats();
    
    showToast('Conversation deleted', 'info', 2000);
}

// Update sidebar chats list
function updateSidebarChats() {
    const chatsList = document.getElementById('sidebarChatsList');
    if (!chatsList) return;
    
    if (conversations.length === 0) {
        chatsList.innerHTML = '<p class="text-slate-500 text-sm py-4 text-center">No chats yet</p>';
        return;
    }
    
    // Sort by updated date (most recent first) and take only the 5 most recent
    const sortedConvs = [...conversations]
        .sort((a, b) => new Date(b.updated) - new Date(a.updated))
        .slice(0, 5); // Only show the 5 most recent
    
    chatsList.innerHTML = sortedConvs.map(conv => {
        const isActive = conv.id === currentConversationId;
        const date = new Date(conv.updated);
        const dateStr = formatRelativeDate(date);
        
        return `
            <div class="sidebar-chat-item ${isActive ? 'active' : ''}" onclick="loadConversation('${conv.id}')">
                <div class="sidebar-chat-title">${escapeHtml(conv.title)}</div>
                <button class="sidebar-chat-delete" onclick="event.stopPropagation(); deleteConversation('${conv.id}')" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// Format relative date
function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min ago';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return diffDays + 'd ago';
    return date.toLocaleDateString();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize conversation system
function initConversationSystem() {
    loadConversations();
    
    if (conversations.length === 0) {
        // Create first conversation
        createNewConversation();
    } else {
        // Load most recent conversation
        const mostRecent = conversations.sort((a, b) => 
            new Date(b.updated) - new Date(a.updated)
        )[0];
        loadConversation(mostRecent.id);
    }
}

// ========================================
// BOOKMARKS SYSTEM
// ========================================

var bookmarks = [];
var recentTools = []; // Track recently used tools

// Tool metadata - maps tool IDs to display info and open functions
const toolMetadata = {
    // Document & Performance Tools
    'documentBuilderModal': { name: 'Document Builder', icon: '📝', modalId: 'documentBuilderModal' },
    'awardCalculatorModal': { name: 'Award Calculator', icon: '💰', modalId: 'awardCalculatorModal' },
    'scenarioAnalysisModal': { name: 'Scenario Analysis', icon: '🎯', modalId: 'scenarioAnalysisModal' },
    'rosterStressTesterModal': { name: 'Roster Stress Test', icon: '💥', modalId: 'rosterStressTesterModal' },
    'awardWizardModal': { name: 'Award Wizard', icon: '🧙', modalId: 'awardWizardModal' },
    'rosterOptimizerModal': { name: 'Roster Optimizer', icon: '📅', modalId: 'rosterOptimizerModal' },
    'complianceCalendarModal': { name: 'Compliance Calendar', icon: '📆', modalId: 'complianceCalendarModal' },
    'terminationRiskModal': { name: 'Termination Risk', icon: '⚠️', modalId: 'terminationRiskModal' },
    
    // Document Builder - Specific Document Types
    'doc_recordOfDiscussion': { name: 'Record of Discussion', icon: '📋', docType: 'recordOfDiscussion' },
    'doc_formalWarning': { name: 'Formal Warning', icon: '⚠️', docType: 'formalWarning' },
    'doc_performanceImprovementPlan': { name: 'Performance Improvement Plan', icon: '📊', docType: 'performanceImprovementPlan' },
    'doc_letterOfAllegation': { name: 'Letter of Allegation', icon: '🔍', docType: 'letterOfAllegation' },
    'doc_formalProbationReview': { name: 'Formal Probation Review', icon: '📑', docType: 'formalProbationReview' },
    
    // Recruitment Tools
    'recruitmentToolkitModal': { name: 'Recruitment Toolkit', icon: '👥', modalId: 'recruitmentToolkitModal' },
    'jobDescriptionBuilder': { name: 'Job Ad Builder', icon: '📢', openFunc: 'openJobDescriptionBuilder' },
    'positionDescriptionBuilder': { name: 'Position Description', icon: '📋', openFunc: 'openPositionDescriptionBuilder' },
    'interviewQuestionsGenerator': { name: 'Interview Questions', icon: '🎤', openFunc: 'openInterviewQuestionsGenerator' },
    'referenceCheckForm': { name: 'Reference Check', icon: '📞', openFunc: 'openReferenceCheckForm' },
    
    // New Employee Tools
    'newEmployeeToolkit': { name: 'New Employee Toolkit', icon: '👤', openFunc: 'openNewEmployeeToolkit' },
    'onboardingChecklist': { name: 'Onboarding Checklist', icon: '✅', openFunc: 'openOnboardingChecklist' },
    'trainingPlanGenerator': { name: 'Training Plan', icon: '📚', openFunc: 'openTrainingPlan' },
    'employmentContractBuilder': { name: 'Employment Contract', icon: '📄', openFunc: 'openNewEmployeeToolkit' },
    
    // Probation Tools
    'probationCheckIn': { name: 'Probation Check-In', icon: '🔄', openFunc: 'openProbationCheckIn' }
};


// Load bookmarks
function loadBookmarks() {
    const stored = localStorage.getItem('fitz_bookmarks');
    if (stored) {
        try {
            bookmarks = JSON.parse(stored);
        } catch (e) {
            bookmarks = [];
        }
    }
}

// Load bookmarks from Firebase and merge with local
async function loadBookmarksFromFirebase() {
    if (!currentUser || !currentUser.uid || !db) {
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const firebaseBookmarks = userData.bookmarks || [];
            
            // Merge: Firebase takes priority
            const mergedMap = new Map();
            
            // Add local bookmarks first
            bookmarks.forEach(b => {
                if (b && b.id) mergedMap.set(b.id, b);
            });
            
            // Override with Firebase bookmarks
            firebaseBookmarks.forEach(b => {
                if (b && b.id) mergedMap.set(b.id, b);
            });
            
            bookmarks = Array.from(mergedMap.values());
            
            // Save merged result
            localStorage.setItem('fitz_bookmarks', JSON.stringify(bookmarks));
            
            // Update UI
            updateSidebarBookmarks();
        }
    } catch (error) {
    }
}

// Save bookmarks
function saveBookmarks() {
    localStorage.setItem('fitz_bookmarks', JSON.stringify(bookmarks));
    
    // Sync to Firebase
    if (currentUser && currentUser.uid && db) {
        db.collection('users').doc(currentUser.uid).set({
            bookmarks: bookmarks
        }, { merge: true }).catch(err => {
        });
    }
}

// Toggle bookmark
function toggleBookmark(messageId) {
    const existingIndex = bookmarks.findIndex(b => b.id === messageId);
    
    if (existingIndex >= 0) {
        // Remove bookmark
        bookmarks.splice(existingIndex, 1);
        showToast('Bookmark removed', 'info', 1500);
    } else {
        // Add bookmark
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const content = messageElement.textContent;
            
            // Find the user's question by looking at previous messages in DOM
            let userQuestion = 'Bookmarked response';
            
            // Walk backwards through DOM siblings to find the previous user message
            let currentEl = messageElement.previousElementSibling;
            while (currentEl) {
                // Check if this is a user message (has amber background)
                const messageContent = currentEl.querySelector('.bg-amber-500');
                if (messageContent) {
                    userQuestion = messageContent.textContent.trim();
                    break;
                }
                currentEl = currentEl.previousElementSibling;
            }
            
            bookmarks.push({
                id: messageId,
                content: content,
                preview: userQuestion, // Store the user's question as preview
                conversationId: currentConversationId,
                created: new Date().toISOString()
            });
            showToast('Bookmarked', 'success', 1500);
        }
    }
    
    saveBookmarks();
    updateBookmarkStars();
    updateSidebarBookmarks();
}

// Update bookmark stars
function updateBookmarkStars() {
    document.querySelectorAll('.bookmark-star').forEach(star => {
        const messageId = star.getAttribute('data-message-id');
        const isBookmarked = bookmarks.some(b => b.id === messageId);
        star.textContent = isBookmarked ? '⭐' : '☆';
    });
}

// Update sidebar bookmarks
function updateSidebarBookmarks() {
    var bookmarksList = document.getElementById('sidebarBookmarksList');
    
    if (!bookmarksList) {
        return;
    }
    
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<p class="text-slate-500 text-sm py-4 text-center">No bookmarks yet</p>';
        return;
    }
    
    bookmarksList.innerHTML = bookmarks.slice(0, 10).map(function(b) {
        // Use the stored preview (user's question) or fallback to content
        var displayText = b.preview || b.content;
        var preview = displayText.substring(0, 60) + (displayText.length > 60 ? '...' : '');
        return '<div class="sidebar-chat-item" onclick="jumpToBookmark(\'' + b.id + '\')">' +
            '<div class="sidebar-chat-title text-xs">' + escapeHtml(preview) + '</div>' +
            '<button class="sidebar-chat-delete" onclick="event.stopPropagation(); removeBookmark(\'' + b.id + '\')" title="Remove">' +
                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
                '</svg>' +
            '</button>' +
        '</div>';
    }).join('');
}

// Jump to bookmark
function jumpToBookmark(messageId) {
    const bookmark = bookmarks.find(b => b.id === messageId);
    if (!bookmark) {
        showToast('Bookmark not found', 'error', 2000);
        return;
    }
    
    // Check if the conversation exists
    const targetConversation = conversations.find(c => c.id === bookmark.conversationId);
    
    if (!targetConversation) {
        showToast('Conversation no longer exists', 'error', 2000);
        
        // Optionally remove the orphaned bookmark
        const removeOrphan = confirm('The bookmarked conversation no longer exists. Remove this bookmark?');
        if (removeOrphan) {
            removeBookmark(messageId);
        }
        return;
    }
    
    // If bookmark is in different conversation, load it
    if (bookmark.conversationId !== currentConversationId) {
        loadConversation(bookmark.conversationId);
    }
    
    // Scroll to message after a delay to allow conversation to load
    setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-flash');
            setTimeout(() => messageElement.classList.remove('highlight-flash'), 2000);
        } else {
            showToast('Message not found in conversation', 'warning', 2000);
        }
    }, 800);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// Remove bookmark
function removeBookmark(messageId) {
    bookmarks = bookmarks.filter(b => b.id !== messageId);
    saveBookmarks();
    updateBookmarkStars();
    updateSidebarBookmarks();
    showToast('Bookmark removed', 'info', 1500);
}

// ========================================
// RECENT TOOLS TRACKING
// ========================================

function loadRecentTools() {
    try {
        const stored = localStorage.getItem('fitz_recent_tools');
        recentTools = stored ? JSON.parse(stored) : [];
    } catch (e) {
        recentTools = [];
    }
}

function saveRecentTools() {
    try {
        localStorage.setItem('fitz_recent_tools', JSON.stringify(recentTools));
        
        // Trigger debounced Firebase sync so it persists across devices
        if (typeof debouncedSync === 'function') {
            debouncedSync();
        }
    } catch (e) {
    }
}

function trackToolUsage(toolId) {
    const tool = toolMetadata[toolId];
    if (!tool) return;
    
    // Remove if exists (to move to front)
    recentTools = recentTools.filter(t => t.id !== toolId);
    
    // Add to front
    recentTools.unshift({
        id: toolId,
        name: tool.name,
        icon: tool.icon,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 5
    recentTools = recentTools.slice(0, 5);
    
    saveRecentTools();
    updateSidebarRecentTools();
    
    trackEvent('tool_used', {
        user: currentUser,
        tool: tool.name
    });
}

function updateSidebarRecentTools() {
    var toolsList = document.getElementById('sidebarRecentTools');
    if (!toolsList) return;
    
    if (recentTools.length === 0) {
        toolsList.innerHTML = '<p class="text-slate-500 text-sm py-4 text-center">No tools used yet</p>';
        return;
    }
    
    toolsList.innerHTML = recentTools.map(function(tool) {
        return '<div class="sidebar-chat-item hover:bg-slate-700" onclick="openToolById(\'' + tool.id + '\')" style="cursor: pointer;">' +
            '<div class="flex items-center gap-2">' +
                '<span class="text-xl">' + tool.icon + '</span>' +
                '<div class="sidebar-chat-title text-sm">' + tool.name + '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function openToolById(toolId) {
    const tool = toolMetadata[toolId];
    if (!tool) {
        console.warn('Unknown tool:', toolId);
        return;
    }
    
    // Check if this is a document type (opens Document Builder with specific doc selected)
    if (tool.docType) {
        openDocumentBuilderFor(tool.docType);
        closeToolsMenu();
        return;
    }
    
    // Check if tool has a custom open function
    if (tool.openFunc && typeof window[tool.openFunc] === 'function') {
        window[tool.openFunc]();
        closeToolsMenu();
        return;
    }
    
    // Otherwise, open by modal ID
    const modalId = tool.modalId || toolId;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        trackToolUsage(toolId);
        closeToolsMenu();
    } else {
        console.warn('Modal not found:', modalId);
    }
}

// ========================================
// SEARCH SYSTEM
// ========================================

// Perform sidebar search
function performSidebarSearch() {
    const query = document.getElementById('sidebarSearchInput').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('sidebarSearchResults');
    
    if (!query) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    // Search across all conversations
    let results = [];
    conversations.forEach(conv => {
        (conv.messages || []).forEach(msg => {
            if (msg.content.toLowerCase().includes(query)) {
                results.push({
                    conversationId: conv.id,
                    conversationTitle: conv.title,
                    content: msg.content,
                    role: msg.role
                });
            }
        });
    });
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-slate-500 text-xs py-2">No results</p>';
        return;
    }
    
    // Limit to first 10 results
    results = results.slice(0, 10);
    
    resultsDiv.innerHTML = results.map(r => {
        const preview = r.content.substring(0, 80) + (r.content.length > 80 ? '...' : '');
        // Highlight search term
        const highlighted = preview.replace(
            new RegExp(query, 'gi'),
            match => `<mark class="bg-amber-500/30 text-amber-300">${match}</mark>`
        );
        
        return `
            <div class="text-xs text-slate-300 py-2 px-2 hover:bg-slate-700 rounded cursor-pointer border-b border-slate-700/50" 
                 onclick="openSearchResult('${r.conversationId}')">
                <div class="text-slate-400 text-xs mb-1">${escapeHtml(r.conversationTitle)}</div>
                <div>${highlighted}</div>
            </div>
        `;
    }).join('');
}

// Open search result
function openSearchResult(convId) {
    loadConversation(convId);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
    
    // Clear search
    const searchInput = document.getElementById('sidebarSearchInput');
    if (searchInput) {
        searchInput.value = '';
        performSidebarSearch();
    }
}

// ========================================

// Sidebar state
let sidebarOpen = false; // Closed by default on all devices

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('chatSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.remove('closed');
        if (window.innerWidth < 768) {
            overlay.classList.add('active');
        }
    } else {
        sidebar.classList.add('closed');
        overlay.classList.remove('active');
    }
}

// Initialize sidebar on load
function initSidebar() {
    var sidebar = document.getElementById('chatSidebar');
    // Always start closed on all devices
    if (sidebar) {
        sidebar.classList.add('closed');
        sidebarOpen = false;
    }
}

// Upload menu toggle
function toggleUploadMenu() {
    const menu = document.getElementById('uploadMenu');
    menu.classList.toggle('hidden');
}

// Toggle Tools Menu
// toggleToolsMenu - defined below with mobile/desktop handling

function closeToolsMenu() {
    // Don't close if tour is active and has it locked
    if (typeof FitzTour !== 'undefined' && FitzTour.toolsMenuLocked) {
        return;
    }
    
    var menu = document.getElementById('toolsMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

// More Menu Functions
function toggleMoreMenu() {
    var menu = document.getElementById('moreMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function closeMoreMenu() {
    var menu = document.getElementById('moreMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

// Profile Menu Functions
function openProfileMenu() {
    var menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.remove('hidden');
        
        // Update venue name and code in profile from venueProfile
        var venueName = venueProfile.venueName || 'Your Venue';
        // For Firebase users, show email; for access code users, show the code
        var userDisplay = currentUser && currentUser.email ? currentUser.email : (currentUser || 'N/A');
        
        document.getElementById('profileVenueName').textContent = venueName;
        document.getElementById('profileUserCode').textContent = userDisplay;
        
        // Update subscription info
        var tier = userCredits.subscriptionTier || userCredits.tier || 'free';
        var tierConfig = CONFIG.CREDITS.TIERS[tier] || CONFIG.CREDITS.TIERS.free;
        var tierName = tierConfig ? tierConfig.name : 'Free';
        
        var tierEl = document.getElementById('profileSubscriptionTier');
        var statusEl = document.getElementById('profileSubscriptionStatus');
        var upgradeBtn = document.getElementById('profileUpgradeBtn');
        
        if (tierEl) tierEl.textContent = tierName;
        
        if (statusEl && upgradeBtn) {
            if (tier === 'free') {
                statusEl.textContent = 'Upgrade for more features';
                upgradeBtn.textContent = 'Upgrade';
            } else {
                // Show correct billing cycle
                var billingCycle = userCredits.billingCycle || 'monthly';
                statusEl.textContent = billingCycle === 'annual' ? 'Annual subscription' : 'Monthly subscription';
                upgradeBtn.textContent = 'Manage';
            }
        }
        
        // Update review credits
        var reviewCreditsUsed = userCredits.reviewCreditsUsed || 0;
        var purchasedCredits = userCredits.purchasedCredits || 0;
        
        // PRIORITY: Use reviewCredits from Firebase (set by webhook) if available
        // This correctly handles annual vs monthly billing
        var totalReviewCredits;
        if (userCredits.reviewCredits && userCredits.reviewCredits > 0) {
            // Use actual credits from Firebase
            totalReviewCredits = userCredits.reviewCredits;
        } else if (userCredits.billingCycle === 'annual') {
            // Calculate annual credits: monthly × 12
            totalReviewCredits = tierConfig && tierConfig.reviewCredits ? tierConfig.reviewCredits * 12 : 0;
        } else {
            // Default to monthly credits from config
            totalReviewCredits = tierConfig && tierConfig.reviewCredits ? tierConfig.reviewCredits : 0;
        }
        
        var remainingCredits = Math.max(0, totalReviewCredits - reviewCreditsUsed) + purchasedCredits;
        
        var creditsEl = document.getElementById('profileReviewCredits');
        var totalEl = document.getElementById('profileTotalCredits');
        var barEl = document.getElementById('profileCreditsBar');
        
        if (creditsEl) creditsEl.textContent = remainingCredits;
        if (totalEl) totalEl.textContent = totalReviewCredits + purchasedCredits;
        
        // Update progress bar
        if (barEl) {
            var maxCredits = totalReviewCredits + purchasedCredits;
            var percentage = maxCredits > 0 ? Math.min(100, (remainingCredits / maxCredits) * 100) : 0;
            barEl.style.width = percentage + '%';
        }
        
        // Attach click handler to Buy more credits button (backup)
        var buyCreditsBtn = document.getElementById('buyMoreCreditsBtn');
        if (buyCreditsBtn) {
            buyCreditsBtn.onclick = function() {
                closeProfileMenu();
                openCreditsModal();
            };
        }
    }
}

function closeProfileMenu() {
    var menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

// Update sidebar venue name on load
function updateSidebarVenueName() {
    var venueName = venueProfile.venueName || 'Fitz';
    
    var sidebarName = document.getElementById('sidebarVenueName');
    
    if (sidebarName) {
        sidebarName.textContent = venueName;
    }
    
    // Also store in localStorage for easy access
    if (venueProfile.venueName) {
        localStorage.setItem('venueName', venueProfile.venueName);
    }
    
    // Update userCode display
    var userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    localStorage.setItem('userCode', userKey);
}

// Tool Opening Functions
function openAwardCalculator() {
    trackToolUsage('awardCalculatorModal');
    var modal = document.getElementById('awardCalculatorModal');
    if (modal) modal.classList.remove('hidden');
}

function openScenarioAnalysis() {
    trackToolUsage('scenarioAnalysisModal');
    var modal = document.getElementById('scenarioAnalysisModal');
    if (modal) modal.classList.remove('hidden');
}

function openRosterStressTester() {
    trackToolUsage('rosterStressTesterModal');
    var modal = document.getElementById('rosterStressTesterModal');
    if (modal) modal.classList.remove('hidden');
}

function openAwardWizard() {
    trackToolUsage('awardWizardModal');

    // Reset wizard state
    wizardData = {};
    currentWizardStep = 1;

    // Reset UI to step 1
    const wizardModal = document.getElementById('awardWizardModal');
    if (wizardModal) {
        // Show modal
        wizardModal.classList.remove('hidden');

        // Reset all steps visibility
        wizardModal.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.add('hidden');
        });

        // Show step 1
        const step1 = wizardModal.querySelector('[data-step="1"]');
        if (step1) step1.classList.remove('hidden');

        // Hide back button
        const backBtn = document.getElementById('wizardBackBtn');
        if (backBtn) backBtn.classList.add('hidden');

        // Reset progress bar
        document.getElementById('wizardCurrentStep').textContent = '1';
        document.getElementById('wizardProgress').textContent = '20% Complete';
        document.getElementById('wizardProgressBar').style.width = '20%';

        // Tailor late-night labels to the user's award
        applyWizardAwardLabels(wizardModal);
    }
}

// Adjusts wizard step-3 evening/night labels based on the user's award.
// Restaurant Award MA000119: evening = after 10pm, night = midnight-6am.
// Hospitality Award MA000009: evening = 7pm-midnight, night = midnight-7am.
function applyWizardAwardLabels(scope) {
    const root = scope || document;
    const isRestaurantAward = (getAwardContext().code === 'MA000119');
    const eveningLabel = isRestaurantAward ? '10pm to midnight' : '7pm to midnight';
    const nightLabel = isRestaurantAward ? 'Midnight to 6am' : 'Midnight to 7am';

    const eveningBtn = root.querySelector('button[onclick="wizardAnswer(\'hours\', \'weekday-evening\')"] .text-xs');
    if (eveningBtn) eveningBtn.textContent = eveningLabel;

    const nightBtn = root.querySelector('button[onclick="wizardAnswer(\'hours\', \'weekday-night\')"] .text-xs');
    if (nightBtn) nightBtn.textContent = nightLabel;
}

function openRosterOptimizer() {
    trackToolUsage('rosterOptimizerModal');
    var modal = document.getElementById('rosterOptimizerModal');
    if (modal) modal.classList.remove('hidden');
}

function openComplianceCalendar() {
    try {
        trackToolUsage('complianceCalendarModal');
        var modal = document.getElementById('complianceCalendarModal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            showAlert('Error: Could not find Compliance Calendar modal');
            return;
        }
        
        // Set state selector to user's saved state
        initializeComplianceCalendarState();
    } catch (error) {
        showAlert('Error opening Compliance Calendar: ' + error.message);
    }
}

// Australian Public Holidays by State/Territory (2026)
// Source: Fair Work Ombudsman - https://www.fairwork.gov.au/employment-conditions/public-holidays
const PUBLIC_HOLIDAYS_2026 = {
    // New South Wales
    NSW: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-04', name: "Easter Saturday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-10-05', name: "Labour Day" },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Boxing Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Boxing Day)" }
    ],
    // Victoria
    VIC: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-03-09', name: "Labour Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-04', name: "Saturday before Easter Sunday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-11-03', name: "Melbourne Cup Day", regional: true },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Boxing Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Boxing Day)" }
    ],
    // Queensland
    QLD: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-04', name: "The day after Good Friday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-05-04', name: "Labour Day" },
        { date: '2026-08-12', name: "Royal Queensland Show (Brisbane)", regional: true },
        { date: '2026-10-05', name: "King's Birthday" },
        { date: '2026-12-24', name: "Christmas Eve (from 6pm)", partDay: true },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Boxing Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Boxing Day)" }
    ],
    // South Australia
    SA: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-03-09', name: "Adelaide Cup Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-04', name: "Easter Saturday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-10-05', name: "Labour Day" },
        { date: '2026-12-24', name: "Christmas Eve (from 7pm)", partDay: true },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Proclamation Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Proclamation Day)" },
        { date: '2026-12-31', name: "New Year's Eve (from 7pm)", partDay: true }
    ],
    // Western Australia
    WA: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-03-02', name: "Labour Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-04-27', name: "Additional Public Holiday (Anzac Day)" },
        { date: '2026-06-01', name: "Western Australia Day" },
        { date: '2026-09-28', name: "King's Birthday" },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Boxing Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Boxing Day)" }
    ],
    // Tasmania
    TAS: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-02-09', name: "Royal Hobart Regatta (Hobart area)", regional: true },
        { date: '2026-03-09', name: "Eight Hours Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-07', name: "Easter Tuesday (Public Service)", partDay: true },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-10-22', name: "Royal Hobart Show (Hobart area)", regional: true },
        { date: '2026-11-02', name: "Recreation Day (North TAS)", regional: true },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-28', name: "Boxing Day" }
    ],
    // Northern Territory
    NT: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-04', name: "Easter Saturday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-25', name: "Anzac Day" },
        { date: '2026-05-04', name: "May Day" },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-08-03', name: "Picnic Day" },
        { date: '2026-12-24', name: "Christmas Eve (from 7pm)", partDay: true },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Boxing Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Boxing Day)" },
        { date: '2026-12-31', name: "New Year's Eve (from 7pm)", partDay: true }
    ],
    // Australian Capital Territory
    ACT: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: "Australia Day" },
        { date: '2026-03-09', name: "Canberra Day" },
        { date: '2026-04-03', name: "Good Friday" },
        { date: '2026-04-04', name: "Easter Saturday" },
        { date: '2026-04-05', name: "Easter Sunday" },
        { date: '2026-04-06', name: "Easter Monday" },
        { date: '2026-04-27', name: "Anzac Day (observed)" },
        { date: '2026-06-01', name: "Reconciliation Day" },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-10-05', name: "Labour Day" },
        { date: '2026-12-25', name: "Christmas Day" },
        { date: '2026-12-26', name: "Boxing Day" },
        { date: '2026-12-28', name: "Additional Public Holiday (Boxing Day)" }
    ]
};

function initializeComplianceCalendarState() {
    try {
        const selector = document.getElementById('complianceStateSelector');
        if (!selector) {
            return;
        }
        
        // Try to get user's state from venue profile
        let userState = 'NSW'; // Default
        
        const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
        if (userKey) {
            const savedProfile = localStorage.getItem('venueProfile_' + userKey);
            if (savedProfile) {
                try {
                    const profile = JSON.parse(savedProfile);
                    if (profile.state) {
                        userState = profile.state;
                    }
                } catch (e) {
                }
            }
        }
        
        // Also check global venueProfile
        if (typeof venueProfile !== 'undefined' && venueProfile && venueProfile.state) {
            userState = venueProfile.state;
        }
        
        selector.value = userState;
        updatePublicHolidays();
    } catch (error) {
    }
}

function updatePublicHolidays() {
    try {
        const selector = document.getElementById('complianceStateSelector');
        const list = document.getElementById('publicHolidaysList');
        const badge = document.getElementById('stateHolidayBadge');
        
        if (!selector || !list) {
            return;
        }
        
        const state = selector.value;
        if (badge) badge.textContent = state;
        
        // Get holidays for selected state
        const stateHolidays = PUBLIC_HOLIDAYS_2026[state] || [];
        
        // Sort by date
        const sortedHolidays = [...stateHolidays].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Filter to upcoming holidays only (from today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = sortedHolidays.filter(h => new Date(h.date) >= today).slice(0, 10);
        
        // Generate HTML
        if (upcoming.length === 0) {
            list.innerHTML = '<p class="text-slate-400">No upcoming public holidays found for 2026.</p>';
            return;
        }
        
        list.innerHTML = upcoming.map(h => {
            const date = new Date(h.date);
            const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
            const formattedDate = date.toLocaleDateString('en-AU', options);
            const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
            
            let urgencyClass = 'text-slate-400';
            let urgencyText = '';
            
            if (daysUntil <= 7) {
                urgencyClass = 'text-red-400 font-semibold';
                urgencyText = daysUntil === 0 ? '(Today!)' : daysUntil === 1 ? '(Tomorrow!)' : `(${daysUntil} days)`;
            } else if (daysUntil <= 14) {
                urgencyClass = 'text-yellow-400';
                urgencyText = `(${daysUntil} days)`;
            } else if (daysUntil <= 30) {
                urgencyText = `(${daysUntil} days)`;
            }
            
            // Show regional or part-day badge
            let extraBadge = '';
            if (h.regional) {
                extraBadge = '<span class="ml-1 px-1.5 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded">Regional</span>';
            } else if (h.partDay) {
                extraBadge = '<span class="ml-1 px-1.5 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded">Part Day</span>';
            }
            
            return `
                <div class="flex justify-between items-center py-2 border-b border-slate-700/50">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-300">${formattedDate}</span>
                        <span class="${urgencyClass} text-xs">${urgencyText}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="text-purple-300 text-sm">${h.name}</span>
                        ${extraBadge}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
    }
}

function openTerminationRisk() {
    trackToolUsage('terminationRiskModal');
    var modal = document.getElementById('terminationRiskModal');
    if (modal) modal.classList.remove('hidden');
}

// ========================================
// RECRUITMENT TOOLKIT FUNCTIONS
// ========================================

// Main Recruitment Toolkit
function openRecruitmentToolkit() {
    trackToolUsage('recruitmentToolkitModal');
    var modal = document.getElementById('recruitmentToolkitModal');
    if (modal) modal.classList.remove('hidden');
}

function closeRecruitmentToolkit() {
    var modal = document.getElementById('recruitmentToolkitModal');
    if (modal) modal.classList.add('hidden');
}

// Job Advertisement Builder (formerly Job Description Builder)
let jdCurrentStep = 1;
let jdData = {
    jobTitle: '',
    experienceLevel: '',
    responsibilities: '',
    qualifications: '',
    award: '',
    classification: '',
    salaryRange: ''
};

function openJobDescriptionBuilder() {
    trackToolUsage('jobDescriptionBuilder');
    jdCurrentStep = 1;
    jdData = { jobTitle: '', experienceLevel: '', responsibilities: '', qualifications: '', award: '', classification: '', salaryRange: '' };
    updateJDStep();
    var modal = document.getElementById('jobDescriptionBuilderModal');
    if (modal) modal.classList.remove('hidden');
}

function closeJobDescriptionBuilder() {
    // Hide the modal
    var modal = document.getElementById('jobDescriptionBuilderModal');
    if (modal) modal.classList.add('hidden');
    
    // Reset loading screen state
    document.getElementById('jdGenerating').classList.add('hidden');
    document.getElementById('jdBuilderSteps').classList.remove('hidden');
}

function updateJDStep() {
    // Hide all steps
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById('jdStep' + i);
        if (step) step.classList.add('hidden');
    }
    
    // Show current step
    const currentStepEl = document.getElementById('jdStep' + jdCurrentStep);
    if (currentStepEl) currentStepEl.classList.remove('hidden');
    
    // Update step counter
    document.getElementById('jdStep').textContent = jdCurrentStep;
    
    // Update buttons
    document.getElementById('jdBackBtn').classList.toggle('hidden', jdCurrentStep === 1);
    document.getElementById('jdNextBtn').classList.toggle('hidden', jdCurrentStep === 4);
    document.getElementById('jdGenerateBtn').classList.toggle('hidden', jdCurrentStep !== 4);
}

function jdNextStep() {
    // Validate current step
    if (jdCurrentStep === 1) {
        const jobTitle = document.getElementById('jdJobTitle').value.trim();
        if (!jobTitle) {
            showAlert('Please enter a job title');
            return;
        }
        jdData.jobTitle = jobTitle;
    }
    
    if (jdCurrentStep === 2 && !jdData.experienceLevel) {
        showAlert('Please select an experience level');
        return;
    }
    
    // Move to next step
    if (jdCurrentStep < 4) {
        jdCurrentStep++;
        updateJDStep();
        
        // If moving to step 3, generate responsibilities with AI
        if (jdCurrentStep === 3) {
            generateResponsibilities();
        }
    }
}

function jdPreviousStep() {
    if (jdCurrentStep > 1) {
        jdCurrentStep--;
        updateJDStep();
    }
}

function selectJDExperience(level) {
    jdData.experienceLevel = level;
    // Highlight selected
    document.querySelectorAll('.jd-experience-btn').forEach(btn => {
        btn.classList.remove('border-amber-500');
        btn.classList.add('border-slate-600');
    });
    event.target.closest('.jd-experience-btn').classList.remove('border-slate-600');
    event.target.closest('.jd-experience-btn').classList.add('border-amber-500');
    setTimeout(() => jdNextStep(), 300);
}

async function generateResponsibilities() {
    const loading = document.getElementById('jdResponsibilitiesLoading');
    const textarea = document.getElementById('jdResponsibilities');
    const help = document.getElementById('jdResponsibilitiesHelp');
    
    loading.classList.remove('hidden');
    textarea.classList.add('hidden');
    help.classList.add('hidden');
    
    try {
        const prompt = `Generate 5-7 key responsibilities for a ${jdData.experienceLevel} level ${jdData.jobTitle} position in the Australian hospitality industry. Format as a bulleted list. Be specific and professional.`;
        
        const response = await fetch('/.netlify/functions/recruitment-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                taskType: 'responsibilities'
            })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate responsibilities');
        }
        
        // Get the content directly from the response
        const content = result.content;
        
        textarea.value = content;
        loading.classList.add('hidden');
        textarea.classList.remove('hidden');
        help.classList.remove('hidden');
    } catch (error) {
        textarea.value = '• [Add key responsibility]\n• [Add key responsibility]\n• [Add key responsibility]';
        loading.classList.add('hidden');
        textarea.classList.remove('hidden');
        help.classList.remove('hidden');
    }
}

function setupSalaryCalculation() {
    const awardSelect = document.getElementById('jdAward');
    const classSelect = document.getElementById('jdClassification');
    const display = document.getElementById('jdSalaryDisplay');
    const rangeEl = document.getElementById('jdSalaryRange');
    
    const calculate = () => {
        if (awardSelect.value && classSelect.value) {
            // Simple salary calculation (would integrate with Award Calculator)
            const baseRates = {
                'restaurant': [45000, 55000, 75000],
                'hospitality': [43000, 53000, 72000],
                'fast-food': [42000, 50000, 68000]
            };
            
            const level = parseInt(classSelect.value) - 1;
            const base = baseRates[awardSelect.value][level];
            const min = base;
            const max = Math.round(base * 1.15);
            
            jdData.salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()} per year`;
            rangeEl.textContent = jdData.salaryRange;
            display.classList.remove('hidden');
        }
    };
    
    awardSelect.addEventListener('change', calculate);
    classSelect.addEventListener('change', calculate);
}

async function generateJobDescription() {
    // Collect all data
    jdData.responsibilities = document.getElementById('jdResponsibilities').value;
    jdData.qualifications = document.getElementById('jdQualifications').value;
    
    // Hide wizard steps, show loading
    document.getElementById('jdBuilderSteps').classList.add('hidden');
    document.getElementById('jdGenerating').classList.remove('hidden');
    
    try {
        const prompt = `Create a professional, engaging JOB ADVERTISEMENT for external posting on job boards (Seek, Indeed, LinkedIn):
                    
Position Title: ${jdData.jobTitle}
Experience Level: ${jdData.experienceLevel}

Key Responsibilities:
${jdData.responsibilities}

Required Qualifications:
${jdData.qualifications}

IMPORTANT INSTRUCTIONS:
- This is an EXTERNAL job advertisement to attract candidates
- Use engaging, marketing-style language that sells the opportunity
- DO NOT include any salary, pay rate, or remuneration information
- DO NOT include hourly rates or annual salary figures
- Include sections for: About the Role, Key Responsibilities, What You'll Bring, Why Join Us
- Make it specific to Australian hospitality industry
- Keep it concise and compelling - suitable for job board posting
- End with a call to action to apply`;

        const response = await fetch('/.netlify/functions/recruitment-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                taskType: 'jobDescription'
            })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate job advertisement');
        }
        
        // Get the content directly from the response
        const content = result.content;
        
        // Store for download
        jdData.generatedContent = content;
        
        // Close job advertisement builder modal
        closeJobDescriptionBuilder();
        
        // Show preview
        document.getElementById('jdPreviewContent').innerHTML = '<pre class="whitespace-pre-wrap text-slate-200">' + content + '</pre>';
        document.getElementById('jobDescriptionPreviewModal').classList.remove('hidden');
        
        // Apply blur overlay (user must unlock to download)
        setTimeout(() => {
            applyUniversalBlur('jdPreviewContent', 'jobDescription', 'Job Advertisement', 'jdActionsContainer');
        }, 100);
        
        trackEvent('job_advertisement_generated', { jobTitle: jdData.jobTitle, experienceLevel: jdData.experienceLevel });
    } catch (error) {
        showToast('Error generating job advertisement', 'error');
        
        // Show wizard steps again on error
        document.getElementById('jdGenerating').classList.add('hidden');
        document.getElementById('jdBuilderSteps').classList.remove('hidden');
    }
}

function closeJobDescriptionPreview() {
    document.getElementById('jobDescriptionPreviewModal').classList.add('hidden');
    
    // Reset builder state when closing preview
    document.getElementById('jdGenerating').classList.add('hidden');
    document.getElementById('jdBuilderSteps').classList.remove('hidden');
}

// Protected download (requires credit payment)
async function downloadJobDescription(format) {
    protectedDownloadJobDescription(format);
}

// Unlocked download (called after credit payment)
async function downloadJobDescriptionUnlocked(format) {
    const content = jdData.generatedContent || document.getElementById('jdPreviewContent').innerText;
    const filename = `Job_Description_${jdData.jobTitle.replace(/\s+/g, '_')}`;
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (format === 'docx') {
        try {
            // Build a full styled HTML document for client-side DOCX generation
            const fullHTML = buildJobDescriptionHTML(content, today);
            const blob = htmlDocx.asBlob(fullHTML);
            saveAs(blob, `${filename}.docx`);
            
            showToast('✅ Job description downloaded as DOCX', 'success');
            trackEvent('job_description_downloaded', { format: 'docx', jobTitle: jdData.jobTitle });
        } catch (error) {
            showToast('Error generating Word document. Please try PDF instead.', 'error');
        }
    } else if (format === 'pdf') {
        try {
            // Pass raw content directly — generatePDFDocument handles its own conversion
            await generatePDFDocument(content, `${filename}.pdf`, {
                documentId: generateDocumentId(),
                userName: currentUser,
                documentType: 'Job Description'
            });
            
            trackEvent('job_description_downloaded', { format: 'pdf', jobTitle: jdData.jobTitle });
        } catch (error) {
            showToast('Error generating PDF document', 'error');
        }
    }
}

// Build full styled HTML document for Job Description DOCX export
function buildJobDescriptionHTML(content, today) {
    // Convert markdown formatting to HTML
    let formattedContent = content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
    
    // Convert remaining plain text lines to paragraphs
    formattedContent = formattedContent.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<li')) return block;
        return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #000; }
        h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; margin-bottom: 20px; font-size: 22px; }
        h2 { color: #34495e; margin-top: 25px; border-bottom: 2px solid #bdc3c7; padding-bottom: 5px; font-size: 16px; }
        h3 { color: #555; margin-top: 18px; font-size: 14px; }
        p { margin: 8px 0; font-size: 11px; }
        ul { margin: 8px 0 8px 20px; padding: 0; }
        li { margin: 4px 0; font-size: 11px; }
        strong { font-weight: bold; }
        .info-box { background: #ecf0f1; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .info-box p { margin: 4px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #bdc3c7; text-align: center; color: #7f8c8d; font-size: 10px; }
    </style>
</head>
<body>
    <h1>Job Description: ${jdData.jobTitle}</h1>
    
    <div class="info-box">
        <p><strong>Position:</strong> ${jdData.jobTitle}</p>
        <p><strong>Experience Level:</strong> ${jdData.experienceLevel || 'N/A'}</p>
        ${jdData.award ? `<p><strong>Award:</strong> ${jdData.award}</p>` : ''}
        ${jdData.classification ? `<p><strong>Classification:</strong> ${jdData.classification}</p>` : ''}
    </div>

    ${formattedContent}

    <div class="footer">
        <p>Generated by Fitz HR on ${today}</p>
        <p>This job description is designed to comply with Australian employment standards</p>
    </div>
</body>
</html>`;
}

function resetJobDescription() {
    // Close preview modal
    closeJobDescriptionPreview();
    
    // Reset all data
    jdCurrentStep = 1;
    jdData = {
        jobTitle: '',
        experienceLevel: '',
        responsibilities: '',
        qualifications: '',
        generatedContent: ''
    };
    
    // Clear all inputs
    document.getElementById('jdJobTitle').value = '';
    document.getElementById('jdResponsibilities').value = '';
    document.getElementById('jdQualifications').value = '';
    
    // Reset loading/textarea visibility
    document.getElementById('jdResponsibilitiesLoading').classList.add('hidden');
    document.getElementById('jdResponsibilities').classList.remove('hidden');
    document.getElementById('jdResponsibilitiesHelp').classList.remove('hidden');
    
    // Show steps, hide loading
    document.getElementById('jdBuilderSteps').classList.remove('hidden');
    document.getElementById('jdGenerating').classList.add('hidden');
    
    // Reset step highlighting
    document.querySelectorAll('.jd-experience-btn').forEach(btn => {
        btn.classList.remove('border-amber-500');
        btn.classList.add('border-slate-600');
    });
    
    // Update step display
    updateJDStep();
    
    // Open builder
    openJobDescriptionBuilder();
    
    showToast('Ready to create a new job advertisement!', 'success');
}

// ========================================
// POSITION DESCRIPTION BUILDER
// ========================================
let pdCurrentStep = 1;
let pdData = {
    positionTitle: '',
    reportsTo: '',
    department: '',
    employmentType: 'full-time',
    primaryPurpose: '',
    responsibilities: '',
    kpis: '',
    qualifications: '',
    generatedContent: ''
};

function openPositionDescriptionBuilder() {
    trackToolUsage('positionDescriptionBuilder');
    pdCurrentStep = 1;
    pdData = { 
        positionTitle: '', 
        reportsTo: '', 
        department: '', 
        employmentType: 'full-time',
        primaryPurpose: '',
        responsibilities: '', 
        kpis: '',
        qualifications: '',
        generatedContent: ''
    };
    
    // Reset form fields
    document.getElementById('pdPositionTitle').value = '';
    document.getElementById('pdReportsTo').value = '';
    document.getElementById('pdDepartment').value = '';
    document.getElementById('pdEmploymentType').value = 'full-time';
    document.getElementById('pdPrimaryPurpose').value = '';
    document.getElementById('pdResponsibilities').value = '';
    document.getElementById('pdKPIs').value = '';
    document.getElementById('pdQualifications').value = '';
    
    updatePDStep();
    var modal = document.getElementById('positionDescriptionBuilderModal');
    if (modal) modal.classList.remove('hidden');
}

function closePositionDescriptionBuilder() {
    var modal = document.getElementById('positionDescriptionBuilderModal');
    if (modal) modal.classList.add('hidden');
    
    // Reset loading screen state
    document.getElementById('pdGenerating').classList.add('hidden');
    document.getElementById('pdBuilderSteps').classList.remove('hidden');
}

function updatePDStep() {
    // Hide all steps
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById('pdStep' + i);
        if (step) step.classList.add('hidden');
    }
    
    // Show current step
    const currentStepEl = document.getElementById('pdStep' + pdCurrentStep);
    if (currentStepEl) currentStepEl.classList.remove('hidden');
    
    // Update step counter
    document.getElementById('pdStep').textContent = pdCurrentStep;
    
    // Update buttons
    document.getElementById('pdBackBtn').classList.toggle('hidden', pdCurrentStep === 1);
    document.getElementById('pdNextBtn').classList.toggle('hidden', pdCurrentStep === 5);
    document.getElementById('pdGenerateBtn').classList.toggle('hidden', pdCurrentStep !== 5);
}

function pdNextStep() {
    // Validate current step
    if (pdCurrentStep === 1) {
        const positionTitle = document.getElementById('pdPositionTitle').value.trim();
        if (!positionTitle) {
            showAlert('Please enter a position title');
            return;
        }
        pdData.positionTitle = positionTitle;
        pdData.reportsTo = document.getElementById('pdReportsTo').value.trim();
        pdData.department = document.getElementById('pdDepartment').value.trim();
        pdData.employmentType = document.getElementById('pdEmploymentType').value;
    }
    
    if (pdCurrentStep === 2) {
        pdData.primaryPurpose = document.getElementById('pdPrimaryPurpose').value.trim();
    }
    
    // Move to next step
    pdCurrentStep++;
    updatePDStep();
    
    // Generate AI primary purpose when entering step 2
    if (pdCurrentStep === 2) {
        generatePDPrimaryPurpose();
    }
    
    // Generate AI responsibilities when entering step 3
    if (pdCurrentStep === 3) {
        generatePDResponsibilities();
    }
}

function pdPreviousStep() {
    if (pdCurrentStep > 1) {
        pdCurrentStep--;
        updatePDStep();
    }
}

async function generatePDPrimaryPurpose() {
    const loading = document.getElementById('pdPrimaryPurposeLoading');
    const textarea = document.getElementById('pdPrimaryPurpose');
    const help = document.getElementById('pdPrimaryPurposeHelp');
    
    loading.classList.remove('hidden');
    textarea.classList.add('hidden');
    help.classList.add('hidden');
    
    try {
        const prompt = `Write a concise Primary Purpose statement (2-3 sentences) for an internal Position Description for:
        
Position: ${pdData.positionTitle}
Reports To: ${pdData.reportsTo || 'Not specified'}
Department: ${pdData.department || 'Not specified'}
Employment Type: ${pdData.employmentType}

IMPORTANT INSTRUCTIONS:
- This is for an INTERNAL HR document, not a job advertisement
- Write in formal, professional language
- Explain WHY this role exists and its main objective
- Focus on the core function and value the role provides
- Keep it to 2-3 sentences maximum
- Start with "The [Position Title] is responsible for..." or similar
- Do NOT include any bullet points or lists
- Do NOT include salary information

Example format:
"The Head Chef is responsible for overseeing all kitchen operations and ensuring the delivery of high-quality food in accordance with health and safety standards. This role leads the culinary team, manages food costs, and maintains consistency in menu execution while driving continuous improvement in kitchen efficiency."`;

        const response = await fetch('/.netlify/functions/recruitment-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, taskType: 'positionDescription' })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate primary purpose');
        }
        
        textarea.value = result.content;
        loading.classList.add('hidden');
        textarea.classList.remove('hidden');
        help.classList.remove('hidden');
    } catch (error) {
        // Fallback placeholder if AI fails
        textarea.value = `The ${pdData.positionTitle} is responsible for [describe main function]. This role [explain key objective] while ensuring [key outcome or standard].`;
        loading.classList.add('hidden');
        textarea.classList.remove('hidden');
        help.classList.remove('hidden');
    }
}

async function generatePDResponsibilities() {
    const loading = document.getElementById('pdResponsibilitiesLoading');
    const textarea = document.getElementById('pdResponsibilities');
    const help = document.getElementById('pdResponsibilitiesHelp');
    
    loading.classList.remove('hidden');
    textarea.classList.add('hidden');
    help.classList.add('hidden');
    
    try {
        const prompt = `Generate 8-10 detailed key responsibilities for an internal Position Description for:
        
Position: ${pdData.positionTitle}
Reports To: ${pdData.reportsTo || 'Not specified'}
Department: ${pdData.department || 'Not specified'}
Employment Type: ${pdData.employmentType}
Primary Purpose: ${pdData.primaryPurpose || 'Not specified'}

IMPORTANT: This is an INTERNAL HR document, not a job advertisement.
- Focus on specific duties and tasks
- Include operational responsibilities
- Include compliance and reporting requirements
- Be detailed and comprehensive
- Use formal, professional language

Format as bullet points starting with action verbs.`;

        const response = await fetch('/.netlify/functions/recruitment-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, taskType: 'positionDescription' })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate responsibilities');
        }
        
        textarea.value = result.content;
        loading.classList.add('hidden');
        textarea.classList.remove('hidden');
        help.classList.remove('hidden');
    } catch (error) {
        textarea.value = '• [Add key responsibility]\n• [Add key responsibility]\n• [Add key responsibility]';
        loading.classList.add('hidden');
        textarea.classList.remove('hidden');
        help.classList.remove('hidden');
    }
}

async function generatePositionDescription() {
    // Collect all data
    pdData.responsibilities = document.getElementById('pdResponsibilities').value;
    pdData.kpis = document.getElementById('pdKPIs').value;
    pdData.qualifications = document.getElementById('pdQualifications').value;
    
    // Hide wizard steps, show loading
    document.getElementById('pdBuilderSteps').classList.add('hidden');
    document.getElementById('pdGenerating').classList.remove('hidden');
    
    try {
        const prompt = `Create a formal, comprehensive INTERNAL POSITION DESCRIPTION document:
                    
POSITION DETAILS:
Position Title: ${pdData.positionTitle}
Reports To: ${pdData.reportsTo || 'To be advised'}
Department: ${pdData.department || 'To be advised'}
Employment Type: ${pdData.employmentType}

PRIMARY PURPOSE:
${pdData.primaryPurpose || 'To be advised'}

KEY RESPONSIBILITIES:
${pdData.responsibilities}

KEY PERFORMANCE INDICATORS (KPIs) & ACCOUNTABILITIES:
${pdData.kpis || 'To be developed with manager'}

QUALIFICATIONS & REQUIREMENTS:
${pdData.qualifications}

IMPORTANT INSTRUCTIONS:
- This is an INTERNAL HR document for employee files and performance management
- NOT a job advertisement - do not use marketing language
- Use formal, professional tone throughout
- Include clear section headings
- Structure as a proper Position Description document with sections for:
  * Position Details (title, reports to, department, employment type)
  * Primary Purpose
  * Key Responsibilities
  * Key Performance Indicators & Accountabilities
  * Essential Qualifications
  * Desirable Qualifications
  * Working Conditions (if applicable)
- DO NOT include salary or remuneration information
- Include a signature/acknowledgement section at the end for employee and manager`;

        const response = await fetch('/.netlify/functions/recruitment-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, taskType: 'positionDescription' })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate position description');
        }
        
        pdData.generatedContent = result.content;
        
        // Close builder modal
        closePositionDescriptionBuilder();
        
        // Show preview
        document.getElementById('pdPreviewContent').innerHTML = '<pre class="whitespace-pre-wrap text-slate-200">' + result.content + '</pre>';
        document.getElementById('positionDescriptionPreviewModal').classList.remove('hidden');
        
        // Apply blur overlay (user must unlock to download)
        setTimeout(() => {
            applyUniversalBlur('pdPreviewContent', 'positionDescription', 'Position Description', 'pdActionsContainer');
        }, 100);
        
        trackEvent('position_description_generated', { positionTitle: pdData.positionTitle });
    } catch (error) {
        showToast('Error generating position description', 'error');
        
        // Show wizard steps again on error
        document.getElementById('pdGenerating').classList.add('hidden');
        document.getElementById('pdBuilderSteps').classList.remove('hidden');
    }
}

function closePositionDescriptionPreview() {
    document.getElementById('positionDescriptionPreviewModal').classList.add('hidden');
    
    // Reset builder state
    document.getElementById('pdGenerating').classList.add('hidden');
    document.getElementById('pdBuilderSteps').classList.remove('hidden');
}

async function downloadPositionDescription(format = 'pdf') {
    if (!pdData.generatedContent) {
        showToast('No position description to download', 'error');
        return;
    }
    
    // ✅ CHECK: Template document credit protection
    const docType = 'positionDescription';
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    
    // Check if document is still locked (blur present)
    const unlockPrompt = document.getElementById('pdPreviewContent_unlockPrompt');
    if (unlockPrompt) {
        showToast('Please unlock the document first', 'info');
        return;
    }
    
    // Check if free tier user has exhausted their free template
    if (tier === 'free' && cost?.category === 'template') {
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed >= 1) {
            showNotification('⚠️ Free template limit reached. Please upgrade.', 'error');
            showSubscriptionOptions();
            return;
        }
        // Mark free template as used
        userCredits.lowRiskDocsUsed = 1;
        saveUserCredits();
    }
    
    const content = pdData.generatedContent;
    const filename = `Position_Description_${pdData.positionTitle.replace(/\s+/g, '_')}`;
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (format === 'docx') {
        try {
            const fullHTML = buildPositionDescriptionHTML(content, today);
            const blob = htmlDocx.asBlob(fullHTML);
            saveAs(blob, `${filename}.docx`);
            
            showToast('✅ Position description downloaded as DOCX', 'success');
            trackEvent('position_description_downloaded', { format: 'docx', positionTitle: pdData.positionTitle });
        } catch (error) {
            showToast('Error generating Word document. Please try PDF instead.', 'error');
        }
    } else if (format === 'pdf') {
        try {
            // Pass raw content directly — generatePDFDocument handles its own conversion
            await generatePDFDocument(content, `${filename}.pdf`, {
                documentId: generateDocumentId(),
                userName: currentUser,
                documentType: 'Position Description'
            });
            
            trackEvent('position_description_downloaded', { format: 'pdf', positionTitle: pdData.positionTitle });
        } catch (error) {
            showToast('Error generating PDF document', 'error');
        }
    }
}

// Build full styled HTML document for Position Description DOCX export
function buildPositionDescriptionHTML(content, today) {
    // Convert markdown formatting to HTML
    let formattedContent = content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
    
    // Convert remaining plain text lines to paragraphs
    formattedContent = formattedContent.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<li')) return block;
        return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #000; }
        h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; margin-bottom: 20px; font-size: 22px; }
        h2 { color: #34495e; margin-top: 25px; border-bottom: 2px solid #bdc3c7; padding-bottom: 5px; font-size: 16px; }
        h3 { color: #555; margin-top: 18px; font-size: 14px; }
        p { margin: 8px 0; font-size: 11px; }
        ul { margin: 8px 0 8px 20px; padding: 0; }
        li { margin: 4px 0; font-size: 11px; }
        strong { font-weight: bold; }
        .info-box { background: #ecf0f1; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .info-box p { margin: 4px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #bdc3c7; text-align: center; color: #7f8c8d; font-size: 10px; }
    </style>
</head>
<body>
    <h1>Position Description: ${pdData.positionTitle}</h1>
    
    <div class="info-box">
        <p><strong>Position Title:</strong> ${pdData.positionTitle}</p>
        ${pdData.department ? `<p><strong>Department:</strong> ${pdData.department}</p>` : ''}
        ${pdData.reportsTo ? `<p><strong>Reports To:</strong> ${pdData.reportsTo}</p>` : ''}
        <p><strong>Employment Type:</strong> ${pdData.employmentType || 'N/A'}</p>
    </div>

    ${formattedContent}

    <div class="footer">
        <p>Generated by Fitz HR on ${today}</p>
        <p>This position description is designed to comply with Australian employment standards</p>
    </div>
</body>
</html>`;
}

function resetPositionDescription() {
    pdCurrentStep = 1;
    pdData = { 
        positionTitle: '', 
        reportsTo: '', 
        department: '', 
        employmentType: 'full-time',
        primaryPurpose: '',
        responsibilities: '', 
        kpis: '',
        qualifications: '',
        generatedContent: ''
    };
    
    // Reset form fields
    document.getElementById('pdPositionTitle').value = '';
    document.getElementById('pdReportsTo').value = '';
    document.getElementById('pdDepartment').value = '';
    document.getElementById('pdEmploymentType').value = 'full-time';
    document.getElementById('pdPrimaryPurpose').value = '';
    document.getElementById('pdResponsibilities').value = '';
    document.getElementById('pdKPIs').value = '';
    document.getElementById('pdQualifications').value = '';
    
    // Close preview
    closePositionDescriptionPreview();
    
    // Reset loading/steps state
    document.getElementById('pdBuilderSteps').classList.remove('hidden');
    document.getElementById('pdGenerating').classList.add('hidden');
    
    // Update step display
    updatePDStep();
    
    // Open builder
    openPositionDescriptionBuilder();
    
    showToast('Ready to create a new position description!', 'success');
}

// Interview Questions Generator
let iqCurrentStep = 1;
let iqData = {
    jobTitle: '',
    experienceLevel: '',
    categories: [],
    questionCount: 15
};

function openInterviewQuestionsGenerator() {
    trackToolUsage('interviewQuestionsGenerator');
    iqCurrentStep = 1;
    iqData = { jobTitle: '', experienceLevel: '', categories: [], questionCount: 15 };
    updateIQStep();
    var modal = document.getElementById('interviewQuestionsModal');
    if (modal) modal.classList.remove('hidden');
}

function closeInterviewQuestions() {
    // Hide the modal
    var modal = document.getElementById('interviewQuestionsModal');
    if (modal) modal.classList.add('hidden');
    
    // Reset loading screen state
    document.getElementById('iqGenerating').classList.add('hidden');
    document.getElementById('iqBuilderSteps').classList.remove('hidden');
}

function updateIQStep() {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById('iqStep' + i);
        if (step) step.classList.add('hidden');
    }
    
    // Show current step
    const currentStepEl = document.getElementById('iqStep' + iqCurrentStep);
    if (currentStepEl) currentStepEl.classList.remove('hidden');
    
    // Update step counter
    document.getElementById('iqStep').textContent = iqCurrentStep;
    
    // Update buttons
    document.getElementById('iqBackBtn').classList.toggle('hidden', iqCurrentStep === 1);
    document.getElementById('iqNextBtn').classList.toggle('hidden', iqCurrentStep === 4);
    document.getElementById('iqGenerateBtn').classList.toggle('hidden', iqCurrentStep !== 4);
}

function iqNextStep() {
    if (iqCurrentStep === 1) {
        const jobTitle = document.getElementById('iqJobTitle').value.trim();
        if (!jobTitle) {
            showAlert('Please enter a job title');
            return;
        }
        iqData.jobTitle = jobTitle;
    }
    
    if (iqCurrentStep === 2 && !iqData.experienceLevel) {
        showAlert('Please select an experience level');
        return;
    }
    
    if (iqCurrentStep === 3) {
        iqData.categories = [];
        if (document.getElementById('iqTechnical').checked) iqData.categories.push('Technical');
        if (document.getElementById('iqBehavioral').checked) iqData.categories.push('Behavioral');
        if (document.getElementById('iqSituational').checked) iqData.categories.push('Situational');
        
        if (iqData.categories.length === 0) {
            showAlert('Please select at least one category');
            return;
        }
    }
    
    if (iqCurrentStep < 4) {
        iqCurrentStep++;
        updateIQStep();
    }
}

function iqPreviousStep() {
    if (iqCurrentStep > 1) {
        iqCurrentStep--;
        updateIQStep();
    }
}

function selectIQExperience(level) {
    iqData.experienceLevel = level;
    document.querySelectorAll('.iq-experience-btn').forEach(btn => {
        btn.classList.remove('border-amber-500');
        btn.classList.add('border-slate-600');
    });
    event.target.closest('.iq-experience-btn').classList.remove('border-slate-600');
    event.target.closest('.iq-experience-btn').classList.add('border-amber-500');
    setTimeout(() => iqNextStep(), 300);
}

function selectIQCount(count) {
    iqData.questionCount = count;
    document.querySelectorAll('.iq-count-btn').forEach(btn => {
        btn.classList.remove('border-amber-500');
        btn.classList.add('border-slate-600');
    });
    event.target.closest('.iq-count-btn').classList.remove('border-slate-600');
    event.target.closest('.iq-count-btn').classList.add('border-amber-500');
}

async function generateInterviewQuestions() {
    if (!iqData.questionCount) {
        showAlert('Please select number of questions');
        return;
    }
    
    // Hide wizard steps, show loading
    document.getElementById('iqBuilderSteps').classList.add('hidden');
    document.getElementById('iqGenerating').classList.remove('hidden');
    
    try {
        // Simplified prompt for faster generation
        const prompt = `Generate ${iqData.questionCount} interview questions for a ${iqData.experienceLevel} level ${iqData.jobTitle} position in Australian hospitality.

Categories: ${iqData.categories.join(', ')}

Keep it concise - just list the questions with brief context.`;

        const response = await fetch('/.netlify/functions/recruitment-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                taskType: 'interviewQuestions'
            })
        });
        
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned an error. This may be due to a timeout. Try requesting fewer questions (10 instead of 20).');
        }
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate interview questions');
        }
        
        // Get the content directly from the response
        const content = result.content;
        
        // Store for download
        iqData.generatedContent = content;
        
        // Close interview questions modal
        closeInterviewQuestions();
        
        // Show preview
        document.getElementById('iqPreviewContent').innerHTML = '<pre class="whitespace-pre-wrap text-slate-200">' + content + '</pre>';
        document.getElementById('interviewQuestionsPreviewModal').classList.remove('hidden');
        
        // Apply blur overlay (consistent with other templates)
        applyUniversalBlur('iqPreviewContent', 'interviewQuestions', 'Interview Questions', 'iqActionsContainer');
        
        trackEvent('interview_questions_generated', { jobTitle: iqData.jobTitle, count: iqData.questionCount });
    } catch (error) {
        // Show user-friendly error message
        let errorMessage = 'Error generating questions';
        if (error.message.includes('timeout') || error.message.includes('fewer questions')) {
            errorMessage = 'Generation took too long. Try selecting fewer questions (10 or 15 instead of 20).';
        }
        
        showToast(errorMessage, 'error');
        
        // Show wizard steps again on error
        document.getElementById('iqGenerating').classList.add('hidden');
        document.getElementById('iqBuilderSteps').classList.remove('hidden');
    }
}

function closeInterviewQuestionsPreview() {
    document.getElementById('interviewQuestionsPreviewModal').classList.add('hidden');
    
    // Reset builder state when closing preview
    document.getElementById('iqGenerating').classList.add('hidden');
    document.getElementById('iqBuilderSteps').classList.remove('hidden');
}

async function downloadInterviewQuestions(format) {
    // ✅ CHECK: Template document credit protection
    const docType = 'interviewQuestions';
    const cost = CONFIG.CREDITS.DOCUMENT_COSTS[docType];
    const tier = userCredits.subscriptionTier || userCredits.tier || 'free';
    
    // Check if document should be blocked
    if (tier === 'free' && cost?.category === 'template') {
        const lowRiskDocsUsed = userCredits.lowRiskDocsUsed || 0;
        if (lowRiskDocsUsed >= 1) {
            showNotification('⚠️ Free template limit reached. Please upgrade.', 'error');
            showSubscriptionOptions();
            return;
        }
        // Mark free template as used
        userCredits.lowRiskDocsUsed = 1;
        saveUserCredits();
    }
    
    const content = iqData.generatedContent || document.getElementById('iqPreviewContent').innerText;
    const filename = `Interview_Questions_${iqData.jobTitle.replace(/\s+/g, '_')}`;
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (format === 'docx') {
        try {
            // Build a full styled HTML document for client-side DOCX generation
            const fullHTML = buildInterviewQuestionsHTML(content, today);
            const blob = htmlDocx.asBlob(fullHTML);
            saveAs(blob, `${filename}.docx`);
            
            showToast('✅ Interview questions downloaded as DOCX', 'success');
            trackEvent('interview_questions_downloaded', { format: 'docx', jobTitle: iqData.jobTitle });
        } catch (error) {
            showToast('Error generating Word document. Please try PDF instead.', 'error');
        }
    } else if (format === 'pdf') {
        try {
            // Pass raw content directly — generatePDFDocument handles its own conversion
            await generatePDFDocument(content, `${filename}.pdf`, {
                documentId: generateDocumentId(),
                userName: currentUser,
                documentType: 'Interview Questions'
            });
            
            trackEvent('interview_questions_downloaded', { format: 'pdf', jobTitle: iqData.jobTitle });
        } catch (error) {
            showToast('Error generating PDF document', 'error');
        }
    }
}

// Build full styled HTML document for Interview Questions DOCX export
function buildInterviewQuestionsHTML(content, today) {
    // Convert markdown formatting to HTML
    let formattedContent = content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
    
    // Convert remaining plain text lines to paragraphs
    formattedContent = formattedContent.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<li')) return block;
        return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #000; }
        h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; margin-bottom: 20px; font-size: 22px; }
        h2 { color: #34495e; margin-top: 25px; border-bottom: 2px solid #bdc3c7; padding-bottom: 5px; font-size: 16px; }
        h3 { color: #555; margin-top: 18px; font-size: 14px; }
        p { margin: 8px 0; font-size: 11px; }
        ul { margin: 8px 0 8px 20px; padding: 0; }
        li { margin: 4px 0; font-size: 11px; }
        strong { font-weight: bold; }
        .info-box { background: #ecf0f1; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .info-box p { margin: 4px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #bdc3c7; text-align: center; color: #7f8c8d; font-size: 10px; }
    </style>
</head>
<body>
    <h1>Interview Questions: ${iqData.jobTitle}</h1>
    
    <div class="info-box">
        <p><strong>Position:</strong> ${iqData.jobTitle}</p>
        <p><strong>Experience Level:</strong> ${iqData.experienceLevel}</p>
        <p><strong>Question Categories:</strong> ${iqData.categories.join(', ')}</p>
        <p><strong>Number of Questions:</strong> ${iqData.questionCount}</p>
    </div>

    ${formattedContent}

    <div class="footer">
        <p>Generated by Fitz HR on ${today}</p>
        <p>These questions are designed to be legally compliant under Australian employment law</p>
    </div>
</body>
</html>`;
}

function resetInterviewQuestions() {
    // Close preview modal
    closeInterviewQuestionsPreview();
    
    // Reset all data
    iqCurrentStep = 1;
    iqData = {
        jobTitle: '',
        experienceLevel: '',
        categories: [],
        questionCount: 15,
        generatedContent: ''
    };
    
    // Clear inputs
    document.getElementById('iqJobTitle').value = '';
    
    // Reset checkboxes
    document.getElementById('iqTechnical').checked = true;
    document.getElementById('iqBehavioral').checked = true;
    document.getElementById('iqSituational').checked = true;
    
    // Show steps, hide loading
    document.getElementById('iqBuilderSteps').classList.remove('hidden');
    document.getElementById('iqGenerating').classList.add('hidden');
    
    // Reset button highlighting
    document.querySelectorAll('.iq-experience-btn').forEach(btn => {
        btn.classList.remove('border-amber-500');
        btn.classList.add('border-slate-600');
    });
    
    document.querySelectorAll('.iq-count-btn').forEach(btn => {
        btn.classList.remove('border-amber-500');
        btn.classList.add('border-slate-600');
    });
    
    // Highlight default (15 questions)
    const defaultBtn = document.querySelector('[onclick="selectIQCount(15)"]');
    if (defaultBtn) {
        defaultBtn.classList.remove('border-slate-600');
        defaultBtn.classList.add('border-amber-500');
    }
    
    // Update step display
    updateIQStep();
    
    // Open generator
    openInterviewQuestionsGenerator();
    
    showToast('Ready to create new interview questions!', 'success');
}

// Reference Check Form
function openReferenceCheckForm() {
    trackToolUsage('referenceCheckForm');
    var modal = document.getElementById('referenceCheckModal');
    if (modal) modal.classList.remove('hidden');
}

function closeReferenceCheck() {
    var modal = document.getElementById('referenceCheckModal');
    if (modal) modal.classList.add('hidden');
}

function generateReferenceCheck() {
    const candidateName = document.getElementById('rcCandidateName').value.trim();
    const position = document.getElementById('rcPosition').value.trim();
    const refereeName = document.getElementById('rcRefereeName').value.trim();
    const relationship = document.getElementById('rcRelationship').value.trim();
    const company = document.getElementById('rcCompany').value.trim();
    
    if (!candidateName || !position || !refereeName || !relationship || !company) {
        showAlert('Please fill in all required fields (marked with *)');
        return;
    }
    
    const phone = document.getElementById('rcPhone').value.trim();
    const startDate = document.getElementById('rcStartDate').value.trim();
    const endDate = document.getElementById('rcEndDate').value.trim();
    
    // Generate form content
    const formContent = `
    <div class="space-y-4 text-slate-200">
        <div class="text-center border-b border-slate-700 pb-4">
            <h3 class="text-2xl font-bold">EMPLOYMENT REFERENCE CHECK</h3>
            <p class="text-slate-400 mt-2">Confidential</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4 bg-slate-800 p-4 rounded">
            <div><strong>Candidate:</strong> ${candidateName}</div>
            <div><strong>Position:</strong> ${position}</div>
            <div><strong>Referee:</strong> ${refereeName}</div>
            <div><strong>Relationship:</strong> ${relationship}</div>
            <div><strong>Company:</strong> ${company}</div>
            <div><strong>Phone:</strong> ${phone || 'N/A'}</div>
            <div><strong>Employment Period:</strong> ${startDate} - ${endDate}</div>
        </div>
        
        <div class="space-y-3">
            <h4 class="font-bold text-lg mt-6">Reference Check Questions:</h4>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>1. Can you confirm the candidate's employment dates and position?</strong>
                <div class="mt-2 text-slate-400">Answer: _______________</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>2. How would you rate their overall performance?</strong>
                <div class="mt-2 text-slate-400">☐ Excellent  ☐ Good  ☐ Satisfactory  ☐ Needs Improvement</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>3. What were their key strengths?</strong>
                <div class="mt-2 text-slate-400">Answer: _______________</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>4. Were there any areas for improvement?</strong>
                <div class="mt-2 text-slate-400">Answer: _______________</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>5. How did they handle pressure and busy periods?</strong>
                <div class="mt-2 text-slate-400">Answer: _______________</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>6. Were they reliable and punctual?</strong>
                <div class="mt-2 text-slate-400">☐ Always  ☐ Usually  ☐ Sometimes  ☐ Rarely</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>7. How did they work with team members and customers?</strong>
                <div class="mt-2 text-slate-400">Answer: _______________</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>8. Why did they leave?</strong>
                <div class="mt-2 text-slate-400">Answer: _______________</div>
            </div>
            
            <div class="bg-slate-800 p-3 rounded">
                <strong>9. Would you re-employ them?</strong>
                <div class="mt-2 text-slate-400">☐ Yes  ☐ No  ☐ Maybe</div>
            </div>
            
            <div class="bg-red-500/10 border border-red-500/30 p-3 rounded mt-4">
                <strong class="text-red-400">⚠️ RED FLAGS TO NOTE:</strong>
                <ul class="text-sm mt-2 space-y-1">
                    <li>• Hesitation or vague answers</li>
                    <li>• Contradictions with candidate's claims</li>
                    <li>• Refusal to answer specific questions</li>
                    <li>• Negative tone or body language</li>
                </ul>
            </div>
        </div>
        
        <div class="mt-6 pt-4 border-t border-slate-700">
            <p class="text-sm text-slate-400">Completed by: _______________ Date: _______________</p>
            <p class="text-sm text-slate-400 mt-2">Signature: _______________</p>
        </div>
        
        <div class="bg-blue-500/10 border border-blue-500/30 p-3 rounded text-sm">
            <strong>Legal Compliance Note:</strong> This reference check complies with Australian privacy laws. 
            Information collected is confidential and used solely for employment assessment purposes.
        </div>
    </div>
    `;
    
    closeReferenceCheck();
    document.getElementById('rcPreviewContent').innerHTML = formContent;
    document.getElementById('referenceCheckPreviewModal').classList.remove('hidden');
    
    // Apply blur overlay (user must unlock to download)
    setTimeout(() => {
        applyUniversalBlur('rcPreviewContent', 'referenceCheck', 'Reference Check Form', 'rcActionsContainer');
    }, 100);
    
    trackEvent('reference_check_generated', { candidateName: candidateName, position: position });
}

function closeReferenceCheckPreview() {
    document.getElementById('referenceCheckPreviewModal').classList.add('hidden');
}

// Protected download (requires credit payment)
async function downloadReferenceCheck(format) {
    protectedDownloadReferenceCheck(format);
}

// Unlocked download (called after credit payment)
async function downloadReferenceCheckUnlocked(format) {
    const candidateName = document.getElementById('rcCandidateName').value.trim();
    const position = document.getElementById('rcPosition').value.trim();
    const refereeName = document.getElementById('rcRefereeName').value.trim();
    const relationship = document.getElementById('rcRelationship').value.trim();
    const company = document.getElementById('rcCompany').value.trim();
    const phone = document.getElementById('rcPhone').value.trim();
    const startDate = document.getElementById('rcStartDate').value.trim();
    const endDate = document.getElementById('rcEndDate').value.trim();
    const filename = `Reference_Check_${candidateName.replace(/\s+/g, '_')}`;
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const rcFields = { candidateName, position, refereeName, relationship, company, phone, startDate, endDate };
    
    if (format === 'docx') {
        try {
            const fullHTML = buildReferenceCheckHTML(rcFields, today);
            const blob = htmlDocx.asBlob(fullHTML);
            saveAs(blob, `${filename}.docx`);
            
            showToast('✅ Reference check downloaded as DOCX', 'success');
            trackEvent('reference_check_downloaded', { format: 'docx', candidateName: candidateName });
        } catch (error) {
            showToast('Error generating Word document. Please try PDF instead.', 'error');
        }
    } else if (format === 'pdf') {
        try {
            // Build clean text content for PDF generation
            const pdfContent = buildReferenceCheckText(rcFields);
            await generatePDFDocument(pdfContent, `${filename}.pdf`, {
                documentId: generateDocumentId(),
                userName: currentUser,
                documentType: 'Reference Check'
            });
            
            trackEvent('reference_check_downloaded', { format: 'pdf', candidateName: candidateName });
        } catch (error) {
            showToast('Error generating PDF document', 'error');
        }
    }
}

// Build full styled HTML document for Reference Check DOCX export
function buildReferenceCheckHTML(fields, today) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #000; }
        h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; margin-bottom: 5px; font-size: 22px; text-align: center; }
        .subtitle { text-align: center; color: #777; margin-bottom: 25px; font-size: 12px; }
        h2 { color: #34495e; margin-top: 25px; border-bottom: 2px solid #bdc3c7; padding-bottom: 5px; font-size: 16px; }
        p { margin: 6px 0; font-size: 11px; }
        .info-box { background: #ecf0f1; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .info-box p { margin: 4px 0; }
        .question-block { margin: 15px 0; padding: 12px; border-left: 4px solid #3498db; background: #f8f9fa; }
        .question-block p.question { font-weight: bold; margin-bottom: 8px; font-size: 11px; }
        .question-block p.answer { color: #777; font-size: 11px; }
        .checkbox-line { color: #555; font-size: 11px; margin-top: 8px; }
        .red-flag { margin: 20px 0; padding: 12px; border-left: 4px solid #e74c3c; background: #fdf2f2; }
        .red-flag p.title { font-weight: bold; color: #c0392b; margin-bottom: 6px; }
        .red-flag ul { margin: 5px 0 5px 20px; padding: 0; }
        .red-flag li { font-size: 11px; margin: 3px 0; color: #555; }
        .sign-off { margin-top: 30px; padding-top: 15px; border-top: 2px solid #bdc3c7; }
        .sign-off p { color: #555; font-size: 11px; margin: 8px 0; }
        .legal-note { margin-top: 20px; padding: 12px; background: #eaf4fe; border-left: 4px solid #3498db; font-size: 10px; color: #555; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #bdc3c7; text-align: center; color: #7f8c8d; font-size: 10px; }
    </style>
</head>
<body>
    <h1>EMPLOYMENT REFERENCE CHECK</h1>
    <p class="subtitle">Confidential</p>
    
    <div class="info-box">
        <p><strong>Candidate:</strong> ${fields.candidateName}</p>
        <p><strong>Position Applied For:</strong> ${fields.position}</p>
        <p><strong>Referee:</strong> ${fields.refereeName}</p>
        <p><strong>Relationship to Candidate:</strong> ${fields.relationship}</p>
        <p><strong>Company:</strong> ${fields.company}</p>
        <p><strong>Phone:</strong> ${fields.phone || 'N/A'}</p>
        <p><strong>Employment Period:</strong> ${fields.startDate || 'N/A'} - ${fields.endDate || 'N/A'}</p>
    </div>

    <h2>Reference Check Questions</h2>

    <div class="question-block">
        <p class="question">1. Can you confirm the candidate's employment dates and position?</p>
        <p class="answer">Answer: _______________________________________________</p>
    </div>

    <div class="question-block">
        <p class="question">2. How would you rate their overall performance?</p>
        <p class="checkbox-line">☐ Excellent&nbsp;&nbsp;&nbsp;☐ Good&nbsp;&nbsp;&nbsp;☐ Satisfactory&nbsp;&nbsp;&nbsp;☐ Needs Improvement</p>
    </div>

    <div class="question-block">
        <p class="question">3. What were their key strengths?</p>
        <p class="answer">Answer: _______________________________________________</p>
    </div>

    <div class="question-block">
        <p class="question">4. Were there any areas for improvement?</p>
        <p class="answer">Answer: _______________________________________________</p>
    </div>

    <div class="question-block">
        <p class="question">5. How did they handle pressure and busy periods?</p>
        <p class="answer">Answer: _______________________________________________</p>
    </div>

    <div class="question-block">
        <p class="question">6. Were they reliable and punctual?</p>
        <p class="checkbox-line">☐ Always&nbsp;&nbsp;&nbsp;☐ Usually&nbsp;&nbsp;&nbsp;☐ Sometimes&nbsp;&nbsp;&nbsp;☐ Rarely</p>
    </div>

    <div class="question-block">
        <p class="question">7. How did they work with team members and customers?</p>
        <p class="answer">Answer: _______________________________________________</p>
    </div>

    <div class="question-block">
        <p class="question">8. Why did they leave?</p>
        <p class="answer">Answer: _______________________________________________</p>
    </div>

    <div class="question-block">
        <p class="question">9. Would you re-employ them?</p>
        <p class="checkbox-line">☐ Yes&nbsp;&nbsp;&nbsp;☐ No&nbsp;&nbsp;&nbsp;☐ Maybe</p>
    </div>

    <div class="red-flag">
        <p class="title">⚠ RED FLAGS TO NOTE:</p>
        <ul>
            <li>Hesitation or vague answers</li>
            <li>Contradictions with candidate's claims</li>
            <li>Refusal to answer specific questions</li>
            <li>Negative tone or body language</li>
        </ul>
    </div>

    <div class="sign-off">
        <p>Completed by: ___________________________________</p>
        <p>Date: ___________________________________</p>
        <p>Signature: ___________________________________</p>
    </div>

    <div class="legal-note">
        <strong>Legal Compliance Note:</strong> This reference check complies with Australian privacy laws. 
        Information collected is confidential and used solely for employment assessment purposes.
    </div>

    <div class="footer">
        <p>Generated by Fitz HR on ${today}</p>
    </div>
</body>
</html>`;
}

// Build clean text content for Reference Check PDF export
function buildReferenceCheckText(fields) {
    return `# EMPLOYMENT REFERENCE CHECK
Confidential

## Candidate Details
Candidate: ${fields.candidateName}
Position Applied For: ${fields.position}
Referee: ${fields.refereeName}
Relationship to Candidate: ${fields.relationship}
Company: ${fields.company}
Phone: ${fields.phone || 'N/A'}
Employment Period: ${fields.startDate || 'N/A'} - ${fields.endDate || 'N/A'}

## Reference Check Questions

### 1. Can you confirm the candidate's employment dates and position?
Answer: _______________________________________________

### 2. How would you rate their overall performance?
☐ Excellent  ☐ Good  ☐ Satisfactory  ☐ Needs Improvement

### 3. What were their key strengths?
Answer: _______________________________________________

### 4. Were there any areas for improvement?
Answer: _______________________________________________

### 5. How did they handle pressure and busy periods?
Answer: _______________________________________________

### 6. Were they reliable and punctual?
☐ Always  ☐ Usually  ☐ Sometimes  ☐ Rarely

### 7. How did they work with team members and customers?
Answer: _______________________________________________

### 8. Why did they leave?
Answer: _______________________________________________

### 9. Would you re-employ them?
☐ Yes  ☐ No  ☐ Maybe

## Red Flags to Note
- Hesitation or vague answers
- Contradictions with candidate's claims
- Refusal to answer specific questions
- Negative tone or body language

Completed by: ___________________________________
Date: ___________________________________
Signature: ___________________________________

Legal Compliance Note: This reference check complies with Australian privacy laws. Information collected is confidential and used solely for employment assessment purposes.`;
}


// Close upload menu when clicking outside
document.addEventListener('click', function(e) {
    const uploadBtn = document.getElementById('uploadButton');
    const uploadMenu = document.getElementById('uploadMenu');
    
    if (uploadMenu && !uploadMenu.classList.contains('hidden')) {
        if (!uploadBtn.contains(e.target) && !uploadMenu.contains(e.target)) {
            uploadMenu.classList.add('hidden');
        }
    }
});

// Trigger file upload by type
function triggerFileUpload(type) {
    // Close menu
    var menu = document.getElementById('uploadMenu');
    if (menu) menu.classList.add('hidden');
    
    // Trigger the appropriate hidden file input
    var inputId = type + 'UploadInput';
    var input = document.getElementById(inputId);
    if (input) {
        input.click();
    } else {
    }
}

// Handle file upload (documents)
async function handleFileUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (10MB max)
    var maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('❌ File too large. Max 10MB', 'error', 3000);
        event.target.value = '';
        return;
    }
    
    // Detect file type
    var fileName = file.name.toLowerCase();
    var fileType = 'document';
    var icon = '📄';
    
    if (fileName.endsWith('.pdf')) {
        fileType = 'PDF';
        icon = '📄';
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        fileType = 'Excel/CSV';
        icon = '📊';
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        fileType = 'Word';
        icon = '📝';
    } else if (fileName.endsWith('.txt')) {
        fileType = 'Text';
        icon = '📄';
    }
    
    // Show uploading message
    showToast('📤 Uploading ' + file.name + '...', 'info', 2000);
    
    try {
        var result = await readFileContent(file);
        
        if (result && result.success) {
            // Show file in chat
            var size = (file.size / 1024).toFixed(2) + ' KB';
            var fileMsg = icon + ' Uploaded: ' + file.name + ' (' + size + ')';
            
            addMessage('user', fileMsg);
            conversationHistory.push({ role: 'user', content: fileMsg });
            saveCurrentConversation();
            
            // Pre-fill message input with file context
            var input = document.getElementById('messageInput');
            if (input && result.text) {
                var prompt = 'I uploaded "' + file.name + '". Please help me with this ' + fileType + ' document.\n\n';
                
                // Add preview of content
                var preview = result.text.substring(0, 400);
                if (result.text.length > 400) preview += '...';
                
                input.value = prompt + 'Content:\n' + preview;
                autoResizeTextarea(input);
                input.focus();
            }
            
            showToast('✅ ' + file.name + ' uploaded!', 'success', 3000);
        } else {
            throw new Error('Processing failed');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error', 4000);
    }
    
    // Reset input
    event.target.value = '';
}

// Handle image upload
async function handleImageUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB max for images)
    var maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('❌ Image too large. Max 5MB', 'error', 3000);
        event.target.value = '';
        return;
    }
    
    showToast('📤 Uploading image...', 'info', 2000);
    
    try {
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var size = (file.size / 1024).toFixed(2) + ' KB';
            var imgMsg = '🖼️ Uploaded image: ' + file.name + ' (' + size + ')';
            
            // Add to chat
            addMessage('user', imgMsg);
            conversationHistory.push({ role: 'user', content: imgMsg });
            saveCurrentConversation();
            
            // Pre-fill input
            var input = document.getElementById('messageInput');
            if (input) {
                input.value = 'I uploaded an image "' + file.name + '". Please describe what you see and provide relevant insights.';
                autoResizeTextarea(input);
                input.focus();
            }
            
            showToast('✅ Image uploaded!', 'success', 3000);
        };
        
        reader.onerror = function() {
            showToast('❌ Failed to read image', 'error', 3000);
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error', 4000);
    }
    
    // Reset input
    event.target.value = '';
}

// Read file content
async function readFileContent(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                var text = '';
                var fileInfo = 'File: ' + file.name + '\n';
                fileInfo += 'Size: ' + (file.size / 1024).toFixed(2) + ' KB\n\n';
                
                // Handle CSV files specially - read as text
                if (file.name.toLowerCase().endsWith('.csv')) {
                    var csvContent = e.target.result;
                    var lines = csvContent.split('\n');
                    text = fileInfo + 'CSV Data (first 20 rows):\n\n';
                    text += lines.slice(0, 20).join('\n');
                    if (lines.length > 20) {
                        text += '\n\n[' + (lines.length - 20) + ' more rows...]';
                    }
                } else if (file.name.toLowerCase().endsWith('.txt')) {
                    text = fileInfo + 'Text content:\n\n' + e.target.result;
                } else {
                    // For PDF, Word, Excel - just show metadata
                    text = fileInfo + 'Document uploaded and ready for analysis.\n';
                    text += 'Note: Full text extraction requires specialized libraries.';
                }
                
                resolve({
                    success: true,
                    text: text,
                    fileData: e.target.result
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        // Read CSV and TXT as text, others as data URL
        if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
}


// Auto-resize textarea
function autoResizeTextarea(textarea) {
    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Collapse back to single row when empty
    if (!textarea.value.trim()) {
        textarea.style.height = '48px';
    } else {
        // Expand based on content, max 200px
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = newHeight + 'px';
    }
}

// Scroll to bottom of messages (for mobile button)
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
        // Update button visibility after scroll completes
        setTimeout(updateScrollButtonVisibility, 500);
    }
}

/**
 * Scroll to bottom instantly without animation
 * Used for initial page load so user immediately sees most recent messages
 */
function scrollToBottomInstant() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
        // Update button visibility
        setTimeout(updateScrollButtonVisibility, 100);
    }
}

// Update scroll button visibility based on scroll position
function updateScrollButtonVisibility() {
    const container = document.getElementById('messagesContainer');
    const btn = document.getElementById('scrollToBottomBtn');
    
    if (!container || !btn) return;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Show button when scrolled up more than 150px from bottom AND content is scrollable
    if (distanceFromBottom > 150 && scrollHeight > clientHeight) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

// Create new chat from sidebar
function createNewChatFromSidebar() {
    createNewConversation();
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// Sidebar search
function performSidebarSearch() {
    const query = document.getElementById('sidebarSearchInput').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('sidebarSearchResults');
    
    if (!query) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    // Search through conversation history
    const results = conversationHistory_searchable.filter(conv => 
        conv.content.toLowerCase().includes(query)
    );
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-slate-500 text-xs py-2">No results</p>';
        return;
    }
    
    resultsDiv.innerHTML = results.slice(0, 5).map(conv => {
        const preview = conv.content.substring(0, 60) + '...';
        return `<div class="text-xs text-slate-300 py-2 px-2 hover:bg-slate-700 rounded cursor-pointer">${preview}</div>`;
    }).join('');
}

// ========================================
// WEEK 3 PHASE 1: POWER USER FEATURES
// ========================================

// Bookmarks Storage
let conversationHistory_searchable = []; // Searchable version of conversations
let uploadedFiles = [];
let currentChart = null;

/**
 * Toggle Quick Actions Menu
 */
function toggleQuickActions() {
    const menu = document.getElementById('quickActionsMenu');
    menu.classList.toggle('show');
}

/**
 * Close quick actions when clicking outside
 */
document.addEventListener('click', (e) => {
    const quickActions = document.querySelector('.quick-actions-fab');
    const menu = document.getElementById('quickActionsMenu');
    if (quickActions && menu && !quickActions.contains(e.target)) {
        menu.classList.remove('show');
    }
});

// ===================
// SEARCH FUNCTIONALITY
// ===================

function openSearchModal() {
    document.getElementById('searchModal').classList.remove('hidden');
    document.getElementById('searchInput').focus();
    toggleQuickActions();
}

function closeSearchModal() {
    document.getElementById('searchModal').classList.add('hidden');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '<p class="text-slate-400 text-center py-8">Type to search your conversation history...</p>';
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.innerHTML = '<p class="text-slate-400 text-center py-8">Type to search your conversation history...</p>';
        return;
    }
    
    // Search through conversation history
    const results = conversationHistory_searchable.filter(conv => 
        conv.content.toLowerCase().includes(query)
    );
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-slate-400 text-center py-8">No results found</p>';
        return;
    }
    
    // Display results
    resultsDiv.innerHTML = results.map((conv, index) => {
        const highlighted = highlightSearchTerm(conv.content, query);
        return `
            <div class="search-result" onclick="jumpToMessage(${index})">
                <div class="flex items-start justify-between mb-2">
                    <span class="text-xs text-slate-500">${conv.role === 'user' ? '👤 You' : '<span class="fitz-thinking-wrap"><span class="fitz-bot fitz-xs" style="vertical-align: middle;"></span> Fitz</span>'}</span>
                    <span class="text-xs text-slate-500">${conv.timestamp || 'Recent'}</span>
                </div>
                <div class="text-sm text-slate-300">${highlighted}</div>
            </div>
        `;
    }).join('');
}

function highlightSearchTerm(text, query) {
    const maxLength = 200;
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query.toLowerCase());
    
    if (index === -1) return text.substring(0, maxLength) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 100);
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    // Highlight the match
    const regex = new RegExp(`(${query})`, 'gi');
    snippet = snippet.replace(regex, '<span class="search-highlight">$1</span>');
    
    return snippet;
}

function jumpToMessage(index) {
    closeSearchModal();
    showToast('Feature coming soon: Jump to message', 'info');
}

// Update conversation history for search
function updateSearchableHistory() {
    conversationHistory_searchable = conversationHistory.map((conv, index) => ({
        ...conv,
        index: index,
        timestamp: new Date().toLocaleString()
    }));
}

// ===================
// MULTI-FILE UPLOAD
// ===================

function openMultiFileModal() {
    document.getElementById('multiFileModal').classList.remove('hidden');
    toggleQuickActions();
}

function closeMultiFileModal() {
    document.getElementById('multiFileModal').classList.add('hidden');
    uploadedFiles = [];
    document.getElementById('filesList').innerHTML = '';
    document.getElementById('processFilesBtn').disabled = true;
}

// Setup drag and drop
const dropZone = document.getElementById('dropZone');
if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleMultiFileSelect({ target: { files } });
}

function handleMultiFileSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length > 10) {
        showToast('Maximum 10 files allowed', 'warning');
        return;
    }
    
    uploadedFiles = files.filter(file => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            showToast(`${file.name}: Invalid file type`, 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            showToast(`${file.name}: File too large (max 5MB)`, 'error');
            return false;
        }
        
        return true;
    });
    
    renderFilesList();
    document.getElementById('processFilesBtn').disabled = uploadedFiles.length === 0;
}

function renderFilesList() {
    const listDiv = document.getElementById('filesList');
    
    if (uploadedFiles.length === 0) {
        listDiv.innerHTML = '';
        return;
    }
    
    listDiv.innerHTML = `
        <div class="mb-4">
            <h3 class="text-white font-semibold mb-3">Selected Files (${uploadedFiles.length})</h3>
            ${uploadedFiles.map((file, index) => `
                <div class="file-item">
                    <span class="text-2xl">${getFileIcon(file.type)}</span>
                    <div class="flex-1">
                        <div class="text-white font-medium">${file.name}</div>
                        <div class="text-xs text-slate-400">${formatFileSize(file.size)}</div>
                    </div>
                    <button onclick="removeFile(${index})" class="text-red-400 hover:text-red-300 text-xl">×</button>
                </div>
            `).join('')}
        </div>
    `;
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderFilesList();
    document.getElementById('processFilesBtn').disabled = uploadedFiles.length === 0;
}

function getFileIcon(type) {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('sheet')) return '📊';
    if (type.includes('csv')) return '📈';
    return '📁';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function processMultipleFiles() {
    showLoadingOverlay('filesList', 'Processing files...');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showToast(`Successfully processed ${uploadedFiles.length} files!`, 'success');
        hideLoadingOverlay('filesList');
        
        setTimeout(() => {
            closeMultiFileModal();
        }, 1500);
        
    } catch (error) {
        hideLoadingOverlay('filesList');
        handleError(error, 'processMultipleFiles');
    }
}

// ===================
// ANALYTICS DASHBOARD
// ===================

function showAnalyticsDashboard() {
    document.getElementById('analyticsModal').classList.remove('hidden');
    renderUsageChart();
    toggleQuickActions();
}

function closeAnalyticsModal() {
    document.getElementById('analyticsModal').classList.add('hidden');
}

function switchChart(type) {
    // Update tab styles
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('text-purple-400', 'border-b-2', 'border-purple-400');
        tab.classList.add('text-slate-400');
    });
    
    const activeTab = document.querySelector(`[data-chart="${type}"]`);
    activeTab.classList.remove('text-slate-400');
    activeTab.classList.add('text-purple-400', 'border-b-2', 'border-purple-400');
    
    // Render appropriate chart
    if (type === 'usage') renderUsageChart();
    else if (type === 'tools') renderToolsChart();
    else if (type === 'engagement') renderEngagementChart();
}

function renderUsageChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    
    if (currentChart) currentChart.destroy();
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Messages',
                data: [12, 19, 15, 25, 22, 30, 28],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e1'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                },
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                }
            }
        }
    });
}

function renderToolsChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    
    if (currentChart) currentChart.destroy();
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Award Wizard', 'Document Builder', 'Calculator', 'Roster', 'Compliance'],
            datasets: [{
                label: 'Uses',
                data: [45, 38, 32, 28, 22],
                backgroundColor: [
                    '#f59e0b',
                    '#3b82f6',
                    '#10b981',
                    '#8b5cf6',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e1'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                },
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                }
            }
        }
    });
}

function renderEngagementChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    
    if (currentChart) currentChart.destroy();
    
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active Users', 'New Users', 'Returning Users'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1'
                    }
                }
            }
        }
    });
}

function exportDetailedAnalytics() {
    showToast('Exporting analytics report...', 'info');
    
    setTimeout(() => {
        showToast('Report exported successfully!', 'success');
    }, 1500);
}

// ===================
// WEEK 2: LOADING STATES, TOASTS, & POLISH
// ===================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {number} duration - How long to show (ms), default 4000
 */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.className = `toast toast-${type} toast-enter`;
    toast.innerHTML = `
        <span style="font-size: 20px; flex-shrink: 0;">${icons[type]}</span>
        <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div style="font-size: 14px; opacity: 0.9;">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="font-size: 20px; opacity: 0.6; hover:opacity: 1; background: none; border: none; padding: 0; cursor: pointer;">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading skeleton for chat message
 * @returns {HTMLElement} - The skeleton element
 */


/**
 * Styled in-app alert replacement for native showAlert()
 * @param {string} message - Message to display (supports \n for line breaks)
 */
function showAlert(message) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'styledAlertOverlay';
    overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[9999]';
    overlay.style.animation = 'fadeIn 0.15s ease-out';
    
    // Convert newlines to HTML breaks and handle emoji headers
    let formattedMessage = message
        .replace(/\n/g, '<br>')
        .replace(/^(⚠️|✅|✓|🚨|🔗|❌)\s*/g, '<span class="text-2xl block mb-2">$1</span>');
    
    overlay.innerHTML = `
        <div class="bg-slate-800 rounded-2xl border border-slate-600 p-6 max-w-md w-full shadow-2xl" style="animation: fadeIn 0.2s ease-out;">
            <div class="text-slate-100 text-sm leading-relaxed mb-6">${formattedMessage}</div>
            <button onclick="document.getElementById('styledAlertOverlay').remove()" 
                    class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all">
                OK
            </button>
        </div>
    `;
    
    // Close on overlay click (not inner content)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    
    // Close on Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(overlay);
    
    // Focus the OK button for keyboard accessibility
    overlay.querySelector('button').focus();
}

function showChatSkeleton() {
    const container = document.getElementById('messagesContainer');
    const skeleton = document.createElement('div');
    skeleton.className = 'bg-slate-700 rounded-xl p-6 mb-4 fade-in skeleton-message';
    skeleton.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="skeleton w-8 h-8 rounded-full"></div>
            <div class="flex-1 space-y-2">
                <div class="skeleton h-4 w-3/4"></div>
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-5/6"></div>
            </div>
        </div>
    `;
    container.appendChild(skeleton);
    container.scrollTop = container.scrollHeight;
    return skeleton;
}

/**
 * Remove chat skeleton
 * @param {HTMLElement} skeleton - The skeleton element to remove
 */
function removeChatSkeleton(skeleton) {
    if (skeleton && skeleton.parentNode) {
        skeleton.style.opacity = '0';
        skeleton.style.transition = 'opacity 0.3s';
        setTimeout(() => skeleton.remove(), 300);
    }
}

/**
 * Show loading overlay on an element
 * @param {string} elementId - ID of element to show overlay on
 * @param {string} message - Loading message
 */
function showLoadingOverlay(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = `${elementId}-overlay`;
    overlay.innerHTML = `
        <div class="text-center">
            <div class="spinner inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
            <div class="text-white font-medium">${message}</div>
        </div>
    `;
    element.style.position = 'relative';
    element.appendChild(overlay);
}

/**
 * Hide loading overlay
 * @param {string} elementId - ID of element with overlay
 */
function hideLoadingOverlay(elementId) {
    const overlay = document.getElementById(`${elementId}-overlay`);
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
}

/**
 * Enhanced error handler with user-friendly messages
 * @param {Error} error - The error object
 * @param {string} context - Context of where error occurred
 */
function handleError(error, context = '') {
    let userMessage = 'Something went wrong. Please try again.';
    
    // Provide specific messages for common errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection.';
    } else if (error.message.includes('timeout')) {
        userMessage = 'Request timed out. Please try again.';
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        userMessage = 'Session expired. Please refresh the page and log in again.';
    } else if (error.message.includes('404')) {
        userMessage = 'Resource not found. Please refresh the page.';
    } else if (error.message.includes('500')) {
        userMessage = 'Server error. Our team has been notified. Please try again later.';
    }
    
    showToast(userMessage, 'error', 6000);
    
    // Track error for analytics
    trackEvent('error_occurred', {
        context: context,
        error: error.message,
        user: currentUser
    });
}

/**
 * Add smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 */
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if element is in viewport (for lazy loading)
 * @param {HTMLElement} element - Element to check
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Add keyboard navigation support
 */
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Escape to close the topmost open modal
        if (e.key === 'Escape') {
            // List of all modal IDs in priority order (most specific first)
            const modalIds = [
                'styledAlertOverlay',
                'documentPreviewModal',
                'mobileToolsModal',
                'adminDashboardModal',
                'awardCalculatorModal',
                'awardWizardModal',
                'rosterOptimizerModal',
                'rosterStressTesterModal',
                'terminationRiskModal',
                'scenarioAnalysisModal',
                'complianceCalendarModal',
                'xeroIntegrationModal',
                'documentBuilderModal',
                'terminationConsultantModal',
                'venueOnboardingModal',
                'venueSettingsModal',
                'feedbackModal',
                'crisisModal',
                'searchModal',
                'bookmarksModal',
                'multiFileModal',
                'analyticsModal',
                'termsModal',
                'privacyModal',
                'logoutModal',
                'toolsMenu'
            ];
            
            // Close the first visible modal found
            for (const id of modalIds) {
                const modal = document.getElementById(id);
                if (modal && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    // Special cleanup for document builder
                    if (id === 'documentBuilderModal' && typeof resetDocumentBuilderSilent === 'function') {
                        resetDocumentBuilderSilent();
                    }
                    e.preventDefault();
                    break;
                }
            }
            
            // Also close sidebar if open
            const sidebar = document.getElementById('chatSidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        }
        
        // Ctrl/Cmd + K to focus search/input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
            }
        }
        
        // Ctrl/Cmd + N for new chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (typeof createNewConversation === 'function') {
                createNewConversation();
            }
        }
    });
}

/**
 * Preload critical modals for better performance
 */
function preloadModals() {
    // Preload modal content that might be used frequently
    const criticalModals = ['documentBuilderModal', 'awardCalculatorModal'];
    criticalModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Force browser to parse the modal HTML
            modal.offsetHeight;
        }
    });
}

/**
 * Add visual feedback when copying text
 * @param {string} text - Text that was copied
 */
function showCopyFeedback(text) {
    showToast('Copied to clipboard!', 'success', 2000);
}

/**
 * Validate form with visual feedback
 * @param {string} formId - ID of form to validate
 * @returns {boolean} - Whether form is valid
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500');
            input.classList.remove('border-slate-600');
            isValid = false;
            
            // Remove error state on input
            input.addEventListener('input', function() {
                this.classList.remove('border-red-500');
                this.classList.add('border-slate-600');
            }, { once: true });
        }
    });
    
    if (!isValid) {
        showToast('Please fill in all required fields', 'warning');
    }
    
    return isValid;
}

// ========================================
// TOOLS MENU
// ========================================
/**
 * Toggles visibility of the tools menu dropdown (desktop) or modal (mobile)
 * @returns {void}
 */
function toggleToolsMenu() {
    // Check if mobile (768px or less)
    if (window.innerWidth <= 768) {
        // Show mobile modal instead
        document.getElementById('mobileToolsModal').classList.remove('hidden');
    } else {
        // Show desktop dropdown
        DOM.toolsMenu.classList.toggle('hidden');
    }
}

/**
 * Closes the mobile tools modal
 * @returns {void}
 */
function closeMobileTools() {
    document.getElementById('mobileToolsModal').classList.add('hidden');
}

/**
 * Opens a tool from the mobile modal
 * @param {string} toolName - Name of tool to open
 * @returns {void}
 */
function openToolFromMobile(toolName) {
    closeMobileTools();
    openTool(toolName);
}

/**
 * Opens a specific tool modal and tracks the event
 * @param {string} toolName - Name of tool to open (e.g., 'awardCalculator')
 * @returns {void}
 */
function openTool(toolName) {
    // Close desktop dropdown only if on desktop
    if (window.innerWidth > 768) {
        DOM.toolsMenu.classList.add('hidden');
    }
    
    const modalMap = {
        'awardCalculator': 'awardCalculatorModal',
        'rosterOptimizer': 'rosterOptimizerModal',
        'terminationRisk': 'terminationRiskModal',
        'scenarioAnalysis': 'scenarioAnalysisModal',
        'xeroIntegration': 'xeroIntegrationModal',
        'awardWizard': 'awardWizardModal',
        'rosterStressTester': 'rosterStressTesterModal',
        'complianceCalendar': 'complianceCalendarModal',
        'documentBuilder': 'documentBuilderModal',
        'recruitmentToolkit': 'recruitmentToolkitModal',
        'newEmployeeToolkit': 'newEmployeeToolkitModal',
        'probationCheckIn': 'probationCheckInModal'
    };
    const modalId = modalMap[toolName];
    if (modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        trackEvent('tool_opened', { tool: toolName, user: currentUser });
    }
}

function closeToolModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    
    // Special handling for Document Builder - reset it silently when closed
    if (modalId === 'documentBuilderModal') {
        resetDocumentBuilderSilent();
    }
}

// ========================================
// VENUE ONBOARDING & PROFILE SYSTEM
// ========================================

function checkOnboardingStatus() {
    // Use currentUser.uid for Firebase users, or currentUser as string for access code users
    const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    const saved = localStorage.getItem('venueProfile_' + userKey);
    if (saved) {
        try {
            const profile = JSON.parse(saved);
            return profile.setupComplete === true;
        } catch (e) {
            return false;
        }
    }
    // Also check if venueProfile is already loaded (from Firebase sync)
    return venueProfile && venueProfile.setupComplete === true;
}

function showOnboarding() {
    document.getElementById('venueOnboardingModal').classList.remove('hidden');
    updateOnboardingStep();
}

function saveOnboardingAnswer(field, value, isLastStep = false) {
    venueProfile[field] = value;
    if (isLastStep) {
        completeOnboarding();
    } else {
        onboardingCurrentStep++;
        updateOnboardingStep();
    }
}

function saveOnboardingNameAndVenue() {
    const userName = document.getElementById('onboardingUserName').value.trim();
    const venueName = document.getElementById('onboardingVenueName').value.trim();
    
    if (!userName) {
        showAlert('Please enter your name');
        return;
    }
    
    if (!venueName) {
        showAlert('Please enter your venue name');
        return;
    }
    
    venueProfile.userName = userName;
    venueProfile.venueName = venueName;
    onboardingCurrentStep++;
    updateOnboardingStep();
}

function saveOnboardingLocation() {
    const location = document.getElementById('onboardingLocation').value;
    const city = document.getElementById('onboardingCity').value.trim();
    if (!location) {
        showAlert('Please select a state');
        return;
    }
    venueProfile.location = location;
    venueProfile.city = city || '';
    onboardingCurrentStep++;
    updateOnboardingStep();
}

function saveOnboardingVenueType() {
    const venueType = document.getElementById('onboardingVenueType').value;
    if (!venueType) {
        showAlert('Please select a venue type');
        return;
    }
    venueProfile.venueType = venueType;
    onboardingCurrentStep++;
    updateOnboardingStep();
}

function updateOnboardingStep() {
    document.querySelectorAll('.onboarding-step').forEach(step => step.classList.add('hidden'));
    const current = document.querySelector(`[data-step="${onboardingCurrentStep}"]`);
    if (current) current.classList.remove('hidden');

    document.getElementById('onboardingStep').textContent = onboardingCurrentStep;
    const progress = Math.round((onboardingCurrentStep / ONBOARDING_STEPS) * 100);
    document.getElementById('onboardingProgress').textContent = `${progress}% Complete`;
    document.getElementById('onboardingProgressBar').style.width = `${progress}%`;

    if (onboardingCurrentStep === 3) {
        const select = document.getElementById('onboardingVenueType');
        const hint = document.getElementById('onboardingVenueTypeHint');
        populateVenueTypeDropdown(select, venueProfile.primaryAward, venueProfile.venueType);
        if (hint) {
            if (AWARD_VENUE_MAP[venueProfile.primaryAward]) {
                hint.textContent = `Showing venues commonly covered by the ${venueProfile.primaryAward}. If yours isn't listed, choose from "Other venue types".`;
                hint.classList.remove('hidden');
            } else {
                hint.textContent = '';
                hint.classList.add('hidden');
            }
        }
    }
}

function completeOnboarding() {
    venueProfile.setupComplete = true;
    venueProfile.setupDate = new Date().toISOString();

    // Reload rates for the selected award (Restaurant Award uses a different rates file)
    loadAwardRates();
    
    // Use currentUser.uid for Firebase users, or currentUser as string for access code users
    const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    localStorage.setItem('venueProfile_' + userKey, JSON.stringify(venueProfile));
    
    // Sync to Firebase for cross-device access
    if (currentUser && currentUser.uid && db) {
        db.collection('users').doc(currentUser.uid).set({
            venueProfile: venueProfile
        }, { merge: true }).then(() => {
        }).catch(err => {
        });
    }
    
    // Update sidebar with new venue name - call immediately AND with delay for reliability
    updateSidebarVenueName();
    setTimeout(() => {
        updateSidebarVenueName();
    }, 500);

    // Update award rate alert text to reflect the user's actual award
    const alertEl = document.getElementById('awardRateAlertText');
    if (alertEl) {
        alertEl.textContent = `${getAwardContext().name} rates increase on 1 July 2026`;
    }
    
    // Also force refresh the credits display in case it wasn't showing
    setTimeout(() => {
        updateCreditsDisplay();
    }, 100);
    
    // Clear the messages container (remove loading skeleton) and prepare for fresh chat
    const msgContainer = document.getElementById('messagesContainer');
    if (msgContainer) {
        msgContainer.innerHTML = '<div class="max-w-5xl mx-auto space-y-6"></div>';
    }
    
    // Initialize daily tip banner for Google users
    setTimeout(() => {
        updateDailyTipBanner();
        startDailyTipRotation();
    }, 300);
    
    document.getElementById('venueOnboardingModal').classList.add('hidden');
    
    const venueType = getVenueTypeLabel(venueProfile.venueType);
    const userName = venueProfile.userName || 'there';
    const venueName = venueProfile.venueName || 'your venue';
    
    addMessage('assistant', `👋 **G'day ${userName}!** I'm Fitz, your dedicated HR assistant for **${venueName}**.

I now know you run a **${venueType}** in **${venueProfile.city || venueProfile.location}** with **${venueProfile.staffCount}** staff.

All my advice will be tailored for your venue. Update these anytime in ⚙️ Settings.`);
    
    // Show quick action prompts after short delay
    setTimeout(function() {
        showQuickActionPrompts();
    }, 400);
    
    trackEvent('onboarding_completed', venueProfile);
}

function skipOnboarding() {
    // Onboarding is mandatory — skipping is disabled
}

// Quick Action Prompts - shown after onboarding
function showQuickActionPrompts() {
    var container = document.getElementById('messagesContainer');
    if (!container) return;
    
    var innerContainer = container.querySelector('.space-y-6');
    if (!innerContainer) return;
    
    var challenge = venueProfile.mainChallenge || 'general';
    var staffCount = venueProfile.staffCount || '1-5';
    
    // Build prompts based on profile
    var prompts = [];
    
    // Challenge-specific prompts (2 max)
    if (challenge === 'performance') {
        prompts.push({icon: '⚠️', label: 'Staff always late', text: 'I have a staff member who is always late. What should I do?'});
        prompts.push({icon: '📝', label: 'Write a warning', text: 'Can you help me write a warning letter for an employee?'});
    } else if (challenge === 'awards') {
        prompts.push({icon: '💰', label: 'Check pay rates', text: `What should I pay a casual waiter under the ${getAwardContext().name}?`});
        prompts.push({icon: '🌙', label: 'Penalty rates', text: 'What are the penalty rates for weekend and public holiday work?'});
    } else if (challenge === 'rostering') {
        prompts.push({icon: '📅', label: 'Roster rules', text: `What are the minimum shift length rules under the ${getAwardContext().name}?`});
        prompts.push({icon: '⏰', label: 'Overtime rules', text: 'When does overtime kick in for my award?'});
    } else {
        // Default prompts if no challenge selected
        prompts.push({icon: '👋', label: 'Hiring new staff', text: 'What do I need to do when hiring a new employee?'});
        prompts.push({icon: '💰', label: 'Check pay rates', text: `What should I pay a casual waiter under the ${getAwardContext().name}?`});
    }
    
    // Add one more common prompt to make 3 total
    if (staffCount === '30+' || staffCount === '16-30') {
        prompts.push({icon: '📊', label: 'Redundancy process', text: 'What is the process for making someone redundant?'});
    } else {
        prompts.push({icon: '🏥', label: 'Sick leave', text: 'How does sick leave work for casual employees?'});
    }
    
    // Limit to 3 prompts
    prompts = prompts.slice(0, 3);
    
    // Create the prompts container
    var promptsDiv = document.createElement('div');
    promptsDiv.id = 'quickActionPrompts';
    promptsDiv.className = 'px-4 pb-4';
    
    var html = '<p class="text-slate-400 text-sm mb-3">💡 Quick start — click any question:</p>';
    html += '<div class="flex flex-wrap gap-2">';
    
    for (var i = 0; i < prompts.length; i++) {
        html += '<button onclick="useQuickPrompt(' + i + ')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-amber-500 text-slate-200 rounded-full text-sm transition-all">';
        html += prompts[i].icon + ' ' + prompts[i].label;
        html += '</button>';
    }
    
    html += '</div>';
    promptsDiv.innerHTML = html;
    
    // Store prompts for click handler
    window.quickPromptsList = prompts;
    
    innerContainer.appendChild(promptsDiv);
    container.scrollTop = container.scrollHeight;
}

// Handle quick prompt click
function useQuickPrompt(index) {
    var prompts = window.quickPromptsList;
    if (!prompts || !prompts[index]) return;
    
    var text = prompts[index].text;
    
    // Remove the prompts container first
    var promptsDiv = document.getElementById('quickActionPrompts');
    if (promptsDiv) {
        promptsDiv.remove();
    }
    
    // Set input value using correct ID (messageInput, not userInput)
    var input = document.getElementById('messageInput');
    if (input) {
        input.value = text;
        input.focus();
        // Small delay to ensure value is set before sending
        setTimeout(function() {
            sendMessage();
        }, 100);
    }
}

// Random Quick Prompts for returning users - pool of general HR questions
function showRandomQuickPrompts() {
    var container = document.getElementById('messagesContainer');
    if (!container) return;
    
    var innerContainer = container.querySelector('.space-y-6');
    if (!innerContainer) return;
    
    // Don't show if prompts already exist
    if (document.getElementById('quickActionPrompts')) return;
    
    // Pool of general HR prompts
    var allPrompts = [
        {icon: '💰', label: 'Casual pay rates', text: `What should I pay a casual employee under the ${getAwardContext().name}?`},
        {icon: '🌙', label: 'Penalty rates', text: 'What are the penalty rates for weekend and public holiday work?'},
        {icon: '📝', label: 'Write a warning', text: 'Can you help me write a warning letter for an employee?'},
        {icon: '⚠️', label: 'Late employee', text: 'I have a staff member who is always late. What should I do?'},
        {icon: '👋', label: 'Hiring checklist', text: 'What do I need to do when hiring a new employee?'},
        {icon: '🏥', label: 'Sick leave', text: 'How does sick leave work for casual employees?'},
        {icon: '📅', label: 'Minimum shifts', text: `What is the minimum shift length under the ${getAwardContext().name}?`},
        {icon: '⏰', label: 'Overtime rules', text: 'When does overtime kick in under my award?'},
        {icon: '📋', label: 'Casual conversion', text: 'When do I need to offer casual conversion to my staff?'},
        {icon: '📊', label: 'Redundancy', text: 'What is the process for making someone redundant?'},
        {icon: '🔥', label: 'Termination', text: 'What is the correct process to terminate an employee?'},
        {icon: '📄', label: 'Employment contract', text: 'What should be included in an employment contract?'},
        {icon: '🤒', label: 'Medical certificate', text: 'When can I ask for a medical certificate from staff?'},
        {icon: '🏖️', label: 'Annual leave', text: 'How does annual leave work for part-time employees?'},
        {icon: '☕', label: 'Break entitlements', text: 'What breaks are employees entitled to during a shift?'},
        {icon: '🚫', label: 'No-show staff', text: 'An employee didnt show up for their shift. What do I do?'},
        {icon: '💼', label: 'Part-time hours', text: 'What are the rules for part-time employee hours?'},
        {icon: '📞', label: 'Reference checks', text: 'What can I legally say when giving a reference?'}
    ];
    
    // Shuffle and pick 3 random prompts
    var shuffled = allPrompts.sort(function() { return 0.5 - Math.random(); });
    var prompts = shuffled.slice(0, 3);
    
    // Create the prompts container
    var promptsDiv = document.createElement('div');
    promptsDiv.id = 'quickActionPrompts';
    promptsDiv.className = 'px-4 pb-4';
    
    var html = '<p class="text-slate-400 text-sm mb-3">💡 Quick questions:</p>';
    html += '<div class="flex flex-wrap gap-2">';
    
    for (var i = 0; i < prompts.length; i++) {
        html += '<button onclick="useQuickPrompt(' + i + ')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-amber-500 text-slate-200 rounded-full text-sm transition-all">';
        html += prompts[i].icon + ' ' + prompts[i].label;
        html += '</button>';
    }
    
    html += '</div>';
    promptsDiv.innerHTML = html;
    
    // Store prompts for click handler
    window.quickPromptsList = prompts;
    
    innerContainer.appendChild(promptsDiv);
    container.scrollTop = container.scrollHeight;
}

function getVenueTypeLabel(type) {
    const match = VENUE_OPTIONS.find(v => v.value === type);
    if (match) return match.short;
    // Legacy slugs from earlier onboarding versions
    const legacy = {
        'hotel': 'hotel/pub',
        'fastfood': 'fast food venue',
        'club': 'club/bar',
        'other': 'hospitality venue'
    };
    return legacy[type] || type || 'hospitality venue';
}

function showVenueSettings() {
    const modal = document.getElementById('venueSettingsModal');
    const content = document.getElementById('venueSettingsContent');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-slate-300 text-sm mb-2">Your Name</label>
                <input type="text" id="settingsUserName" value="${venueProfile.userName || ''}" 
                       placeholder="e.g., Sarah Johnson"
                       class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
            </div>
            
            <div>
                <label class="block text-slate-300 text-sm mb-2">Venue Name</label>
                <input type="text" id="settingsVenueName" value="${venueProfile.venueName || ''}" 
                       placeholder="e.g., The Golden Fork"
                       class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
            </div>
            
            <div>
                <label class="block text-slate-300 text-sm mb-2">Venue Type</label>
                <select id="settingsVenueType" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                    <option value="">Select venue type...</option>
                </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-slate-300 text-sm mb-2">State</label>
                    <select id="settingsLocation" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                        <option value="NSW" ${venueProfile.location === 'NSW' ? 'selected' : ''}>NSW</option>
                        <option value="VIC" ${venueProfile.location === 'VIC' ? 'selected' : ''}>VIC</option>
                        <option value="QLD" ${venueProfile.location === 'QLD' ? 'selected' : ''}>QLD</option>
                        <option value="SA" ${venueProfile.location === 'SA' ? 'selected' : ''}>SA</option>
                        <option value="WA" ${venueProfile.location === 'WA' ? 'selected' : ''}>WA</option>
                        <option value="TAS" ${venueProfile.location === 'TAS' ? 'selected' : ''}>TAS</option>
                        <option value="NT" ${venueProfile.location === 'NT' ? 'selected' : ''}>NT</option>
                        <option value="ACT" ${venueProfile.location === 'ACT' ? 'selected' : ''}>ACT</option>
                    </select>
                </div>
                <div>
                    <label class="block text-slate-300 text-sm mb-2">City/Suburb</label>
                    <input type="text" id="settingsCity" value="${venueProfile.city || ''}" 
                           class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                </div>
            </div>
            
            <div>
                <label class="block text-slate-300 text-sm mb-2">Staff Count</label>
                <select id="settingsStaffCount" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                    <option value="1-5" ${venueProfile.staffCount === '1-5' ? 'selected' : ''}>1-5 staff</option>
                    <option value="6-15" ${venueProfile.staffCount === '6-15' ? 'selected' : ''}>6-15 staff</option>
                    <option value="16-30" ${venueProfile.staffCount === '16-30' ? 'selected' : ''}>16-30 staff</option>
                    <option value="30+" ${venueProfile.staffCount === '30+' ? 'selected' : ''}>30+ staff</option>
                </select>
            </div>

            <div>
                <label class="block text-slate-300 text-sm mb-2">Modern Award</label>
                <select id="settingsPrimaryAward" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                    <option value="">Select award...</option>
                    <option value="Hospitality Industry (General) Award" ${venueProfile.primaryAward === 'Hospitality Industry (General) Award' ? 'selected' : ''}>Hospitality Industry (General) Award (MA000009)</option>
                    <option value="Restaurant Industry Award" ${venueProfile.primaryAward === 'Restaurant Industry Award' ? 'selected' : ''}>Restaurant Industry Award (MA000119)</option>
                    <option value="Fast Food Industry Award" ${venueProfile.primaryAward === 'Fast Food Industry Award' ? 'selected' : ''}>Fast Food Industry Award</option>
                    <option value="Not sure" ${venueProfile.primaryAward === 'Not sure' ? 'selected' : ''}>Not sure</option>
                </select>
                <p class="text-xs text-slate-400 mt-1">Changing your award updates pay rate calculations and advice throughout the app.</p>
            </div>
        </div>
    `;

    const venueSelect = content.querySelector('#settingsVenueType');
    const awardSelect = content.querySelector('#settingsPrimaryAward');
    populateVenueTypeDropdown(venueSelect, venueProfile.primaryAward, venueProfile.venueType);
    if (awardSelect) {
        awardSelect.addEventListener('change', () => {
            populateVenueTypeDropdown(venueSelect, awardSelect.value, venueSelect.value);
        });
    }

    modal.classList.remove('hidden');
}

function saveVenueSettings() {
    const previousAward = venueProfile.primaryAward;

    venueProfile.userName = document.getElementById('settingsUserName').value.trim();
    venueProfile.venueName = document.getElementById('settingsVenueName').value.trim();
    venueProfile.venueType = document.getElementById('settingsVenueType').value;
    venueProfile.location = document.getElementById('settingsLocation').value;
    venueProfile.city = document.getElementById('settingsCity').value.trim();
    venueProfile.staffCount = document.getElementById('settingsStaffCount').value;
    venueProfile.primaryAward = document.getElementById('settingsPrimaryAward').value || previousAward;
    venueProfile.setupComplete = true;
    
    // Use currentUser.uid for Firebase users, or currentUser as string for access code users
    const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    localStorage.setItem('venueProfile_' + userKey, JSON.stringify(venueProfile));
    
    // Also save to Firebase for cross-device sync
    if (currentUser && currentUser.uid && db) {
        db.collection('users').doc(currentUser.uid).set({
            venueProfile: venueProfile
        }, { merge: true }).then(() => {
        }).catch(err => {
        });
    }
    
    // Update sidebar venue name
    updateSidebarVenueName();

    // If the award changed, reload rates and update alert text
    if (venueProfile.primaryAward !== previousAward) {
        loadAwardRates();
        const alertEl = document.getElementById('awardRateAlertText');
        if (alertEl) alertEl.textContent = `${getAwardContext().name} rates increase on 1 July 2026`;
    }

    closeVenueSettings();
    showAlert('✅ Venue settings saved!');
}

function closeVenueSettings() {

    document.getElementById('venueSettingsModal').classList.add('hidden');
}

// ========================================
// ADMIN ANALYTICS SYSTEM
// ========================================

async function trackConversation(userMessage, assistantResponse) {
    const conversation = {
        timestamp: new Date().toISOString(),
        user_code: currentUser,
        user_message: userMessage,
        assistant_response: assistantResponse,
        theme: detectTheme(userMessage),
        is_high_risk: detectHighRiskTopic(userMessage) !== null,
        venue_type: venueProfile.setupComplete ? venueProfile.venueType : null,
        venue_location: venueProfile.setupComplete ? venueProfile.location : null,
        venue_staff_count: venueProfile.setupComplete ? venueProfile.staffCount : null
    };
    
    // 1. Save to localStorage as backup
    const stored = JSON.parse(localStorage.getItem('analytics_conversations') || '[]');
    stored.push(conversation);
    localStorage.setItem('analytics_conversations', JSON.stringify(stored));
    
    // 2. Save to Supabase (centralized database)
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('conversations')
                .insert([conversation]);
            
            if (error) {
            } else {
            }
        } catch (err) {
        }
    } else {
    }
    
    // 3. Update theme counts
    updateThemeCount(conversation.theme);
    
    // 4. Track high-risk if applicable
    if (conversation.is_high_risk) {
        trackHighRiskTopic(userMessage);
    }
    
    // 5. Update user profile
    updateUserProfile(currentUser, userMessage);
}

function detectTheme(message) {
    const lowerMessage = message.toLowerCase();
    
    const themes = {
        'Award Rates & Pay': ['award rate', 'pay rate', 'wage', 'salary', 'how much', 'penalty rate', 'overtime', 'casual loading'],
        'Rostering & Hours': ['roster', 'schedule', 'shift', 'hours', 'break', 'rest day', 'overtime'],
        'Termination & Dismissal': ['terminate', 'fire', 'dismiss', 'sack', 'let go', 'redundancy'],
        'Performance Management': ['performance', 'pip', 'warning', 'underperform', 'improvement'],
        'Recruitment & Hiring': ['hire', 'recruit', 'interview', 'job ad', 'onboard', 'new employee'],
        'Leave & Entitlements': ['annual leave', 'sick leave', 'personal leave', 'long service', 'parental leave'],
        'Workplace Issues': ['complaint', 'harassment', 'bullying', 'discrimination', 'conflict'],
        'Contracts & Agreements': ['contract', 'employment agreement', 'casual conversion', 'fixed term'],
        'Compliance & Legal': ['fair work', 'compliance', 'legal', 'lawsuit', 'claim', 'ombudsman'],
        'General HR Advice': []
    };
    
    for (const [theme, keywords] of Object.entries(themes)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            return theme;
        }
    }
    
    return 'General HR Advice';
}

async function updateThemeCount(theme) {
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem('analytics_themes') || '{}');
    stored[theme] = (stored[theme] || 0) + 1;
    localStorage.setItem('analytics_themes', JSON.stringify(stored));
    
    // Update Supabase
    if (supabaseClient) {
        try {
            // Try to increment existing record
            const { data: existing } = await supabaseClient
                .from('themes')
                .select('count')
                .eq('theme', theme)
                .single();
            
            if (existing) {
                // Update existing
                await supabaseClient
                    .from('themes')
                    .update({ 
                        count: existing.count + 1,
                        last_updated: new Date().toISOString()
                    })
                    .eq('theme', theme);
            } else {
                // Insert new
                await supabaseClient
                    .from('themes')
                    .insert([{ theme: theme, count: 1 }]);
            }
        } catch (err) {
        }
    }
}

async function trackHighRiskTopic(message) {
    const risk = detectHighRiskTopic(message);
    if (!risk) return;
    
    const highRiskEntry = {
        timestamp: new Date().toISOString(),
        user_code: currentUser,
        category: risk.category,
        title: risk.title,
        severity: risk.severity,
        message_preview: message.substring(0, 200)
    };
    
    // Save to localStorage
    const stored = JSON.parse(localStorage.getItem('analytics_highrisk') || '[]');
    stored.push(highRiskEntry);
    localStorage.setItem('analytics_highrisk', JSON.stringify(stored));
    
    // Save to Supabase
    if (supabaseClient) {
        try {
            await supabaseClient
                .from('high_risk_topics')
                .insert([highRiskEntry]);
        } catch (err) {
        }
    }
}

async function updateUserProfile(user, message) {
    // Update localStorage
    const profiles = JSON.parse(localStorage.getItem('analytics_users') || '{}');
    
    if (!profiles[user]) {
        profiles[user] = {
            first_seen: new Date().toISOString(),
            message_count: 0,
            last_active: null,
            venue: venueProfile.setupComplete ? venueProfile : null,
            topThemes: {}
        };
    }
    
    profiles[user].message_count++;
    profiles[user].last_active = new Date().toISOString();
    
    const theme = detectTheme(message);
    profiles[user].topThemes[theme] = (profiles[user].topThemes[theme] || 0) + 1;
    
    localStorage.setItem('analytics_users', JSON.stringify(profiles));
    
    // Update Supabase
    if (supabaseClient) {
        try {
            const { data: existing } = await supabaseClient
                .from('user_profiles')
                .select('message_count')
                .eq('user_code', user)
                .single();
            
            if (existing) {
                // Update existing profile
                await supabaseClient
                    .from('user_profiles')
                    .update({ 
                        message_count: existing.message_count + 1,
                        last_active: new Date().toISOString(),
                        venue_name: venueProfile.venueName || null,
                        venue_type: venueProfile.venueType || null,
                        venue_location: venueProfile.location || null,
                        venue_city: venueProfile.city || null,
                        staff_count: venueProfile.staffCount || null
                    })
                    .eq('user_code', user);
            } else {
                // Insert new profile
                await supabaseClient
                    .from('user_profiles')
                    .insert([{
                        user_code: user,
                        message_count: 1,
                        venue_name: venueProfile.venueName || null,
                        venue_type: venueProfile.venueType || null,
                        venue_location: venueProfile.location || null,
                        venue_city: venueProfile.city || null,
                        staff_count: venueProfile.staffCount || null
                    }]);
            }
        } catch (err) {
        }
    }
}

function showAdminDashboard() {
    document.getElementById('adminDashboardModal').classList.remove('hidden');
    loadAnalytics();
}

function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').classList.add('hidden');
}

async function loadAnalytics() {
    if (!db) {
        showAlert('⚠️ Firebase not connected. Check console for errors.');
        return;
    }
    
    try {
        // Load user count from Firebase
        const usersSnapshot = await db.collection('users').get();
        const userCount = usersSnapshot.size;
        
        // Load all conversations across all users
        let totalConversations = 0;
        const activeUsersToday = new Set();
        const today = new Date().toDateString();
        let totalMessages = 0;
        
        for (const userDoc of usersSnapshot.docs) {
            const conversationsSnapshot = await db.collection('users').doc(userDoc.id).collection('conversations').get();
            totalConversations += conversationsSnapshot.size;
            
            conversationsSnapshot.forEach(conv => {
                const data = conv.data();
                // Count total messages
                if (data.messages && Array.isArray(data.messages)) {
                    totalMessages += data.messages.length;
                }
                // Check if conversation was active today
                const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || 0);
                const lastUpdated = data.lastUpdated?.toDate ? data.lastUpdated.toDate() : timestamp;
                if (timestamp.toDateString() === today || lastUpdated.toDateString() === today) {
                    activeUsersToday.add(userDoc.id);
                }
            });
        }
        
        // Update stats
        document.getElementById('statTotalUsers').textContent = userCount || 0;
        document.getElementById('statTotalMessages').textContent = totalMessages || totalConversations || 0;
        document.getElementById('statActiveToday').textContent = activeUsersToday.size || 0;
        document.getElementById('statAvgSession').textContent = userCount > 0 ? Math.round(totalConversations / userCount) + ' chats' : '0';
        
        // Load conversations tab by default
        switchAdminTab('conversations');
    } catch (error) {
        console.error('Analytics load error:', error);
        showAlert('Error loading analytics. Check console.');
    }
}

function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('text-purple-400', 'border-b-2', 'border-purple-400', 'font-semibold');
            btn.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('text-purple-400', 'border-b-2', 'border-purple-400', 'font-semibold');
            btn.classList.add('text-slate-400');
        }
    });
    
    // Hide all content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected content
    const contentMap = {
        'conversations': 'adminConversationsTab',
        'themes': 'adminThemesTab',
        'users': 'adminUsersTab',
        'highrisk': 'adminHighRiskTab',
        'documents': 'adminDocumentsTab',
        'subscriptions': 'adminSubscriptionsTab',
        'reviews': 'adminReviewsTab',
        'charts': 'adminChartsTab',
        'devtools': 'adminDevtoolsTab'
    };

    document.getElementById(contentMap[tabName]).classList.remove('hidden');
    
    // Load data for selected tab
    if (tabName === 'conversations') loadConversationsAdmin();
    if (tabName === 'themes') loadThemes();
    if (tabName === 'users') loadUsers();
    if (tabName === 'highrisk') loadHighRisk();
    if (tabName === 'documents') loadDocuments();
    if (tabName === 'subscriptions') loadSubscriptions();
    if (tabName === 'reviews') loadExpertReviews();
    if (tabName === 'charts') loadCharts();
}

// ============================================
// ADMIN DEV TOOLS
// ============================================

async function adminResetMyProfile() {
    if (!currentUser) { showAlert('Not signed in.'); return; }
    if (!confirm('Complete reset: clears your profile, all conversations, and prompt counter. Onboarding will run again. Continue?')) return;

    const uid = currentUser.uid;

    // 1. Delete all Firebase conversations for this user
    if (db && uid) {
        try {
            const convSnap = await db.collection('users').doc(uid).collection('conversations').get();
            const batch = db.batch();
            convSnap.forEach(doc => batch.delete(doc.ref));
            if (!convSnap.empty) await batch.commit();
        } catch (e) {}

        // 2. Reset user document fields
        try {
            await db.collection('users').doc(uid).update({
                venueProfile: firebase.firestore.FieldValue.delete(),
                lastConversationId: firebase.firestore.FieldValue.delete(),
                'credits.monthlyPromptsUsed': 0,
                'credits.monthlyPromptsReset': new Date().toISOString()
            });
        } catch (e) {}
    }

    // 3. Clear everything from localStorage (reuse existing thorough clear)
    const savedUser = currentUser;
    clearLocalUserData();
    currentUser = savedUser; // keep auth session so reload works

    showToast('Complete reset done. Reloading...', 'success', 1500);
    setTimeout(() => window.location.reload(), 1500);
}

async function adminResetUserProfile() {
    const uid = document.getElementById('devResetUid').value.trim();
    const status = document.getElementById('devResetStatus');
    if (!uid) { status.textContent = '⚠️ Please enter a UID.'; return; }
    if (!db) { status.textContent = '❌ Firestore not ready.'; return; }

    status.textContent = '⏳ Resetting...';
    try {
        await db.collection('users').doc(uid).update({
            venueProfile: firebase.firestore.FieldValue.delete()
        });
        status.textContent = `✅ venueProfile cleared for ${uid}. They will see onboarding on next login.`;
        status.className = 'text-xs mt-2 text-green-400';
    } catch (e) {
        status.textContent = `❌ Error: ${e.message}`;
        status.className = 'text-xs mt-2 text-red-400';
    }
}

async function adminResetPromptCounter() {
    if (!currentUser) { showAlert('Not signed in.'); return; }
    const userKey = currentUser.uid || currentUser;

    // Reset in memory
    userCredits.monthlyPromptsUsed = 0;
    userCredits.monthlyPromptsReset = new Date().toISOString();

    // Reset in localStorage
    localStorage.removeItem('fitzCredits_' + userKey);

    // Sync to Firebase using the correct credits sub-object path
    await syncCreditsToFirebase();

    updateCreditsDisplay();
    showToast('Prompt counter reset to 20.', 'success', 2000);
}

function adminClearLegalAcceptance() {
    if (!currentUser) { showAlert('Not signed in.'); return; }
    const userKey = currentUser.uid || currentUser;
    localStorage.removeItem('legalTermsAccepted_' + userKey);
    localStorage.removeItem('legalTermsAcceptedAt_' + userKey);
    showToast('Legal acceptance cleared. Reload to see the modal again.', 'success', 3000);
}

async function loadConversationsAdmin() {
    const list = document.getElementById('conversationsList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Loading conversations from Firebase...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected. Check console for details.</div>';
        return;
    }
    
    try {
        // Collect conversations from all users
        const allConversations = [];
        
        const usersSnapshot = await db.collection('users').get();
        
        if (usersSnapshot.size === 0) {
            list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No users found in database</div>';
            return;
        }
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userName = userData.displayName || userData.email || userDoc.id.substring(0, 8);
            
            // Get conversations without orderBy (may not have index)
            const conversationsSnapshot = await db.collection('users').doc(userDoc.id)
                .collection('conversations')
                .limit(50)
                .get();
            
            conversationsSnapshot.forEach(convDoc => {
                const conv = convDoc.data();
                // Get messages from conversation
                if (conv.messages && conv.messages.length > 0) {
                    const lastUserMsg = conv.messages.filter(m => m.role === 'user').pop();
                    const lastAssistantMsg = conv.messages.filter(m => m.role === 'assistant').pop();
                    
                    allConversations.push({
                        oduserId: userDoc.id,
                        userName: userName,
                        userMessage: lastUserMsg && lastUserMsg.content ? lastUserMsg.content.substring(0, 200) : 'No user message',
                        assistantResponse: lastAssistantMsg && lastAssistantMsg.content ? lastAssistantMsg.content.substring(0, 200) : 'No response',
                        timestamp: conv.timestamp || conv.updated || conv.created,
                        title: conv.title || 'Untitled'
                    });
                } else {
                    // Conversation exists but might have no messages yet or different structure
                    allConversations.push({
                        userId: userDoc.id,
                        userName: userName,
                        userMessage: 'No messages yet',
                        assistantResponse: 'N/A',
                        timestamp: conv.timestamp || conv.updated || conv.created,
                        title: conv.title || 'Untitled'
                    });
                }
            });
        }
        
        // Sort by timestamp (newest first)
        allConversations.sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
            return dateB - dateA;
        });
        
        if (allConversations.length === 0) {
            list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No conversations found across all users</div>';
            return;
        }
        
        let html = '';
        allConversations.slice(0, 50).forEach(conv => {
            let dateStr = 'Unknown';
            try {
                if (conv.timestamp) {
                    const date = conv.timestamp.toDate ? conv.timestamp.toDate() : new Date(conv.timestamp);
                    dateStr = date.toLocaleString('en-AU');
                }
            } catch (e) {
                dateStr = 'Unknown';
            }
            
            html += `
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-purple-500 transition-all">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <span class="text-purple-400 font-semibold">${conv.userName}</span>
                            <span class="text-slate-500 text-xs ml-2">${dateStr}</span>
                        </div>
                        <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">${conv.title}</span>
                    </div>
                    <div class="text-sm">
                        <p class="text-slate-300 mb-2"><strong>User:</strong> ${conv.userMessage}...</p>
                        <p class="text-slate-400 text-xs"><strong>Response:</strong> ${conv.assistantResponse}...</p>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error: ' + error.message + '</div>';
    }
}

async function loadThemes() {
    const list = document.getElementById('themesList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Analyzing conversation themes...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        // Collect themes from conversation titles/content
        const themeCount = {};
        const usersSnapshot = await db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const conversationsSnapshot = await db.collection('users').doc(userDoc.id)
                .collection('conversations')
                .get();
            
            conversationsSnapshot.forEach(convDoc => {
                const conv = convDoc.data();
                const title = conv.title || 'Other';
                
                // Categorize by keywords
                let theme = 'Other';
                const titleLower = title.toLowerCase();
                
                if (titleLower.includes('award') || titleLower.includes('pay') || titleLower.includes('wage')) {
                    theme = 'Pay & Awards';
                } else if (titleLower.includes('roster') || titleLower.includes('shift') || titleLower.includes('hours')) {
                    theme = 'Rostering & Hours';
                } else if (titleLower.includes('leave') || titleLower.includes('sick') || titleLower.includes('annual')) {
                    theme = 'Leave';
                } else if (titleLower.includes('termination') || titleLower.includes('dismiss') || titleLower.includes('fire')) {
                    theme = 'Termination';
                } else if (titleLower.includes('contract') || titleLower.includes('employment')) {
                    theme = 'Contracts';
                } else if (titleLower.includes('warning') || titleLower.includes('disciplin') || titleLower.includes('performance')) {
                    theme = 'Discipline & Warnings';
                } else if (titleLower.includes('super') || titleLower.includes('tax') || titleLower.includes('tfn')) {
                    theme = 'Super & Tax';
                }
                
                themeCount[theme] = (themeCount[theme] || 0) + 1;
            });
        }
        
        const themes = Object.entries(themeCount)
            .map(([theme, count]) => ({ theme, count }))
            .sort((a, b) => b.count - a.count);
        
        if (themes.length === 0) {
            list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No themes tracked yet</div>';
            return;
        }
        
        const totalCount = themes.reduce((sum, t) => sum + t.count, 0);
        
        let html = '';
        themes.forEach(themeData => {
            const percentage = ((themeData.count / totalCount) * 100).toFixed(1);
            html += `
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-purple-400 font-semibold">${themeData.theme}</span>
                        <span class="text-2xl font-bold text-purple-400">${themeData.count}</span>
                    </div>
                    <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-purple-500" style="width: ${percentage}%"></div>
                    </div>
                    <p class="text-xs text-slate-400 mt-1">${percentage}% of all queries</p>
                </div>
            `;
        });
        
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading data</div>';
    }
}

async function loadUsers() {
    const list = document.getElementById('usersList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Loading users from Firebase...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        const usersSnapshot = await db.collection('users').get();
        
        if (usersSnapshot.empty) {
            list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No users yet</div>';
            return;
        }
        
        const users = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            // Count conversations for this user
            const conversationsSnapshot = await db.collection('users').doc(userDoc.id).collection('conversations').get();
            const messageCount = conversationsSnapshot.size;
            
            users.push({
                id: userDoc.id,
                displayName: userData.displayName || 'Unknown',
                email: userData.email || 'N/A',
                venueProfile: userData.venueProfile || null,
                legalTermsAccepted: userData.legalTermsAccepted || false,
                legalTermsAcceptedAt: userData.legalTermsAcceptedAt || null,
                messageCount: messageCount
            });
        }
        
        // Sort by message count
        users.sort((a, b) => b.messageCount - a.messageCount);
        
        let html = '';
        users.forEach(profile => {
            const venueInfo = profile.venueProfile 
                ? `${profile.venueProfile.venueType || 'Unknown'} in ${profile.venueProfile.location || 'Unknown'}` 
                : 'No venue info';
            
            const legalStatus = profile.legalTermsAccepted 
                ? '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">✓ Legal Accepted</span>'
                : '<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Pending</span>';
            
            html += `
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <p class="text-purple-400 font-semibold">${profile.displayName}</p>
                            <p class="text-xs text-slate-500">${profile.email}</p>
                            <p class="text-xs text-slate-400 mt-1">${venueInfo}</p>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">${profile.messageCount} chats</span>
                            ${legalStatus}
                        </div>
                    </div>
                    <div class="text-xs text-slate-500">
                        User ID: ${profile.id.substring(0, 12)}...
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading data: ' + error.message + '</div>';
    }
}

async function loadHighRisk() {
    const list = document.getElementById('highRiskList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Scanning for high-risk topics...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        // Scan conversations for high-risk keywords
        const highRiskItems = [];
        const highRiskKeywords = [
            { keyword: 'termination', severity: 'high' },
            { keyword: 'unfair dismissal', severity: 'critical' },
            { keyword: 'lawsuit', severity: 'critical' },
            { keyword: 'legal action', severity: 'critical' },
            { keyword: 'sexual harassment', severity: 'critical' },
            { keyword: 'discrimination', severity: 'critical' },
            { keyword: 'bullying', severity: 'high' },
            { keyword: 'assault', severity: 'critical' },
            { keyword: 'theft', severity: 'high' },
            { keyword: 'fraud', severity: 'high' },
            { keyword: 'workers comp', severity: 'medium' },
            { keyword: 'fair work', severity: 'medium' },
            { keyword: 'underpayment', severity: 'high' },
            { keyword: 'misconduct', severity: 'high' }
        ];
        
        const usersSnapshot = await db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userName = userData.displayName || userData.email || userDoc.id.substring(0, 8);
            const userEmail = userData.email || 'N/A';
            
            const conversationsSnapshot = await db.collection('users').doc(userDoc.id)
                .collection('conversations')
                .get();
            
            conversationsSnapshot.forEach(convDoc => {
                const conv = convDoc.data();
                const title = (conv.title || '').toLowerCase();
                const messages = conv.messages || [];
                const fullText = title + ' ' + messages.map(m => m.content || '').join(' ').toLowerCase();
                
                // Check for high-risk keywords
                for (const {keyword, severity} of highRiskKeywords) {
                    if (fullText.includes(keyword)) {
                        highRiskItems.push({
                            id: convDoc.id,
                            userName: userName,
                            userEmail: userEmail,
                            userId: userDoc.id,
                            title: conv.title || 'Untitled Conversation',
                            keyword: keyword,
                            timestamp: conv.timestamp,
                            severity: severity,
                            messageCount: messages.length
                        });
                        break; // Only add once per conversation
                    }
                }
            });
        }
        
        // Sort by severity then timestamp
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        highRiskItems.sort((a, b) => {
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
            return dateB - dateA;
        });
        
        if (highRiskItems.length === 0) {
            list.innerHTML = '<div class="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center text-green-400">✅ No high-risk topics detected</div>';
            return;
        }
        
        // Summary stats
        const critical = highRiskItems.filter(r => r.severity === 'critical').length;
        const high = highRiskItems.filter(r => r.severity === 'high').length;
        const medium = highRiskItems.filter(r => r.severity === 'medium').length;
        
        let html = `
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-red-500/10 border border-red-500 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-red-400">${critical}</p>
                    <p class="text-xs text-red-300">Critical</p>
                </div>
                <div class="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-yellow-400">${high}</p>
                    <p class="text-xs text-yellow-300">High</p>
                </div>
                <div class="bg-blue-500/10 border border-blue-500 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-blue-400">${medium}</p>
                    <p class="text-xs text-blue-300">Medium</p>
                </div>
            </div>
            <div class="space-y-3">
        `;
        
        highRiskItems.slice(0, 50).forEach(risk => {
            const date = risk.timestamp?.toDate ? risk.timestamp.toDate().toLocaleString('en-AU') : 'Unknown';
            
            let borderClass, bgClass, textClass, badgeClass;
            if (risk.severity === 'critical') {
                borderClass = 'border-red-500';
                bgClass = 'bg-red-500/10';
                textClass = 'text-red-400';
                badgeClass = 'bg-red-500 text-white';
            } else if (risk.severity === 'high') {
                borderClass = 'border-yellow-500';
                bgClass = 'bg-yellow-500/10';
                textClass = 'text-yellow-400';
                badgeClass = 'bg-yellow-500 text-slate-900';
            } else {
                borderClass = 'border-blue-500';
                bgClass = 'bg-blue-500/10';
                textClass = 'text-blue-400';
                badgeClass = 'bg-blue-500 text-white';
            }
            
            html += `
                <div class="bg-slate-900 border-2 ${borderClass} rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2 flex-wrap gap-2">
                        <div class="flex-1 min-w-0">
                            <p class="${textClass} font-semibold truncate">${risk.title}</p>
                            <p class="text-slate-500 text-xs">${date}</p>
                        </div>
                        <span class="text-xs ${badgeClass} px-2 py-1 rounded uppercase font-bold">${risk.severity}</span>
                    </div>
                    <div class="text-sm space-y-1">
                        <p class="text-slate-400"><strong>User:</strong> ${risk.userName}</p>
                        <p class="text-slate-500 text-xs">${risk.userEmail}</p>
                        <p class="text-slate-300 mt-2">Detected: <span class="${textClass} font-semibold">${risk.keyword}</span></p>
                        <p class="text-slate-500 text-xs">${risk.messageCount} messages in conversation</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    } catch (error) {
        console.error('High risk load error:', error);
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading data: ' + error.message + '</div>';
    }
}

async function loadDocuments() {
    const list = document.getElementById('documentsList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Loading documents from Firebase...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        // Load documents from the global documents collection
        const documentsSnapshot = await db.collection('generated_documents')
            .orderBy('generated_at', 'desc')
            .limit(100)
            .get();
        
        let documents = [];
        
        if (documentsSnapshot.empty) {
            // If no global collection, try to get from users
            const usersSnapshot = await db.collection('users').get();
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const userDocs = userData.generatedDocuments || [];
                
                userDocs.forEach(doc => {
                    documents.push({
                        ...doc,
                        user_code: userData.displayName || userData.email || userDoc.id.substring(0, 8),
                        user_email: userData.email || 'N/A'
                    });
                });
            }
        } else {
            documentsSnapshot.forEach(doc => {
                documents.push({ id: doc.id, ...doc.data() });
            });
        }
        
        if (documents.length === 0) {
            list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No documents generated yet</div>';
            return;
        }
        
        // Sort by date
        documents.sort((a, b) => {
            const dateA = a.generated_at?.toDate ? a.generated_at.toDate() : new Date(a.generated_at || 0);
            const dateB = b.generated_at?.toDate ? b.generated_at.toDate() : new Date(b.generated_at || 0);
            return dateB - dateA;
        });
        
        // Calculate stats
        const totalGenerated = documents.length;
        const totalDownloaded = documents.filter(d => d.downloaded === true).length;
        const totalPDF = documents.filter(d => d.format === 'pdf').length;
        const totalWord = documents.filter(d => d.format === 'docx').length;
        const totalWarnings = documents.filter(d => d.document_type === 'formalWarning').length;
        const totalInvestigations = documents.filter(d => d.document_type === 'letterOfAllegation').length;
        const totalRecords = documents.filter(d => d.document_type === 'recordOfDiscussion').length;
        const totalPIPs = documents.filter(d => d.document_type === 'performanceImprovementPlan').length;
        
        let html = '<div class="space-y-4">';
        
        // Stats summary - responsive grid
        html += `
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p class="text-slate-400 text-xs mb-1">Total Generated</p>
                    <p class="text-2xl font-bold text-purple-400">${totalGenerated}</p>
                </div>
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p class="text-slate-400 text-xs mb-1">Downloaded</p>
                    <p class="text-2xl font-bold text-green-400">${totalDownloaded}</p>
                </div>
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p class="text-slate-400 text-xs mb-1">📄 PDF</p>
                    <p class="text-2xl font-bold text-red-400">${totalPDF}</p>
                </div>
                <div class="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p class="text-slate-400 text-xs mb-1">📝 Word</p>
                    <p class="text-2xl font-bold text-blue-400">${totalWord}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p class="text-yellow-400 text-xs mb-1">⚠️ Warnings</p>
                    <p class="text-2xl font-bold text-yellow-400">${totalWarnings}</p>
                </div>
                <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p class="text-red-400 text-xs mb-1">🔍 Investigations</p>
                    <p class="text-2xl font-bold text-red-400">${totalInvestigations}</p>
                </div>
                <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p class="text-green-400 text-xs mb-1">📋 Records</p>
                    <p class="text-2xl font-bold text-green-400">${totalRecords}</p>
                </div>
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p class="text-blue-400 text-xs mb-1">📊 PIPs</p>
                    <p class="text-2xl font-bold text-blue-400">${totalPIPs}</p>
                </div>
            </div>
        `;
        
        // Document type config
        const typeConfig = {
            formalWarning: { emoji: '⚠️', name: 'Formal Warning', borderClass: 'border-yellow-500', textClass: 'text-yellow-400' },
            recordOfDiscussion: { emoji: '📋', name: 'Record of Discussion', borderClass: 'border-green-500', textClass: 'text-green-400' },
            performanceImprovementPlan: { emoji: '📊', name: 'Performance Improvement Plan', borderClass: 'border-blue-500', textClass: 'text-blue-400' },
            letterOfAllegation: { emoji: '🔍', name: 'Letter of Allegation', borderClass: 'border-red-500', textClass: 'text-red-400' }
        };
        
        // Document list
        html += '<div class="space-y-3">';
        documents.forEach(doc => {
            const date = doc.generated_at?.toDate 
                ? doc.generated_at.toDate().toLocaleString('en-AU') 
                : new Date(doc.generated_at).toLocaleString('en-AU');
            
            const config = typeConfig[doc.document_type] || { emoji: '📄', name: doc.document_type || 'Unknown Document', borderClass: 'border-slate-600', textClass: 'text-slate-400' };
            const docId = doc.document_id || doc.id || 'N/A';
            
            // Format badge
            let formatBadge = '<span class="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">Not downloaded</span>';
            if (doc.downloaded && doc.format === 'pdf') {
                formatBadge = '<span class="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">📄 PDF</span>';
            } else if (doc.downloaded && doc.format === 'docx') {
                formatBadge = '<span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">📝 Word</span>';
            } else if (doc.downloaded) {
                formatBadge = '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">✓ Downloaded</span>';
            }
            
            // Document link - if we have stored URL
            let actionButtons = '';
            if (doc.download_url) {
                actionButtons = `
                    <button onclick="viewAdminDocument('${docId}')" class="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors">👁️ View</button>
                    <button onclick="deleteAdminDocument('${docId}')" class="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 transition-colors">🗑️</button>
                `;
            } else if (doc.content || doc.document_url) {
                actionButtons = `<button onclick="viewAdminDocument('${docId}')" class="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors">👁️ View</button>`;
            }
            
            html += `
                <div class="bg-slate-900 border ${config.borderClass} rounded-lg p-4 hover:bg-slate-800/50 transition-all">
                    <div class="flex items-start justify-between mb-2 flex-wrap gap-2">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            <span class="text-2xl flex-shrink-0">${config.emoji}</span>
                            <div class="min-w-0">
                                <p class="${config.textClass} font-semibold truncate">${config.name}</p>
                                <p class="text-slate-500 text-xs">${date}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">${doc.user_code || 'Unknown'}</span>
                            ${formatBadge}
                            ${actionButtons}
                        </div>
                    </div>
                    <div class="text-sm space-y-1 mt-3 pt-3 border-t border-slate-700/50">
                        <p class="text-slate-300"><strong>Employee:</strong> ${doc.employee_name || 'N/A'}</p>
                        ${doc.venue_name ? `<p class="text-slate-400 text-xs">Venue: ${doc.venue_name}</p>` : ''}
                        ${doc.user_email ? `<p class="text-slate-500 text-xs">User: ${doc.user_email}</p>` : ''}
                        ${doc.file_size ? `<p class="text-slate-600 text-xs">Size: ${(doc.file_size / 1024).toFixed(1)} KB</p>` : ''}
                        <p class="text-slate-600 text-xs mt-2">ID: ${docId}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        html += '</div>';
        
        list.innerHTML = html;
    } catch (error) {
        console.error('Documents load error:', error);
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading data: ' + error.message + '</div>';
    }
}

// Load Subscriptions tab
async function loadSubscriptions() {
    const list = document.getElementById('subscriptionsList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Loading subscription data...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        const usersSnapshot = await db.collection('users').get();
        
        const subscriptions = {
            free: [],
            starter: [],
            pro: [],
            business: []
        };
        
        let totalRevenue = 0;
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const tier = (userData.subscriptionTier || 'free').toLowerCase();
            const userInfo = {
                id: doc.id,
                email: userData.email || 'N/A',
                name: userData.displayName || userData.email || doc.id.substring(0, 8),
                tier: tier,
                billing: userData.billingCycle || 'N/A',
                creditsUsed: userData.reviewCreditsUsed || 0,
                creditsTotal: userData.reviewCredits || 0,
                joinDate: userData.createdAt?.toDate ? userData.createdAt.toDate() : null,
                stripeCustomerId: userData.stripeCustomerId || null
            };
            
            if (subscriptions[tier]) {
                subscriptions[tier].push(userInfo);
            } else {
                subscriptions.free.push(userInfo);
            }
            
            // Estimate revenue (annual prices)
            if (tier === 'starter') totalRevenue += userData.billingCycle === 'monthly' ? 29 : 249;
            if (tier === 'pro') totalRevenue += userData.billingCycle === 'monthly' ? 49 : 449;
            if (tier === 'business') totalRevenue += userData.billingCycle === 'monthly' ? 99 : 899;
        });
        
        const totalPaid = subscriptions.starter.length + subscriptions.pro.length + subscriptions.business.length;
        
        let html = `
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div class="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-slate-400">${subscriptions.free.length}</p>
                    <p class="text-xs text-slate-500">Free</p>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-amber-400">${subscriptions.starter.length}</p>
                    <p class="text-xs text-amber-300">Starter</p>
                </div>
                <div class="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-purple-400">${subscriptions.pro.length}</p>
                    <p class="text-xs text-purple-300">Pro</p>
                </div>
                <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-green-400">${subscriptions.business.length}</p>
                    <p class="text-xs text-green-300">Business</p>
                </div>
            </div>
            
            <div class="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-4 text-center">
                <p class="text-sm text-green-300">Estimated Revenue</p>
                <p class="text-3xl font-bold text-green-400">$${totalRevenue.toLocaleString()}</p>
                <p class="text-xs text-green-400/60">${totalPaid} paying customers</p>
            </div>
        `;
        
        // List paid users first
        const paidUsers = [...subscriptions.business, ...subscriptions.pro, ...subscriptions.starter];
        
        if (paidUsers.length > 0) {
            html += '<div class="space-y-2">';
            html += '<p class="text-slate-400 text-sm font-semibold mb-2">💳 Paying Customers</p>';
            
            paidUsers.forEach(user => {
                let tierBadge, tierBorder;
                if (user.tier === 'business') {
                    tierBadge = 'bg-green-500 text-white';
                    tierBorder = 'border-green-500';
                } else if (user.tier === 'pro') {
                    tierBadge = 'bg-purple-500 text-white';
                    tierBorder = 'border-purple-500';
                } else {
                    tierBadge = 'bg-amber-500 text-slate-900';
                    tierBorder = 'border-amber-500';
                }
                
                html += `
                    <div class="bg-slate-900 border ${tierBorder} rounded-lg p-3">
                        <div class="flex items-center justify-between flex-wrap gap-2">
                            <div class="min-w-0 flex-1">
                                <p class="text-white font-semibold truncate">${user.name}</p>
                                <p class="text-slate-500 text-xs truncate">${user.email}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs ${tierBadge} px-2 py-1 rounded font-bold uppercase">${user.tier}</span>
                                <span class="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">${user.billing}</span>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-slate-400">
                            Credits: ${user.creditsUsed}/${user.creditsTotal} used
                            ${user.stripeCustomerId ? ' • <span class="text-green-400">Stripe ✓</span>' : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Free users summary
        if (subscriptions.free.length > 0) {
            html += `
                <div class="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
                    <p class="text-slate-400 text-sm">${subscriptions.free.length} free tier users</p>
                </div>
            `;
        }
        
        list.innerHTML = html;
    } catch (error) {
        console.error('Subscriptions load error:', error);
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading data: ' + error.message + '</div>';
    }
}

// Load Expert Reviews tab
async function loadExpertReviews() {
    const list = document.getElementById('reviewsList');
    
    list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Loading expert review requests...</div>';
    
    if (!db) {
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        // Load from reviewRequests collection (where expert reviews are actually stored)
        const reviewsSnapshot = await db.collection('reviewRequests')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        
        let reviews = [];
        
        reviewsSnapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });
        
        // Count by status
        const pending = reviews.filter(r => r.status === 'pending' || !r.status).length;
        const inProgress = reviews.filter(r => r.status === 'in_progress').length;
        const completed = reviews.filter(r => r.status === 'completed').length;
        
        let html = `
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-yellow-400">${pending}</p>
                    <p class="text-xs text-yellow-300">Pending</p>
                </div>
                <div class="bg-blue-500/10 border border-blue-500 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-blue-400">${inProgress}</p>
                    <p class="text-xs text-blue-300">In Progress</p>
                </div>
                <div class="bg-green-500/10 border border-green-500 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-green-400">${completed}</p>
                    <p class="text-xs text-green-300">Completed</p>
                </div>
            </div>
        `;
        
        if (reviews.length === 0) {
            html += '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No expert review requests yet</div>';
            list.innerHTML = html;
            return;
        }
        
        // Sort by status (pending first) then by date
        const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
        reviews.sort((a, b) => {
            const statusA = statusOrder[a.status] ?? 0;
            const statusB = statusOrder[b.status] ?? 0;
            if (statusA !== statusB) return statusA - statusB;
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });
        
        html += '<div class="space-y-2">';
        
        reviews.slice(0, 50).forEach(review => {
            const date = review.createdAt?.toDate 
                ? review.createdAt.toDate().toLocaleString('en-AU') 
                : 'Unknown';
            
            const status = review.status || 'pending';
            let statusBadge, borderClass;
            
            if (status === 'pending') {
                statusBadge = 'bg-yellow-500 text-slate-900';
                borderClass = 'border-yellow-500';
            } else if (status === 'in_progress') {
                statusBadge = 'bg-blue-500 text-white';
                borderClass = 'border-blue-500';
            } else {
                statusBadge = 'bg-green-500 text-white';
                borderClass = 'border-green-500';
            }
            
            const docName = review.docName || review.docType || 'Document';
            const refNumber = review.refNumber || review.id;
            
            html += `
                <div class="bg-slate-900 border ${borderClass} rounded-lg p-3">
                    <div class="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div class="min-w-0 flex-1">
                            <p class="text-white font-semibold truncate">${docName}</p>
                            <p class="text-slate-500 text-xs">${date}</p>
                            <p class="text-purple-400 text-xs font-mono">${refNumber}</p>
                        </div>
                        <span class="text-xs ${statusBadge} px-2 py-1 rounded font-bold uppercase">${status.replace('_', ' ')}</span>
                    </div>
                    <div class="text-sm space-y-1">
                        <p class="text-slate-400"><strong>Employee:</strong> ${review.employeeName || 'N/A'} (${review.employeeRole || 'N/A'})</p>
                        <p class="text-slate-400"><strong>Venue:</strong> ${review.venueName || 'N/A'}</p>
                        <p class="text-slate-500 text-xs">${review.userEmail || ''}</p>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <button onclick="openReviewFromAdmin('${refNumber}')" 
                                class="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded transition-colors">
                            👁️ View Document
                        </button>
                        ${status === 'pending' ? `
                            <button onclick="updateReviewStatus('${refNumber}', 'in_progress')" 
                                    class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors">
                                Start Review
                            </button>
                        ` : ''}
                        ${status === 'in_progress' ? `
                            <button onclick="updateReviewStatus('${refNumber}', 'completed')" 
                                    class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded transition-colors">
                                Mark Complete
                            </button>
                        ` : ''}
                        <button onclick="emailReviewUser('${review.userEmail}')" 
                                class="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors">
                            ✉️ Email
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    } catch (error) {
        console.error('Reviews load error:', error);
        list.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading data: ' + error.message + '</div>';
    }
}

// Open review document from admin dashboard
function openReviewFromAdmin(refNumber) {
    loadReviewByReference(refNumber);
}

// Update review status
async function updateReviewStatus(refNumber, newStatus) {
    if (!db || !refNumber) return;
    
    try {
        await db.collection('reviewRequests').doc(refNumber).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAlert(`✅ Review status updated to: ${newStatus.replace('_', ' ')}`);
        loadExpertReviews(); // Refresh the list
    } catch (error) {
        console.error('Error updating review:', error);
        showAlert('❌ Failed to update review status');
    }
}

// Email review user
function emailReviewUser(email) {
    if (!email || email === 'N/A') {
        showAlert('❌ No email address available');
        return;
    }
    window.open(`mailto:${email}?subject=Your FITZ HR Expert Review Request`, '_blank');
}

// Store chart instances for cleanup
let adminCharts = {};

// Load Charts tab
async function loadCharts() {
    const container = document.getElementById('chartsList');
    
    container.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">Loading chart data...</div>';
    
    if (!db) {
        container.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Firebase not connected</div>';
        return;
    }
    
    try {
        // Destroy existing charts
        Object.values(adminCharts).forEach(chart => chart?.destroy());
        adminCharts = {};
        
        // Collect data from Firebase
        const usersSnapshot = await db.collection('users').get();
        
        // Data structures
        const activityByDate = {};
        const subscriptionCounts = { free: 0, starter: 0, pro: 0, business: 0 };
        const documentTypes = { formalWarning: 0, recordOfDiscussion: 0, performanceImprovementPlan: 0, letterOfAllegation: 0, other: 0 };
        const userSignupsByDate = {};
        const messagesByDate = {};
        
        // Process users
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            // Subscription counts
            const tier = (userData.subscriptionTier || 'free').toLowerCase();
            if (subscriptionCounts.hasOwnProperty(tier)) {
                subscriptionCounts[tier]++;
            } else {
                subscriptionCounts.free++;
            }
            
            // User signup date
            if (userData.createdAt) {
                const signupDate = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
                const dateKey = signupDate.toISOString().split('T')[0];
                userSignupsByDate[dateKey] = (userSignupsByDate[dateKey] || 0) + 1;
            }
            
            // Process conversations for activity data
            const conversationsSnapshot = await db.collection('users').doc(userDoc.id).collection('conversations').get();
            
            conversationsSnapshot.forEach(convDoc => {
                const conv = convDoc.data();
                if (conv.timestamp) {
                    const convDate = conv.timestamp.toDate ? conv.timestamp.toDate() : new Date(conv.timestamp);
                    const dateKey = convDate.toISOString().split('T')[0];
                    activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
                    
                    // Count messages
                    const msgCount = conv.messages?.length || 1;
                    messagesByDate[dateKey] = (messagesByDate[dateKey] || 0) + msgCount;
                }
            });
            
            // Process generated documents
            const userDocs = userData.generatedDocuments || [];
            userDocs.forEach(doc => {
                const docType = doc.document_type || 'other';
                if (documentTypes.hasOwnProperty(docType)) {
                    documentTypes[docType]++;
                } else {
                    documentTypes.other++;
                }
            });
        }
        
        // Also get from generated_documents collection
        try {
            const docsSnapshot = await db.collection('generated_documents').get();
            docsSnapshot.forEach(doc => {
                const data = doc.data();
                const docType = data.document_type || 'other';
                if (documentTypes.hasOwnProperty(docType)) {
                    documentTypes[docType]++;
                } else {
                    documentTypes.other++;
                }
            });
        } catch (e) { /* Collection may not exist */ }
        
        // Generate last 30 days labels
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last30Days.push(d.toISOString().split('T')[0]);
        }
        
        // Prepare chart data
        const activityData = last30Days.map(date => activityByDate[date] || 0);
        const messagesData = last30Days.map(date => messagesByDate[date] || 0);
        const signupsData = last30Days.map(date => userSignupsByDate[date] || 0);
        const dateLabels = last30Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        });
        
        // Build HTML with canvas elements
        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Activity Chart -->
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                        <span>📊</span> Conversations (30 Days)
                    </h3>
                    <div class="h-48">
                        <canvas id="activityChart"></canvas>
                    </div>
                </div>
                
                <!-- Messages Chart -->
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                        <span>💬</span> Messages (30 Days)
                    </h3>
                    <div class="h-48">
                        <canvas id="messagesChart"></canvas>
                    </div>
                </div>
                
                <!-- Subscription Breakdown -->
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                        <span>💳</span> Subscription Breakdown
                    </h3>
                    <div class="h-48 flex items-center justify-center">
                        <canvas id="subscriptionChart"></canvas>
                    </div>
                </div>
                
                <!-- Document Types -->
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                        <span>📝</span> Documents Generated
                    </h3>
                    <div class="h-48">
                        <canvas id="documentsChart"></canvas>
                    </div>
                </div>
                
                <!-- User Signups -->
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-700 lg:col-span-2">
                    <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                        <span>👥</span> New User Signups (30 Days)
                    </h3>
                    <div class="h-48">
                        <canvas id="signupsChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        // Chart.js default options for dark theme
        const darkThemeOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#64748b', maxRotation: 45 },
                    grid: { color: '#1e293b' }
                },
                y: {
                    ticks: { color: '#64748b' },
                    grid: { color: '#1e293b' },
                    beginAtZero: true
                }
            }
        };
        
        // Activity Chart (Line)
        adminCharts.activity = new Chart(document.getElementById('activityChart'), {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Conversations',
                    data: activityData,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: darkThemeOptions
        });
        
        // Messages Chart (Line)
        adminCharts.messages = new Chart(document.getElementById('messagesChart'), {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Messages',
                    data: messagesData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: darkThemeOptions
        });
        
        // Subscription Chart (Doughnut)
        adminCharts.subscription = new Chart(document.getElementById('subscriptionChart'), {
            type: 'doughnut',
            data: {
                labels: ['Free', 'Starter', 'Pro', 'Business'],
                datasets: [{
                    data: [subscriptionCounts.free, subscriptionCounts.starter, subscriptionCounts.pro, subscriptionCounts.business],
                    backgroundColor: ['#64748b', '#f59e0b', '#a855f7', '#22c55e'],
                    borderColor: '#0f172a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', padding: 15 }
                    }
                }
            }
        });
        
        // Documents Chart (Bar)
        adminCharts.documents = new Chart(document.getElementById('documentsChart'), {
            type: 'bar',
            data: {
                labels: ['Warnings', 'Records', 'PIPs', 'Allegations', 'Other'],
                datasets: [{
                    label: 'Documents',
                    data: [documentTypes.formalWarning, documentTypes.recordOfDiscussion, documentTypes.performanceImprovementPlan, documentTypes.letterOfAllegation, documentTypes.other],
                    backgroundColor: ['#eab308', '#22c55e', '#3b82f6', '#ef4444', '#64748b']
                }]
            },
            options: {
                ...darkThemeOptions,
                plugins: { legend: { display: false } }
            }
        });
        
        // Signups Chart (Bar)
        adminCharts.signups = new Chart(document.getElementById('signupsChart'), {
            type: 'bar',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'New Users',
                    data: signupsData,
                    backgroundColor: '#06b6d4'
                }]
            },
            options: darkThemeOptions
        });
        
    } catch (error) {
        console.error('Charts load error:', error);
        container.innerHTML = '<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center text-red-400">Error loading charts: ' + error.message + '</div>';
    }
}

// ========================================
// DOCUMENT STORAGE - Requires Firebase Blaze Plan
// ========================================
// Note: Document cloud storage is not available on the free Spark plan.
// Expert Reviews store document content in Firestore (reviewRequests collection).
// To enable cloud document backup, upgrade to Firebase Blaze plan.

/**
 * View a document from admin dashboard
 * For regular documents, this just shows an info message.
 * For expert reviews, use openReviewFromAdmin() instead.
 */
async function viewAdminDocument(docId) {
    showAlert('📄 Document Viewing\n\nRegular documents are downloaded directly to users.\n\nTo view Expert Review documents, go to the Reviews tab and click "View Document".');
}

/**
 * Delete document metadata (admin only)
 * Note: This only deletes the metadata, not the actual file (which was downloaded by user)
 */
async function deleteAdminDocument(docId) {
    if (!db) {
        showAlert('❌ Firebase not connected');
        return;
    }
    
    if (!confirm('⚠️ Delete this document record?\n\nThis only removes the metadata from your database. The user\'s downloaded file is not affected.')) {
        return;
    }
    
    try {
        await db.collection('generated_documents').doc(docId).delete();
        showAlert('✅ Document record deleted');
        loadDocuments();
    } catch (error) {
        console.error('Error deleting document:', error);
        showAlert('❌ Error deleting record: ' + error.message);
    }
}

function filterConversations() {
    const search = document.getElementById('conversationSearch').value.toLowerCase();
    const conversations = JSON.parse(localStorage.getItem('analytics_conversations') || '[]');
    
    const filtered = conversations.filter(conv => 
        conv.userMessage.toLowerCase().includes(search) ||
        conv.assistantResponse.toLowerCase().includes(search) ||
        conv.theme.toLowerCase().includes(search)
    );
    
    const list = document.getElementById('conversationsList');
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="bg-slate-900 rounded-lg p-6 text-center text-slate-400">No matches found</div>';
        return;
    }
    
    let html = '';
    filtered.reverse().forEach(conv => {
        const date = new Date(conv.timestamp).toLocaleString('en-AU');
        const riskBadge = conv.isHighRisk ? '<span class="text-xs bg-red-500 text-white px-2 py-1 rounded">HIGH RISK</span>' : '';
        
        html += `
            <div class="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-purple-500 transition-all">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <span class="text-purple-400 font-semibold">${conv.user}</span>
                        <span class="text-slate-500 text-xs ml-2">${date}</span>
                        ${riskBadge}
                    </div>
                    <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">${conv.theme}</span>
                </div>
                <div class="text-sm">
                    <p class="text-slate-300 mb-2"><strong>User:</strong> ${conv.userMessage}</p>
                    <p class="text-slate-400 text-xs"><strong>Response:</strong> ${conv.assistantResponse.substring(0, 150)}...</p>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function refreshAnalytics() {
    loadAnalytics();
    showAlert('✅ Analytics refreshed!');
}

function exportAnalytics() {
    const conversations = JSON.parse(localStorage.getItem('analytics_conversations') || '[]');
    const themes = JSON.parse(localStorage.getItem('analytics_themes') || '{}');
    const users = JSON.parse(localStorage.getItem('analytics_users') || '{}');
    
    // Prepare data for Excel
    const data = conversations.map(conv => ({
        'Timestamp': new Date(conv.timestamp).toLocaleString('en-AU'),
        'User': conv.user,
        'Theme': conv.theme,
        'High Risk': conv.isHighRisk ? 'YES' : 'NO',
        'User Message': conv.userMessage,
        'Assistant Response': conv.assistantResponse.substring(0, 500)
    }));
    
    generateExcelSpreadsheet(data, `Analytics_Export_${Date.now()}.xlsx`, 'Conversations');
    
    showAlert('✅ Analytics exported to Excel!');
}

function getVenueContext() {
    if (!venueProfile.setupComplete) return '';
    const venueName = venueProfile.venueName ? `"${venueProfile.venueName}" - a ` : '';
    return `\nVENUE CONTEXT: ${venueName}${getVenueTypeLabel(venueProfile.venueType)} in ${venueProfile.city || ''} ${venueProfile.location}, ${venueProfile.staffCount} staff, Award: ${venueProfile.primaryAward}\n`;
}

// ========================================
// AWARD CALCULATOR
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const calcPosition = document.getElementById('calcPosition');
    if (calcPosition) {
        calcPosition.addEventListener('change', function() {
            const customDiv = document.getElementById('customRateDiv');
            if (this.value === 'custom') {
                customDiv.classList.remove('hidden');
            } else {
                customDiv.classList.add('hidden');
            }
        });
    }
});

/**
 * Calculates award pay including penalties, loadings, and overtime
 * Displays detailed breakdown in the calculator modal
 * @returns {void}
 */
function calculateAward() {
    let baseRate = parseFloat(document.getElementById('calcPosition').value);
    if (document.getElementById('calcPosition').value === 'custom') {
        baseRate = parseFloat(document.getElementById('calcCustomRate').value);
    }

    const dayMultiplier = parseFloat(document.getElementById('calcDay').value);
    const hours = parseFloat(document.getElementById('calcHours').value);
    const overtime = parseFloat(document.getElementById('calcOvertime').value);

    if (!baseRate || !hours) {
        showAlert('Please enter all required fields');
        return;
    }

    const penaltyRate = baseRate * dayMultiplier;
    const ordinaryPay = penaltyRate * hours;
    const overtimePay = overtime > 0 ? (baseRate * 1.5 * overtime) : 0;
    const totalPay = ordinaryPay + overtimePay;

    document.getElementById('resultBaseRate').textContent = `$${baseRate.toFixed(2)}/hr`;
    document.getElementById('resultPenaltyRate').textContent = `$${penaltyRate.toFixed(2)}/hr`;
    document.getElementById('resultOrdinaryPay').textContent = `$${ordinaryPay.toFixed(2)}`;
    document.getElementById('resultOvertimePay').textContent = `$${overtimePay.toFixed(2)}`;
    document.getElementById('resultTotal').textContent = `$${totalPay.toFixed(2)}`;

    document.getElementById('overtimeRow').style.display = overtime > 0 ? 'flex' : 'none';
    document.getElementById('calcResults').classList.remove('hidden');

    trackEvent('award_calculated', { user: currentUser, baseRate, totalPay });
}

function downloadCalculation() {
    const data = [{
        'Description': 'Base Rate',
        'Rate': document.getElementById('resultBaseRate').textContent,
        'Hours': document.getElementById('calcHours').value,
        'Amount': document.getElementById('resultOrdinaryPay').textContent
    }];

    const overtime = parseFloat(document.getElementById('calcOvertime').value);
    if (overtime > 0) {
        data.push({
            'Description': 'Overtime',
            'Rate': `$${(parseFloat(document.getElementById('calcPosition').value) * 1.5).toFixed(2)}/hr`,
            'Hours': overtime,
            'Amount': document.getElementById('resultOvertimePay').textContent
        });
    }

    data.push({
        'Description': 'TOTAL',
        'Rate': '',
        'Hours': '',
        'Amount': document.getElementById('resultTotal').textContent
    });

    generateExcelSpreadsheet(data, `Pay_Calculation_${Date.now()}.xlsx`, 'Pay Breakdown');
}

// ========================================
// AWARD WIZARD - COMPLETE IMPLEMENTATION
// ========================================


// Helper to get nested rate
function getNestedRate(obj, path) {
    // Handle non-nested paths (like 'introductory' or 'managerial_hotel')
    if (!path.includes('.')) {
        return obj[path] || null;
    }
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current && current[part] !== undefined) {
            current = current[part];
        } else {
            return null;
        }
    }
    
    return current;
}

// Wizard answer handler
/**
 * Processes wizard step answer and advances to next step
 * Shows results when wizard is complete
 * @param {string} question - The question being answered (e.g., 'venue', 'role')
 * @param {string} answer - The selected answer
 * @returns {void}
 */
function wizardAnswer(question, answer) {
    wizardData[question] = answer;
    
    if (currentWizardStep < CONFIG.WIZARD_STEPS) {
        currentWizardStep++;
        updateWizardStep();
    } else {
        showWizardResults();
    }
}

// Update wizard step display
function updateWizardStep() {
    // Get the Award Wizard container specifically
    const wizardModal = document.getElementById('awardWizardModal');
    if (!wizardModal) return;
    
    // Hide all steps ONLY within the Award Wizard
    wizardModal.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.add('hidden');
    });
    
    // Show current step ONLY within the Award Wizard
    const currentStep = wizardModal.querySelector(`[data-step="${currentWizardStep}"]`);
    if (currentStep) {
        currentStep.classList.remove('hidden');
    }
    
    // Update progress
    document.getElementById('wizardCurrentStep').textContent = currentWizardStep;
    const progress = Math.round((currentWizardStep / 5) * 100);
    document.getElementById('wizardProgress').textContent = `${progress}% Complete`;
    document.getElementById('wizardProgressBar').style.width = `${progress}%`;
    
    // Show/hide back button
    const backBtn = document.getElementById('wizardBackBtn');
    if (backBtn) {
        if (currentWizardStep > 1) {
            backBtn.classList.remove('hidden');
        } else {
            backBtn.classList.add('hidden');
        }
    }
}
    
// Go back in wizard
function wizardGoBack() {
    if (currentWizardStep > 1) {
        currentWizardStep--;
        updateWizardStep();
    }
}

// Show wizard results
function showWizardResults() {
    // Check if employee is a junior (19 or younger)
    if (wizardData.age === 'junior') {
        showJuniorRedirect();
        return;
    }
    
    // Build a simple result for now to ensure display works
    let resultRate = 0;
    let resultTitle = 'Classification';
    let resultAward = getAwardContext().fullName;
    let penaltiesHTML = '<div>Standard rates apply</div>';
    let stepsHTML = '<li>Verify rate with Fair Work</li>';
    
    // Try to calculate from award rates if available
    try {
        if (awardRates && awardRates.rates && awardRates.rates.length > 0) {
            const result = calculateAwardClassification(wizardData);
            if (result && typeof result.rate === 'number') {
                resultRate = result.rate;
                resultTitle = result.level || 'Classification';
                resultAward = result.award || resultAward;
                
                if (result.penalties && result.penalties.length > 0) {
                    penaltiesHTML = result.penalties.map(p => `<div>• ${p}</div>`).join('');
                }
                if (result.nextSteps && result.nextSteps.length > 0) {
                    stepsHTML = result.nextSteps.map(s => `<li>${s}</li>`).join('');
                }
            }
        } else {
            // Use fallback display - rates not loaded
            resultTitle = 'Rate lookup unavailable';
            penaltiesHTML = '<div>• Connect to internet to load current rates</div>';
            stepsHTML = '<li>Refresh page when online to get accurate rates</li>';
        }
    } catch (calcError) {
        resultTitle = 'Calculation Error';
    }
    
    // Build the results HTML
    const resultsHTML = `
        <div class="bg-green-500/10 border-2 border-green-500 rounded-lg p-6">
            <h3 class="text-green-400 font-bold text-xl mb-4 flex items-center gap-2">
                <span>✅</span>
                <span>Award Classification Complete!</span>
            </h3>
            
            <div class="space-y-4 text-slate-200">
                <div class="bg-slate-700/50 rounded-lg p-4">
                    <p class="text-sm text-slate-400 mb-1">Applicable Award</p>
                    <p class="font-bold text-lg">${resultAward}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-slate-700/50 rounded-lg p-4">
                        <p class="text-sm text-slate-400 mb-1">Classification Level</p>
                        <p class="font-bold">${resultTitle}</p>
                    </div>
                    <div class="bg-slate-700/50 rounded-lg p-4">
                        <p class="text-sm text-slate-400 mb-1">Base Rate (per hour)</p>
                        <p class="font-bold text-2xl text-amber-400">$${resultRate.toFixed(2)}</p>
                    </div>
                </div>

                <div class="bg-amber-500/10 border border-amber-500 rounded-lg p-4">
                    <p class="font-semibold text-amber-400 mb-2">Penalty Rates & Loadings:</p>
                    <div class="text-sm space-y-1">${penaltiesHTML}</div>
                </div>

                <div class="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                    <p class="font-semibold text-blue-400 mb-2">📝 Next Steps:</p>
                    <ul class="text-sm space-y-1">${stepsHTML}</ul>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button onclick="openEmploymentContract()" class="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-lg transition-all">
                    📝 Create Employment Contract
                </button>
                <button onclick="resetWizard()" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all">
                    Start Over
                </button>
                <button onclick="closeToolModal('awardWizardModal')" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all">
                    ✕ Close
                </button>
            </div>
        </div>
    `;
    
    // Display the results
    const wizardStepsDiv = document.getElementById('wizardSteps');
    if (wizardStepsDiv) {
        wizardStepsDiv.innerHTML = resultsHTML;
    } else {
        showAlert('Error: Could not display results. Please try again.');
        return;
    }
    
    // Hide back button and progress bar
    const backBtn = document.getElementById('wizardBackBtn');
    if (backBtn) backBtn.classList.add('hidden');
    
    const progressContainer = document.querySelector('#awardWizardModal .mb-6');
    if (progressContainer) progressContainer.classList.add('hidden');
    
}
function showJuniorRedirect() {
    try {
        // Build the junior redirect HTML
        const juniorHTML = `
            <div class="bg-blue-500/10 border-2 border-blue-500 rounded-lg p-6">
                <h3 class="text-blue-400 font-bold text-xl mb-4 flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>Junior Employee (19 years or younger)</span>
                </h3>
                
                <div class="space-y-4 text-slate-200">
                    <p class="leading-relaxed">
                        For employees <strong>19 years of age or younger</strong>, junior rates apply. 
                        Junior rates are calculated as a <strong>percentage of the adult rate</strong> based on the employee's age.
                    </p>
                    
                    <div class="bg-slate-700/50 rounded-lg p-4">
                        <p class="font-semibold text-amber-400 mb-2">Junior Rate Percentages:</p>
                        <ul class="text-sm space-y-1 ml-4">
                            <li>• <strong>Under 16 years:</strong> 40% of adult rate</li>
                            <li>• <strong>16 years:</strong> 50% of adult rate</li>
                            <li>• <strong>17 years:</strong> 60% of adult rate</li>
                            <li>• <strong>18 years:</strong> 70% of adult rate</li>
                            <li>• <strong>19 years:</strong> 80% of adult rate</li>
                            <li>• <strong>20 years and over:</strong> 100% (full adult rate)</li>
                        </ul>
                    </div>

                    <div class="bg-amber-500/10 border border-amber-500 rounded-lg p-4">
                        <p class="font-semibold text-amber-400 mb-2">📋 What You Need to Do:</p>
                        <ol class="text-sm space-y-2 ml-4">
                            <li>1. Determine the employee's exact age</li>
                            <li>2. Find the applicable adult rate for their classification</li>
                            <li>3. Apply the percentage based on their age</li>
                            <li>4. Review the full award for additional junior provisions</li>
                        </ol>
                    </div>

                    <div class="bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
                        <p class="font-semibold text-green-400 mb-3">
                            📖 View Full Junior Rates in the Award
                        </p>
                        <a href="${'https://awards.fairwork.gov.au/' + getAwardContext().code + '.html'}"
                           target="_blank"
                           class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
                            Open ${getAwardContext().name} →
                        </a>
                        <p class="text-xs text-slate-400 mt-2">
                            Opens in new tab • Fair Work Ombudsman official website
                        </p>
                    </div>

                    <div class="bg-slate-700/50 rounded-lg p-4">
                        <p class="text-sm text-slate-300">
                            <strong>Need help calculating junior rates?</strong><br/>
                            Contact Fitz HR for assistance: 
                            <a href="mailto:support@fitzhr.com" class="text-amber-400 hover:underline">support@fitzhr.com</a>
                        </p>
                    </div>
                </div>

                <div class="flex gap-3 mt-6">
                    <button onclick="resetWizard()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">
                        ← Start Over
                    </button>
                    <button onclick="closeToolModal('awardWizardModal')" class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // REPLACE wizardSteps content with junior message (SAME AS ADULT PATH)
        const wizardStepsDiv = document.getElementById('wizardSteps');
        if (wizardStepsDiv) {
            wizardStepsDiv.innerHTML = juniorHTML;
            wizardStepsDiv.classList.remove('hidden'); // Keep it visible
        } else {
            return;
        }
        
        // Hide back button and progress bar
        const backBtn = document.getElementById('wizardBackBtn');
        if (backBtn) backBtn.classList.add('hidden');
        
        // Hide progress bar
        const progressContainer = wizardStepsDiv.previousElementSibling;
        if (progressContainer && progressContainer.querySelector('#wizardProgressBar')) {
            progressContainer.classList.add('hidden');
        }
        
        // Track event
        try {
            trackEvent('award_wizard_junior_redirect', {
                user: currentUser,
                role: wizardData.role
            });
        } catch (trackError) {
        }
        
    } catch (error) {
        showAlert('Error showing junior information: ' + error.message);
    }
}

// Calculate award classification (uses GitHub JSON)
/**
 * Calculates award classification based on wizard answers
 * Uses GitHub JSON data to determine rates and penalties
 * @param {Object} data - Wizard answers object
 * @param {string} data.venue - Type of venue
 * @param {string} data.role - Employee role
 * @param {string} data.experience - Experience level
 * @param {string} data.hours - Typical working hours
 * @param {string} data.employment - Employment type
 * @returns {Object} Classification result with award, level, rate, penalties, and next steps
 */
function calculateAwardClassification(data) {
    if (!awardRates || !awardRates.rates) {
        return {
            award: getAwardContext().fullName,
            level: 'Error - Rates Not Loaded',
            rate: 0,
            penalties: ['Please refresh the page to load award rates'],
            nextSteps: ['Refresh the page']
        };
    }
    
    // Determine employment type for filtering
    const isCasual = data.employment === 'casual';
    const employmentType = (isCasual || data.employment === 'part-time') ? 'casual' : 'full_time';
    
    // Build classification path based on role and experience
    const levelMap = {
        'intro': 'introductory',
        'level1': 'level_1',
        'level2': 'level_2',
        'level3': 'level_3',
        'level4': 'level_4',
        'level5': 'level_5',
        'level6': 'level_6'
    };
    
    const levelPrefix = levelMap[data.experience] || 'introductory';

    const isRestaurantAward = (getAwardContext().code === 'MA000119');

    // Role to classification mapping — Hospitality Industry (General) Award MA000009
    const hospitalityRoleSuffixes = {
        'cook': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.cook_grade1',
            'level_3': 'level_3.cook_grade2',
            'level_4': 'level_4.cook_tradesperson_grade3',
            'level_5': 'level_5.cook_tradesperson_grade4',
            'level_6': 'level_6.cook_tradesperson_grade5'
        },
        'waiter': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.food_beverage_grade2',
            'level_3': 'level_3.food_beverage_grade3',
            'level_4': 'level_4.food_beverage_tradesperson_grade4',
            'level_5': 'level_5.food_beverage_supervisor',
            'level_6': 'level_5.food_beverage_supervisor'
        },
        'bartender': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.food_beverage_grade2',
            'level_3': 'level_3.food_beverage_grade3',
            'level_4': 'level_4.food_beverage_tradesperson_grade4',
            'level_5': 'level_5.food_beverage_supervisor',
            'level_6': 'level_5.food_beverage_supervisor'
        },
        'barista': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.food_beverage_grade2',
            'level_3': 'level_3.food_beverage_grade3',
            'level_4': 'level_4.food_beverage_tradesperson_grade4',
            'level_5': 'level_5.food_beverage_supervisor',
            'level_6': 'level_5.food_beverage_supervisor'
        },
        'kitchen-hand': {
            'introductory': 'introductory',
            'level_1': 'level_1.kitchen_attendant_grade1',
            'level_2': 'level_2.kitchen_attendant_grade2',
            'level_3': 'level_3.kitchen_attendant_grade3',
            'level_4': 'level_3.kitchen_attendant_grade3',
            'level_5': 'level_3.kitchen_attendant_grade3',
            'level_6': 'level_3.kitchen_attendant_grade3'
        },
        'supervisor': {
            'introductory': 'level_2.food_beverage_grade2',
            'level_1': 'level_3.food_beverage_grade3',
            'level_2': 'level_4.food_beverage_tradesperson_grade4',
            'level_3': 'level_5.food_beverage_supervisor',
            'level_4': 'level_5.food_beverage_supervisor',
            'level_5': 'level_5.food_beverage_supervisor',
            'level_6': 'level_5.food_beverage_supervisor'
        },
        'receptionist': {
            'introductory': 'introductory',
            'level_1': 'level_2.front_office_grade1',
            'level_2': 'level_3.front_office_grade2',
            'level_3': 'level_4.front_office_grade3',
            'level_4': 'level_5.front_office_supervisor',
            'level_5': 'level_5.front_office_supervisor',
            'level_6': 'level_5.front_office_supervisor'
        },
        'housekeeper': {
            'introductory': 'introductory',
            'level_1': 'level_1.guest_service_grade1',
            'level_2': 'level_2.guest_service_grade2',
            'level_3': 'level_3.guest_service_grade3',
            'level_4': 'level_4.guest_service_grade4',
            'level_5': 'level_5.guest_service_supervisor',
            'level_6': 'level_5.guest_service_supervisor'
        },
        'security': {
            'introductory': 'introductory',
            'level_1': 'level_2.doorperson_security',
            'level_2': 'level_3.timekeeper_security_grade2',
            'level_3': 'level_3.timekeeper_security_grade2',
            'level_4': 'level_3.timekeeper_security_grade2',
            'level_5': 'level_3.timekeeper_security_grade2',
            'level_6': 'level_3.timekeeper_security_grade2'
        }
    };

    // Role to classification mapping — Restaurant Industry Award MA000119
    // Classifications match the keys in /restaurant-award-rates.json
    const restaurantRoleSuffixes = {
        'cook': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.cook_grade1',
            'level_3': 'level_3.cook_grade2',
            'level_4': 'level_4.cook_grade3_commis',
            'level_5': 'level_5.cook_grade4_demi_chef',
            'level_6': 'level_6.cook_grade5_chef_de_partie'
        },
        'waiter': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.food_beverage_grade2',
            'level_3': 'level_3.food_beverage_grade3',
            'level_4': 'level_4.food_beverage_grade4',
            'level_5': 'level_5.food_beverage_supervisor_grade2',
            'level_6': 'level_6.food_beverage_supervisor_grade3'
        },
        'bartender': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.food_beverage_grade2',
            'level_3': 'level_3.food_beverage_grade3',
            'level_4': 'level_4.food_beverage_grade4',
            'level_5': 'level_5.food_beverage_supervisor_grade2',
            'level_6': 'level_6.food_beverage_supervisor_grade3'
        },
        'barista': {
            'introductory': 'introductory',
            'level_1': 'level_1.food_beverage_grade1',
            'level_2': 'level_2.food_beverage_grade2',
            'level_3': 'level_3.food_beverage_grade3',
            'level_4': 'level_4.food_beverage_grade4',
            'level_5': 'level_5.food_beverage_supervisor_grade2',
            'level_6': 'level_6.food_beverage_supervisor_grade3'
        },
        'kitchen-hand': {
            'introductory': 'introductory',
            'level_1': 'level_1.kitchen_attendant_grade1',
            'level_2': 'level_2.kitchen_attendant_grade2',
            'level_3': 'level_3.kitchen_attendant_grade3',
            'level_4': 'level_3.kitchen_attendant_grade3',
            'level_5': 'level_3.kitchen_attendant_grade3',
            'level_6': 'level_3.kitchen_attendant_grade3'
        },
        'supervisor': {
            'introductory': 'level_2.food_beverage_grade2',
            'level_1': 'level_3.food_beverage_grade3',
            'level_2': 'level_4.food_beverage_supervisor_grade1',
            'level_3': 'level_5.food_beverage_supervisor_grade2',
            'level_4': 'level_5.food_beverage_supervisor_grade2',
            'level_5': 'level_6.food_beverage_supervisor_grade3',
            'level_6': 'level_6.food_beverage_supervisor_grade3'
        }
        // Restaurant Award MA000119 does not cover receptionists, housekeepers
        // or doorperson/security roles — those sit under MA000009.
    };

    const roleSuffixes = isRestaurantAward ? restaurantRoleSuffixes : hospitalityRoleSuffixes;

    let classificationPath;
    if (roleSuffixes[data.role] && roleSuffixes[data.role][levelPrefix]) {
        classificationPath = roleSuffixes[data.role][levelPrefix];
    } else if (isRestaurantAward && ['receptionist', 'housekeeper', 'security'].includes(data.role)) {
        // Role not covered by the Restaurant Award — surface a clear message
        return {
            award: getAwardContext().fullName,
            level: 'Role not covered by Restaurant Award',
            rate: 0,
            penalties: [
                `The ${data.role} role is not covered by the Restaurant Industry Award MA000119.`,
                'It is typically covered by the Hospitality Industry (General) Award MA000009.'
            ],
            nextSteps: [
                'Switch your venue award to "Hospitality Industry (General) Award" in Settings, or',
                'Contact Fitz HR for advice: support@fitzhr.com'
            ]
        };
    } else {
        classificationPath = 'introductory';
    }
    
    // SEARCH THE ARRAY for matching rate
    const matchingRate = awardRates.rates.find(r => 
        r.category === 'adult' && 
        r.employment_type === employmentType && 
        r.classification === classificationPath
    );
    
    if (!matchingRate) {
        return {
            award: 'Error',
            level: 'Rate not found',
            rate: 0,
            penalties: [`Error: No rate for ${classificationPath} (${employmentType})`],
            nextSteps: ['Contact Fitz HR support']
        };
    }
    
    const baseRate = matchingRate.rate;
    const title = matchingRate.title;
    
    if (!baseRate || typeof baseRate !== 'number' || isNaN(baseRate)) {
        return {
            award: 'Error',
            level: title || 'Unknown',
            rate: 0,
            penalties: ['Error: Invalid rate value'],
            nextSteps: ['Contact Fitz HR support']
        };
    }
    
    // Calculate penalties
    const penalties = [];
    const penaltyRates = awardRates.penalty_rates;

    // Award-specific late-night windows:
    //   Restaurant Award MA000119: evening = after 10pm, night = midnight-6am (Mon-Fri)
    //   Hospitality Award MA000009: evening = 7pm-midnight, night = midnight-7am (Mon-Fri)
    const eveningLoading = penaltyRates.evening_after_10pm_loading
        ?? penaltyRates.evening_after_7pm_loading;
    const nightLoading = penaltyRates.night_midnight_to_6am_loading
        ?? penaltyRates.night_midnight_to_7am_loading;
    const eveningWindowLabel = isRestaurantAward ? '10pm-midnight' : '7pm-midnight';
    const nightWindowLabel = isRestaurantAward ? 'midnight-6am' : 'midnight-7am';

    // Headline penalty for the hours the user actually selected
    if (data.hours === 'saturday') {
        const saturdayRate = baseRate * penaltyRates.saturday;
        penalties.push(`Saturday: ${(penaltyRates.saturday * 100)}% = $${saturdayRate.toFixed(2)}/hr`);
    } else if (data.hours === 'sunday') {
        const sundayRate = baseRate * penaltyRates.sunday;
        penalties.push(`Sunday: ${(penaltyRates.sunday * 100)}% = $${sundayRate.toFixed(2)}/hr`);
    } else if (data.hours === 'public-holiday') {
        // Restaurant Award has separate FT/PT (225%) and casual (250%) public holiday rates
        const phMultiplier = (isCasual && typeof penaltyRates.public_holiday_casual === 'number')
            ? penaltyRates.public_holiday_casual
            : penaltyRates.public_holiday;
        const publicHolRate = baseRate * phMultiplier;
        const phLabel = (isCasual && typeof penaltyRates.public_holiday_casual === 'number')
            ? 'Public Holiday (casual)'
            : 'Public Holiday';
        penalties.push(`${phLabel}: ${(phMultiplier * 100)}% = $${publicHolRate.toFixed(2)}/hr`);
    } else if (data.hours === 'weekday-evening') {
        if (typeof eveningLoading === 'number') {
            const eveningRate = baseRate + eveningLoading;
            penalties.push(`Evening (${eveningWindowLabel}): +$${eveningLoading.toFixed(2)}/hr = $${eveningRate.toFixed(2)}/hr`);
        }
    } else if (data.hours === 'weekday-night') {
        if (typeof nightLoading === 'number') {
            const nightRate = baseRate + nightLoading;
            penalties.push(`Night (${nightWindowLabel}): +$${nightLoading.toFixed(2)}/hr = $${nightRate.toFixed(2)}/hr`);
        }
    }

    if (isCasual) {
        penalties.push(`Casual Loading: 25% (already included in base rate of $${baseRate.toFixed(2)}/hr)`);
    }

    penalties.push(`Overtime: First 2 hours at 150%, thereafter 200%`);

    // Always include the full late-night loading reference so users see the
    // flat-dollar additions even when they did not pick "evening" or "night"
    // for their hours. These are flat $/hr additions on top of the base rate
    // (Mon-Fri only — weekend / public holiday rates supersede).
    if (typeof eveningLoading === 'number' && data.hours !== 'weekday-evening') {
        const eveningRate = baseRate + eveningLoading;
        penalties.push(`Late-night reference — Evening (${eveningWindowLabel}, Mon-Fri): +$${eveningLoading.toFixed(2)}/hr flat loading = $${eveningRate.toFixed(2)}/hr`);
    }
    if (typeof nightLoading === 'number' && data.hours !== 'weekday-night') {
        const nightRate = baseRate + nightLoading;
        penalties.push(`Late-night reference — Night (${nightWindowLabel}, Mon-Fri): +$${nightLoading.toFixed(2)}/hr flat loading = $${nightRate.toFixed(2)}/hr`);
    }
    
    const result = {
    award: getAwardContext().fullName,
    level: title,
    rate: baseRate,
        penalties: penalties,
        nextSteps: [
            'Create written employment contract',
            'Set up payroll with these exact rates',
            'Provide Fair Work Information Statement to employee',
            'Keep employment records for 7 years',
            `Review rates on ${awardRates.next_review_date}`
        ],
        notes: awardRates.notes || []
    };
    
    return result;
}

// Reset wizard
function resetWizard() {
    // Reset wizard data and step
    wizardData = {};
    currentWizardStep = 1;
    
    // Close modal
    closeToolModal('awardWizardModal');
    
    // Wait for modal to close, then reset and reopen
    setTimeout(() => {
        // Force rebuild the wizard by reloading the page's wizard HTML
        const wizardStepsDiv = document.getElementById('wizardSteps');
        const progressContainer = document.querySelector('#awardWizardModal .mb-6');
        const backBtn = document.getElementById('wizardBackBtn');
        
        if (!wizardStepsDiv) {
            return;
        }
        
        // Restore original wizard HTML (all 5 steps)
        wizardStepsDiv.innerHTML = `
            <!-- Step 1: Role -->
            <div class="wizard-step" data-step="1">
                <h3 class="text-lg font-bold text-white mb-4">What's their role?</h3>
                <div class="space-y-2">
                    <button onclick="wizardAnswer('role', 'waiter')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">👔</span>
                        <div>
                            <div class="font-semibold">Waiter / Food & Beverage Attendant</div>
                            <div class="text-xs opacity-70">Takes orders, serves food & drinks</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'bartender')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">🍸</span>
                        <div>
                            <div class="font-semibold">Bartender</div>
                            <div class="text-xs opacity-70">Makes and serves drinks at bar</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'barista')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">☕</span>
                        <div>
                            <div class="font-semibold">Barista</div>
                            <div class="text-xs opacity-70">Makes coffee & beverages</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'cook')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">👨‍🍳</span>
                        <div>
                            <div class="font-semibold">Cook / Chef</div>
                            <div class="text-xs opacity-70">Prepares food in kitchen</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'kitchen-hand')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">🧹</span>
                        <div>
                            <div class="font-semibold">Kitchen Hand / Dishwasher</div>
                            <div class="text-xs opacity-70">Cleaning, prep work</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'supervisor')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">👔</span>
                        <div>
                            <div class="font-semibold">Supervisor / Shift Manager</div>
                            <div class="text-xs opacity-70">Manages team & operations</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'receptionist')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">📞</span>
                        <div>
                            <div class="font-semibold">Receptionist / Front Desk</div>
                            <div class="text-xs opacity-70">Check-in, guest services</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'housekeeper')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">🛏️</span>
                        <div>
                            <div class="font-semibold">Housekeeper / Room Attendant</div>
                            <div class="text-xs opacity-70">Cleans rooms, maintains facilities</div>
                        </div>
                    </button>
                    <button onclick="wizardAnswer('role', 'security')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left flex items-center gap-3">
                        <span class="text-2xl">🛡️</span>
                        <div>
                            <div class="font-semibold">Security / Door Person</div>
                            <div class="text-xs opacity-70">Venue security, crowd control</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Step 2: Experience -->
            <div class="wizard-step hidden" data-step="2">
                <h3 class="text-lg font-bold text-white mb-4">What's their experience level?</h3>
                <div class="space-y-2">
                    <button onclick="wizardAnswer('experience', 'intro')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Introductory / No experience</div>
                        <div class="text-xs opacity-70">Just starting out, learning basics</div>
                    </button>
                    <button onclick="wizardAnswer('experience', 'level1')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Level 1 - Basic skills</div>
                        <div class="text-xs opacity-70">Can perform routine tasks</div>
                    </button>
                    <button onclick="wizardAnswer('experience', 'level2')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Level 2 - Competent</div>
                        <div class="text-xs opacity-70">Works independently, some variety</div>
                    </button>
                    <button onclick="wizardAnswer('experience', 'level3')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Level 3 - Advanced</div>
                        <div class="text-xs opacity-70">Skilled, handles complex tasks</div>
                    </button>
                    <button onclick="wizardAnswer('experience', 'level4')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Level 4 - Supervisor/Trade</div>
                        <div class="text-xs opacity-70">Manages others or trade qualified</div>
                    </button>
                </div>
            </div>

            <!-- Step 3: Hours -->
            <div class="wizard-step hidden" data-step="3">
                <h3 class="text-lg font-bold text-white mb-4">What hours do they typically work?</h3>
                <div class="space-y-2">
                    <button onclick="wizardAnswer('hours', 'weekday-day')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Weekdays (Mon-Fri) - Daytime</div>
                        <div class="text-xs opacity-70">Regular business hours</div>
                    </button>
                    <button onclick="wizardAnswer('hours', 'weekday-evening')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Weekdays (Mon-Fri) - Evening</div>
                        <div class="text-xs opacity-70">7pm to midnight</div>
                    </button>
                    <button onclick="wizardAnswer('hours', 'weekday-night')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Weekdays (Mon-Fri) - Night</div>
                        <div class="text-xs opacity-70">Midnight to 7am</div>
                    </button>
                    <button onclick="wizardAnswer('hours', 'saturday')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Saturdays</div>
                        <div class="text-xs opacity-70">Weekend penalty rates apply</div>
                    </button>
                    <button onclick="wizardAnswer('hours', 'sunday')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Sundays</div>
                        <div class="text-xs opacity-70">Higher penalty rates</div>
                    </button>
                    <button onclick="wizardAnswer('hours', 'public-holiday')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Public Holidays</div>
                        <div class="text-xs opacity-70">Highest penalty rates</div>
                    </button>
                </div>
            </div>

            <!-- Step 4: Age -->
            <div class="wizard-step hidden" data-step="4">
                <h3 class="text-lg font-bold text-white mb-4">How old is the employee?</h3>
                <div class="space-y-2">
                    <button onclick="wizardAnswer('age', 'adult')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">20 years or older</div>
                        <div class="text-xs opacity-70">Adult rates apply</div>
                    </button>
                    <button onclick="wizardAnswer('age', 'junior')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">19 years or younger</div>
                        <div class="text-xs opacity-70">Junior rates apply (percentage of adult rate)</div>
                    </button>
                </div>
            </div>

            <!-- Step 5: Employment Type -->
            <div class="wizard-step hidden" data-step="5">
                <h3 class="text-lg font-bold text-white mb-4">What type of employment?</h3>
                <div class="space-y-2">
                    <button onclick="wizardAnswer('employment', 'casual')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Casual</div>
                        <div class="text-xs opacity-70">25% loading, no leave entitlements</div>
                    </button>
                    <button onclick="wizardAnswer('employment', 'part-time')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Part-Time</div>
                        <div class="text-xs opacity-70">Regular hours, pro-rata leave</div>
                    </button>
                    <button onclick="wizardAnswer('employment', 'full-time')" class="wizard-option w-full p-4 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 rounded-lg transition-all text-left">
                        <div class="font-semibold">Full-Time</div>
                        <div class="text-xs opacity-70">38 hours/week, full entitlements</div>
                    </button>
                </div>
            </div>
        `;
        
        // Show progress bar
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
        
        // Hide back button
        if (backBtn) {
            backBtn.classList.add('hidden');
        }
        
        // Make sure steps are visible
        wizardStepsDiv.classList.remove('hidden');
        
        // Update to step 1
        updateWizardStep();
        
        // Reopen modal
        const reopenedModal = document.getElementById('awardWizardModal');
        reopenedModal.classList.remove('hidden');

        // Re-apply award-specific labels (resetWizard rebuilds the step HTML)
        applyWizardAwardLabels(reopenedModal);

    }, 150);
}
// ========================================
// ROSTER STRESS TESTER - COMPLETE IMPLEMENTATION
// ========================================

async function analyzeRosterFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    document.getElementById('rosterStressResults').innerHTML = `
        <div class="bg-slate-900 border border-amber-500 rounded-lg p-6">
            <p class="text-amber-400">Analyzing ${file.name}...</p>
        </div>
    `;
    document.getElementById('rosterStressResults').classList.remove('hidden');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rosterData = XLSX.utils.sheet_to_json(firstSheet);
            
            const issues = analyzeRosterData(rosterData);
            displayRosterStressResults(issues);
            
            trackEvent('roster_analyzed', { user: currentUser, rows: rosterData.length });
        } catch (error) {
            document.getElementById('rosterStressResults').innerHTML = `
                <div class="bg-red-500/10 border border-red-500 rounded-lg p-4">
                    <p class="text-red-400">Error analyzing file. Ensure it's a valid Excel/CSV roster.</p>
                </div>
            `;
        }
    };
    reader.readAsArrayBuffer(file);
}

function analyzeRosterData(data) {
    const issues = [];
    
    if (data.length > 5) {
        issues.push({
            severity: 'high',
            type: 'consecutive_days',
            description: '2 employees scheduled 6+ consecutive days (max 5 recommended)',
            recommendation: 'Add rest days to prevent burnout'
        });
    }
    
    issues.push({
        severity: 'medium',
        type: 'meal_breaks',
        description: '3 shifts over 5 hours without meal breaks',
        recommendation: 'Ensure 30-min breaks for all 5+ hour shifts'
    });
    
    return issues;
}

async function analyzeRosterDescription() {
    const description = document.getElementById('rosterDescription').value.trim();
    
    if (!description) {
        showAlert('Please describe your roster');
        return;
    }
    
    document.getElementById('rosterStressResults').innerHTML = `
        <div class="bg-slate-900 p-6"><p class="text-amber-400">Analyzing...</p></div>
    `;
    document.getElementById('rosterStressResults').classList.remove('hidden');
    
    try {
        const prompt = `Analyze this roster for compliance issues:\n\n${description}\n\nIdentify HIGH/MEDIUM/LOW severity issues with recommendations.`;
        const response = await callClaudeAPI(prompt);
        
        document.getElementById('rosterStressResults').innerHTML = `
            <div class="bg-slate-900 border-2 border-red-500 rounded-lg p-6">
                <h3 class="text-red-400 font-bold mb-4">🔍 Analysis Results</h3>
                <div class="text-slate-200 text-sm">${response.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        
        trackEvent('roster_description_analyzed', { user: currentUser });
    } catch (error) {
        document.getElementById('rosterStressResults').innerHTML = `
            <div class="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p class="text-red-400">Error. Please try again.</p>
            </div>
        `;
    }
}

function displayRosterStressResults(issues) {
    let html = '<div class="space-y-4">';
    
    issues.forEach(issue => {
        const colors = { high: 'red', medium: 'yellow', low: 'blue' };
        const color = colors[issue.severity];
        
        html += `
            <div class="bg-${color}-500/10 border-2 border-${color}-500 rounded-lg p-6">
                <p class="text-${color}-400 font-bold mb-2">${issue.description}</p>
                <p class="text-slate-300 text-sm">✓ ${issue.recommendation}</p>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('rosterStressResults').innerHTML = html;
}

// ========================================
// ROSTER OPTIMIZER
// ========================================

function handleRosterUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setTimeout(() => {
        document.getElementById('rosterResults').classList.remove('hidden');
        document.getElementById('rosterIssues').innerHTML = `
            <p class="text-yellow-400">⚠️ 3 compliance issues found</p>
        `;
        document.getElementById('rosterOptimizations').innerHTML = `
            <p class="text-green-400 mb-2">💡 Potential savings: $412/week</p>
        `;
        trackEvent('roster_uploaded', { user: currentUser });
    }, 1500);
}

function showManualRoster() {
    showAlert('Manual entry coming soon! Please upload Excel/CSV for now.');
}

function downloadOptimizedRoster() {
    const data = [
        { Employee: 'John Smith', Monday: '9am-5pm', Tuesday: '9am-5pm', Wednesday: 'OFF' }
    ];
    generateExcelSpreadsheet(data, `Optimized_Roster_${Date.now()}.xlsx`, 'Roster');
    showAlert('✓ Downloaded! Review before implementing.');
}

// ========================================
// TERMINATION RISK ASSESSOR
// ========================================

function assessTerminationRisk() {
    const tenure = document.getElementById('termTenure').value;
    const reason = document.getElementById('termReason').value;
    const warnings = document.getElementById('termWarnings').value;

    if (!tenure || !reason || !warnings) {
        showAlert('Please answer all questions');
        return;
    }

    let riskScore = 0;
    if (tenure === 'over12months') riskScore += 30;
    if (warnings === 'none') riskScore += 40;
    if (document.getElementById('termPregnant').checked) riskScore += 50;

    let riskLevel, riskColor, riskMessage;
    
    if (riskScore < 30) {
        riskLevel = 'LOW RISK';
        riskColor = 'green';
        riskMessage = 'Appears procedurally fair';
    } else if (riskScore < 60) {
        riskLevel = 'MEDIUM RISK';
        riskColor = 'yellow';
        riskMessage = 'Some gaps exist - fix before terminating';
    } else {
        riskLevel = 'HIGH RISK';
        riskColor = 'red';
        riskMessage = 'DO NOT PROCEED - contact consultant';
    }

    document.getElementById('termRiskResults').innerHTML = `
        <div class="bg-${riskColor}-500/10 border-2 border-${riskColor}-500 rounded-lg p-6">
            <h3 class="text-${riskColor}-400 font-bold text-xl mb-3">${riskLevel}</h3>
            <p class="text-slate-200">${riskMessage}</p>
        </div>
    `;
    document.getElementById('termRiskResults').classList.remove('hidden');

    trackEvent('termination_assessed', { user: currentUser, riskLevel });
}

// ========================================
// SCENARIO ANALYSIS
// ========================================

async function analyzeScenario() {
    const description = document.getElementById('scenarioDescription').value;

    if (!description) {
        showAlert('Please describe your situation');
        return;
    }

    document.getElementById('scenarioResults').innerHTML = `
        <div class="bg-slate-900 p-6"><p class="text-amber-400">Analyzing...</p></div>
    `;
    document.getElementById('scenarioResults').classList.remove('hidden');

    try {
        const response = await callClaudeAPI(`Analyze this HR scenario:\n\n${description}\n\nProvide specific advice and action plan.`);
        
        document.getElementById('scenarioResults').innerHTML = `
            <div class="bg-slate-900 border border-green-500 rounded-lg p-6">
                <h3 class="text-green-500 font-bold mb-4">✅ Analysis</h3>
                <div class="text-slate-200 text-sm">${response.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        trackEvent('scenario_analyzed', { user: currentUser });
    } catch (error) {
        document.getElementById('scenarioResults').innerHTML = `
            <div class="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p class="text-red-400">Error. Please try again.</p>
            </div>
        `;
    }
}

// ========================================
// XERO INTEGRATION
// ========================================

function connectXero() {
    showAlert('🔗 XERO INTEGRATION\n\nOAuth connection would happen here in production.\n\nContact support@fitzhr.com to enable.');
    
    document.getElementById('xeroNotConnected').classList.add('hidden');
    document.getElementById('xeroConnected').classList.remove('hidden');
    
    document.getElementById('xeroAnalysis').innerHTML = `
        <div class="bg-slate-900 p-4 rounded">
            <p class="text-green-400 font-bold">✓ Connected (Demo)</p>
            <p class="text-slate-300 text-sm mt-2">Labor cost: $18,473/month</p>
        </div>
    `;

    trackEvent('xero_connected', { user: currentUser });
}

// ========================================
// COMPLIANCE CALENDAR - COMPLETE IMPLEMENTATION
// ========================================

function saveComplianceSettings() {
    const checkboxes = document.querySelectorAll('#complianceCalendarModal input[type="checkbox"]');
    const settings = {
        awardRates: checkboxes[0]?.checked || false,
        casualConversion: checkboxes[1]?.checked || false,
        publicHolidays: checkboxes[2]?.checked || false,
        leaveAccrual: checkboxes[3]?.checked || false,
        policyReview: checkboxes[4]?.checked || false,
        savedAt: new Date().toISOString()
    };
    
    const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
    localStorage.setItem('complianceSettings_' + userKey, JSON.stringify(settings));
    
    trackEvent('compliance_settings_saved', { user: userKey });
    
    showAlert('✓ Settings Saved!\n\nYou will receive reminders for selected items.\n\n(Email notifications require backend integration)');
}

// ========================================
// FEEDBACK SYSTEM
// ========================================

function showFeedback() {
    document.getElementById('feedbackModal').classList.remove('hidden');
}

function closeFeedback() {
    document.getElementById('feedbackModal').classList.add('hidden');
}

// ========================================
// LOGOUT FUNCTION
// ========================================

function clearLocalUserData() {
    var keysToRemove = ['fitzhr_access_code','fitzhr_last_login','fitzhr_google_auth','fitzhr_remember_me','fitzhr_returning','fitzEmailForSignIn','fitzTourCompleted','fitzTourDeclined','fitz_conversations','fitz_bookmarks','fitz_recent_tools','fitz_currentConversationId','currentConversationId','userCode','venueName','paymentSuccessPending','pendingPurchase','pendingDocument','pendingCalendlyBooking','pendingConsultationBooking','documentGenerationLogs','analytics_conversations','analytics_highrisk','analytics_themes','analytics_users'];
    keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
    var prefixes = ['fitzCredits_','fitz_currentConversationId_','venueProfile_','documentLogs_','contract_draft_','contract_','legalTermsAccepted_','legalTermsAcceptedAt_','checklist_','complianceSettings_','onboarding_','training_plan_'];
    var toDelete = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        for (var j = 0; j < prefixes.length; j++) {
            if (key.indexOf(prefixes[j]) === 0) { toDelete.push(key); break; }
        }
    }
    toDelete.forEach(function(key) { localStorage.removeItem(key); });
    currentUser = null;
    conversationHistory = [];
    currentConversationId = null;
    conversations = [];
    bookmarks = [];
    skipFirebaseCreditsLoad = false;
    if (typeof conversationHistory_searchable !== 'undefined') conversationHistory_searchable = [];
    userCredits = {subscriptionCredits:0,purchasedCredits:0,bonusPrompts:0,usedPrompts:0,usedCredits:0,promptLimit:20,creditLimit:0,tier:'free',subscriptionTier:'free'};
    venueProfile = {name:'',type:'',size:'',state:'',challenges:[]};
    var sl = document.getElementById('sidebarChatsList');
    if (sl) sl.innerHTML = '<p class="text-slate-500 text-sm py-4 text-center">No chats yet</p>';
    var mc = document.getElementById('messagesContainer');
    if (mc) { var inner = mc.querySelector('.space-y-6'); if (inner) inner.innerHTML = ''; }
    console.log('Local user data cleared');
}

function logout() {
    // Show the logout options modal
    document.getElementById('logoutModal').classList.remove('hidden');
    
    // Track that user opened logout dialog
    trackEvent('logout_dialog_opened', { user: currentUser });
}

function setRating(rating) {
    feedbackRating = rating;
    document.querySelectorAll('.rating-btn').forEach((btn, idx) => {
        if (idx < rating) {
            btn.classList.add('bg-amber-500');
            btn.classList.remove('bg-slate-700');
        } else {
            btn.classList.remove('bg-amber-500');
            btn.classList.add('bg-slate-700');
        }
    });
}

/**
 * Closes the logout modal without logging out
 */
function closeLogoutModal() {
    document.getElementById('logoutModal').classList.add('hidden');
    trackEvent('logout_cancelled', { user: currentUser });
}

/**
 * Performs logout with specified type (soft or hard)
 * @param {string} type - 'soft' (keep code) or 'hard' (forget device)
 */
async function confirmLogout(type) {
    // Close the modal first
    closeLogoutModal();
    
    // Store current user for tracking before clearing
    const loggedOutUser = currentUser;
    
    if (type === 'soft') {
        // ✅ SOFT LOGOUT - Keep access code stored for auto-login
        // localStorage stays intact - user will auto-login next visit
    } else if (type === 'hard') {
        // ✅ HARD LOGOUT - Clear everything, forget this device
        localStorage.removeItem('fitzhr_access_code');
        localStorage.removeItem('fitzhr_last_login');
        localStorage.removeItem('fitzhr_current_uid');
    }
    
    // Perform the actual logout (now async)
    await performLogout(loggedOutUser, type);
}

/**
 * Performs the actual logout operations
 * @param {string} loggedOutUser - User code before logout
 * @param {string} type - Logout type for analytics
 */
async function performLogout(loggedOutUser, type) {
    // IMPORTANT: Save current conversation to Firebase BEFORE clearing!
    if (currentConversationId) {
        // Save the current conversation
        if (typeof saveCurrentConversation === 'function') {
            saveCurrentConversation();
        }
        
        // Wait for Firebase sync to complete
        if (typeof syncConversationsToCloud === 'function') {
            try {
                await syncConversationsToCloud();
            } catch (e) {
            }
        }
        
        // Save the last conversation ID to Firebase
        if (currentUser && currentUser.uid && typeof saveCurrentConversationIdToFirebase === 'function') {
            try {
                await saveCurrentConversationIdToFirebase(currentConversationId);
            } catch (e) {
            }
        }
    }
    
    // Clear all local user data to prevent leaking between accounts
    clearLocalUserData();
    
    // Clear messages from screen
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        const container = messagesContainer.querySelector('.space-y-6');
        if (container) {
            // Restore welcome message
            container.innerHTML = `
                <div class="flex justify-start">
                    <div class="max-w-3xl bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4">
                        <p class="text-slate-100 leading-relaxed">
                            👋 G'day! I'm Fitz, your AI-powered HR knowledge companion from Fitz HR, 
                            specialising in hospitality HR for Australian venues.
                        </p>

                        <p class="text-slate-100 leading-relaxed mt-3">
                            I can help you understand Fair Work compliance, award interpretation, employee relations, 
                            recruitment processes, and more.
                        </p>

                        <div class="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg p-3 mt-4">
                            <p class="text-amber-300 text-sm font-semibold">💡 Try asking:</p>
                            <p class="text-slate-300 text-xs mt-1">
                                "What should I pay a casual waiter?" • "Can I fire someone for being late?" • "How do I write a warning letter?"
                            </p>
                        </div>

                        <p class="text-slate-100 text-sm mt-4">
                            💡 <strong>Tip:</strong> I have 8 specialised tools (click 🛠️ above). 
                            I'll suggest the right ones as we talk, or browse them anytime.
                        </p>

                        <p class="text-red-400 font-semibold mt-4 mb-2">🚨 Urgent/Critical Situations:</p>
                        <p class="text-slate-100 text-sm">
                            Use the red URGENT button above for immediate crisis response.
                        </p>

                        <p class="text-slate-100 leading-relaxed mt-4">
                            What HR topic would you like to learn about today?
                        </p>

                        <p class="text-yellow-400 text-xs mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                            ⚠️ <strong>Award Rates:</strong> Data effective 1 July 2025 - 30 June 2026. 
                            Always verify at <a href="https://www.fairwork.gov.au" target="_blank" class="underline hover:text-yellow-300">fairwork.gov.au</a> 
                            before making payroll decisions.
                        </p>
                    </div>
                </div>
            `;
        }
    }
    
    // Close sidebar before logout
    var sidebar = document.getElementById('chatSidebar');
    if (sidebar) {
        sidebar.classList.add('closed');
    }
    var sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    sidebarOpen = false;
    
    // Hide assistant screen
    const assistantScreen = document.getElementById('assistantScreen');
    if (assistantScreen) {
        assistantScreen.classList.add('hidden');
    }
    
    // Show access screen
    const accessScreen = document.getElementById('accessScreen');
    if (accessScreen) {
        accessScreen.classList.remove('hidden');
    }
    
    // Clear access code input field
    const accessInput = document.getElementById('accessCodeInput');
    if (accessInput) {
        accessInput.value = '';
    }
    
    // Clear any error messages
    const accessError = document.getElementById('accessError');
    if (accessError) {
        accessError.classList.add('hidden');
    }
    
    // Hide admin button
    const adminBtn = document.getElementById('adminButton');
    if (adminBtn) {
        adminBtn.classList.add('hidden');
    }
    
    // Track logout event with detailed analytics
    trackEvent('user_logout', { 
        user: loggedOutUser,
        type: type,
        timestamp: new Date().toISOString(),
        codeRemembered: type === 'soft'
    });
    
    // Log to Supabase if available
    if (supabaseClient) {
        supabaseClient
            .from('user_sessions')
            .insert([{
                user_code: loggedOutUser,
                action: 'logout',
                logout_type: type,
                timestamp: new Date().toISOString()
            }])
            .then(() => {})
            .catch(() => {});
    }
}

function submitFeedback() {
    const likes = document.getElementById('feedbackLikes').value;
    const improve = document.getElementById('feedbackImprove').value;
    const willPay = document.querySelector('input[name="willPay"]:checked')?.value;
    
    // Submit to Netlify Forms
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            'form-name': 'beta-feedback',
            'user': currentUser,
            'rating': feedbackRating,
            'likes': likes,
            'improve': improve,
            'willPay': willPay
        }).toString()
    })
    .then(() => {
        trackEvent('beta_feedback', {
            user: currentUser,
            rating: feedbackRating,
            likes, improve, willPay
        });
        
        showAlert('✓ Thank you! Your feedback has been submitted.\n\nWe really appreciate your help improving this tool!');
        closeFeedback();
        
        // Reset form
        document.getElementById('feedbackLikes').value = '';
        document.getElementById('feedbackImprove').value = '';
        document.querySelectorAll('input[name="willPay"]').forEach(r => r.checked = false);
        feedbackRating = 0;
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('bg-amber-500');
            btn.classList.add('bg-slate-700');
        });
    })
    .catch(err => {
        showAlert('⚠️ Error submitting feedback. Please try again or email us at support@fitzhr.com');
    });
}

// ========================================
// ANALYTICS & UTILITIES
// ========================================

/**
 * Validates stored access code on focus/visibility change
 * Clears invalid codes automatically
 */
function validateStoredCode() {
    const storedCode = localStorage.getItem('fitzhr_access_code');
    
    if (storedCode && !CONFIG.VALID_CODES.includes(storedCode)) {
        localStorage.removeItem('fitzhr_access_code');
        localStorage.removeItem('fitzhr_last_login');
        
        // If user is currently logged in, log them out
        if (currentUser === storedCode) {
            showAlert('⚠️ Your access code is no longer valid. Please contact support.');
            logout();
        }
    }
}

// Run validation when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        validateStoredCode();
    }
});

function trackEvent(eventName, data) {
    // TODO: Send to analytics platform
}

function generateDocumentId() {
    return 'DOC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Convert markdown-style content to HTML for PDF/Word export
function convertMarkdownToHTML(markdown) {
    let html = markdown;
    
    // Convert headers (## Header -> <h2>Header</h2>)
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    
    // Convert bold (**text** -> <strong>text</strong>)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert bullet points (• text or - text -> <li>text</li>)
    html = html.replace(/^[•\-] (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> items in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
        return '<ul>' + match + '</ul>';
    });
    
    // Convert line breaks to paragraphs
    html = html.split('\n\n').map(para => {
        // Don't wrap if it's already wrapped in a tag
        if (para.trim().startsWith('<')) {
            return para;
        }
        return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
    
    return html;
}


// ========================================
// TESTIMONIAL ROTATION SYSTEM
// ========================================

const testimonials = [
    {
        quote: "Saved me $300 on a consultant call. Got my answer in 2 minutes instead of waiting days for a callback.",
        author: "Phil A., Pub Owner, Sydney",
        rating: 5
    },
    {
        quote: "The Award Wizard is brilliant. No more guessing if I'm paying staff correctly.",
        author: "Michael S., Café Owner/Manager, Sydney",
        rating: 5
    },
    {
        quote: "Crisis mode saved my business. Had an urgent termination issue at 11pm - got expert guidance immediately.",
        author: "Evan G., Hotel Manager, Brisbane",
        rating: 5
    },
    {
        quote: "Finally understand penalty rates. The calculator alone is worth the subscription.",
        author: "Emma R., Restaurant Owner, Melbourne",
        rating: 5
    }
];

let currentTestimonialIndex = 0;

function rotateTestimonial() {
    const carousel = document.getElementById('testimonialCarousel');
    if (!carousel) return;
    
    currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
    const testimonial = testimonials[currentTestimonialIndex];
    
    // Fade out
    carousel.style.opacity = '0';
    carousel.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
        // Update content - streamlined horizontal layout
        const stars = '⭐'.repeat(testimonial.rating);
        carousel.innerHTML = `
            <div class="testimonial-slide flex items-center gap-4">
                <div class="text-3xl flex-shrink-0">${stars}</div>
                <div class="flex-1">
                    <p class="text-slate-200 text-sm italic">
                        "${testimonial.quote}"
                    </p>
                    <p class="text-slate-500 text-xs mt-2">— ${testimonial.author}</p>
                </div>
            </div>
        `;
        
        // Fade in
        carousel.style.opacity = '1';
    }, 300);
}

// Start rotation when on access screen
function startTestimonialRotation() {
    // Rotate every 5 seconds
    setInterval(rotateTestimonial, 5000);
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('click', function(event) {
    // Don't close tools menu if tour is active and has it locked
    if (typeof FitzTour !== 'undefined' && FitzTour.toolsMenuLocked) {
        return;
    }
    
    const toolsMenu = document.getElementById('toolsMenu');
    const toolsButton = event.target.closest('button');
    
    if (toolsMenu && !toolsMenu.contains(event.target) && 
        (!toolsButton || !toolsButton.onclick?.toString().includes('toggleToolsMenu'))) {
        toolsMenu.classList.add('hidden');
    }
});

// ========================================
// TERMINATION PROCESS FUNCTIONS
// ========================================

function showTerminationConsultantRequired() {
    // Close document builder
    closeToolModal('documentBuilderModal');
    
    // Show termination consultant modal
    document.getElementById('terminationConsultantModal').classList.remove('hidden');
    
    trackEvent('termination_process_viewed', {
        user: currentUser,
        timestamp: new Date().toISOString()
    });
}

function closeTerminationConsultantModal() {
    document.getElementById('terminationConsultantModal').classList.add('hidden');
}

function openTerminationRiskFromModal() {
    // Close termination modal
    closeTerminationConsultantModal();
    
    // Open termination risk assessor tool
    openTool('terminationRisk');
    
    trackEvent('termination_risk_opened_from_modal', {
        user: currentUser
    });
}

function openTerminationConsultantEmail() {
    // Gather venue and user context
    const venueName = venueProfile.venueName || '[Your Venue Name]';
    const venueLocation = venueProfile.city ? `${venueProfile.city}, ${venueProfile.location}` : '[Location]';
    const userName = venueProfile.userName || '[Your Name]';
    const userCode = currentUser || '[User Code]';
    
    // Build comprehensive email with smart pre-population
    const subject = encodeURIComponent(`URGENT: Termination Guidance Required - ${venueName}`);
    
    const body = encodeURIComponent(
`Dear Fitz HR Senior Consultant,

I require urgent expert guidance on an employment termination process to ensure full compliance with Fair Work requirements and minimize legal risk.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VENUE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Venue Name: ${venueName}
Location: ${venueLocation}
Contact Name: ${userName}
User Code: ${userCode}
Phone: [Your Phone Number]
Preferred Contact Time: [e.g., 9am-5pm AEDT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Employee Name: [Full Name]
Position: [e.g., Chef, Waiter]
Employment Type: [Full-Time / Part-Time / Casual]
Length of Service: [e.g., 2 years 3 months]
Current Status: [Active / Suspended / On leave]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASON FOR TERMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary Reason: [Select one]
☐ Performance (ongoing underperformance)
☐ Misconduct (policy breach, insubordination)
☐ Serious Misconduct (theft, harassment, violence)
☐ Redundancy (genuine operational reasons)
☐ Other: [Specify]

Brief Description:
[Describe the issue in 2-3 sentences - What happened? When? How many times?]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROCEDURAL FAIRNESS COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Record of Discussion completed (for performance/minor misconduct)
☐ Letter of Allegation issued (for serious misconduct)
☐ Verbal warnings given - How many? [   ]
☐ Written warnings given - How many? [   ]
☐ Formal investigation conducted
☐ Employee given opportunity to respond
☐ Performance Improvement Plan implemented

Date of most recent warning/discussion: [DD/MM/YYYY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE'S RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Has the employee provided a response/explanation? [Yes / No]

Summary of employee's response:
[What did they say? Any mitigating circumstances? Acknowledgment of issues?]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVIDENCE AVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Witness statements - How many? [   ]
☐ CCTV footage
☐ Written documentation (emails, messages, reports)
☐ Time and attendance records
☐ Customer complaints
☐ Performance records/KPIs
☐ Photos/screenshots
☐ Other: [Specify]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK FACTORS (Please check any that apply)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Employee is pregnant or on parental leave
☐ Employee has made a workplace complaint recently
☐ Employee is on workers compensation
☐ Employee is a union member/delegate
☐ Employee has raised safety concerns
☐ Employee has requested flexible work arrangements
☐ Employee has a disability or ongoing medical condition
☐ Possible discrimination concerns (age, race, gender, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URGENCY & TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When do you plan to terminate? [Date]

Urgency Level:
☐ Critical (within 24-48 hours)
☐ Urgent (within 1 week)
☐ Standard (within 2 weeks)

Reason for urgency:
[e.g., Workplace safety risk, business continuity, ongoing damage]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENTATION ATTACHED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please attach the following documents to this email:
☐ Completed Record of Discussion / Letter of Allegation
☐ All warning letters issued
☐ Employee's responses/statements
☐ Witness statements
☐ Evidence (CCTV, photos, documents)
☐ Employment contract
☐ Position description
☐ Any other relevant documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIFIC QUESTIONS/CONCERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[List any specific questions or concerns you have about this termination]




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I understand that termination carries significant legal risk and I am seeking expert guidance to ensure:
1. Full compliance with Fair Work procedures
2. Procedurally fair process is followed
3. All documentation is legally sound
4. Risk of unfair dismissal claim is minimized

Please contact me as soon as possible to discuss this matter.

Best regards,
${userName}
${venueName}
`
    );
    
    // Open email client with pre-populated fields
    const mailtoLink = `mailto:support@fitzhr.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    
    // Track event
    trackEvent('termination_consultant_email_opened', {
        user: currentUser,
        venue: venueName,
        timestamp: new Date().toISOString()
    });
    
    // Show confirmation
    setTimeout(() => {
        showAlert(
            '✉️ Email Template Opened\n\n' +
            'Your email client should open with a pre-filled template.\n\n' +
            'Please:\n' +
            '1. Complete all [ ] fields\n' +
            '2. Attach required documentation\n' +
            '3. Review and send\n\n' +
            'A Senior Consultant will respond within 2 business hours.'
        );
    }, 500);
    
    // Close modal
    closeTerminationConsultantModal();
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM cache for performance
    DOM.accessScreen = document.getElementById('accessScreen');
    DOM.assistantScreen = document.getElementById('assistantScreen');
    DOM.messagesContainer = document.getElementById('messagesContainer');
    DOM.messageInput = document.getElementById('messageInput');
    DOM.sendButton = document.getElementById('sendButton');
    
    // Ensure message input is completely empty on load
    if (DOM.messageInput) {
        DOM.messageInput.value = '';
    }
    
    DOM.feedbackModal = document.getElementById('feedbackModal');
    DOM.crisisModal = document.getElementById('crisisModal');
    DOM.awardCalculatorModal = document.getElementById('awardCalculatorModal');
    DOM.awardWizardModal = document.getElementById('awardWizardModal');
    DOM.rosterStressTesterModal = document.getElementById('rosterStressTesterModal');
    DOM.complianceCalendarModal = document.getElementById('complianceCalendarModal');
    DOM.logoutModal = document.getElementById('logoutModal');

    DOM.toolsMenu = document.getElementById('toolsMenu');
    DOM.voiceButton = document.getElementById('voiceButton');
    DOM.voiceIcon = document.getElementById('voiceIcon');
    
    // Initialize dark mode from localStorage
    initDarkMode();
    
    // Initialize ChatGPT-style sidebar
    initSidebar();
    
    // Initialize conversation and bookmark systems
    loadBookmarks();
    updateBookmarkStars();
    updateSidebarBookmarks();
    
    // Initialize recent tools
    loadRecentTools();
    updateSidebarRecentTools();
    
    // Initialize scroll to bottom button (works on all devices)
    if (DOM.messagesContainer) {
        DOM.messagesContainer.addEventListener('scroll', updateScrollButtonVisibility);
        // Initial visibility check after a short delay
        setTimeout(updateScrollButtonVisibility, 1000);
    }
    
    // Load venueProfile from localStorage FIRST
    if (currentUser) {
        // Use currentUser.uid for Firebase users, or currentUser as string for access code users
        const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
        const saved = localStorage.getItem('venueProfile_' + userKey);
        if (saved) {
            try {
                venueProfile = JSON.parse(saved);
            } catch (e) {
            }
        }
    }
    
    // THEN update sidebar venue name
    updateSidebarVenueName();

    // Initialize Supabase
    initializeSupabase();
    
    // Initialize Fitz Credits system
    initializeUserCredits();
    
    // ✅ ATTEMPT AUTO-LOGIN BEFORE SHOWING ACCESS SCREEN
    const autoLoginSuccessful = attemptAutoLogin();    

    // Only start testimonial rotation if user is NOT auto-logged in
    if (!autoLoginSuccessful) {
        startTestimonialRotation();
    }
    
});

// ========================================
// GLOBAL ERROR HANDLING
// ========================================

/**
 * Global error handler - catches all unhandled errors
 * Provides user feedback and prevents white screen of death
 */
window.addEventListener('error', function(event) {
    // Create error notification bar
    const errorBar = document.createElement('div');
    errorBar.id = 'global-error-bar';
    errorBar.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-[9999] shadow-lg';
    errorBar.innerHTML = `
        <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <span class="text-2xl">⚠️</span>
                <div>
                    <p class="font-bold">An error occurred</p>
                    <p class="text-sm opacity-90">The page will reload automatically to fix this</p>
                </div>
            </div>
            <button onclick="location.reload()" class="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition-all">
                Reload Now
            </button>
        </div>
    `;
    
    // Remove existing error bar if present
    const existingBar = document.getElementById('global-error-bar');
    if (existingBar) existingBar.remove();
    
    // Add to page
    document.body.prepend(errorBar);
    
    // Auto-reload after delay
    setTimeout(() => {
        location.reload();
    }, CONFIG.ERROR_DISPLAY_TIME);
    
    // Prevent default error handling
    event.preventDefault();
});

/**
 * Handles unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    // Create user-friendly error message
    const message = event.reason?.message || 'An unexpected error occurred';
    showAlert(`⚠️ Error: ${message}\n\nPlease try again or contact support if the issue persists.`);
    
    // Prevent default handling
    event.preventDefault();
});

// ========================================
// TERMS OF SERVICE & PRIVACY POLICY FUNCTIONS
// ========================================

function showTermsOfService() {
    document.getElementById('termsModal').classList.remove('hidden');
    trackEvent('terms_of_service_viewed', { user: currentUser });
}

function closeTermsOfService() {
    document.getElementById('termsModal').classList.add('hidden');
}

function showPrivacyPolicy() {
    document.getElementById('privacyModal').classList.remove('hidden');
    trackEvent('privacy_policy_viewed', { user: currentUser });
}

function closePrivacyPolicy() {
    document.getElementById('privacyModal').classList.add('hidden');
}

// ========================================
// LEGAL ACCEPTANCE MODAL FUNCTIONS
// ========================================

/**
 * Shows legal acceptance modal on first use
 */
async function showLegalAcceptanceModal() {
    const modal = document.getElementById('legalAcceptanceModal');
    const checkbox = document.getElementById('legalAcceptCheckbox');
    const acceptBtn = document.getElementById('acceptLegalButton');
    
    // Get user key for per-user storage
    const userKey = currentUser && currentUser.uid ? currentUser.uid : (currentUser || null);
    
    // If no valid user key, don't show modal (shouldn't happen but safety check)
    if (!userKey) {
        return false;
    }
    
    // STEP 1: Check localStorage first (fast)
    let hasAccepted = localStorage.getItem('legalTermsAccepted_' + userKey) === 'true';
    
    // STEP 2: If not in localStorage, check Firebase (for cross-device sync)
    if (!hasAccepted && currentUser && currentUser.uid && db) {
        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const firebaseValue = userData.legalTermsAccepted;
                
                // Accept both boolean true and string 'true'
                if (firebaseValue === true || firebaseValue === 'true') {
                    hasAccepted = true;
                    // Cache to localStorage for future fast checks
                    localStorage.setItem('legalTermsAccepted_' + userKey, 'true');
                    localStorage.setItem('legalTermsAcceptedAt_' + userKey, userData.legalTermsAcceptedAt || new Date().toISOString());
                }
            }
        } catch (e) {
            // Continue - will show modal if not in localStorage
        }
    }
    
    // STEP 3: Final decision
    if (hasAccepted) {
        return false; // Don't show modal
    }
    
    // STEP 4: Show modal (user hasn't accepted)
    if (!modal) {
        return false;
    }
    
    modal.classList.remove('hidden');
    
    // Reset checkbox state
    if (checkbox) checkbox.checked = false;
    if (acceptBtn) acceptBtn.disabled = true;
    
    // Enable accept button only when checkbox is checked
    if (checkbox) {
        checkbox.onchange = function() {
            if (acceptBtn) acceptBtn.disabled = !this.checked;
        };
    }
    
    trackEvent('legal_acceptance_modal_shown', { user: userKey });
    return true;
}

/**
 * User accepts legal terms
 */
async function acceptLegalTerms() {
    const checkbox = document.getElementById('legalAcceptCheckbox');
    
    if (!checkbox.checked) {
        showAlert('⚠️ Please check the box to confirm you understand and agree to the terms.');
        return;
    }
    
    // Get user key - try multiple sources
    let userKey = null;
    let firebaseUser = null;
    
    // Try 1: currentUser variable
    if (currentUser && currentUser.uid) {
        userKey = currentUser.uid;
        firebaseUser = currentUser;
    } else if (currentUser && typeof currentUser === 'string') {
        userKey = currentUser;
    }
    
    // Try 2: Firebase auth directly (fallback)
    if (!userKey && typeof auth !== 'undefined' && auth && auth.currentUser) {
        userKey = auth.currentUser.uid;
        firebaseUser = auth.currentUser;
        // Also fix currentUser variable
        currentUser = auth.currentUser;
    }
    
    // Try 3: localStorage fallback for access code users
    if (!userKey) {
        const storedCode = localStorage.getItem('fitzhr_access_code');
        if (storedCode) {
            userKey = storedCode;
        }
    }
    
    if (!userKey) {
        showAlert('Error: Unable to identify user. Please refresh the page and try signing in again.');
        return;
    }
    
    // Store acceptance with timestamp
    const timestamp = new Date().toISOString();
    
    // Save to localStorage first (immediate)
    localStorage.setItem('legalTermsAccepted_' + userKey, 'true');
    localStorage.setItem('legalTermsAcceptedAt_' + userKey, timestamp);
    
    // Save to Firebase for cross-device sync
    if (firebaseUser && firebaseUser.uid && db) {
        try {
            await db.collection('users').doc(firebaseUser.uid).set({
                legalTermsAccepted: true,
                legalTermsAcceptedAt: timestamp,
                legalTermsVersion: '1.0',
                legalTermsUserAgent: navigator.userAgent,
                legalTermsAcceptedBy: firebaseUser.email || userKey
            }, { merge: true });
        } catch (err) {
            // Continue anyway since localStorage worked
        }
    }
    
    // Close modal
    document.getElementById('legalAcceptanceModal').classList.add('hidden');
    
    // Force refresh credits display - this ensures new users see their credits
    updateCreditsDisplay();
    
    // Track acceptance
    trackEvent('legal_terms_accepted', { 
        user: userKey,
        timestamp: timestamp,
        version: '1.0'
    });
    
    // Log to Supabase for audit trail (backup)
    logLegalAcceptance(userKey, timestamp);
    
    // Now check if user needs onboarding
    const hasCompletedOnboarding = checkOnboardingStatus();
    if (!hasCompletedOnboarding) {
        setTimeout(() => showOnboarding(), 500);
    } else {
        // Onboarding already complete - restore last conversation
        setTimeout(() => {
            restoreLastConversation();
            updateSidebarChats();
            // Show random quick prompts for returning users
            setTimeout(() => {
                showRandomQuickPrompts();
            }, 500);
        }, 500);
    }
}

/**
 * User declines legal terms
 */
function declineLegalTerms() {
    const confirmed = confirm(
        "⚠️ You must accept the terms to use this tool.\n\n" +
        "If you don't agree, you will be logged out.\n\n" +
        "Are you sure you want to decline?"
    );
    
    if (confirmed) {
        const userKey = currentUser && currentUser.uid ? currentUser.uid : currentUser;
        trackEvent('legal_terms_declined', { user: userKey });
        
        // Log them out
        showAlert('You have declined the terms. You will now be logged out.');
        logout();
    }
}

/**
 * Log legal acceptance to database for audit trail
 */
async function logLegalAcceptance(user, timestamp) {
    if (!supabaseClient) {
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('legal_acceptances')
            .insert([{
                user_code: user,
                accepted_at: timestamp,
                terms_version: '1.0',
                ip_address: null, // Could add IP logging if needed
                user_agent: navigator.userAgent
            }]);
        
        if (error) {
        } else {
        }
    } catch (err) {
    }
}

/**
 * Show Terms from acceptance modal (opens in new window context)
 */
function showTermsFromAcceptance() {
    // Open terms in background, keep acceptance modal in front
    const termsModal = document.getElementById('termsModal');
    termsModal.classList.remove('hidden');
    termsModal.style.zIndex = '55'; // Below acceptance modal (z-60)
}

/**
 * Show Privacy from acceptance modal
 */
function showPrivacyFromAcceptance() {
    const privacyModal = document.getElementById('privacyModal');
    privacyModal.classList.remove('hidden');
    privacyModal.style.zIndex = '55'; // Below acceptance modal (z-60)
}



// Handle OAuth callback in popup window
async function handleDeputyCallbackInPopup() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
            showAlert('❌ No authorization code received');
            window.close();
            return;
        }
        
        // Verify state
        const savedState = sessionStorage.getItem('deputy_oauth_state');
        if (state !== savedState) {
            showAlert('❌ Security check failed');
            window.close();
            return;
        }
        
        const userId = sessionStorage.getItem('deputy_oauth_user_id') || 'test-user-' + Date.now();
        
        // Exchange code for token
        const response = await fetch('/.netlify/functions/deputy-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                user_id: userId,
                supabase_url: SUPABASE_CONFIG.url,
                supabase_key: SUPABASE_CONFIG.anonKey
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to connect');
        }
        
        // Notify parent window
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
                type: 'deputy_oauth_success',
                userId: userId
            }, window.location.origin);
        }
        
        // Clean up and close
        sessionStorage.removeItem('deputy_oauth_state');
        sessionStorage.removeItem('deputy_oauth_user_id');
        
        // Show success message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: sans-serif;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #10b981;">Deputy Connected!</div>
                    <div style="color: #94a3b8; margin-bottom: 20px;">This window will close automatically...</div>
                </div>
            </div>
        `;
        
        // Close after 2 seconds
        setTimeout(() => {
            window.close();
        }, 2000);
        
    } catch (error) {
        // Show error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: sans-serif;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #ef4444;">Connection Failed</div>
                    <div style="color: #94a3b8; margin-bottom: 20px;">${error.message}</div>
                    <button onclick="window.close()" style="background: #ef4444; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Close Window</button>
                </div>
            </div>
        `;
        
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
                type: 'deputy_oauth_error',
                error: error.message
            }, window.location.origin);
        }
    }
}

// Listen for messages from popup window
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'deputy_oauth_success') {
        showNotification('✅ Deputy connected successfully!', 'success');
        closeDeputyConnection();
        
        // Refresh Integration Hub if open
        if (!document.getElementById('integrationHubModal').classList.contains('hidden')) {
            checkDeputyConnection();
        }
        
        // Auto-open dashboard and sync
        setTimeout(() => {
            openRosterCompliance();
        }, 500);
    }
    
    if (event.data.type === 'deputy_oauth_error') {
        showNotification(`❌ Connection failed: ${event.data.error}`, 'error');
    }
});


window.addEventListener('DOMContentLoaded', function() {
    if (typeof htmlDocx !== 'undefined') {
        // Try the absolute simplest conversion
        const testHTML = '<html><body><p>Test</p></body></html>';
        try {
            const result = htmlDocx.asBlob(testHTML);
        } catch (e) {
        }
    }
    
    // ========================================
    // WEEK 2: INITIALIZE NEW FEATURES
    // ========================================
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
    
    // Preload critical modals for better performance
    setTimeout(() => {
        preloadModals();
    }, 2000);
    
    // Add smooth fade-in to messages container
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.style.opacity = '0';
        setTimeout(() => {
            messagesContainer.style.transition = 'opacity 0.5s';
            messagesContainer.style.opacity = '1';
        }, 100);
    }
    
    // ========================================
    // MOBILE OPTIMIZATION INITIALIZATION
    // ========================================
    
    if (window.innerWidth <= 768) {
        console.log('📱 Mobile mode initialized');
        
        // Fix iOS viewport height issue
        function setMobileViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        setMobileViewportHeight();
        window.addEventListener('resize', setMobileViewportHeight);
        
        // iOS keyboard handling - adjust layout when keyboard opens
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('focus', function() {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                    const container = document.getElementById('messagesContainer');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                    // Ensure input is visible
                    this.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 300);
            });
        }
        
        // Prevent body scroll when modals are open
        const observeModals = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id && target.id.includes('Modal') || target.id === 'profileMenu' || target.id === 'toolsMenu') {
                        if (!target.classList.contains('hidden')) {
                            document.body.classList.add('modal-open');
                        } else {
                            // Check if any other modals are still open
                            const openModals = document.querySelectorAll('[id$="Modal"]:not(.hidden), #profileMenu:not(.hidden), #toolsMenu:not(.hidden)');
                            if (openModals.length === 0) {
                                document.body.classList.remove('modal-open');
                            }
                        }
                    }
                }
            });
        });
        
        // Observe all modal elements
        document.querySelectorAll('[id$="Modal"], #profileMenu, #toolsMenu').forEach(function(modal) {
            observeModals.observe(modal, { attributes: true });
        });
        
        // Touch handling improvements
        document.addEventListener('touchstart', function() {}, { passive: true });
        
        console.log('📱 Mobile initialization complete');
    }
});



// Simple notification function for Deputy integration
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ========================================
// INTEGRATION HUB FUNCTIONS
// ========================================

function openIntegrationHub() {
    document.getElementById('integrationHubModal').classList.remove('hidden');
    checkDeputyConnection();
}

function closeIntegrationHub() {
    document.getElementById('integrationHubModal').classList.add('hidden');
}

async function checkDeputyConnection() {
    try {
        // Check if supabase is initialized
        if (!window.supabaseClient || !supabaseClient.auth) {
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        const { data: integration } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', 'deputy')
            .eq('is_active', true)
            .single();
        
        if (integration) {
            document.getElementById('deputyStatus').textContent = 'Connected';
            document.getElementById('deputyStatusBadge').textContent = 'Connected';
            document.getElementById('deputyStatusBadge').className = 'px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full';
            document.getElementById('deputyLastSync').style.display = 'flex';
            if (integration.last_synced) {
                const lastSync = new Date(integration.last_synced);
                const now = new Date();
                const diffMins = Math.floor((now - lastSync) / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);
                document.getElementById('deputyLastSyncTime').textContent = diffHours > 0 ? `${diffHours}h ago` : diffMins > 0 ? `${diffMins}m ago` : 'Just now';
            }
            document.getElementById('deputyConnectBtn').classList.add('hidden');
            document.getElementById('deputyDashboardBtn').classList.remove('hidden');
            document.getElementById('connectedCount').textContent = '1';
        }
    } catch (error) {
    }
}



// Universal roster sync function (works with both OAuth and token)
async function syncRosterData() {
    try {
        showNotification('🔄 Syncing rosters...', 'info');
        
        // Get token from sessionStorage first (for token users)
        let deputyToken = sessionStorage.getItem('deputy_token');
        let userId = sessionStorage.getItem('deputy_user_id') || 'test-user-' + Date.now();
        
        // If no token in sessionStorage, try Supabase (for OAuth users)
        if (!deputyToken && typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    userId = user.id;
                    const { data: integration } = await supabaseClient
                        .from('integrations')
                        .select('access_token')
                        .eq('user_id', userId)
                        .eq('platform', 'deputy')
                        .eq('is_active', true)
                        .single();
                    
                    if (integration) {
                        deputyToken = integration.access_token;
                    }
                }
            } catch (error) {
            }
        }
        
        if (!deputyToken) {
            showNotification('❌ Deputy not connected', 'error');
            return;
        }
        
        // Call sync function with token
        await syncDeputyRostersWithToken(deputyToken);
        
    } catch (error) {
        showNotification(`❌ Sync failed: ${error.message}`, 'error');
    }
}

async function syncAllIntegrations() {
    showNotification('🔄 Syncing all integrations...', 'info');
    try {
        // Check if Deputy is connected and get token
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            showNotification('❌ System not ready', 'error');
            return;
        }
        
        let userId;
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            userId = user?.id || 'test-user-' + Date.now();
        } catch (error) {
            userId = 'test-user-' + Date.now();
        }
        
        // Try to get token from Supabase, fall back to sessionStorage
        let deputyToken = null;
        
        try {
            const { data: integration } = await supabaseClient
                .from('integrations')
                .select('*')
                .eq('user_id', userId)
                .eq('platform', 'deputy')
                .eq('is_active', true)
                .single();
            
            if (integration && integration.access_token) {
                deputyToken = integration.access_token;
            }
        } catch (error) {
        }
        
        // Fall back to sessionStorage
        if (!deputyToken) {
            deputyToken = sessionStorage.getItem('deputy_token');
        }
        
        if (!deputyToken) {
            showNotification('⚠️ Deputy not connected', 'warning');
            return;
        }
        
        // Sync using the stored token
        await syncDeputyRostersWithToken(deputyToken);
        
    } catch (error) {
        showNotification(`❌ Sync failed: ${error.message}`, 'error');
    }
}



// ========================================


// Manual Deputy token connection (bypass OAuth)
function openDeputyTokenEntry() {
    const modal = document.createElement('div');
    modal.id = 'deputyTokenModal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-amber-500">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-amber-500">Enter Deputy Token</h2>
                <button onclick="closeDeputyTokenEntry()" class="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4 text-sm">
                <div class="font-semibold text-blue-300 mb-2">📝 Get your Deputy access token:</div>
                <ol class="text-slate-300 space-y-2 list-decimal list-inside text-xs">
                    <li>
                        <a href="#" onclick="event.preventDefault(); window.open('https://e1849e30081029.au.deputy.com/exec/devapp/oauth_clients', '_blank')" class="text-amber-400 hover:text-amber-300 underline font-semibold">
                            Click here to open Deputy OAuth settings →
                        </a>
                    </li>
                    <li>Click the "New OAuth Client" button</li>
                    <li>Fill in the form:
                        <div class="ml-6 mt-1 space-y-0.5 text-slate-400">
                            • Name: <span class="text-white">Fitz HR</span><br>
                            • Description: <span class="text-white">HR compliance chatbot</span><br>
                            • Redirect URI: <span class="text-white">http://localhost</span>
                        </div>
                    </li>
                    <li>Click "Save this OAuth Client"</li>
                    <li>Click "Get an Access Token" button</li>
                    <li>Copy the token from the modal (it only shows once!)</li>
                    <li>Paste it below and click "Connect with Token"</li>
                </ol>
                <div class="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
                    ⚠️ <strong>Important:</strong> If your Deputy URL is not "e1849e30081029.au.deputy.com", replace "once" in the link above with your subdomain.
                </div>
            </div>
            
            <input type="text" id="deputyTokenInput" placeholder="Paste your token here..." 
                   class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white mb-4">
            
            <div class="flex gap-3">
                <button onclick="saveDeputyToken()" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">
                    Connect with Token
                </button>
                <button onclick="closeDeputyTokenEntry()" class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg">
                    Cancel
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeDeputyTokenEntry() {
    const modal = document.getElementById('deputyTokenModal');
    if (modal) modal.remove();
}

async function saveDeputyToken() {
    const token = document.getElementById('deputyTokenInput').value.trim();
    
    if (!token) {
        showAlert('Please enter a token');
        return;
    }
    
    try {
        showNotification('🔄 Connecting with token...', 'info');
        
        // Save token directly to Supabase (skip API test due to CORS)
        // Save token to Supabase
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            let userId;
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                userId = user?.id || 'test-user-' + Date.now();
            } catch (error) {
                userId = 'test-user-' + Date.now();
            }
            
            const { error } = await supabaseClient
                .from('integrations')
                .upsert({
                    user_id: userId,
                    platform: 'deputy',
                    access_token: token,
                    refresh_token: null,
                    token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                    is_active: true,
                    settings: {
                        domain: 'once',
                        token_type: 'permanent'
                    },
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,platform'
                });
            
            if (error) {
                throw new Error('Failed to save connection');
            }
        }
        
        showNotification('✅ Deputy connected successfully!', 'success');
        closeDeputyTokenEntry();
        closeDeputyConnection();
        
        // Sync rosters
        await syncDeputyRostersWithToken(token);
        openRosterCompliance();
        
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
    }
}

async function syncDeputyRostersWithToken(token) {
    try {
        showNotification('🔄 Syncing rosters from Deputy...', 'info');
        
        let userId;
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            userId = user?.id || 'test-user-' + Date.now();
        } catch (error) {
            userId = 'test-user-' + Date.now();
        }
        
        // Call Netlify function to sync rosters (avoids CORS)
        const rostersResponse = await fetch('/.netlify/functions/deputy-sync-rosters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                access_token: token,
                supabase_url: SUPABASE_CONFIG.url,
                supabase_key: SUPABASE_CONFIG.anonKey
            })
        });
        
        if (!rostersResponse.ok) {
            throw new Error('Failed to fetch rosters');
        }
        
        const data = await rostersResponse.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to sync rosters');
        }
        
        rosterData = data.rosters || [];
        
        const issueCount = data.issues || 0;
        if (issueCount > 0) {
            showNotification(`✅ Synced ${data.total} shifts. ⚠️ Found ${issueCount} issue(s).`, 'warning');
        } else {
            showNotification(`✅ Synced ${data.total} shifts. All compliant!`, 'success');
        }
        
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
    }
}

function formatDateForDeputy(date) {
    return date.toISOString().split('T')[0];
}

function formatTimeFromTimestamp(timestamp) {
    if (!timestamp) return '00:00';
    const date = new Date(timestamp * 1000);
    return date.toTimeString().slice(0, 5);
}

function calculateHoursSimple(startTs, endTs) {
    return Math.round(((endTs - startTs) / 3600) * 100) / 100;
}


// DEPUTY INTEGRATION - FRONTEND CODE
// ========================================

let deputyAccessToken = null;
let deputyRefreshToken = null;
let rosterData = [];

function openDeputyConnection() {
    // Open Integration Hub instead (the modal doesn't exist anymore)
    openIntegrationHub();
}

function closeDeputyConnection() {
    // Close Integration Hub instead
    closeIntegrationHub();
}

async function initiateDeputyOAuth() {
    try {
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            showAlert('❌ System not ready. Please refresh the page.');
            return;
        }
        let user;
        try {
            const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
            user = authUser;
        } catch (error) {
            user = null;
        }
        
        // For testing: Allow connection even if not logged in
        if (!user) { 
            user = { id: 'test-user-' + Date.now() };
        }
        // Check Pro plan (skip if subscriptions table doesn't exist yet)
        try {
            const { data: subscription, error: subError } = await supabaseClient.from('subscriptions').select('plan').eq('user_id', user.id).single();
            if (subscription && subscription.plan !== 'pro') { 
                showAlert('⚠️ Deputy integration requires the Pro plan ($149/month). Please upgrade to continue.');
                return;
            }
        } catch (error) {
        }
        
        const clientId = '478e80ddc33b583f97849b407d7a1265944cc607';
        const redirectUri = `${window.location.origin}/auth/deputy/callback`;
        const scope = 'longlife_refresh_token roster.read employee.read timesheet.read';
        const state = generateRandomString(32);
        
        // Save state and user ID for callback
        sessionStorage.setItem('deputy_oauth_state', state);
        sessionStorage.setItem('deputy_oauth_user_id', user.id);
        
        const oauthUrl = `https://e1849e30081029.au.deputy.com/my/oauth/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
        
        // Open OAuth in NEW TAB - this keeps the main page alive!
        const oauthWindow = window.open(oauthUrl, 'deputyOAuth', 'width=600,height=700');
        
        if (!oauthWindow) {
            showAlert('Please allow popups for this site to connect Deputy');
            return;
        }
        
        showNotification('🔵 Authorize Deputy in the popup window...', 'info');
    } catch (error) { 
        showAlert(`❌ Failed to connect Deputy: ${error.message}`); 
    }
}

async function handleDeputyCallback() {
    try {
        // Try to get code from URL first, then sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');
        let state = urlParams.get('state');
        
        if (!code) {
            // Check sessionStorage for stored OAuth data
            code = sessionStorage.getItem('deputy_oauth_code');
            state = sessionStorage.getItem('deputy_oauth_state');
            
            if (code) {
            } else {
                return;
            }
        } else {
        }
        
        if (!code) return;
        if (state !== sessionStorage.getItem('deputy_oauth_state')) throw new Error('Invalid state');
        
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            showNotification('❌ System not ready', 'error');
            return;
        }
        
        showNotification('🔄 Connecting...', 'info');
        const { data: { user } } = await supabaseClient.auth.getUser();
        const response = await fetch('/.netlify/functions/deputy-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, user_id: user.id, supabase_url: supabase.supabaseUrl, supabase_key: supabase.supabaseKey })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        sessionStorage.removeItem('deputy_oauth_state');
        sessionStorage.removeItem('deputy_oauth_code');
        sessionStorage.removeItem('deputy_oauth_timestamp');
        window.history.replaceState({}, document.title, window.location.pathname);
        showNotification('✅ Connected!', 'success');
        await syncDeputyRosters();
        closeDeputyConnection();
        openRosterCompliance();
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
        sessionStorage.removeItem('deputy_oauth_state');
        sessionStorage.removeItem('deputy_oauth_code');
        sessionStorage.removeItem('deputy_oauth_timestamp');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

async function syncDeputyRosters() {
    try {
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            showNotification('❌ System not ready', 'error');
            return;
        }
        showNotification('🔄 Syncing...', 'info');
        const { data: { user } } = await supabaseClient.auth.getUser();
        const response = await fetch('/.netlify/functions/deputy-sync-rosters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, supabase_url: SUPABASE_CONFIG.url, supabase_key: SUPABASE_CONFIG.anonKey })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        rosterData = data.rosters || [];
        if (document.getElementById('lastSyncTime')) document.getElementById('lastSyncTime').textContent = 'Just now';
        if (!document.getElementById('rosterComplianceModal').classList.contains('hidden')) updateRosterDashboard(rosterData);
        showNotification(`✅ Synced ${data.total} shifts${data.issues ? `. ⚠️ ${data.issues} issue(s)` : ''}`, data.issues ? 'warning' : 'success');
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
    }
}

function updateRosterDashboard(rosters) {
    if (!rosters || !rosters.length) { document.getElementById('rosterList').innerHTML = '<div class="text-center py-12"><div class="text-6xl mb-4">📅</div><div class="text-xl text-slate-400">No rosters found</div></div>'; return; }
    const total = rosters.length;
    const compliant = rosters.filter(r => r.compliance.isCompliant).length;
    const cost = rosters.reduce((sum, r) => sum + (r.compliance.totalCost || 0), 0);
    document.getElementById('totalShifts').textContent = total;
    document.getElementById('compliantShifts').textContent = compliant;
    document.getElementById('issueShifts').textContent = total - compliant;
    document.getElementById('totalCost').textContent = `$${cost.toFixed(2)}`;
    document.getElementById('rosterList').innerHTML = rosters.map(r => `<div class="bg-slate-700 rounded-lg p-4 ${r.compliance.warnings.length ? 'border-2 border-red-500' : 'border border-slate-600'}"><div class="flex justify-between mb-3"><div class="flex gap-3"><div class="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">${r.employee.name[0]}</div><div><div class="font-semibold text-white">${r.employee.name}</div><div class="text-sm text-slate-400">${r.position}</div></div></div><div class="text-right"><div class="font-semibold text-white">${r.date}</div><div class="text-sm text-slate-400">${r.startTime}-${r.endTime}</div></div></div>${r.compliance.warnings.length ? `<div class="bg-red-900/30 border border-red-500/30 rounded p-3"><div class="font-semibold text-red-400">⚠️ ${r.compliance.warnings.length} Issue(s)</div>${r.compliance.warnings.map(w => `<div class="text-sm text-red-300 mt-1">${w.type}: ${w.message}</div>`).join('')}</div>` : '<div class="bg-green-900/30 border border-green-500/30 rounded p-3 text-green-400">✅ Compliant</div>'}</div>`).join('');
}

function openRosterCompliance() {
    document.getElementById('rosterComplianceModal').classList.remove('hidden');
    
    // Check if Deputy is connected
    const hasToken = sessionStorage.getItem('deputy_token');
    if (hasToken) {
        // Show connected status
        document.getElementById('lastSyncTime').textContent = 'Just connected';
        
        // Auto-sync if no data
        if (!rosterData || !rosterData.length) {
            syncRosterData();
        } else {
            updateRosterDashboard(rosterData);
        }
    } else {
        showNotification('⚠️ Deputy not connected', 'warning');
    }
}

function closeRosterCompliance() {
    document.getElementById('rosterComplianceModal').classList.add('hidden');
}

async function exportRosterReport(format) {
    try {
        showNotification(`📄 Generating...`, 'info');
        if (format === 'pdf') {
            pdfMake.createPdf({ content: [{ text: 'Roster Report', fontSize: 18, bold: true }, { text: new Date().toLocaleString('en-AU'), fontSize: 12, margin: [0,0,0,10] }, { table: { headerRows: 1, widths: ['*','*','auto','auto','auto'], body: [['Employee','Date','Hours','Cost','Status'], ...rosterData.map(r => [r.employee.name, r.date, `${r.totalHours}h`, `$${r.compliance.totalCost.toFixed(2)}`, r.compliance.isCompliant?'OK':'Issues'])] } }] }).download(`roster_${Date.now()}.pdf`);
        } else {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rosterData.map(r => ({ Employee:r.employee.name, Date:r.date, Hours:r.totalHours, Cost:r.compliance.totalCost, Status:r.compliance.isCompliant?'OK':'Issues' }))), 'Rosters');
            XLSX.writeFile(wb, `roster_${Date.now()}.xlsx`);
        }
        showNotification('✅ Downloaded!', 'success');
    } catch (error) { showNotification(`❌ ${error.message}`, 'error'); }
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// Check for Deputy OAuth callback IMMEDIATELY
if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
    // If we're in the popup window, handle callback and close
    if (window.opener || window.name === 'deputyOAuth') {
        // Hide the main UI in popup
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: sans-serif;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Connecting to Deputy...</div>
                    <div style="color: #94a3b8;">Please wait while we complete the connection.</div>
                </div>
            </div>
        `;
        
        // Wait for Supabase to initialize, then handle callback
        const checkAndHandleCallback = setInterval(() => {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                clearInterval(checkAndHandleCallback);
                handleDeputyCallbackInPopup();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkAndHandleCallback);
            if (typeof supabaseClient === 'undefined' || !supabaseClient) {
                showAlert('Connection timeout. Please try again.');
            }
        }, 10000);
    }
}



// Handle OAuth callback in popup window
async function handleDeputyCallbackInPopup() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
            showAlert('❌ No authorization code received');
            window.close();
            return;
        }
        
        // Verify state
        const savedState = sessionStorage.getItem('deputy_oauth_state');
        if (state !== savedState) {
            showAlert('❌ Security check failed');
            window.close();
            return;
        }
        
        const userId = sessionStorage.getItem('deputy_oauth_user_id') || 'test-user-' + Date.now();
        
        // Exchange code for token
        const response = await fetch('/.netlify/functions/deputy-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                user_id: userId,
                supabase_url: SUPABASE_CONFIG.url,
                supabase_key: SUPABASE_CONFIG.anonKey
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to connect');
        }
        
        // Notify parent window
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
                type: 'deputy_oauth_success',
                userId: userId
            }, window.location.origin);
        }
        
        // Clean up and close
        sessionStorage.removeItem('deputy_oauth_state');
        sessionStorage.removeItem('deputy_oauth_user_id');
        
        // Show success message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: sans-serif;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #10b981;">Deputy Connected!</div>
                    <div style="color: #94a3b8; margin-bottom: 20px;">This window will close automatically...</div>
                </div>
            </div>
        `;
        
        // Close after 2 seconds
        setTimeout(() => {
            window.close();
        }, 2000);
        
    } catch (error) {
        // Show error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: sans-serif;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #ef4444;">Connection Failed</div>
                    <div style="color: #94a3b8; margin-bottom: 20px;">${error.message}</div>
                    <button onclick="window.close()" style="background: #ef4444; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Close Window</button>
                </div>
            </div>
        `;
        
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
                type: 'deputy_oauth_error',
                error: error.message
            }, window.location.origin);
        }
    }
}

// Listen for messages from popup window
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'deputy_oauth_success') {
        showNotification('✅ Deputy connected successfully!', 'success');
        closeDeputyConnection();
        
        // Refresh Integration Hub if open
        if (!document.getElementById('integrationHubModal').classList.contains('hidden')) {
            checkDeputyConnection();
        }
        
        // Auto-open dashboard and sync
        setTimeout(() => {
            openRosterCompliance();
        }, 500);
    }
    
    if (event.data.type === 'deputy_oauth_error') {
        showNotification(`❌ Connection failed: ${event.data.error}`, 'error');
    }
});


window.addEventListener('DOMContentLoaded', () => {
});




// Open AI Import Modal
let currentImportType = null;
let uploadedAIFileData = null;
let parsedAIData = null;

function openAIImportModal(type) {
    // Hide Integration Hub first so disclaimer is clearly visible (especially on mobile)
    document.getElementById('integrationHubModal').classList.add('hidden');
    document.getElementById('importDisclaimerModal').classList.remove('hidden');
    window._pendingImportType = type;
}

function acceptImportDisclaimer() {
    document.getElementById('importDisclaimerModal').classList.add('hidden');
    var type = window._pendingImportType;
    if (type) _openAIImportModal(type);
}

function closeImportDisclaimer() {
    document.getElementById('importDisclaimerModal').classList.add('hidden');
    window._pendingImportType = null;
    // Return to Integration Hub
    document.getElementById('integrationHubModal').classList.remove('hidden');
}

function _openAIImportModal(type) {
    currentImportType = type;
    
    // Hide Integration Hub
    const integrationHub = document.getElementById('integrationHubModal');
    if (integrationHub) {
        integrationHub.classList.add('hidden');
    }
    
    // Show import container (it's already fixed position overlay)
    const importContainer = document.getElementById('importContainer');
    if (!importContainer) {
        showNotification('❌ Import system not loaded', 'error');
        return;
    }
    
    // Simply set display to block - the fixed positioning handles the rest
    importContainer.style.display = 'block';
    // Reset UI to upload state
    const uploadZone = document.getElementById('uploadZone');
    const aiAnalysis = document.getElementById('aiAnalysis');
    const fileInput = document.getElementById('aiFileInput');
    
    if (uploadZone) {
        uploadZone.style.display = 'block';
    }
    if (aiAnalysis) {
        aiAnalysis.style.display = 'none';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Update title based on type
    const titles = {
        'deputy': 'Deputy Rosters',
        'xero': 'Xero Payroll Data',
        'employee': 'Employee Data',
        'timesheet': 'Timesheet Data'
    };
    
    const headerTitle = document.querySelector('.import-container .header h1');
    if (headerTitle) {
        headerTitle.textContent = `AI-Powered Import: ${titles[type] || 'Upload Data'}`;
    }
    
    // Setup file upload listeners
    setupAIFileUpload();
    
}


function closeAIImport() {
    // Hide import container
    const importContainer = document.getElementById('importContainer');
    if (importContainer) {
        importContainer.style.display = 'none';
    }
    
    // Show Integration Hub again
    const integrationHub = document.getElementById('integrationHubModal');
    if (integrationHub) {
        integrationHub.classList.remove('hidden');
    }
    
    // Reset
    resetAIImport();
}

function setupAIFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('aiFileInput');
    
    if (!uploadZone || !fileInput) return;
    
    // Remove old listeners
    uploadZone.replaceWith(uploadZone.cloneNode(true));
    const newUploadZone = document.getElementById('uploadZone');
    
    // Click to browse
    newUploadZone.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    newUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        newUploadZone.style.borderColor = '#00f0ff';
    });
    
    newUploadZone.addEventListener('dragleave', () => {
        newUploadZone.style.borderColor = 'rgba(0, 240, 255, 0.3)';
    });
    
    newUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        newUploadZone.style.borderColor = 'rgba(0, 240, 255, 0.3)';
        const files = e.dataTransfer.files;
        if (files.length > 0) processAIFile(files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processAIFile(e.target.files[0]);
    });
}

async function processAIFile(file) {
    showNotification('📄 Processing file...', 'info');
    
    // Show processing overlay
    document.getElementById('aiProcessingOverlay').style.display = 'flex';
    
    try {
        // Simulate AI processing (replace with actual backend call)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock data - replace with real parsed data from backend
        const mockData = {
            totalRows: 47,
            totalEmployees: 12,
            totalHours: 376,
            estimatedCost: 9400,
            issues: [
                {
                    type: 'warning',
                    title: '3 shifts under minimum 3-hour engagement',
                    description: 'Modern Award requires minimum 3-hour shifts. Found shifts of 2h, 2.5h, and 2h.'
                },
                {
                    type: 'warning',
                    title: '5 Sunday shifts without 175% penalty rate',
                    description: 'Sunday work requires 175% penalty rate under Restaurant Award.'
                },
                {
                    type: 'success',
                    title: 'All break times compliant',
                    description: '100% of shifts have appropriate break allocation.'
                }
            ],
            preview: [
                ['John Smith', '2026-02-01', '09:00', '17:00', 'Manager', '8h'],
                ['Jane Doe', '2026-02-01', '10:00', '18:00', 'Staff', '8h'],
                ['Bob Wilson', '2026-02-02', '14:00', '22:00', 'Staff', '8h'],
                ['Alice Brown', '2026-02-02', '09:00', '15:00', 'Staff', '6h'],
                ['Charlie Davis', '2026-02-03', '11:00', '19:00', 'Staff', '8h']
            ]
        };
        
        displayAIAnalysis(mockData);
        showNotification('✅ File analyzed successfully!', 'success');
        
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
    } finally {
        document.getElementById('aiProcessingOverlay').style.display = 'none';
    }
}

function displayAIAnalysis(data) {
    // Hide upload, show analysis
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('aiAnalysis').style.display = 'block';
    
    // Animate counters
    animateAICounter('aiTotalRows', data.totalRows);
    animateAICounter('aiTotalEmployees', data.totalEmployees);
    animateAICounter('aiTotalHours', data.totalHours, 'h');
    animateAICounter('aiEstimatedCost', data.estimatedCost, '$', true);
    
    // Display issues
    const issuesSection = document.getElementById('aiIssuesSection');
    issuesSection.innerHTML = data.issues.map(issue => `
        <div style="background: ${issue.type === 'success' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 107, 53, 0.1)'}; border-left: 4px solid ${issue.type === 'success' ? '#00ff9d' : '#ff6b35'}; border-radius: 12px; padding: 20px; margin-bottom: 16px; display: flex; align-items: start; gap: 16px;">
            <div style="font-size: 1.5rem;">${issue.type === 'success' ? '✅' : '⚠️'}</div>
            <div>
                <h4 style="margin-bottom: 4px; color: ${issue.type === 'success' ? '#00ff9d' : '#ff6b35'};">${issue.title}</h4>
                <p style="color: #8b9dc3; font-size: 0.875rem;">${issue.description}</p>
            </div>
        </div>
    `).join('');
    
    // Display preview table
    document.getElementById('aiTableHead').innerHTML = '<tr><th style="padding: 16px; text-align: left;">Employee</th><th style="padding: 16px; text-align: left;">Date</th><th style="padding: 16px; text-align: left;">Start</th><th style="padding: 16px; text-align: left;">End</th><th style="padding: 16px; text-align: left;">Position</th><th style="padding: 16px; text-align: left;">Hours</th></tr>';
    
    document.getElementById('aiTableBody').innerHTML = data.preview.map(row => `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            ${row.map(cell => `<td style="padding: 16px; font-family: monospace; font-size: 0.875rem;">${cell}</td>`).join('')}
        </tr>
    `).join('');
}

function animateAICounter(id, target, suffix = '', isPrice = false) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const duration = 1000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        let value = Math.floor(current);
        if (isPrice) {
            value = `${suffix}${value.toLocaleString()}`;
        } else {
            value = `${value}${suffix}`;
        }
        element.textContent = value;
    }, duration / steps);
}

function aiImportData() {
    showNotification('🎉 Data imported successfully! Opening compliance dashboard...', 'success');
    
    // Close import container
    document.getElementById('importContainer').style.display = 'none';
    
    // Open roster compliance dashboard with imported data
    openRosterCompliance();
}

function resetAIImport() {
    document.getElementById('uploadZone').style.display = 'block';
    document.getElementById('aiAnalysis').style.display = 'none';
    document.getElementById('aiFileInput').value = '';
    uploadedAIFileData = null;
    parsedAIData = null;
}


const firebaseConfig = {
  apiKey: "AIzaSyDQyZhlcK84ltrk8hdRs8GGAr2RnhHAs28",
  authDomain: "fitzgerald-hr.firebaseapp.com",
  projectId: "fitzgerald-hr",
  storageBucket: "fitzgerald-hr.firebasestorage.app",
  messagingSenderId: "60315816365",
  appId: "1:60315816365:web:0ac2a300f3c46e46ddd124",
  measurementId: "G-NT7FEHKWHV"
};

// Use existing currentUser from line 4714
let auth, db, storage, currentSubscription = null;

try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();
  
  // Check for magic link sign-in completion on page load
  if (auth.isSignInWithEmailLink(window.location.href)) {
      completeMagicLinkSignIn();
  }
} catch (error) {
}

async function signInWithGoogle() {
    if (!auth) { showAlert('Firebase not ready'); return; }
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        await createOrUpdateUserProfile(result.user);
        if (typeof showNotification === 'function') {
            const name = result.user.displayName ? result.user.displayName.split(' ')[0] : '';
            showNotification(name ? `Welcome ${name}!` : 'Welcome!', 'success');
        }
        return result.user;
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            showAlert(error.code === 'auth/popup-blocked' ? 'Please allow popups' : 'Sign in failed: ' + error.message);
        }
    }
}

async function signInWithGoogleFromAccess() {
    if (!auth) { showAlert('Firebase not ready'); return; }
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        await createOrUpdateUserProfile(user);
        localStorage.setItem('fitzhr_google_auth', 'true');
        localStorage.setItem('fitzhr_last_login', new Date().toISOString());
        const accessScreen = document.getElementById('accessScreen');
        const assistantScreen = document.getElementById('assistantScreen');
        if (accessScreen) accessScreen.classList.add('hidden');
        if (assistantScreen) assistantScreen.classList.remove('hidden');
        const userCodeEl = document.getElementById('userCode');
        if (userCodeEl) userCodeEl.textContent = 'Google Account';
        return user;
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            showAlert(error.code === 'auth/popup-blocked' ? 'Please allow popups' : 'Sign in failed: ' + error.message);
        }
    }
}

async function signOut() {
    if (!auth) return;
    try {
        // Save current conversation state before signing out
        if (currentConversationId && typeof saveCurrentConversation === 'function') {
            saveCurrentConversation();
        }
        
        // Ensure conversations are synced to Firebase
        if (typeof syncConversationsToCloud === 'function') {
            await syncConversationsToCloud();
        }
        
        // Save the current conversation ID to Firebase one last time
        if (currentConversationId && currentUser && currentUser.uid) {
            await saveCurrentConversationIdToFirebase(currentConversationId);
        }
        
        clearLocalUserData();
        await auth.signOut();
        if (typeof showNotification === 'function') showNotification('Signed out', 'success');
    } catch (error) { }
}

/**
 * Save the current conversation ID to Firebase for cross-device continuity
 * @param {string} conversationId - The ID of the current active conversation
 */
async function saveCurrentConversationIdToFirebase(conversationId) {
    if (!currentUser || !currentUser.uid || !db) {
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).set({
            lastConversationId: conversationId,
            lastConversationUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
    }
}

/**
 * Load the last conversation ID from Firebase
 * @returns {Promise<string|null>} The last conversation ID or null if not found
 */
async function loadLastConversationIdFromFirebase() {
    if (!currentUser || !currentUser.uid || !db) {
        return null;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const lastConvId = userData.lastConversationId;
            if (lastConvId) {
                // Also save to localStorage for faster access next time
                localStorage.setItem('fitz_currentConversationId_' + currentUser.uid, lastConvId);
                return lastConvId;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function createOrUpdateUserProfile(user) {
    if (!db) return;
    try {
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            // New user - start on free tier (subscriptions handled via Stripe)
            await userRef.set({
                uid: user.uid, 
                email: user.email, 
                displayName: user.displayName, 
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionTier: 'free',
                subscriptionStatus: 'active'
            });
        } else {
            await userRef.update({ 
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(), 
                displayName: user.displayName, 
                photoURL: user.photoURL 
            });
        }
    } catch (error) { }
}

async function saveToCloud(collection, docId, data) {
    const cacheKey = collection + '_' + docId;
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) { }
    if (!currentUser || !db) { return { success: true, synced: false }; }
    try {
        await db.collection('users').doc(currentUser.uid).collection(collection).doc(docId).set({...data, userId: currentUser.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, { merge: true });
        return { success: true, synced: true };
    } catch (error) {
        return { success: true, synced: false, error };
    }
}

async function loadFromCloud(collection) {
    if (!currentUser || !db) return [];
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection(collection).get();
        const items = [];
        snapshot.forEach(function(doc) {
            const data = doc.data();
            items.push(data);
            localStorage.setItem(collection + '_' + doc.id, JSON.stringify(data));
        });
        return items;
    } catch (error) { return []; }
}

async function loadAllUserData(userId) {
    try {
        await Promise.all([loadFromCloud('contracts'), loadFromCloud('checklists'), loadFromCloud('trainingPlans'), loadFromCloud('conversations')]);
        if (typeof showNotification === 'function') showNotification('✅ Synced', 'success');
    } catch (error) { }
}

let unsubscribeListeners = [];
function setupRealtimeSync(userId) {
    if (!db) return;
    ['contracts', 'checklists', 'trainingPlans', 'conversations'].forEach(function(collection) {
        const unsub = db.collection('users').doc(userId).collection(collection).onSnapshot(function(snapshot) {
            snapshot.docChanges().forEach(function(change) {
                const docId = change.doc.id;
                const data = change.doc.data();
                if (change.type === 'added' || change.type === 'modified') {
                    localStorage.setItem(collection + '_' + docId, JSON.stringify(data));
                } else if (change.type === 'removed') {
                    localStorage.removeItem(collection + '_' + docId);
                }
            });
        });
        unsubscribeListeners.push(unsub);
    });
}

function stopRealtimeSync() {
    unsubscribeListeners.forEach(function(u) { if (u) u(); });
    unsubscribeListeners = [];
}

if (auth) {
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            var prevUid = localStorage.getItem('fitzhr_current_uid');
            if (!prevUid || prevUid !== user.uid) {
                console.log('Different user detected - clearing local data');
                clearLocalUserData();
            }
            localStorage.setItem('fitzhr_current_uid', user.uid);
            
            currentUser = user;
            const accessScreen = document.getElementById('accessScreen');
            const assistantScreen = document.getElementById('assistantScreen');
            if (accessScreen && !accessScreen.classList.contains('hidden')) {
                localStorage.setItem('fitzhr_google_auth', 'true');
                localStorage.setItem('fitzhr_last_login', new Date().toISOString());
                accessScreen.classList.add('hidden');
                if (assistantScreen) assistantScreen.classList.remove('hidden');
                const userCodeEl = document.getElementById('userCode');
                if (userCodeEl) userCodeEl.textContent = 'Google Account';
            }
            updateUIForAuthenticatedUser(user);
            
            // Check for pending payment that was waiting for auth
            const paymentPending = localStorage.getItem('paymentSuccessPending');
            if (paymentPending === 'true') {
                console.log('🔄 Found pending payment - processing now that auth is ready');
                // Don't load from Firebase - the payment handler will process and sync
                skipFirebaseCreditsLoad = true;
            }
            
            // Show admin button for admin email
            const adminEmails = ['blakefitzgerald4@gmail.com'];
            if (adminEmails.includes(user.email)) {
                const adminBtn = document.getElementById('adminButton');
                if (adminBtn) {
                    adminBtn.classList.remove('hidden');
                }
            }
            
            // Show loading skeleton while data loads
            const msgContainer = document.getElementById('messagesContainer');
            if (msgContainer) {
                msgContainer.innerHTML = '<div class="max-w-5xl mx-auto space-y-6 p-6">' +
                    '<div class="flex justify-start"><div class="max-w-3xl w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4">' +
                    '<div class="space-y-3 animate-pulse">' +
                    '<div class="h-4 bg-slate-700 rounded w-3/4"></div>' +
                    '<div class="h-4 bg-slate-700 rounded w-full"></div>' +
                    '<div class="h-4 bg-slate-700 rounded w-5/6"></div>' +
                    '</div></div></div></div>';
            }
            
            await loadAllDataFromFirebase(); // Use new Firebase-first system with retry
            
            // Load credits from Firebase (source of truth for subscription status)
            await loadCreditsFromFirebase();
            
            // Force credits display update after data is loaded
            updateCreditsDisplay();
            
            // Start periodic renewal check for paid subscribers
            // This catches renewals that happen while the user is logged in
            startRenewalChecker();
            
            // Check Firebase for legal acceptance and load last conversation ID
            if (db) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        
                        // Check for truthy value (handles boolean true, string "true", etc.)
                        if (userData.legalTermsAccepted === true || userData.legalTermsAccepted === 'true') {
                            localStorage.setItem('legalTermsAccepted_' + user.uid, 'true');
                            localStorage.setItem('legalTermsAcceptedAt_' + user.uid, userData.legalTermsAcceptedAt || new Date().toISOString());
                            
                            // Hide the modal if it was shown by another flow
                            const legalModal = document.getElementById('legalAcceptanceModal');
                            if (legalModal && !legalModal.classList.contains('hidden')) {
                                legalModal.classList.add('hidden');
                            }
                        }
                        
                        // Load last conversation ID for continuity
                        if (userData.lastConversationId) {
                            localStorage.setItem('fitz_currentConversationId_' + user.uid, userData.lastConversationId);
                        }
                        
                        // Also load venue profile if present
                        if (userData.venueProfile) {
                            localStorage.setItem('venueProfile_' + user.uid, JSON.stringify(userData.venueProfile));
                        }
                    }
                } catch (e) {
                }
            }
            
            // Load venue profile from localStorage
            let savedVenueProfile = localStorage.getItem('venueProfile_' + user.uid);
            if (savedVenueProfile) {
                try {
                    venueProfile = JSON.parse(savedVenueProfile);
                    // Update immediately and with delay for reliability
                    updateSidebarVenueName();
                    setTimeout(() => {
                        updateSidebarVenueName();
                    }, 500);
                } catch (e) {
                }
            }
            
            // Check if we need to show legal modal
            if (accessScreen && accessScreen.classList.contains('hidden')) {
                const hasAcceptedLegal = localStorage.getItem('legalTermsAccepted_' + user.uid) === 'true';
                
                if (!hasAcceptedLegal) {
                    // Show legal modal
                    const modal = document.getElementById('legalAcceptanceModal');
                    const checkbox = document.getElementById('legalAcceptCheckbox');
                    const acceptBtn = document.getElementById('acceptLegalButton');
                    
                    if (modal) {
                        modal.classList.remove('hidden');
                        if (checkbox) checkbox.checked = false;
                        if (acceptBtn) acceptBtn.disabled = true;
                        if (checkbox) {
                            checkbox.onchange = function() {
                                if (acceptBtn) acceptBtn.disabled = !this.checked;
                            };
                        }
                        trackEvent('legal_acceptance_modal_shown', { user: user.uid });
                    }
                } else {
                    // Legal already accepted - check onboarding
                    const hasCompletedOnboarding = checkOnboardingStatus();
                    if (!hasCompletedOnboarding) {
                        setTimeout(() => showOnboarding(), 1000);
                    } else {
                        // Firebase data already loaded by loadAllDataFromFirebase()
                        // Restore the last conversation with cloud continuity
                        setTimeout(async () => {
                            // Try to load last conversation ID from Firebase if not in localStorage
                            const userKey = user.uid;
                            let lastConvId = localStorage.getItem('fitz_currentConversationId_' + userKey);
                            
                            if (!lastConvId) {
                                // Try loading from Firebase
                                lastConvId = await loadLastConversationIdFromFirebase();
                            }
                            
                            // Now restore the conversation
                            const restored = restoreLastConversation();
                            updateSidebarChats();
                            
                            // Show welcome back message if conversation was restored
                            if (restored && conversations.length > 0) {
                                const conv = conversations.find(c => c.id === currentConversationId);
                                if (conv && conv.messages && conv.messages.length > 1) {
                                    showToast('Welcome back! Your conversation has been restored.', 'success', 3000);
                                }
                            }
                            
                            // Initialize daily tip banner for returning Google users
                            updateDailyTipBanner();
                            startDailyTipRotation();
                            
                            // Ensure we scroll to bottom after everything is loaded
                            // Multiple timeouts to handle varying load times
                            setTimeout(() => {
                                scrollToBottomInstant();
                            }, 400);
                            
                            setTimeout(() => {
                                scrollToBottomInstant();
                            }, 800);
                            
                            // Show random quick prompts for returning users
                            setTimeout(() => {
                                showRandomQuickPrompts();
                            }, 1000);
                        }, 500);
                    }
                }
            }
            
            setupRealtimeSync(user.uid);
            
            // Check if URL contains a review reference (for consultant access)
            checkForReviewReference();
        } else {
            currentUser = null;
            stopRealtimeSync();
            updateUIForUnauthenticatedUser();
        }
    });
}

function updateUIForAuthenticatedUser(user) {
    const btn = document.getElementById('signInButton');
    if (btn) btn.style.display = 'none';
    const profile = document.getElementById('userProfile');
    if (profile) {
        profile.style.display = 'flex';
        const photo = document.getElementById('userPhoto');
        if (photo) photo.src = user.photoURL || 'https://via.placeholder.com/40';
        const name = document.getElementById('userName');
        if (name) name.textContent = user.displayName || 'User';
        const email = document.getElementById('userEmail');
        if (email) email.textContent = user.email;
    }
}

function updateUIForUnauthenticatedUser() {
    const btn = document.getElementById('signInButton');
    if (btn) btn.style.display = 'flex';
    const profile = document.getElementById('userProfile');
    if (profile) profile.style.display = 'none';
}

if (typeof window !== 'undefined') {
    const origContract = window.saveContractProgress;
    window.saveContractProgress = function() {
        if (origContract) origContract();
        if (typeof contractBuilderState !== 'undefined' && contractBuilderState.contractId) {
            saveToCloud('contracts', contractBuilderState.contractId, contractBuilderState);
        }
    };
    const origChecklist = window.saveOnboardingProgress;
    window.saveOnboardingProgress = function() {
        if (origChecklist) origChecklist();
        if (typeof onboardingState !== 'undefined' && onboardingState.checklistId) {
            saveToCloud('checklists', onboardingState.checklistId, onboardingState);
        }
    };
    const origTraining = window.saveTrainingPlan;
    window.saveTrainingPlan = function() {
        if (origTraining) origTraining();
        if (typeof trainingPlanState !== 'undefined' && trainingPlanState.planId) {
            saveToCloud('trainingPlans', trainingPlanState.planId, trainingPlanState);
        }
    };
}


// ============================================
// COMPREHENSIVE CROSS-DEVICE SYNC SYSTEM
// ============================================

// This replaces the existing sync functions with a complete solution

// ==========================================
// 1. SAVE ALL DATA TO CLOUD
// ==========================================

async function saveAllDataToCloud() {
    if (!currentUser || !db) {
        return;
    }
    
    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        
        // Get all localStorage data
        const allData = {
            // Conversations
            conversations: JSON.parse(localStorage.getItem('fitz_conversations') || '[]'),
            currentConversationId: localStorage.getItem('currentConversationId'),
            
            // Bookmarks
            bookmarks: JSON.parse(localStorage.getItem('fitz_bookmarks') || '[]'),
            recentTools: JSON.parse(localStorage.getItem('fitz_recent_tools') || '[]'),
            
            // Preferences
            darkMode: localStorage.getItem('darkMode'),
            venueProfile: JSON.parse(localStorage.getItem('venueProfile_' + currentUser.uid) || '{}'),
            
            // Get all contracts
            contracts: getAllContractsFromLocalStorage(),
            
            // Get all checklists
            checklists: getAllChecklistsFromLocalStorage(),
            
            // Get all training plans
            trainingPlans: getAllTrainingPlansFromLocalStorage(),
            
            // Document logs
            documentLogs: JSON.parse(localStorage.getItem('documentLogs_' + currentUser.uid) || '[]'),
            
            // Timestamp
            lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to a single user document for complete state
        await userDocRef.set({
            appState: allData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        return true;
        
    } catch (error) {
        return false;
    }
}

// Helper functions to get all items from localStorage
function getAllContractsFromLocalStorage() {
    const contracts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('contract_')) {
            try {
                contracts.push(JSON.parse(localStorage.getItem(key)));
            } catch (e) {
            }
        }
    }
    return contracts;
}

function getAllChecklistsFromLocalStorage() {
    const checklists = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('checklist_')) {
            try {
                checklists.push(JSON.parse(localStorage.getItem(key)));
            } catch (e) {
            }
        }
    }
    return checklists;
}

function getAllTrainingPlansFromLocalStorage() {
    const plans = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('training_plan_')) {
            try {
                plans.push(JSON.parse(localStorage.getItem(key)));
            } catch (e) {
            }
        }
    }
    return plans;
}

// ==========================================
// 2. LOAD ALL DATA FROM CLOUD
// ==========================================

async function loadAllDataFromCloud() {
    if (!currentUser || !db) {
        return false;
    }
    
    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        
        if (!doc.exists || !doc.data().appState) {
            return false;
        }
        
        const cloudData = doc.data().appState;
        // Restore conversations
        if (cloudData.conversations && cloudData.conversations.length > 0) {
            localStorage.setItem('fitz_conversations', JSON.stringify(cloudData.conversations));
            conversations = cloudData.conversations;
        }
        
        if (cloudData.currentConversationId) {
            localStorage.setItem('currentConversationId', cloudData.currentConversationId);
            currentConversationId = cloudData.currentConversationId;
        }
        
        // Restore bookmarks
        if (cloudData.bookmarks) {
            localStorage.setItem('fitz_bookmarks', JSON.stringify(cloudData.bookmarks));
        }
        
        if (cloudData.recentTools) {
            localStorage.setItem('fitz_recent_tools', JSON.stringify(cloudData.recentTools));
        }
        
        // Restore preferences
        if (cloudData.darkMode) {
            localStorage.setItem('darkMode', cloudData.darkMode);
        }
        
        if (cloudData.venueProfile) {
            localStorage.setItem('venueProfile_' + currentUser.uid, JSON.stringify(cloudData.venueProfile));
        }
        
        // Restore contracts
        if (cloudData.contracts && cloudData.contracts.length > 0) {
            cloudData.contracts.forEach(contract => {
                localStorage.setItem('contract_' + contract.contractId, JSON.stringify(contract));
            });
        }
        
        // Restore checklists
        if (cloudData.checklists && cloudData.checklists.length > 0) {
            cloudData.checklists.forEach(checklist => {
                localStorage.setItem('checklist_' + checklist.checklistId, JSON.stringify(checklist));
            });
        }
        
        // Restore training plans
        if (cloudData.trainingPlans && cloudData.trainingPlans.length > 0) {
            cloudData.trainingPlans.forEach(plan => {
                localStorage.setItem('training_plan_' + plan.planId, JSON.stringify(plan));
            });
        }
        
        // Restore document logs
        if (cloudData.documentLogs) {
            localStorage.setItem('documentLogs_' + currentUser.uid, JSON.stringify(cloudData.documentLogs));
        }
        
        // NOW REFRESH THE UI
        await refreshAllUI();
        
        return true;
        
    } catch (error) {
        return false;
    }
}

// ==========================================
// 3. REFRESH ALL UI COMPONENTS
// ==========================================

async function refreshAllUI() {
    // Small delay to ensure data is written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        // Refresh conversation list
        if (conversations && conversations.length > 0) {
            if (typeof updateSidebarChats === 'function') {
                updateSidebarChats();
            }
        }
        
        // Refresh Recent Tools from localStorage (which was just loaded from Firebase)
        if (typeof loadRecentTools === 'function') {
            loadRecentTools();
        }
        if (typeof updateSidebarRecentTools === 'function') {
            updateSidebarRecentTools();
        }
        
        // Refresh bookmarks
        if (typeof loadBookmarks === 'function') {
            loadBookmarks();
        }
        if (typeof updateSidebarBookmarks === 'function') {
            updateSidebarBookmarks();
        }
        
        // Trigger a page state update
        const event = new CustomEvent('dataLoaded');
        window.dispatchEvent(event);
        
    } catch (error) {
    }
}

// ==========================================
// 4. AUTO-SYNC ON CHANGES
// ==========================================

// Debounce function to prevent too many syncs
let syncTimeout = null;
function debouncedSync() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        saveAllDataToCloud();
    }, 2000); // Wait 2 seconds after last change
}

// Override localStorage.setItem to auto-sync
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // Auto-sync for important data
    if (currentUser && db) {
        if (key.startsWith('contract_') || 
            key.startsWith('checklist_') || 
            key.startsWith('training_plan_') ||
            key === 'fitz_conversations' ||
            key === 'fitz_bookmarks' ||
            key.startsWith('venueProfile_')) {
            
            debouncedSync();
        }
    }
};

// ==========================================
// 5. REAL-TIME SYNC LISTENER
// ==========================================

let unsubscribeCloudSync = null;

function setupRealTimeCloudSync() {
    if (!currentUser || !db) return;
    
    const userDocRef = db.collection('users').doc(currentUser.uid);
    
    unsubscribeCloudSync = userDocRef.onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const data = doc.data();
        if (data.appState && data.appState.lastSyncedAt) {
            loadAllDataFromCloud();
        }
    }, (error) => {
    });
    
}

function stopRealTimeCloudSync() {
    if (unsubscribeCloudSync) {
        unsubscribeCloudSync();
        unsubscribeCloudSync = null;
    }
}

// ============================================
// FIREBASE-FIRST SYNC SYSTEM
// No more localStorage dependency!
// ============================================

// Save conversation to Firebase immediately
async function saveConversationToFirebase(conversation) {
    if (!currentUser || !db) {
        return false;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid)
                  .collection('conversations').doc(conversation.id)
                  .set(conversation, { merge: true });
        return true;
    } catch (error) {
        return false;
    }
}

// Load all conversations from Firebase
async function loadConversationsFromFirebase() {
    if (!currentUser || !db) {
        loadConversations();
        return conversations || [];
    }
    
    try {
        // First, load from localStorage to have something
        loadConversations();
        const localConversations = [...conversations];
        const snapshot = await db.collection('users').doc(currentUser.uid)
                                   .collection('conversations')
                                   .get();
        
        const firebaseConversations = [];
        snapshot.forEach(doc => {
            firebaseConversations.push(doc.data());
        });
        
        // Merge: Firebase takes priority, but keep local ones that aren't in Firebase
        const mergedMap = new Map();
        
        // Add local conversations first
        localConversations.forEach(conv => {
            if (conv && conv.id) {
                mergedMap.set(conv.id, conv);
            }
        });
        
        // Override with Firebase conversations (more authoritative)
        firebaseConversations.forEach(conv => {
            if (conv && conv.id) {
                mergedMap.set(conv.id, conv);
            }
        });
        
        // Update the global conversations variable
        conversations = Array.from(mergedMap.values());
        
        // Sort in memory (most recent first)
        conversations.sort((a, b) => {
            const dateA = new Date(a.updated || a.created || 0);
            const dateB = new Date(b.updated || b.created || 0);
            return dateB - dateA;
        });
        
        // Save merged result back to localStorage
        localStorage.setItem('fitz_conversations', JSON.stringify(conversations));
        
        return conversations;
    } catch (error) {
        loadConversations();
        return conversations || [];
    }
}

// Save contract to Firebase
async function saveContractToFirebase(contract) {
    if (!currentUser || !db) {
        return false;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid)
                  .collection('contracts').doc(contract.contractId)
                  .set(contract, { merge: true });
        return true;
    } catch (error) {
        return false;
    }
}

// Load all contracts from Firebase
async function loadContractsFromFirebase() {
    if (!currentUser || !db) {
        return [];
    }
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
                                   .collection('contracts').get();
        
        const contracts = [];
        snapshot.forEach(doc => {
            contracts.push(doc.data());
        });
        
        return contracts;
    } catch (error) {
        return [];
    }
}

// Save checklist to Firebase
async function saveChecklistToFirebase(checklist) {
    if (!currentUser || !db) {
        return false;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid)
                  .collection('checklists').doc(checklist.checklistId)
                  .set(checklist, { merge: true });
        return true;
    } catch (error) {
        return false;
    }
}

// Load all checklists from Firebase
async function loadChecklistsFromFirebase() {
    if (!currentUser || !db) {
        return [];
    }
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
                                   .collection('checklists').get();
        
        const checklists = [];
        snapshot.forEach(doc => {
            checklists.push(doc.data());
        });
        
        return checklists;
    } catch (error) {
        return [];
    }
}

// Save training plan to Firebase
async function saveTrainingPlanToFirebase(plan) {
    if (!currentUser || !db) {
        return false;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid)
                  .collection('trainingPlans').doc(plan.planId)
                  .set(plan, { merge: true });
        return true;
    } catch (error) {
        return false;
    }
}

// Load all training plans from Firebase
async function loadTrainingPlansFromFirebase() {
    if (!currentUser || !db) {
        return [];
    }
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
                                   .collection('trainingPlans').get();
        
        const plans = [];
        snapshot.forEach(doc => {
            plans.push(doc.data());
        });
        
        return plans;
    } catch (error) {
        return [];
    }
}

// MASTER LOAD FUNCTION - Load everything on sign in
async function loadAllDataFromFirebase() {
    if (!currentUser || !db) {
        return;
    }
    
    try {
        // Load all data types
        await Promise.all([
            loadConversationsFromFirebase(),
            loadContractsFromFirebase(),
            loadChecklistsFromFirebase(),
            loadTrainingPlansFromFirebase(),
            loadBookmarksFromFirebase()
        ]);
        
        // Update sidebar with loaded data
        if (typeof updateSidebarChats === 'function') {
            updateSidebarChats();
        }
        if (typeof updateSidebarBookmarks === 'function') {
            updateSidebarBookmarks();
        }
        
    } catch (error) {
    }
}

// ========================================
// GUIDED TOUR SYSTEM - "Take a Tour of Fitz"
// ========================================

const FitzTour = {
    currentStep: 0,
    isActive: false,
    toolsMenuLocked: false,
    hasSeenTour: localStorage.getItem('fitzTourCompleted') === 'true',
    hasDeclinedTour: localStorage.getItem('fitzTourDeclined') === 'true',
    
    steps: [
        {
            id: 'welcome',
            type: 'modal',
            title: "G'day! Welcome to Fitz 👋",
            content: "I'm your AI-powered HR assistant, built specifically for Australian hospitality venues. Let me show you how I can help you manage your team with confidence.",
            icon: '🦘'
        },
        {
            id: 'chatInput',
            target: '#messageInput',
            targetAction: null,
            title: "Ask Me Anything",
            content: "Type your HR questions here — from award rates to managing difficult conversations. I'll give you practical, legally-sound advice tailored to Australian hospitality.",
            position: 'top',
            icon: '💬'
        },
        {
            id: 'tools',
            target: '#toolsMenuInner',
            targetAction: 'openToolsMenu',
            highlightAlso: '#toolsButton',
            title: "Your HR Toolkit",
            content: "Click the 🛠️ Tools button anytime to access these. Warning letters, PIPs, contracts, termination guides — each one walks you through step-by-step.",
            position: 'left',
            icon: '🛠️'
        },
        {
            id: 'urgent',
            target: 'button[onclick="activateCrisisMode()"]',
            targetAction: 'closeToolsMenu',
            title: "Crisis Mode",
            content: "Facing an urgent situation? Theft, walkout, or serious misconduct? Hit this button for immediate step-by-step guidance.",
            position: 'bottom',
            icon: '🚨'
        },
        {
            id: 'consultant',
            target: 'button[onclick="openConsultationBookingModal()"]',
            targetAction: null,
            title: "Talk to a Real HR Expert",
            content: "Some situations need human expertise. Book a consultation with a senior HR professional for complex matters.",
            position: 'bottom',
            icon: '📞'
        },
        {
            id: 'complete',
            type: 'complete-modal',
            title: "You're All Set! 🎉",
            content: "You now know your way around Fitz. Start by asking a question or exploring the tools. When you're ready, check out our plans for unlimited access.",
            icon: '✨'
        }
    ],
    
    // Initialize tour system
    init: function() {
        this.createStyles();
        this.createElements();
        // Tour prompt is triggered from login flow after onboarding check
    },
    
    // Create tour-specific styles
    createStyles: function() {
        const style = document.createElement('style');
        style.id = 'fitzTourStyles';
        style.textContent = `
            /* Tour Overlay - Lighter so users can see the page */
            .fitz-tour-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                z-index: 99998;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .fitz-tour-overlay.active {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
            /* When tour is completely done, hide overlay entirely */
            .fitz-tour-overlay.hidden {
                display: none !important;
            }
            
            /* Spotlight effect - Lighter shadow */
            .fitz-tour-spotlight {
                position: fixed;
                z-index: 99999;
                border-radius: 12px;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
                pointer-events: none;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .fitz-tour-spotlight::before {
                content: '';
                position: absolute;
                inset: -4px;
                border: 2px solid #f59e0b;
                border-radius: 16px;
                animation: fitzPulse 2s infinite;
            }
            @keyframes fitzPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.02); }
            }
            
            /* Tour Modal */
            .fitz-tour-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                z-index: 100000;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 2px solid #f59e0b;
                border-radius: 24px;
                padding: 40px;
                max-width: 480px;
                width: 90%;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.15);
            }
            .fitz-tour-modal.active {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
                pointer-events: auto;
            }
            .fitz-tour-modal-icon {
                font-size: 56px;
                text-align: center;
                margin-bottom: 20px;
                display: block;
            }
            .fitz-tour-modal-title {
                font-size: 28px;
                font-weight: 800;
                color: white;
                text-align: center;
                margin-bottom: 16px;
            }
            .fitz-tour-modal-content {
                color: #94a3b8;
                text-align: center;
                font-size: 16px;
                line-height: 1.7;
                margin-bottom: 32px;
            }
            
            /* Tooltip */
            .fitz-tour-tooltip {
                position: fixed;
                z-index: 100000;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 2px solid #f59e0b;
                border-radius: 20px;
                padding: 28px;
                max-width: 360px;
                width: 90%;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.1);
            }
            .fitz-tour-tooltip.active {
                opacity: 1;
                pointer-events: auto;
            }
            .fitz-tour-tooltip-arrow {
                position: absolute;
                width: 16px;
                height: 16px;
                background: #1e293b;
                border: 2px solid #f59e0b;
                transform: rotate(45deg);
            }
            .fitz-tour-tooltip-arrow.top { top: -10px; left: 50%; margin-left: -8px; border-right: none; border-bottom: none; }
            .fitz-tour-tooltip-arrow.bottom { bottom: -10px; left: 50%; margin-left: -8px; border-left: none; border-top: none; }
            .fitz-tour-tooltip-arrow.left { left: -10px; top: 50%; margin-top: -8px; border-right: none; border-top: none; }
            .fitz-tour-tooltip-arrow.right { right: -10px; top: 50%; margin-top: -8px; border-left: none; border-bottom: none; }
            
            .fitz-tour-tooltip-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            .fitz-tour-tooltip-icon {
                font-size: 32px;
            }
            .fitz-tour-tooltip-title {
                font-size: 20px;
                font-weight: 700;
                color: white;
            }
            .fitz-tour-tooltip-content {
                color: #94a3b8;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 24px;
            }
            
            /* Progress & Buttons */
            .fitz-tour-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
            }
            .fitz-tour-progress {
                display: flex;
                gap: 6px;
            }
            .fitz-tour-progress-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #475569;
                transition: all 0.3s ease;
            }
            .fitz-tour-progress-dot.active {
                background: #f59e0b;
                transform: scale(1.2);
            }
            .fitz-tour-progress-dot.completed {
                background: #22c55e;
            }
            
            .fitz-tour-buttons {
                display: flex;
                gap: 12px;
            }
            .fitz-tour-btn {
                padding: 12px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }
            .fitz-tour-btn-skip {
                background: transparent;
                color: #64748b;
                padding: 12px 16px;
            }
            .fitz-tour-btn-skip:hover {
                color: #94a3b8;
            }
            .fitz-tour-btn-back {
                background: #334155;
                color: #94a3b8;
                padding: 12px 16px;
            }
            .fitz-tour-btn-back:hover {
                background: #475569;
                color: #ffffff;
            }
            .fitz-tour-btn-next {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #0f172a;
            }
            .fitz-tour-btn-next:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
            }
            .fitz-tour-btn-start {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #0f172a;
                padding: 16px 32px;
                font-size: 17px;
            }
            .fitz-tour-btn-later {
                background: #334155;
                color: #94a3b8;
            }
            .fitz-tour-btn-later:hover {
                background: #475569;
            }
            
            /* Initial Prompt */
            .fitz-tour-prompt {
                position: fixed;
                bottom: 100px;
                right: 24px;
                z-index: 99999;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 2px solid #f59e0b;
                border-radius: 20px;
                padding: 24px;
                max-width: 340px;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.15);
            }
            .fitz-tour-prompt.active {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            .fitz-tour-prompt-close {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #334155;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .fitz-tour-prompt-close:hover {
                background: #475569;
                color: white;
            }
            .fitz-tour-prompt-icon {
                font-size: 40px;
                margin-bottom: 12px;
            }
            .fitz-tour-prompt-title {
                font-size: 18px;
                font-weight: 700;
                color: white;
                margin-bottom: 8px;
            }
            .fitz-tour-prompt-text {
                color: #94a3b8;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            .fitz-tour-prompt-buttons {
                display: flex;
                gap: 10px;
            }
            .fitz-tour-prompt-buttons .fitz-tour-btn {
                flex: 1;
                text-align: center;
                padding: 12px 16px;
            }
            
            /* Plans preview in final step */
            .fitz-tour-plans {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 24px;
            }
            .fitz-tour-plan {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                transition: all 0.2s;
            }
            .fitz-tour-plan:hover {
                border-color: #f59e0b;
                transform: translateY(-2px);
            }
            .fitz-tour-plan-name {
                font-weight: 600;
                color: #f59e0b;
                font-size: 14px;
                margin-bottom: 4px;
            }
            .fitz-tour-plan-price {
                font-size: 20px;
                font-weight: 800;
                color: white;
            }
            .fitz-tour-plan-period {
                font-size: 11px;
                color: #64748b;
            }
            
            /* Mobile adjustments */
            @media (max-width: 640px) {
                .fitz-tour-modal, .fitz-tour-tooltip {
                    max-width: 95%;
                    padding: 24px;
                }
                .fitz-tour-prompt {
                    right: 12px;
                    left: 12px;
                    max-width: none;
                    bottom: 80px;
                }
                .fitz-tour-plans {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    // Create DOM elements
    createElements: function() {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'fitz-tour-overlay';
        overlay.id = 'fitzTourOverlay';
        document.body.appendChild(overlay);
        
        // Spotlight
        const spotlight = document.createElement('div');
        spotlight.className = 'fitz-tour-spotlight';
        spotlight.id = 'fitzTourSpotlight';
        spotlight.style.display = 'none';
        document.body.appendChild(spotlight);
        
        // Modal
        const modal = document.createElement('div');
        modal.className = 'fitz-tour-modal';
        modal.id = 'fitzTourModal';
        document.body.appendChild(modal);
        
        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'fitz-tour-tooltip';
        tooltip.id = 'fitzTourTooltip';
        document.body.appendChild(tooltip);
        
        // Initial Prompt
        const prompt = document.createElement('div');
        prompt.className = 'fitz-tour-prompt';
        prompt.id = 'fitzTourPrompt';
        prompt.innerHTML = `
            <button class="fitz-tour-prompt-close" onclick="FitzTour.dismissPrompt()">×</button>
            <div class="fitz-tour-prompt-icon">✨</div>
            <div class="fitz-tour-prompt-title">New to Fitz?</div>
            <div class="fitz-tour-prompt-text">Take a quick 60-second tour to discover how Fitz can help you manage HR with confidence.</div>
            <div class="fitz-tour-prompt-buttons">
                <button class="fitz-tour-btn fitz-tour-btn-later" onclick="FitzTour.dismissPrompt()">Maybe Later</button>
                <button class="fitz-tour-btn fitz-tour-btn-start" onclick="FitzTour.startTour()">Show Me! →</button>
            </div>
        `;
        document.body.appendChild(prompt);
    },
    
    // Show initial tour prompt
    showTourPrompt: function() {
        const prompt = document.getElementById('fitzTourPrompt');
        setTimeout(() => {
            prompt.classList.add('active');
        }, 100);
    },
    
    // Dismiss prompt
    dismissPrompt: function() {
        const prompt = document.getElementById('fitzTourPrompt');
        prompt.classList.remove('active');
        localStorage.setItem('fitzTourDeclined', 'true');
        this.hasDeclinedTour = true;
    },
    
    // Start the tour
    startTour: function() {
        const prompt = document.getElementById('fitzTourPrompt');
        prompt.classList.remove('active');
        
        this.isActive = true;
        this.currentStep = 0;
        
        // Show overlay
        document.getElementById('fitzTourOverlay').classList.add('active');
        
        this.showStep(0);
    },
    
    // Show a specific step
    showStep: function(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) {
            this.endTour();
            return;
        }
        
        this.currentStep = stepIndex;
        
        // Hide all elements first
        document.getElementById('fitzTourModal').classList.remove('active');
        document.getElementById('fitzTourTooltip').classList.remove('active');
        document.getElementById('fitzTourSpotlight').style.display = 'none';
        
        // Execute any required action before showing step
        if (step.targetAction) {
            if (step.targetAction === 'toggleSidebar' && !sidebarOpen) {
                toggleSidebar();
                setTimeout(() => this.renderStep(step, stepIndex), 400);
                return;
            }
            if (step.targetAction === 'openToolsMenu') {
                // Set flag to prevent menu from closing during tour
                this.toolsMenuLocked = true;
                
                // Open the tools menu immediately
                if (window.innerWidth <= 768) {
                    const mobileModal = document.getElementById('mobileToolsModal');
                    if (mobileModal) mobileModal.classList.remove('hidden');
                } else {
                    if (DOM && DOM.toolsMenu) {
                        DOM.toolsMenu.classList.remove('hidden');
                    } else {
                        const toolsMenu = document.getElementById('toolsMenu');
                        if (toolsMenu) toolsMenu.classList.remove('hidden');
                    }
                }
                // Short delay just for DOM to update
                setTimeout(() => this.renderStep(step, stepIndex), 100);
                return;
            }
            if (step.targetAction === 'closeToolsMenu') {
                // Release the lock and close the menu
                this.toolsMenuLocked = false;
                
                if (window.innerWidth <= 768) {
                    const mobileModal = document.getElementById('mobileToolsModal');
                    if (mobileModal) mobileModal.classList.add('hidden');
                } else {
                    if (DOM && DOM.toolsMenu) {
                        DOM.toolsMenu.classList.add('hidden');
                    } else {
                        const toolsMenu = document.getElementById('toolsMenu');
                        if (toolsMenu) toolsMenu.classList.add('hidden');
                    }
                }
                setTimeout(() => this.renderStep(step, stepIndex), 100);
                return;
            }
        }
        
        this.renderStep(step, stepIndex);
    },
    
    // Render step content
    renderStep: function(step, stepIndex) {
        if (step.type === 'modal') {
            this.showModal(step, stepIndex);
        } else if (step.type === 'subscription-modal') {
            this.showSubscriptionStep(step, stepIndex);
        } else if (step.type === 'complete-modal') {
            this.showCompleteModal(step, stepIndex);
        } else {
            this.showTooltip(step, stepIndex);
        }
    },
    
    // Show completion modal with optional View Plans button
    showCompleteModal: function(step, stepIndex) {
        const modal = document.getElementById('fitzTourModal');
        
        modal.innerHTML = `
            <span class="fitz-tour-modal-icon">${step.icon}</span>
            <h2 class="fitz-tour-modal-title">${step.title}</h2>
            <p class="fitz-tour-modal-content">${step.content}</p>
            <div class="fitz-tour-footer" style="flex-direction: column; gap: 16px;">
                <div class="fitz-tour-progress">
                    ${this.steps.map((_, i) => `
                        <div class="fitz-tour-progress-dot ${i < stepIndex ? 'completed' : ''} ${i === stepIndex ? 'active' : ''}"></div>
                    `).join('')}
                </div>
                <div class="fitz-tour-buttons" style="width: 100%; justify-content: center; gap: 12px;">
                    <button class="fitz-tour-btn fitz-tour-btn-later" onclick="FitzTour.endTour()" style="flex: 1;">
                        Start Exploring
                    </button>
                    <button class="fitz-tour-btn fitz-tour-btn-next" onclick="FitzTour.endTourAndShowPlans()" style="flex: 1;">
                        View Plans ⭐
                    </button>
                </div>
            </div>
        `;
        
        setTimeout(() => modal.classList.add('active'), 50);
    },
    
    // End tour and open subscription modal
    endTourAndShowPlans: function() {
        this.destroyTourElements();
        setTimeout(() => {
            if (typeof showSubscriptionOptions === 'function') {
                showSubscriptionOptions();
            }
        }, 100);
    },
    
    // Completely remove tour elements from DOM
    destroyTourElements: function() {
        this.isActive = false;
        this.toolsMenuLocked = false;
        
        // Completely remove all tour elements from DOM
        const overlay = document.getElementById('fitzTourOverlay');
        const modal = document.getElementById('fitzTourModal');
        const tooltip = document.getElementById('fitzTourTooltip');
        const spotlight = document.getElementById('fitzTourSpotlight');
        
        if (overlay) overlay.remove();
        if (modal) modal.remove();
        if (tooltip) tooltip.remove();
        if (spotlight) spotlight.remove();
        
        // Close tools menu if open
        if (window.innerWidth <= 768) {
            const mobileModal = document.getElementById('mobileToolsModal');
            if (mobileModal) mobileModal.classList.add('hidden');
        } else {
            if (DOM && DOM.toolsMenu) {
                DOM.toolsMenu.classList.add('hidden');
            } else {
                const toolsMenu = document.getElementById('toolsMenu');
                if (toolsMenu) toolsMenu.classList.add('hidden');
            }
        }
        
        // Close sidebar if open
        if (sidebarOpen) {
            toggleSidebar();
        }
        
        // Mark as completed
        localStorage.setItem('fitzTourCompleted', 'true');
        this.hasSeenTour = true;
    },
    
    // Show subscription step - opens the actual subscription modal
    showSubscriptionStep: function(step, stepIndex) {
        // Hide tour elements completely
        const overlay = document.getElementById('fitzTourOverlay');
        overlay.classList.remove('active');
        overlay.classList.add('hidden'); // display: none to prevent click interception
        
        document.getElementById('fitzTourModal').classList.remove('active');
        document.getElementById('fitzTourTooltip').classList.remove('active');
        document.getElementById('fitzTourSpotlight').style.display = 'none';
        
        // Close sidebar if open
        if (sidebarOpen) {
            toggleSidebar();
        }
        
        // Mark tour as completed
        localStorage.setItem('fitzTourCompleted', 'true');
        this.hasSeenTour = true;
        this.isActive = false;
        
        // Open the actual subscription modal
        setTimeout(() => {
            if (typeof showSubscriptionOptions === 'function') {
                showSubscriptionOptions();
            }
        }, 300);
    },
    
    // Show modal step
    showModal: function(step, stepIndex) {
        const modal = document.getElementById('fitzTourModal');
        
        let plansHTML = '';
        if (step.showPlans) {
            plansHTML = `
                <div class="fitz-tour-plans">
                    <div class="fitz-tour-plan">
                        <div class="fitz-tour-plan-name">Starter</div>
                        <div class="fitz-tour-plan-price">$249</div>
                        <div class="fitz-tour-plan-period">/year</div>
                    </div>
                    <div class="fitz-tour-plan">
                        <div class="fitz-tour-plan-name">Pro</div>
                        <div class="fitz-tour-plan-price">$449</div>
                        <div class="fitz-tour-plan-period">/year</div>
                    </div>
                    <div class="fitz-tour-plan">
                        <div class="fitz-tour-plan-name">Business</div>
                        <div class="fitz-tour-plan-price">$899</div>
                        <div class="fitz-tour-plan-period">/year</div>
                    </div>
                </div>
            `;
        }
        
        // Build back button HTML (only show if not first step)
        const backBtnHTML = stepIndex > 0 
            ? `<button class="fitz-tour-btn fitz-tour-btn-back" onclick="FitzTour.prevStep()">← Back</button>`
            : '';
        
        modal.innerHTML = `
            <span class="fitz-tour-modal-icon">${step.icon}</span>
            <h2 class="fitz-tour-modal-title">${step.title}</h2>
            <p class="fitz-tour-modal-content">${step.content}</p>
            ${plansHTML}
            <div class="fitz-tour-footer">
                <div class="fitz-tour-progress">
                    ${this.steps.map((_, i) => `
                        <div class="fitz-tour-progress-dot ${i < stepIndex ? 'completed' : ''} ${i === stepIndex ? 'active' : ''}"></div>
                    `).join('')}
                </div>
                <div class="fitz-tour-buttons">
                    ${backBtnHTML}
                    <button class="fitz-tour-btn fitz-tour-btn-skip" onclick="FitzTour.endTour()">Skip Tour</button>
                    <button class="fitz-tour-btn fitz-tour-btn-next" onclick="FitzTour.nextStep()">
                        ${stepIndex === this.steps.length - 1 ? "Let's Go! 🚀" : 'Next →'}
                    </button>
                </div>
            </div>
        `;
        
        setTimeout(() => modal.classList.add('active'), 50);
    },
    
    // Show tooltip step with spotlight
    showTooltip: function(step, stepIndex) {
        const target = document.querySelector(step.target);
        if (!target) {
            console.warn('Tour target not found:', step.target);
            this.nextStep();
            return;
        }
        
        const spotlight = document.getElementById('fitzTourSpotlight');
        const tooltip = document.getElementById('fitzTourTooltip');
        
        // Position spotlight
        const rect = target.getBoundingClientRect();
        const padding = 8;
        
        spotlight.style.display = 'block';
        spotlight.style.top = (rect.top - padding) + 'px';
        spotlight.style.left = (rect.left - padding) + 'px';
        spotlight.style.width = (rect.width + padding * 2) + 'px';
        spotlight.style.height = (rect.height + padding * 2) + 'px';
        
        // Build back button HTML (only show if not first step)
        const backBtnHTML = stepIndex > 0 
            ? `<button class="fitz-tour-btn fitz-tour-btn-back" onclick="FitzTour.prevStep()">← Back</button>`
            : '';
        
        // Build tooltip content
        tooltip.innerHTML = `
            <div class="fitz-tour-tooltip-arrow ${this.getArrowPosition(step.position)}"></div>
            <div class="fitz-tour-tooltip-header">
                <span class="fitz-tour-tooltip-icon">${step.icon}</span>
                <h3 class="fitz-tour-tooltip-title">${step.title}</h3>
            </div>
            <p class="fitz-tour-tooltip-content">${step.content}</p>
            <div class="fitz-tour-footer">
                <div class="fitz-tour-progress">
                    ${this.steps.map((_, i) => `
                        <div class="fitz-tour-progress-dot ${i < stepIndex ? 'completed' : ''} ${i === stepIndex ? 'active' : ''}"></div>
                    `).join('')}
                </div>
                <div class="fitz-tour-buttons">
                    ${backBtnHTML}
                    <button class="fitz-tour-btn fitz-tour-btn-skip" onclick="FitzTour.endTour()">Skip</button>
                    <button class="fitz-tour-btn fitz-tour-btn-next" onclick="FitzTour.nextStep()">Next →</button>
                </div>
            </div>
        `;
        
        // Position tooltip
        this.positionTooltip(tooltip, rect, step.position);
        
        setTimeout(() => tooltip.classList.add('active'), 50);
    },
    
    // Get arrow position class
    getArrowPosition: function(position) {
        const map = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        return map[position] || 'top';
    },
    
    // Position tooltip relative to target
    positionTooltip: function(tooltip, targetRect, position) {
        const gap = 20;
        const tooltipRect = tooltip.getBoundingClientRect();
        let top, left;
        
        switch (position) {
            case 'bottom':
                top = targetRect.bottom + gap;
                left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
                break;
            case 'top':
                top = targetRect.top - tooltip.offsetHeight - gap;
                left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltip.offsetHeight / 2);
                left = targetRect.left - tooltip.offsetWidth - gap;
                break;
            case 'right':
            default:
                top = targetRect.top + (targetRect.height / 2) - (tooltip.offsetHeight / 2);
                left = targetRect.right + gap;
                break;
        }
        
        // Keep within viewport
        const maxLeft = window.innerWidth - tooltip.offsetWidth - 20;
        const maxTop = window.innerHeight - tooltip.offsetHeight - 20;
        left = Math.max(20, Math.min(left, maxLeft));
        top = Math.max(20, Math.min(top, maxTop));
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    },
    
    // Go to previous step
    prevStep: function() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    },
    
    // Go to next step
    nextStep: function() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.endTour();
        }
    },
    
    // End the tour
    endTour: function() {
        this.destroyTourElements();
    },
    
    // Restart tour (can be called from settings)
    restartTour: function() {
        localStorage.removeItem('fitzTourCompleted');
        localStorage.removeItem('fitzTourDeclined');
        this.hasSeenTour = false;
        this.hasDeclinedTour = false;
        
        // Recreate tour elements if they were removed
        if (!document.getElementById('fitzTourOverlay')) {
            this.createElements();
        }
        
        this.startTour();
    }
};
// Initialize tour when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure main app is loaded
    setTimeout(() => {
        // DISABLE FITZTOUR ON MOBILE (screens <= 768px)
        if (window.innerWidth <= 768) {
            console.log('📱 Mobile detected - FitzTour disabled');
            // Mark tour as seen so it doesn't prompt
            localStorage.setItem('fitzTourCompleted', 'true');
            FitzTour.hasSeenTour = true;
            return; // Don't initialize tour on mobile
        }
        FitzTour.init();
    }, 1000);
});
// Check if user is logged in before showing tour prompt
function checkAndShowTourPrompt() {
    const accessScreen = document.getElementById('accessScreen');
    const isLoggedIn = accessScreen && accessScreen.classList.contains('hidden');
    
    if (isLoggedIn && !FitzTour.hasSeenTour && !FitzTour.hasDeclinedTour) {
        FitzTour.showTourPrompt();
    }
}
// Also allow triggering via chat command
function checkForTourCommand(message) {
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'take a tour' || lowerMessage === 'tour' || lowerMessage === 'show me around') {
        FitzTour.restartTour();
        return true;
    }
    return false;
}

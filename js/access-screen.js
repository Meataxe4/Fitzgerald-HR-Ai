// Smart view switching based on returning user
function initAccessScreen() {
    const isReturning = localStorage.getItem('fitzhr_returning') === 'true' || 
                        localStorage.getItem('fitzhr_google_auth') === 'true' ||
                        localStorage.getItem('fitzhr_last_login');
    
    if (isReturning) {
        showReturningView();
    }
}

function showReturningView() {
    document.getElementById('newVisitorView').classList.add('hidden');
    document.getElementById('returningVisitorView').classList.remove('hidden');
    document.getElementById('featuresSection').classList.add('hidden');
}

function showNewVisitorView() {
    document.getElementById('returningVisitorView').classList.add('hidden');
    document.getElementById('newVisitorView').classList.remove('hidden');
    document.getElementById('featuresSection').classList.remove('hidden');
}

function continueWithEmail() {
    const email = document.getElementById('emailInput').value.trim();
    
    if (!email) {
        showAlert('Please enter your email address');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showAlert('Please enter a valid email address');
        return;
    }
    
    // Send magic link
    sendMagicLink(email);
}

async function sendMagicLink(email) {
    if (!auth) { 
        showAlert('Authentication not ready. Please refresh the page.'); 
        return; 
    }
    
    // Show loading state
    const emailBtn = document.querySelector('#newVisitorView button[onclick="continueWithEmail()"]');
    const originalText = emailBtn ? emailBtn.innerHTML : '';
    if (emailBtn) {
        emailBtn.innerHTML = '<span class="animate-pulse">Sending link...</span>';
        emailBtn.disabled = true;
    }
    
    const actionCodeSettings = {
        // URL to redirect to after email link click - must be whitelisted in Firebase Console
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true
    };
    
    try {
        await auth.sendSignInLinkToEmail(email, actionCodeSettings);
        
        // Save email locally to complete sign-in after redirect
        localStorage.setItem('fitzEmailForSignIn', email);
        localStorage.setItem('fitzhr_returning', 'true');
        
        // Show success state
        showMagicLinkSent(email);
        
    } catch (error) {
        console.error('Magic link error:', error);
        
        // Restore button
        if (emailBtn) {
            emailBtn.innerHTML = originalText;
            emailBtn.disabled = false;
        }
        
        if (error.code === 'auth/invalid-email') {
            showAlert('Please enter a valid email address');
        } else if (error.code === 'auth/unauthorized-continue-uri') {
            showAlert('Configuration error. Please contact support.');
        } else {
            showAlert('Could not send sign-in link. Please try again or use Google sign-in.');
        }
    }
}

function showMagicLinkSent(email) {
    const newVisitorView = document.getElementById('newVisitorView');
    if (!newVisitorView) return;
    
    // Find the sign-in card and replace its content
    const signInCard = newVisitorView.querySelector('.bg-slate-800\\/50.backdrop-blur-sm');
    if (signInCard) {
        signInCard.innerHTML = `
            <div class="text-center py-4">
                <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <h2 class="text-xl font-semibold text-white mb-2">Check your inbox!</h2>
                <p class="text-slate-400 text-sm mb-4">We sent a sign-in link to:</p>
                <p class="text-amber-400 font-medium mb-6">${email}</p>
                <p class="text-slate-500 text-xs mb-4">Click the link in your email to sign in.<br>The link expires in 1 hour.</p>
                <div class="border-t border-slate-700 pt-4 mt-4">
                    <p class="text-slate-500 text-xs mb-2">Didn't receive it?</p>
                    <button onclick="resendMagicLink('${email}')" class="text-amber-500 hover:text-amber-400 text-sm font-medium">
                        Resend link
                    </button>
                    <span class="text-slate-600 mx-2">•</span>
                    <button onclick="resetEmailSignIn()" class="text-slate-400 hover:text-white text-sm">
                        Try different email
                    </button>
                </div>
            </div>
        `;
    }
}

function resendMagicLink(email) {
    showToast('Sending new link...', 'info', 2000);
    sendMagicLink(email);
}

function resetEmailSignIn() {
    // Reload the page to reset the form
    localStorage.removeItem('fitzEmailForSignIn');
    window.location.reload();
}

// Check for magic link sign-in on page load
async function completeMagicLinkSignIn() {
    if (!auth) return;
    
    // Check if the URL is a sign-in link
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = localStorage.getItem('fitzEmailForSignIn');
        
        // If email is not in localStorage, prompt user
        if (!email) {
            email = window.prompt('Please enter your email to complete sign-in:');
        }
        
        if (!email) return;
        
        try {
            const result = await auth.signInWithEmailLink(email, window.location.href);
            
            // Clear the email from storage
            localStorage.removeItem('fitzEmailForSignIn');
            localStorage.setItem('fitzhr_returning', 'true');
            localStorage.setItem('fitzhr_last_login', new Date().toISOString());
            
            // Create/update user profile
            await createOrUpdateUserProfile(result.user);
            
            // Clean up URL (remove the sign-in parameters)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Show assistant screen
            const accessScreen = document.getElementById('accessScreen');
            const assistantScreen = document.getElementById('assistantScreen');
            if (accessScreen) accessScreen.classList.add('hidden');
            if (assistantScreen) assistantScreen.classList.remove('hidden');
            
            // Welcome notification
            if (typeof showNotification === 'function') {
                showNotification('Welcome! Signed in successfully.', 'success');
            }
            
        } catch (error) {
            console.error('Magic link sign-in error:', error);
            localStorage.removeItem('fitzEmailForSignIn');
            
            if (error.code === 'auth/invalid-action-code') {
                showAlert('This sign-in link has expired or already been used. Please request a new one.');
            } else if (error.code === 'auth/invalid-email') {
                showAlert('Email mismatch. Please use the same email you requested the link for.');
            } else {
                showAlert('Sign-in failed. Please try again.');
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure DOM is ready
    setTimeout(initAccessScreen, 100);
});

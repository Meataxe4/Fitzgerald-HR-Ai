// ========================================
// CAPTURE OAUTH CALLBACK IMMEDIATELY
// ========================================
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (code && state) {
        sessionStorage.setItem('deputy_oauth_code', code);
        sessionStorage.setItem('deputy_oauth_state', state);
        sessionStorage.setItem('deputy_oauth_timestamp', Date.now().toString());
    } else if (error) {
        sessionStorage.setItem('deputy_oauth_error', error);
    }
})();

function checkAccess() {
    var code = document.getElementById('accessCode').value.trim().toUpperCase();
    var rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;
    var errorEl = document.getElementById('accessError');
    var validCodes = ['BETA-VENUE-001', 'BETA-VENUE-002', 'BETA-VENUE-003', 'BETA-VENUE-004', 'BETA-VENUE-005', 'FITZ-TEST', 'DEMO-2025'];
    
    if (!code) {
        if (errorEl) {
            errorEl.textContent = 'Please enter an access code';
            errorEl.classList.remove('hidden');
        }
        return;
    }
    
    if (validCodes.includes(code)) {
        localStorage.setItem('fitzhr_access_code', code);
        if (rememberMe) localStorage.setItem('fitzhr_remember_me', 'true');
        localStorage.setItem('fitzhr_last_login', new Date().toISOString());
        
        var accessScreen = document.getElementById('accessScreen');
        var assistantScreen = document.getElementById('assistantScreen');
        if (accessScreen) accessScreen.classList.add('hidden');
        if (assistantScreen) assistantScreen.classList.remove('hidden');
        
        var userCodeEl = document.getElementById('userCode');
        if (userCodeEl) userCodeEl.textContent = code;
        
        window.currentUser = code;
        
        if (typeof initConversationSystem === 'function') {
            initConversationSystem();
        }
    } else {
        if (errorEl) {
            errorEl.textContent = 'Invalid access code. Please check and try again.';
            errorEl.classList.remove('hidden');
        }
    }
}

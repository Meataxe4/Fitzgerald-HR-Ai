// ============================================
// LAUNCH GATE CONFIGURATION
// ============================================
const LAUNCH_MODE = false; // ← SITE IS LIVE

const LAUNCH_PASSWORD_HASH = 'e9f5e778011fa55514350a71e6f0508368db8cd9eedb13802bdd93d02e44aaf6';

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function initLaunchGate() {
    if (!LAUNCH_MODE) {
        const gate = document.getElementById('launchGate');
        if (gate) gate.remove();
        return;
    }
    const hasAccess = localStorage.getItem('fitz_launch_access') === 'granted';
    if (hasAccess) {
        const gate = document.getElementById('launchGate');
        if (gate) gate.remove();
    }
}

function showLaunchPassword() {
    document.getElementById('launchGateComingSoon').classList.add('hidden');
    document.getElementById('launchGatePassword').classList.remove('hidden');
    document.getElementById('launchPasswordInput').focus();
}

function hideLaunchPassword() {
    document.getElementById('launchGatePassword').classList.add('hidden');
    document.getElementById('launchGateComingSoon').classList.remove('hidden');
}

async function checkLaunchPassword() {
    const input = document.getElementById('launchPasswordInput');
    const error = document.getElementById('launchPasswordError');
    const inputHash = await hashPassword(input.value);
    if (inputHash === LAUNCH_PASSWORD_HASH) {
        localStorage.setItem('fitz_launch_access', 'granted');
        const gate = document.getElementById('launchGate');
        if (gate) {
            gate.style.opacity = '0';
            gate.style.transition = 'opacity 0.3s';
            setTimeout(() => gate.remove(), 300);
        }
    } else {
        error.classList.remove('hidden');
        input.classList.add('border-red-500');
        setTimeout(() => {
            error.classList.add('hidden');
            input.classList.remove('border-red-500');
        }, 3000);
    }
}

function submitLaunchEmail() {
    const email = document.getElementById('launchEmailInput').value.trim();
    if (email && email.includes('@')) {
        const emails = JSON.parse(localStorage.getItem('fitz_launch_emails') || '[]');
        if (!emails.includes(email)) {
            emails.push(email);
            localStorage.setItem('fitz_launch_emails', JSON.stringify(emails));
        }
        document.getElementById('launchEmailSuccess').classList.remove('hidden');
        document.getElementById('launchEmailInput').value = '';
    }
}

initLaunchGate();

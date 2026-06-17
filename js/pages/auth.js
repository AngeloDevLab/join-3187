import { validateField, setError, isValidEmail } from '../utils/form-validation.js';
import { loginUser, registerUser, loginAsGuest } from '../firebase/auth.js';
import { showToast } from '../components/toast.js';

const INTRO_DELAY_MS = 400;
const INTRO_MOVE_MS = 600;
const INTRO_FADE_MS = 400;

const PASSWORD_ICON = {
    static: './assets/icons/lock.svg',
    hidden: { src: './assets/icons/visibility_off.svg', label: 'Show password' },
    visible: { src: './assets/icons/visibility.svg', label: 'Hide password' },
};



document.addEventListener('DOMContentLoaded', () => {
    initIntro();
    initAuthSwitch();
    initPasswordToggles();
    initLoginForm();
    initSignupForm();
});


// ── Toast & Redirect ─────────────────────────────────────

/**
 * @param {HTMLElement} cardEl
 * @param {string} message
 * @param {string} href
 */
function exitAndRedirect(cardEl, message, href) {
    cardEl.style.transition = 'opacity 300ms ease';
    cardEl.style.opacity = '0';
    setTimeout(() => {
        showToast(message);
        setTimeout(() => { window.location.href = href; }, 1200);
    }, 300);
}


// ── Intro ────────────────────────────────────────────────

/**
 * @param {HTMLElement} intro
 */
function playIntro(intro) {
    setTimeout(() => {
        intro.classList.add('intro-animate');
        setTimeout(() => {
            intro.classList.add('intro-hidden');
            setTimeout(() => intro.remove(), INTRO_FADE_MS);
        }, INTRO_MOVE_MS);
    }, INTRO_DELAY_MS);
}

/** Plays the intro animation on page load. No-ops if the element is absent. */
function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;
    playIntro(intro);
}


// ── Auth Switch ──────────────────────────────────────────

/**
 * @param {'login'|'signup'} view
 */
function showAuthCard(view) {
    const showSignup = view === 'signup';
    document.getElementById('loginView').classList.toggle('is-hidden', showSignup);
    document.getElementById('signupCard').classList.toggle('is-hidden', !showSignup);
    document.getElementById('signupHintHeader').classList.toggle('is-hidden', showSignup);
}

function initAuthSwitch() {
    document.querySelectorAll('[data-show-auth]').forEach((trigger) => {
        trigger.addEventListener('click', () => showAuthCard(trigger.dataset.showAuth));
    });
}


// ── Password Toggle ──────────────────────────────────────

/**
 * @param {HTMLInputElement} input
 * @param {HTMLButtonElement} button
 * @param {HTMLImageElement} icon
 */
function updatePasswordToggle(input, button, icon) {
    if (!input.value) {
        input.type = 'password';
        button.disabled = true;
        button.removeAttribute('aria-label');
        icon.src = PASSWORD_ICON.static;
        return;
    }
    const state = input.type === 'password' ? PASSWORD_ICON.hidden : PASSWORD_ICON.visible;
    button.disabled = false;
    button.setAttribute('aria-label', state.label);
    icon.src = state.src;
}

/**
 * @param {HTMLElement} wrapper
 */
function initPasswordToggle(wrapper) {
    const input = wrapper.querySelector('input[type="password"]');
    const button = wrapper.querySelector('.input-icon-btn');
    const icon = button?.querySelector('img');
    if (!input || !button || !icon) return;
    button.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
        updatePasswordToggle(input, button, icon);
    });
    input.addEventListener('input', () => updatePasswordToggle(input, button, icon));
}

function initPasswordToggles() {
    document.querySelectorAll('.input-wrapper').forEach((wrapper) => {
        if (wrapper.querySelector('input[type="password"]')) initPasswordToggle(wrapper);
    });
}


// ── Password Strength ────────────────────────────────────

// ── Login Form ───────────────────────────────────────────

/**
 * @param {SubmitEvent} e
 * @param {{ emailInput: HTMLInputElement, emailError: HTMLElement, passwordInput: HTMLInputElement, passwordError: HTMLElement }} fields
 */
async function handleLoginSubmit(e, fields) {
    e.preventDefault();
    const valid = [
        validateField(fields.emailInput, fields.emailError, isValidEmail(fields.emailInput.value), 'Please enter a valid email address.'),
        validateField(fields.passwordInput, fields.passwordError, !!fields.passwordInput.value.trim(), 'Please enter your password.'),
    ].every(Boolean);
    if (!valid) return;
    try {
        await loginUser(fields.emailInput.value);
        exitAndRedirect(document.getElementById('loginCard'), "You're logged in!", 'pages/summary.html');
    } catch (err) {
        setError(fields.emailInput.closest('.input-wrapper'), fields.emailError, err.message);
    }
}

function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const fields = {
        emailInput: form.querySelector('input[type="email"]'),
        emailError: document.getElementById('loginEmailError'),
        passwordInput: form.querySelector('input[type="password"]'),
        passwordError: document.getElementById('loginPasswordError'),
    };
    document.getElementById('guestLoginBtn').addEventListener('click', () => {
        loginAsGuest();
        exitAndRedirect(document.getElementById('loginCard'), 'Logged in as guest!', 'pages/summary.html');
    });
    form.addEventListener('submit', (e) => handleLoginSubmit(e, fields));
}


// ── Signup Form ──────────────────────────────────────────

/**
 * @param {HTMLFormElement} form
 * @returns {{ nameInput: HTMLInputElement, nameError: HTMLElement, emailInput: HTMLInputElement, emailError: HTMLElement, passwordInput: HTMLInputElement, passwordError: HTMLElement, confirmInput: HTMLInputElement, confirmError: HTMLElement, checkbox: HTMLInputElement, checkboxError: HTMLElement }}
 */
function getSignupFields(form) {
    return {
        nameInput: form.querySelector('input[type="text"]'),
        nameError: document.getElementById('signupNameError'),
        emailInput: form.querySelector('input[type="email"]'),
        emailError: document.getElementById('signupEmailError'),
        passwordInput: document.getElementById('signupPassword'),
        passwordError: document.getElementById('signupPasswordError'),
        confirmInput: document.getElementById('signupConfirm'),
        confirmError: document.getElementById('signupConfirmError'),
        checkbox: form.querySelector('.checkbox-input'),
        checkboxError: document.getElementById('signupCheckboxError'),
    };
}

/**
 * @param {ReturnType<typeof getSignupFields>} fields
 * @returns {boolean}
 */
function validateSignup(fields) {
    const { nameInput, nameError, emailInput, emailError, passwordInput, passwordError, confirmInput, confirmError, checkbox, checkboxError } = fields;
    return [
        validateField(nameInput, nameError, !!nameInput.value.trim(), 'Please enter your name.'),
        validateField(emailInput, emailError, isValidEmail(emailInput.value), 'Please enter a valid email address.'),
        validateField(passwordInput, passwordError, !!passwordInput.value.trim(), 'Please enter a password.'),
        validateField(confirmInput, confirmError, confirmInput.value === passwordInput.value, "Your passwords don't match. Please try again."),
        validateField(checkbox, checkboxError, checkbox.checked, 'Please accept the Privacy Policy to continue.'),
    ].every(Boolean);
}

/**
 * @param {SubmitEvent} e
 * @param {ReturnType<typeof getSignupFields>} fields
 */
async function handleSignupSubmit(e, fields) {
    e.preventDefault();
    if (!validateSignup(fields)) return;
    try {
        await registerUser(fields.nameInput.value, fields.emailInput.value);
        exitAndRedirect(document.getElementById('signupCard'), 'Account created!', 'pages/summary.html');
    } catch (err) {
        setError(fields.emailInput.closest('.input-wrapper'), fields.emailError, err.message);
    }
}

/**
 * @param {ReturnType<typeof getSignupFields>} fields
 * @returns {boolean}
 */
function isSignupReady(fields) {
    return !!fields.nameInput.value.trim()
        && isValidEmail(fields.emailInput.value)
        && !!fields.passwordInput.value.trim()
        && !!fields.confirmInput.value
        && fields.confirmInput.value === fields.passwordInput.value
        && fields.checkbox.checked;
}

/**
 * @param {HTMLButtonElement} btn
 * @param {ReturnType<typeof getSignupFields>} fields
 */
function updateSignupBtn(btn, fields) {
    btn.disabled = !isSignupReady(fields);
}

function initSignupForm() {
    const form = document.getElementById('signupForm');
    if (!form) return;
    const fields = getSignupFields(form);
    const submitBtn = form.querySelector('[type="submit"]');
    updateSignupBtn(submitBtn, fields);
    [fields.nameInput, fields.emailInput, fields.passwordInput, fields.confirmInput]
        .forEach((input) => input.addEventListener('input', () => updateSignupBtn(submitBtn, fields)));
    fields.checkbox.addEventListener('change', () => updateSignupBtn(submitBtn, fields));
    form.addEventListener('submit', (e) => handleSignupSubmit(e, fields));
}

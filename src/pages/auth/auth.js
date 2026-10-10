import { validateField, validateOnBlur, setError, isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from '../../utils/form-validation.js';
import { authService } from '../../services/auth-service.js';
import { showToast } from '../../components/toast.js';
import { iconUrl, pageUrl } from '../../utils/paths.js';

const INTRO_DELAY_MS = 400;
const INTRO_MOVE_MS = 600;
const INTRO_FADE_MS = 400;

const PASSWORD_ICON = {
    static: iconUrl('lock.svg'),
    hidden: { src: iconUrl('visibility_off.svg'), label: 'Show password' },
    visible: { src: iconUrl('visibility.svg'), label: 'Hide password' },
};


// ── Shared ───────────────────────────────────────────────

/**
 * Fades out the auth card, shows a toast, then navigates to a new page.
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
        sessionStorage.setItem('justLoggedIn', 'true'); // Check for Animation
    }, 300);
}


// ── Intro ────────────────────────────────────────────────

/**
 * Runs the logo intro animation sequence.
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


/**
 * Fades out the signup card, shows a toast, then switches to the login card.
 * @param {HTMLElement} cardEl
 * @param {string} message
 */
function exitToLogin(cardEl, message) {
    cardEl.style.transition = 'opacity 300ms ease';
    cardEl.style.opacity = '0';
    setTimeout(() => {
        showToast(message);
        setTimeout(() => {
            cardEl.style.transition = '';
            cardEl.style.opacity = '';
            showAuthCard('login');
        }, 1200);
    }, 300);
}


// ── Auth Switch ──────────────────────────────────────────

/**
 * Shows the login or signup card and hides the other.
 * @param {'login'|'signup'} view
 */
function showAuthCard(view) {
    const showSignup = view === 'signup';
    document.getElementById('loginView').classList.toggle('is-hidden', showSignup);
    document.getElementById('signupCard').classList.toggle('is-hidden', !showSignup);
    document.getElementById('signupHintHeader').classList.toggle('is-hidden', showSignup);
}


/** Wires up all [data-show-auth] triggers to switch between login and signup. */
function initAuthSwitch() {
    document.querySelectorAll('[data-show-auth]').forEach((trigger) => {
        trigger.addEventListener('click', () => showAuthCard(trigger.dataset.showAuth));
    });
}


// ── Password Toggle ──────────────────────────────────────

/**
 * Syncs the toggle button icon and type based on current input value and state.
 * @param {HTMLInputElement} input
 * @param {HTMLButtonElement} button
 * @param {HTMLImageElement} icon
 */
function updatePasswordToggle(input, button, icon) {
    if (!input.value) {
        input.type = 'password';
        button.disabled = true;
        button.setAttribute('aria-label', PASSWORD_ICON.hidden.label);
        icon.src = PASSWORD_ICON.static;
        return;
    }
    const state = input.type === 'password' ? PASSWORD_ICON.hidden : PASSWORD_ICON.visible;
    button.disabled = false;
    button.setAttribute('aria-label', state.label);
    icon.src = state.src;
}


/**
 * Wires up the visibility toggle for a single password input wrapper.
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


/** Initializes visibility toggles for all password inputs on the page. */
function initPasswordToggles() {
    document.querySelectorAll('.input-wrapper').forEach((wrapper) => {
        if (wrapper.querySelector('input[type="password"]')) initPasswordToggle(wrapper);
    });
}


// ── Login ────────────────────────────────────────────────

const LOGIN_ERROR_MESSAGE = 'Check your email and password.\nPlease try again.';


/**
 * Marks both login fields as invalid with one shared, unspecific message, so
 * a failed attempt never reveals which field (or which reason) was wrong.
 * @param {{ emailInput: HTMLInputElement, emailError: HTMLElement, passwordInput: HTMLInputElement, passwordError: HTMLElement }} fields
 */
function setLoginError(fields) {
    setError(fields.emailInput.closest('.input-wrapper'), fields.emailError, '');
    setError(fields.passwordInput.closest('.input-wrapper'), fields.passwordError, LOGIN_ERROR_MESSAGE);
}


/**
 * Validates and submits the login form.
 * @param {SubmitEvent} e
 * @param {{ emailInput: HTMLInputElement, emailError: HTMLElement, passwordInput: HTMLInputElement, passwordError: HTMLElement }} fields
 */
async function handleLoginSubmit(e, fields) {
    e.preventDefault();
    const filledAndValid = isValidEmail(fields.emailInput.value) && !!fields.passwordInput.value.trim();
    if (!filledAndValid) {
        setLoginError(fields);
        return;
    }
    try {
        await authService.login(fields.emailInput.value, fields.passwordInput.value);
        exitAndRedirect(document.getElementById('loginCard'), "You're logged in!", pageUrl('summary'));
    } catch {
        setLoginError(fields);
    }
}


/** Logs in as guest (anonymous Firebase account) and redirects to the summary. */
async function handleGuestLogin() {
    try {
        await authService.loginAsGuest();
        exitAndRedirect(document.getElementById('loginCard'), 'Logged in as guest!', pageUrl('summary'));
    } catch {
        showToast('Guest login is currently unavailable. Please try again later.');
    }
}


/** Sets up the login form and guest login button. */
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const fields = {
        emailInput: form.querySelector('input[type="email"]'),
        emailError: document.getElementById('loginEmailError'),
        passwordInput: form.querySelector('input[type="password"]'),
        passwordError: document.getElementById('loginPasswordError'),
    };
    document.getElementById('guestLoginBtn').addEventListener('click', handleGuestLogin);
    form.addEventListener('submit', (e) => handleLoginSubmit(e, fields));
}


// ── Signup ───────────────────────────────────────────────

const PASSWORD_LENGTH_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;


/**
 * Collects all signup form field elements into one object.
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
 * Returns true when all signup fields are filled and valid.
 * @param {ReturnType<typeof getSignupFields>} fields
 * @returns {boolean}
 */
function isSignupReady(fields) {
    return !!fields.nameInput.value.trim()
        && isValidEmail(fields.emailInput.value)
        && isValidPassword(fields.passwordInput.value)
        && !!fields.confirmInput.value
        && fields.confirmInput.value === fields.passwordInput.value
        && fields.checkbox.checked;
}


/**
 * Visually dims the submit button when required fields are missing, without
 * disabling it so a click still triggers validation and shows the errors.
 * @param {HTMLButtonElement} btn
 * @param {ReturnType<typeof getSignupFields>} fields
 */
function updateSignupBtn(btn, fields) {
    btn.classList.toggle('btn-pending', !isSignupReady(fields));
}


/**
 * Validates all signup fields on submit and shows errors for any that fail.
 * @param {ReturnType<typeof getSignupFields>} fields
 * @returns {boolean}
 */
function validateSignup(fields) {
    const { nameInput, nameError, emailInput, emailError, passwordInput, passwordError, confirmInput, confirmError, checkbox, checkboxError } = fields;
    return [
        validateField(nameInput, nameError, !!nameInput.value.trim(), 'Please enter your name.'),
        validateField(emailInput, emailError, isValidEmail(emailInput.value), 'Please enter a valid email address.'),
        validateField(passwordInput, passwordError, isValidPassword(passwordInput.value), PASSWORD_LENGTH_MESSAGE),
        validateField(confirmInput, confirmError, confirmInput.value === passwordInput.value, "Your passwords don't match. Please try again."),
        validateField(checkbox, checkboxError, checkbox.checked, 'Please accept the Privacy Policy.'),
    ].every(Boolean);
}


/**
 * Validates and submits the signup form.
 * @param {SubmitEvent} e
 * @param {ReturnType<typeof getSignupFields>} fields
 */
async function handleSignupSubmit(e, fields) {
    e.preventDefault();
    if (!validateSignup(fields)) return;
    try {
        await authService.register(fields.nameInput.value, fields.emailInput.value, fields.passwordInput.value);
        exitToLogin(document.getElementById('signupCard'), 'Account created!');
    } catch (err) {
        setError(fields.emailInput.closest('.input-wrapper'), fields.emailError, err.message);
    }
}


/**
 * Validates each signup field as soon as focus leaves it, ahead of submit.
 * @param {ReturnType<typeof getSignupFields>} fields
 */
function wireSignupBlurValidation(fields) {
    validateOnBlur(fields.nameInput, fields.nameError, () => !!fields.nameInput.value.trim(), 'Please enter your name.');
    validateOnBlur(fields.emailInput, fields.emailError, () => isValidEmail(fields.emailInput.value), 'Please enter a valid email address.');
    validateOnBlur(fields.passwordInput, fields.passwordError, () => isValidPassword(fields.passwordInput.value), PASSWORD_LENGTH_MESSAGE);
    validateOnBlur(fields.confirmInput, fields.confirmError, () => fields.confirmInput.value === fields.passwordInput.value, "Your passwords don't match. Please try again.");
    validateOnBlur(fields.checkbox, fields.checkboxError, () => fields.checkbox.checked, 'Please accept the Privacy Policy.');
}


/** Sets up the signup form with live validation and submit handling. */
function initSignupForm() {
    const form = document.getElementById('signupForm');
    if (!form) return;
    const fields = getSignupFields(form);
    const submitBtn = form.querySelector('[type="submit"]');
    updateSignupBtn(submitBtn, fields);
    [fields.nameInput, fields.emailInput, fields.passwordInput, fields.confirmInput]
        .forEach((input) => input.addEventListener('input', () => updateSignupBtn(submitBtn, fields)));
    fields.checkbox.addEventListener('change', () => updateSignupBtn(submitBtn, fields));
    wireSignupBlurValidation(fields);
    form.addEventListener('submit', (e) => handleSignupSubmit(e, fields));
}


initIntro();
initAuthSwitch();
initPasswordToggles();
initLoginForm();
initSignupForm();

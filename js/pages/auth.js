const INTRO_DELAY_MS = 400;
const INTRO_MOVE_MS = 600;
const INTRO_FADE_MS = 400;

const PASSWORD_ICON = {
  static: './assets/icons/lock.svg',
  hidden: { src: './assets/icons/visibility_off.svg', label: 'Show password' },
  visible: { src: './assets/icons/visibility.svg', label: 'Hide password' },
};

const PASSWORD_RULES = [
  { id: 'length', test: (v) => v.length >= 8 },
  { id: 'upper', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', test: (v) => /[a-z]/.test(v) },
  { id: 'number', test: (v) => /[0-9]/.test(v) },
  { id: 'special', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH_LEVELS = {
  weak: { label: 'Password strength: Weak', dataLevel: 'weak' },
  medium: { label: 'Password strength: Medium', dataLevel: 'medium' },
  strong: { label: 'Password strength: Strong', dataLevel: 'strong' },
};


document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initAuthSwitch();
  initPasswordToggles();
  initLoginForm();
  initSignupForm();
});


// ── Toast & Redirect ─────────────────────────────────────

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-visible')));
}

function exitAndRedirect(cardEl, message, href) {
  cardEl.style.transition = 'opacity 300ms ease';
  cardEl.style.opacity = '0';
  setTimeout(() => {
    showToast(message);
    setTimeout(() => { window.location.href = href; }, 1200);
  }, 300);
}


// ── Intro ────────────────────────────────────────────────

function playIntro(intro) {
  setTimeout(() => {
    intro.classList.add('intro-animate');
    setTimeout(() => {
      intro.classList.add('intro-hidden');
      setTimeout(() => intro.remove(), INTRO_FADE_MS);
    }, INTRO_MOVE_MS);
  }, INTRO_DELAY_MS);
}

function initIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return;
  playIntro(intro);
}


// ── Auth Switch ──────────────────────────────────────────

function showAuthCard(view) {
  const loginView = document.getElementById('loginView');
  const signupCard = document.getElementById('signupCard');
  const signupHintHeader = document.getElementById('signupHintHeader');
  const showSignup = view === 'signup';

  loginView.classList.toggle('is-hidden', showSignup);
  signupCard.classList.toggle('is-hidden', !showSignup);
  signupHintHeader.classList.toggle('is-hidden', showSignup);
}

function initAuthSwitch() {
  document.querySelectorAll('[data-show-auth]').forEach((trigger) => {
    trigger.addEventListener('click', () => showAuthCard(trigger.dataset.showAuth));
  });
}


// ── Password Toggle ──────────────────────────────────────

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
    if (wrapper.querySelector('input[type="password"]')) {
      initPasswordToggle(wrapper);
    }
  });
}


// ── Validation Helpers ───────────────────────────────────

const ERROR_AUTO_CLEAR_MS = 5000;
const ERROR_FADE_MS = 400;
const errorTimers = new WeakMap();

function setError(wrapper, errorEl, message) {
  errorEl.classList.remove('fading-out');
  wrapper.classList.add('error');
  errorEl.textContent = message;

  clearTimeout(errorTimers.get(errorEl));
  errorTimers.set(errorEl, setTimeout(() => {
    errorEl.classList.add('fading-out');
    setTimeout(() => clearError(wrapper, errorEl), ERROR_FADE_MS);
  }, ERROR_AUTO_CLEAR_MS));
}

function clearError(wrapper, errorEl) {
  errorEl.classList.remove('fading-out');
  wrapper.classList.remove('error');
  errorEl.textContent = '';
}


// ── Password Strength ────────────────────────────────────

function getStrengthKey(value) {
  const count = PASSWORD_RULES.filter(({ test }) => test(value)).length;
  if (count <= 2) return 'weak';
  if (count <= 4) return 'medium';
  return 'strong';
}

function updateStrengthIndicator(value, indicator) {
  if (!value) {
    delete indicator.dataset.level;
    return;
  }
  indicator.dataset.level = STRENGTH_LEVELS[getStrengthKey(value)].dataLevel;
}


// ── Login Form ───────────────────────────────────────────

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = form.querySelector('input[type="email"]');
  const emailError = document.getElementById('loginEmailError');
  const passwordInput = form.querySelector('input[type="password"]');
  const passwordError = document.getElementById('loginPasswordError');

  document.getElementById('guestLoginBtn').addEventListener('click', () => {
    exitAndRedirect(document.getElementById('loginCard'), 'Logged in as guest!', 'pages/summary.html');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    if (!emailInput.validity.valid) {
      setError(emailInput.closest('.input-wrapper'), emailError, 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError(emailInput.closest('.input-wrapper'), emailError);
    }

    if (!passwordInput.value.trim()) {
      setError(passwordInput.closest('.input-wrapper'), passwordError, 'Please enter your password.');
      valid = false;
    } else {
      clearError(passwordInput.closest('.input-wrapper'), passwordError);
    }

    if (!valid) return;

    // TODO: Call Firebase login here before redirecting
    exitAndRedirect(form.closest('.auth-card'), "You're logged in!", 'pages/summary.html');
  });
}


// ── Signup Form ──────────────────────────────────────────

function initSignupForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const nameInput = form.querySelector('input[type="text"]');
  const nameError = document.getElementById('signupNameError');
  const emailInput = form.querySelector('input[type="email"]');
  const emailError = document.getElementById('signupEmailError');
  const passwordInput = document.getElementById('signupPassword');
  const passwordError = document.getElementById('signupPasswordError');
  const confirmInput = document.getElementById('signupConfirm');
  const confirmError = document.getElementById('signupConfirmError');
  const checkbox = form.querySelector('.checkbox-input');
  const checkboxError = document.getElementById('signupCheckboxError');
  const strengthIndicator = document.getElementById('passwordStrength');

  passwordInput.addEventListener('input', () => {
    updateStrengthIndicator(passwordInput.value, strengthIndicator);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    if (!nameInput.value.trim()) {
      setError(nameInput.closest('.input-wrapper'), nameError, 'Please enter your name.');
      valid = false;
    } else {
      clearError(nameInput.closest('.input-wrapper'), nameError);
    }

    if (!emailInput.validity.valid) {
      setError(emailInput.closest('.input-wrapper'), emailError, 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError(emailInput.closest('.input-wrapper'), emailError);
    }

    if (!passwordInput.value.trim()) {
      setError(passwordInput.closest('.input-wrapper'), passwordError, 'Please enter a password.');
      valid = false;
    } else {
      clearError(passwordInput.closest('.input-wrapper'), passwordError);
    }

    if (confirmInput.value !== passwordInput.value) {
      setError(confirmInput.closest('.input-wrapper'), confirmError, "Your passwords don't match. Please try again.");
      valid = false;
    } else {
      clearError(confirmInput.closest('.input-wrapper'), confirmError);
    }

    if (!checkbox.checked) {
      checkboxError.classList.remove('fading-out');
      checkboxError.textContent = 'Please accept the Privacy Policy to continue.';
      clearTimeout(errorTimers.get(checkboxError));
      errorTimers.set(checkboxError, setTimeout(() => {
        checkboxError.classList.add('fading-out');
        setTimeout(() => { checkboxError.classList.remove('fading-out'); checkboxError.textContent = ''; }, ERROR_FADE_MS);
      }, ERROR_AUTO_CLEAR_MS));
      valid = false;
    } else {
      checkboxError.textContent = '';
    }

    if (!valid) return;

    // TODO: Call Firebase signup here before redirecting
    exitAndRedirect(form.closest('.auth-card'), 'Account created!', 'pages/summary.html');
  });
}

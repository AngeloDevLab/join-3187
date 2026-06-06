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
});


/**
 * Moves the intro logo into the corner, then fades the whole overlay out
 * and removes it from the DOM once the transitions have finished.
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


function initIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return;

  playIntro(intro);
}


/**
 * Switches between the login and sign-up view, triggered by any element
 * with a `data-show-auth="login"` / `data-show-auth="signup"` attribute.
 */
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


/**
 * Reflects the input's current value/type onto the toggle button: shows a
 * static lock while empty, otherwise an eye icon that previews the input's
 * shown/hidden state and doubles as the label for the next click.
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
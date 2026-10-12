import { showToast } from '../../components/toast.js';
import { pageUrl } from '../../utils/paths.js';
import { PasswordToggle } from './password-toggle.js';
import { LoginForm } from './login-form.js';
import { SignupForm } from './signup-form.js';

const INTRO_DELAY_MS = 400;
const INTRO_MOVE_MS = 600;
const INTRO_FADE_MS = 400;
const CARD_FADE_MS = 300;
const TOAST_VISIBLE_MS = 1200;


/**
 * The login/signup page: logo intro, switching between the role choice, login
 * and signup views and the transitions after a successful login (to the
 * summary) or signup (back to login).
 */
class AuthPage {
    #loginCard = document.getElementById('loginCard');
    #signupCard = document.getElementById('signupCard');
    #views = {
        role: document.getElementById('roleView'),
        login: document.getElementById('loginView'),
        signup: this.#signupCard,
    };


    /** Plays the intro and wires the card switch, password toggles and both forms. */
    init() {
        this.#playIntro();
        PasswordToggle.initAll();
        document.querySelectorAll('[data-show-auth]').forEach((trigger) =>
            trigger.addEventListener('click', () => this.#show(trigger.dataset.showAuth)));
        document.getElementById('createRequestBtn').addEventListener('click', () => {
            window.location.href = pageUrl('request');
        });
        new LoginForm((message) => this.#enterApp(message));
        new SignupForm(() => this.#returnToLogin('Account created!'));
    }


    /** @param {'role'|'login'|'signup'} view - shows that view and hides the others */
    #show(view) {
        Object.entries(this.#views).forEach(([name, element]) =>
            element.classList.toggle('is-hidden', name !== view));
        document.getElementById('signupHintHeader').classList.toggle('is-hidden', view === 'signup');
        document.body.classList.toggle('is-dark', view === 'role');
    }


    /** Runs the logo intro (move, then fade out and remove), if the page has one. */
    #playIntro() {
        const intro = document.getElementById('intro');
        if (!intro) return;
        setTimeout(() => {
            intro.classList.add('intro-animate');
            setTimeout(() => {
                intro.classList.add('intro-hidden');
                setTimeout(() => intro.remove(), INTRO_FADE_MS);
            }, INTRO_MOVE_MS);
        }, INTRO_DELAY_MS);
    }


    /** @param {string} message - fades out the login card, toasts, then opens the summary */
    #enterApp(message) {
        this.#fadeOutThenToast(this.#loginCard, message, () => { window.location.href = pageUrl('summary'); });
        sessionStorage.setItem('justLoggedIn', 'true'); // the summary plays its mobile greeting once
    }


    /** @param {string} message - fades out the signup card, toasts, then shows the login card */
    #returnToLogin(message) {
        this.#fadeOutThenToast(this.#signupCard, message, () => {
            this.#signupCard.style.transition = '';
            this.#signupCard.style.opacity = '';
            this.#show('login');
        });
    }


    /**
     * @param {HTMLElement} card
     * @param {string} message
     * @param {() => void} next - runs once the toast has been visible for a moment
     */
    #fadeOutThenToast(card, message, next) {
        card.style.transition = `opacity ${CARD_FADE_MS}ms ease`;
        card.style.opacity = '0';
        setTimeout(() => {
            showToast(message);
            setTimeout(next, TOAST_VISIBLE_MS);
        }, CARD_FADE_MS);
    }
}


new AuthPage().init();

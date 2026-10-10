import { setError, isValidEmail } from '../../utils/form-validation.js';
import { authService } from '../../services/auth-service.js';
import { showToast } from '../../components/toast.js';

const LOGIN_ERROR = 'Check your email and password.\nPlease try again.';
const GUEST_ERROR = 'Guest login is currently unavailable. Please try again later.';


/**
 * The login form plus the guest login button. Both buttons stay disabled while
 * a login is running and after it succeeded (until the page navigates away).
 */
export class LoginForm {
    #form = document.getElementById('loginForm');
    #email = document.getElementById('loginEmail');
    #emailError = document.getElementById('loginEmailError');
    #password = document.getElementById('loginPassword');
    #passwordError = document.getElementById('loginPasswordError');
    #guestButton = document.getElementById('guestLoginBtn');
    #onSuccess;
    #busy = false;


    /** @param {(message: string) => void} onSuccess - called with a toast message after logging in */
    constructor(onSuccess) {
        this.#onSuccess = onSuccess;
        this.#form.addEventListener('submit', (e) => this.#submit(e));
        this.#guestButton.addEventListener('click', () => this.#run(() => authService.loginAsGuest(), 'Logged in as guest!', () => showToast(GUEST_ERROR)));
    }


    /** @param {SubmitEvent} e */
    #submit(e) {
        e.preventDefault();
        if (!isValidEmail(this.#email.value) || !this.#password.value.trim()) return this.#showError();
        this.#run(() => authService.login(this.#email.value, this.#password.value), "You're logged in!", () => this.#showError());
    }


    /**
     * Runs one login attempt with both buttons disabled; re-enables them only on failure.
     * @param {() => Promise<void>} login
     * @param {string} message - success toast
     * @param {() => void} onError
     */
    async #run(login, message, onError) {
        if (this.#busy) return;
        this.#setBusy(true);
        try {
            await login();
            this.#onSuccess(message);
        } catch {
            this.#setBusy(false);
            onError();
        }
    }


    /** @param {boolean} busy */
    #setBusy(busy) {
        this.#busy = busy;
        this.#form.querySelector('[type="submit"]').disabled = busy;
        this.#guestButton.disabled = busy;
    }


    /**
     * Marks both fields as invalid with one shared, unspecific message, so a
     * failed attempt never reveals which field (or which reason) was wrong.
     */
    #showError() {
        setError(this.#email.closest('.input-wrapper'), this.#emailError, '');
        setError(this.#password.closest('.input-wrapper'), this.#passwordError, LOGIN_ERROR);
    }
}

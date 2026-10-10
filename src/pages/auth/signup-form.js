import { validateField, setError, isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from '../../utils/form-validation.js';
import { authService } from '../../services/auth-service.js';

/**
 * One rule per field: input/error element ids, the check (gets all inputs,
 * so "confirm" can compare against "password") and the error message.
 */
const RULES = [
    { key: 'name', input: 'signupName', error: 'signupNameError', valid: (f) => !!f.name.value.trim(), message: 'Please enter your name.' },
    { key: 'email', input: 'signupEmail', error: 'signupEmailError', valid: (f) => isValidEmail(f.email.value), message: 'Please enter a valid email address.' },
    { key: 'password', input: 'signupPassword', error: 'signupPasswordError', valid: (f) => isValidPassword(f.password.value), message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
    { key: 'confirm', input: 'signupConfirm', error: 'signupConfirmError', valid: (f) => !!f.confirm.value && f.confirm.value === f.password.value, message: "Your passwords don't match. Please try again." },
    { key: 'privacy', input: 'signupPrivacy', error: 'signupCheckboxError', valid: (f) => f.privacy.checked, message: 'Please accept the Privacy Policy.' },
];


/**
 * The signup form. Each field is validated on blur and on submit; the submit
 * button is dimmed until every rule passes and disabled while registering.
 */
export class SignupForm {
    #form = document.getElementById('signupForm');
    #submitButton = this.#form.querySelector('[type="submit"]');
    #inputs = Object.fromEntries(RULES.map((rule) => [rule.key, document.getElementById(rule.input)]));
    #onSuccess;


    /** @param {() => void} onSuccess - called after the account was created */
    constructor(onSuccess) {
        this.#onSuccess = onSuccess;
        RULES.forEach((rule) => this.#wireField(rule));
        this.#form.addEventListener('submit', (e) => this.#submit(e));
        this.#updateSubmitState();
    }


    /** @param {typeof RULES[number]} rule - live button state on input, validation on blur */
    #wireField(rule) {
        const input = this.#inputs[rule.key];
        input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => this.#updateSubmitState());
        input.addEventListener('blur', () => this.#check(rule));
    }


    /**
     * @param {typeof RULES[number]} rule
     * @returns {boolean} true if the field is valid; shows or clears its error
     */
    #check(rule) {
        return validateField(this.#inputs[rule.key], document.getElementById(rule.error), rule.valid(this.#inputs), rule.message);
    }


    /** Dims (but does not disable) the button until all rules pass, so a click still shows the errors. */
    #updateSubmitState() {
        this.#submitButton.classList.toggle('btn-pending', !RULES.every((rule) => rule.valid(this.#inputs)));
    }


    /** @param {SubmitEvent} e - validates everything, then registers with the button disabled */
    async #submit(e) {
        e.preventDefault();
        if (this.#submitButton.disabled || !RULES.map((rule) => this.#check(rule)).every(Boolean)) return;
        const { name, email, password } = this.#inputs;
        this.#submitButton.disabled = true;
        try {
            await authService.register(name.value, email.value, password.value);
            this.#onSuccess();
        } catch (err) {
            setError(email.closest('.input-wrapper'), document.getElementById('signupEmailError'), err.message);
        } finally {
            this.#submitButton.disabled = false;
        }
    }
}

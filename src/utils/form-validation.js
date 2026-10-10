const EMAIL_RE = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const PHONE_RE = /^\+?[0-9]+$/;

/** Firebase Auth rejects shorter passwords, so signup validates against the same limit. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
    return EMAIL_RE.test(value.trim());
}


/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidPhone(value) {
    return PHONE_RE.test(value.trim());
}


/**
 * @param {string} value
 * @returns {boolean} true if the password meets Firebase's minimum length
 */
export function isValidPassword(value) {
    return value.length >= MIN_PASSWORD_LENGTH;
}


/**
 * Strips any non-digit characters as the user types, keeping a phone field
 * numeric-only while still allowing a leading "+" for a country code.
 * @param {HTMLInputElement} inputEl
 */
export function restrictToDigits(inputEl) {
    inputEl.addEventListener('input', () => {
        const value = inputEl.value;
        const sanitized = (value.startsWith('+') ? '+' : '') + value.replace(/\D/g, '');
        if (sanitized !== value) inputEl.value = sanitized;
    });
}


/**
 * Marks a field as invalid and shows an error message.
 * @param {HTMLElement|null} wrapper - input-wrapper element, or null (e.g. checkbox)
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
export function setError(wrapper, errorEl, message) {
    if (wrapper) wrapper.classList.add('error');
    errorEl.textContent = message;
}


/**
 * Resets a field to its valid state and clears the error message.
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement} errorEl
 */
export function clearError(wrapper, errorEl) {
    if (wrapper) wrapper.classList.remove('error');
    errorEl.textContent = '';
}


/**
 * Validates a single field and updates its error state, clearing any
 * previous error once the field becomes valid.
 * Passes null as wrapper when the input has no .input-wrapper ancestor (e.g. checkbox).
 * @param {HTMLElement} inputEl
 * @param {HTMLElement} errorEl
 * @param {boolean} condition - true means the field is valid
 * @param {string} message
 * @returns {boolean}
 */
export function validateField(inputEl, errorEl, condition, message) {
    const wrapper = inputEl.closest('.input-wrapper');
    if (!condition) {
        setError(wrapper, errorEl, message);
        return false;
    }
    clearError(wrapper, errorEl);
    return true;
}


/**
 * Re-validates a field as soon as it loses focus, showing or clearing its
 * error immediately instead of waiting for a submit attempt.
 * @param {HTMLElement} inputEl
 * @param {HTMLElement} errorEl
 * @param {() => boolean} getCondition - re-evaluated at blur time
 * @param {string} message
 */
export function validateOnBlur(inputEl, errorEl, getCondition, message) {
    inputEl.addEventListener('blur', () => validateField(inputEl, errorEl, getCondition(), message));
}

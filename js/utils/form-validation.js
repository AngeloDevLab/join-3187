const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
    return EMAIL_RE.test(value.trim());
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
 * Validates a single field and updates its error state.
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
    return true;
}

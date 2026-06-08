const ERROR_AUTO_CLEAR_MS = 5000;
const ERROR_FADE_MS = 400;
const errorTimers = new WeakMap();

/**
 * Marks a field as invalid, shows an error message, and auto-clears after a timeout.
 * @param {HTMLElement|null} wrapper - input-wrapper element, or null (e.g. checkbox)
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
export function setError(wrapper, errorEl, message) {
    errorEl.classList.remove('fading-out');
    if (wrapper) wrapper.classList.add('error');
    errorEl.textContent = message;
    clearTimeout(errorTimers.get(errorEl));
    errorTimers.set(errorEl, setTimeout(() => {
        errorEl.classList.add('fading-out');
        setTimeout(() => clearError(wrapper, errorEl), ERROR_FADE_MS);
    }, ERROR_AUTO_CLEAR_MS));
}

/**
 * Resets a field to its valid state and clears the error message.
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement} errorEl
 */
export function clearError(wrapper, errorEl) {
    errorEl.classList.remove('fading-out');
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
    clearError(wrapper, errorEl);
    return true;
}

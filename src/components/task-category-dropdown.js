import { clearError, validateOnBlur } from '../utils/form-validation.js';
import { Dropdown } from './dropdown.js';


/**
 * Collects DOM elements needed for the category dropdown.
 * @param {ParentNode} root
 * @returns {{ dropdown: HTMLElement, hiddenInput: HTMLInputElement, valueEl: HTMLElement, trigger: HTMLButtonElement, errorEl: HTMLElement }}
 */
function getCategoryEls(root) {
    return {
        dropdown: root.querySelector('#categoryDropdown'),
        hiddenInput: root.querySelector('#task-category'),
        valueEl: root.querySelector('#categoryDropdown .dropdown-value'),
        trigger: root.querySelector('#categoryDropdown .dropdown-trigger'),
        errorEl: root.querySelector('#taskCategoryError'),
    };
}


/**
 * Selects an option: updates the hidden input, display text, and clears any error.
 * @param {HTMLElement} option
 * @param {ReturnType<typeof getCategoryEls>} els
 */
function pickCategoryOption(option, els) {
    els.hiddenInput.value = option.dataset.value;
    els.valueEl.textContent = option.textContent.trim();
    els.valueEl.classList.remove('dropdown-placeholder');
    els.hiddenInput.dispatchEvent(new Event('input'));
    clearError(els.hiddenInput.closest('.input-wrapper'), els.errorEl);
    Dropdown.for(els.dropdown).close();
}


/**
 * Programmatically selects a category option, e.g. when prefilling for an edit.
 * @param {ParentNode} root
 * @param {string} value
 * @param {string} label
 */
export function setCategoryOption(root, value, label) {
    const els = getCategoryEls(root);
    if (!els.dropdown) return;
    els.hiddenInput.value = value;
    els.valueEl.textContent = label;
    els.valueEl.classList.remove('dropdown-placeholder');
}


/**
 * Sets up the category dropdown — toggle and option selection.
 * @param {ParentNode} root
 */
export function initCategoryDropdown(root) {
    const els = getCategoryEls(root);
    if (!els.dropdown) return;
    const dropdown = new Dropdown(els.dropdown, els.trigger);
    els.trigger.addEventListener('click', () => dropdown.toggle());
    els.dropdown.querySelectorAll('.dropdown-option').forEach((opt) =>
        opt.addEventListener('click', () => pickCategoryOption(opt, els)));
    validateOnBlur(els.trigger, els.errorEl, () => !!els.hiddenInput.value, 'This field is required');
}

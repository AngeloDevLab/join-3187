import { clearError } from '../utils/form-validation.js';


/**
 * Opens or closes a dropdown by toggling `is-open` and the aria-expanded attribute.
 * @param {{ dropdown: HTMLElement, trigger: HTMLButtonElement }} els
 * @param {boolean} open
 */
export function toggleDropdown(els, open) {
    els.dropdown.classList.toggle('is-open', open);
    els.trigger.setAttribute('aria-expanded', String(open));
}


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
    toggleDropdown(els, false);
}


let dropdownAutoCloseInitialized = false;


/** Closes any open dropdown when clicking outside it (registered once, regardless of how many forms exist). */
export function initDropdownAutoClose() {
    if (dropdownAutoCloseInitialized) return;
    dropdownAutoCloseInitialized = true;
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown.is-open').forEach((d) => {
            if (!d.contains(e.target)) {
                d.classList.remove('is-open');
                d.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            }
        });
    });
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
    els.trigger.addEventListener('click', () =>
        toggleDropdown(els, !els.dropdown.classList.contains('is-open')));
    els.dropdown.querySelectorAll('.dropdown-option').forEach((opt) =>
        opt.addEventListener('click', () => pickCategoryOption(opt, els)));
}

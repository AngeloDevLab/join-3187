import { clearError, validateOnBlur } from '../../utils/form-validation.js';
import { Dropdown } from '../dropdown.js';


/**
 * The single-select category dropdown of the task form. Its value is the
 * database key of the chosen option (`data-value`, e.g. 'userStory'), kept in
 * a hidden input so the form can listen to `input` events on it.
 */
export class CategorySelect {
    #element;
    #input;
    #valueEl;
    #errorEl;
    #trigger;
    #dropdown;
    #placeholder;


    /** @param {ParentNode} root - the form's root (document or a modal dialog) */
    constructor(root) {
        this.#element = root.querySelector('#categoryDropdown');
        this.#input = root.querySelector('#task-category');
        this.#valueEl = this.#element.querySelector('.dropdown-value');
        this.#errorEl = root.querySelector('#taskCategoryError');
        this.#trigger = this.#element.querySelector('.dropdown-trigger');
        this.#placeholder = this.#valueEl.textContent;
        this.#dropdown = new Dropdown(this.#element, this.#trigger);
        this.#wire();
    }


    /** @returns {HTMLInputElement} the hidden input holding the value (for validation and listeners) */
    get input() {
        return this.#input;
    }


    /** @returns {string} the selected category key, or '' */
    get value() {
        return this.#input.value;
    }


    /**
     * Selects the option with the given key and shows its label.
     * @param {string} value - e.g. 'userStory'
     */
    set value(value) {
        const option = this.#element.querySelector(`.dropdown-option[data-value="${value}"]`);
        this.#input.value = option ? value : '';
        this.#valueEl.textContent = option ? option.textContent.trim() : this.#placeholder;
        this.#valueEl.classList.toggle('dropdown-placeholder', !option);
    }


    /** Clears the selection back to the placeholder. */
    reset() {
        this.value = '';
    }


    /** Wires the trigger, the options and the on-blur validation. */
    #wire() {
        this.#trigger.addEventListener('click', () => this.#dropdown.toggle());
        this.#element.querySelectorAll('.dropdown-option').forEach((opt) =>
            opt.addEventListener('click', () => this.#pick(opt.dataset.value)));
        validateOnBlur(this.#trigger, this.#errorEl, () => !!this.value, 'This field is required');
    }


    /**
     * Applies a user's choice: sets the value, clears the error and closes the dropdown.
     * @param {string} value
     */
    #pick(value) {
        this.value = value;
        this.#input.dispatchEvent(new Event('input'));
        clearError(this.#input.closest('.input-wrapper'), this.#errorEl);
        this.#dropdown.close();
    }
}

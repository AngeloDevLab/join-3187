import { iconUrl } from '../../utils/paths.js';

const ICON = {
    empty: iconUrl('lock.svg'),
    hidden: { src: iconUrl('visibility_off.svg'), label: 'Show password' },
    visible: { src: iconUrl('visibility.svg'), label: 'Hide password' },
};


/**
 * The eye button inside a password field: shows a lock while the field is
 * empty, then toggles between hidden and visible password.
 */
export class PasswordToggle {
    #input;
    #button;
    #icon;


    /** @param {ParentNode} [root] - attaches a toggle to every password field wrapper below it */
    static initAll(root = document) {
        root.querySelectorAll('.input-wrapper').forEach((wrapper) => {
            if (wrapper.querySelector('input[type="password"]') && wrapper.querySelector('.input-icon-btn img')) new PasswordToggle(wrapper);
        });
    }


    /** @param {HTMLElement} wrapper - the `.input-wrapper` holding the input and the button */
    constructor(wrapper) {
        this.#input = wrapper.querySelector('input[type="password"]');
        this.#button = wrapper.querySelector('.input-icon-btn');
        this.#icon = this.#button.querySelector('img');
        this.#button.addEventListener('click', () => this.#toggle());
        this.#input.addEventListener('input', () => this.#sync());
    }


    /** Switches between hidden and visible password. */
    #toggle() {
        this.#input.type = this.#input.type === 'password' ? 'text' : 'password';
        this.#sync();
    }


    /** Updates icon, label and enabled state to match the input's value and type. */
    #sync() {
        if (!this.#input.value) {
            this.#input.type = 'password';
            this.#button.disabled = true;
            this.#button.setAttribute('aria-label', ICON.hidden.label);
            this.#icon.src = ICON.empty;
            return;
        }
        const state = this.#input.type === 'password' ? ICON.hidden : ICON.visible;
        this.#button.disabled = false;
        this.#button.setAttribute('aria-label', state.label);
        this.#icon.src = state.src;
    }
}

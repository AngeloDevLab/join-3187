import { triggerTransitionIn } from '../utils/helpers.js';

const CLOSE_FALLBACK_MS = 350;


/**
 * A native <dialog> shown as a modal with a CSS animation (`modal--<animation>`
 * plus `is-open`, see modal.css). Closes on Escape or a backdrop click and
 * removes itself from the DOM once the closing animation has finished.
 */
export class Modal {
    static #openCount = 0;
    #dialog;
    #closing = false;


    /**
     * @param {string|Node} content - plain text (e.g. a toast message) or a node to show
     * @param {{ animation?: 'bottom'|'right'|'center'|'contact' }} [options]
     */
    constructor(content, { animation = 'right' } = {}) {
        this.#dialog = document.createElement('dialog');
        this.#dialog.className = `modal modal--${animation}`;
        if (typeof content === 'string') this.#dialog.textContent = content;
        else this.#dialog.appendChild(content);
        this.#dialog.addEventListener('cancel', (e) => { e.preventDefault(); this.close(); });
        this.#dialog.addEventListener('click', (e) => { if (e.target === this.#dialog) this.close(); });
    }


    /** @returns {HTMLDialogElement} */
    get element() {
        return this.#dialog;
    }


    /**
     * Shows the modal. With `autoCloseMs` it closes itself after that time (toasts).
     * @param {number} [autoCloseMs]
     * @returns {this}
     */
    open(autoCloseMs) {
        document.body.appendChild(this.#dialog);
        this.#dialog.showModal();
        Modal.#lockScroll();
        triggerTransitionIn(this.#dialog, 'is-open');
        if (autoCloseMs) setTimeout(() => this.close(), autoCloseMs);
        return this;
    }


    /** Animates the modal out, then closes and removes it. Safe to call more than once. */
    close() {
        if (this.#closing) return;
        this.#closing = true;
        this.#dialog.classList.remove('is-open');
        this.#dialog.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') this.#remove(); });
        setTimeout(() => this.#remove(), CLOSE_FALLBACK_MS);
    }


    /** Closes the dialog and removes it from the DOM, once. */
    #remove() {
        if (!this.#dialog.isConnected) return;
        this.#dialog.close();
        this.#dialog.remove();
        Modal.#unlockScroll();
    }


    /** Locks page scroll while at least one modal is open (modals can stack). */
    static #lockScroll() {
        Modal.#openCount++;
        document.documentElement.classList.add('modal-open');
    }


    /** Unlocks page scroll once the last open modal has closed. */
    static #unlockScroll() {
        Modal.#openCount = Math.max(0, Modal.#openCount - 1);
        if (Modal.#openCount === 0) document.documentElement.classList.remove('modal-open');
    }
}

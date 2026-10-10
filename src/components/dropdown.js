/**
 * A toggleable `.dropdown` element. The open state lives in the `is-open` class
 * and is mirrored to the trigger's aria-expanded. Every open dropdown closes on
 * a click outside of it and its trigger.
 */
export class Dropdown {
    static #instances = new WeakMap();
    static #autoCloseReady = false;
    #element;
    #trigger;


    /**
     * @param {HTMLElement} element - the `.dropdown` container
     * @param {HTMLElement|null} [trigger] - toggles the dropdown; defaults to its `.dropdown-trigger`
     */
    constructor(element, trigger = element.querySelector('.dropdown-trigger')) {
        this.#element = element;
        this.#trigger = trigger;
        Dropdown.#instances.set(element, this);
        Dropdown.#initAutoClose();
    }


    /**
     * Returns the existing instance for an element, or creates one — for
     * dropdowns inside markup that is re-rendered (e.g. board task cards).
     * @param {HTMLElement} element
     * @param {HTMLElement|null} [trigger]
     * @returns {Dropdown}
     */
    static for(element, trigger) {
        return Dropdown.#instances.get(element) ?? new Dropdown(element, trigger);
    }


    /** @returns {boolean} */
    get isOpen() {
        return this.#element.classList.contains('is-open');
    }


    /** Opens the dropdown. */
    open() {
        this.#setOpen(true);
    }


    /** Closes the dropdown. */
    close() {
        this.#setOpen(false);
    }


    /** Opens the dropdown if it is closed, closes it if it is open. */
    toggle() {
        this.#setOpen(!this.isOpen);
    }


    /**
     * @param {Node} target
     * @returns {boolean} true if the target is inside the dropdown or its trigger
     */
    contains(target) {
        return this.#element.contains(target) || !!this.#trigger?.contains(target);
    }


    /** @param {boolean} open */
    #setOpen(open) {
        this.#element.classList.toggle('is-open', open);
        this.#trigger?.setAttribute('aria-expanded', String(open));
    }


    /**
     * Closes every open dropdown on the page, except the one given.
     * @param {HTMLElement} [keep]
     */
    static closeAll(keep) {
        document.querySelectorAll('.dropdown.is-open').forEach((element) => {
            if (element !== keep) Dropdown.for(element).close();
        });
    }


    /** Registers the single document-wide "click outside closes" listener. */
    static #initAutoClose() {
        if (Dropdown.#autoCloseReady) return;
        Dropdown.#autoCloseReady = true;
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.dropdown.is-open').forEach((element) => {
                const dropdown = Dropdown.for(element);
                if (!dropdown.contains(e.target)) dropdown.close();
            });
        });
    }
}

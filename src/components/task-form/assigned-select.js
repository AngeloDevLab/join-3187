import { Dropdown } from '../dropdown.js';
import { authService } from '../../services/auth-service.js';
import { contactStore } from '../../services/contact-store.js';
import { getAvatarColorForId, getInitials, escapeHtml } from '../../utils/helpers.js';
import { iconUrl } from '../../utils/paths.js';

const MAX_VISIBLE_CHIPS = 4;


/**
 * @param {{ email?: string }} contact
 * @returns {boolean} true if the contact is the logged-in user
 */
function isCurrentUser(contact) {
    const email = authService.currentUser?.email;
    return !!email && contact.email === email;
}


/**
 * Builds one selectable contact option.
 * @param {{ id: string, name: string, email?: string }} contact
 * @returns {HTMLLIElement}
 */
function buildOption(contact) {
    const color = getAvatarColorForId(contact.id);
    const initials = getInitials(contact.name);
    const label = isCurrentUser(contact) ? `${contact.name} (You)` : contact.name;
    const li = document.createElement('li');
    Object.assign(li.dataset, { id: contact.id, name: contact.name, initials, color });
    li.className = 'dropdown-option assigned-option';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.innerHTML = `<span class="contact-avatar avatar-circle" style="background:${color}">${escapeHtml(initials)}</span>`
        + `<span class="contact-name">${escapeHtml(label)}</span>`
        + `<img src="${iconUrl('default-box.svg')}" class="contact-checkbox" alt="">`;
    return li;
}


/**
 * @param {HTMLLIElement} option
 * @returns {string} avatar chip markup for a selected option
 */
function chipHtml(option) {
    return `<span class="contact-avatar avatar-circle" style="background:${option.dataset.color}">${escapeHtml(option.dataset.initials)}</span>`;
}


/**
 * The multi-select "Assigned to" dropdown of the task form, with name search
 * and a chip row showing the selected contacts. The logged-in user is listed first.
 */
export class AssignedSelect {
    #element;
    #trigger;
    #search;
    #list;
    #chips;
    #dropdown;
    #loaded;


    /** @param {ParentNode} root - the form's root (document or a modal dialog) */
    constructor(root) {
        this.#element = root.querySelector('#assignedDropdown');
        this.#trigger = root.querySelector('#assignedTrigger');
        this.#search = root.querySelector('#assignedValue');
        this.#list = root.querySelector('#assignedList');
        this.#chips = root.querySelector('#assignedChipsDisplay');
        this.#dropdown = new Dropdown(this.#element, this.#trigger);
        this.#wire();
        this.#loaded = this.#loadContacts();
    }


    /** @returns {string[]} ids of the selected contacts */
    get selectedIds() {
        return this.#options().filter((opt) => opt.classList.contains('selected')).map((opt) => opt.dataset.id);
    }


    /**
     * Selects exactly the given contacts, once the contact list has loaded.
     * @param {string[]} ids
     * @returns {Promise<void>}
     */
    async select(ids) {
        await this.#loaded;
        const idSet = new Set(ids);
        this.#options().forEach((opt) => this.#setSelected(opt, idSet.has(opt.dataset.id)));
        this.#renderChips();
    }


    /** Deselects everyone and clears the search. */
    reset() {
        this.#options().forEach((opt) => this.#setSelected(opt, false));
        this.#renderChips();
        this.#clearSearch();
    }


    /** Wires trigger, search, list and focus handling. */
    #wire() {
        this.#trigger.addEventListener('mousedown', (e) => { if (e.target !== this.#search) e.preventDefault(); });
        this.#list.addEventListener('mousedown', (e) => { if (e.target.closest('.assigned-option')) e.preventDefault(); });
        this.#trigger.addEventListener('click', (e) => this.#handleTriggerClick(e));
        this.#search.addEventListener('focus', () => this.#open());
        this.#search.addEventListener('input', () => this.#filter(this.#search.value));
        this.#element.addEventListener('focusout', (e) => { if (!this.#element.contains(e.relatedTarget)) this.#close(); });
        this.#list.addEventListener('click', (e) => this.#handleListClick(e));
    }


    /** Loads all contacts from the store, current user first, into the option list. */
    async #loadContacts() {
        const contacts = await contactStore.getAll();
        Object.entries(contacts)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => Number(isCurrentUser(b)) - Number(isCurrentUser(a)))
            .forEach((contact) => this.#list.appendChild(buildOption(contact)));
    }


    /** @returns {HTMLLIElement[]} */
    #options() {
        return [...this.#list.querySelectorAll('.assigned-option')];
    }


    /**
     * @param {HTMLLIElement} option
     * @param {boolean} selected
     */
    #setSelected(option, selected) {
        option.classList.toggle('selected', selected);
        option.querySelector('.contact-checkbox').src = iconUrl(selected ? 'checked-box.svg' : 'default-box.svg');
        option.setAttribute('aria-selected', String(selected));
    }


    /** Shows up to MAX_VISIBLE_CHIPS avatars of the selected contacts, the rest as "+n". */
    #renderChips() {
        const selected = this.#options().filter((opt) => opt.classList.contains('selected'));
        const chips = selected.slice(0, MAX_VISIBLE_CHIPS).map(chipHtml);
        const overflow = selected.length - MAX_VISIBLE_CHIPS;
        if (overflow > 0) chips.push(`<span class="contact-avatar avatar-circle contact-avatar-more">+${overflow}</span>`);
        this.#chips.innerHTML = chips.join('');
    }


    /** @param {string} query - shows only options whose name contains it */
    #filter(query) {
        const q = query.trim().toLowerCase();
        this.#options().forEach((opt) => opt.classList.toggle('is-filtered', !opt.dataset.name.toLowerCase().includes(q)));
    }


    /** Empties the search field and shows all options again. */
    #clearSearch() {
        this.#search.value = '';
        this.#filter('');
    }


    /** Opens with a fresh, unfiltered list — unless already open (keeps an in-progress search). */
    #open() {
        if (this.#dropdown.isOpen) return;
        this.#dropdown.open();
        this.#clearSearch();
        this.#search.focus();
    }


    /** Closes and clears the search. */
    #close() {
        this.#dropdown.close();
        this.#clearSearch();
    }


    /**
     * The arrow closes an open dropdown; any other click on the trigger opens it.
     * @param {MouseEvent} e
     */
    #handleTriggerClick(e) {
        if (e.target.closest('.dropdown-arrow') && this.#dropdown.isOpen) return this.#close();
        this.#open();
    }


    /** @param {MouseEvent} e - toggles the clicked contact */
    #handleListClick(e) {
        const option = e.target.closest('.assigned-option');
        if (!option) return;
        this.#setSelected(option, !option.classList.contains('selected'));
        this.#renderChips();
    }
}

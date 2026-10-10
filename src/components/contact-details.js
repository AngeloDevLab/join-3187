import { getAvatarColorForId, getInitials, triggerTransitionIn } from '../utils/helpers.js';

const MENU_CLASSES = [
    ['#contactMenu', 'contact_menu_open'],
    ['#menuContactBtn', 'menu_contact_btn_active'],
    ['#contactMenuBackdrop', 'contact_menu_backdrop_open'],
];


/**
 * The details panel of the contacts page: shows one contact with its edit and
 * delete actions (desktop buttons plus the mobile action menu). On mobile it
 * replaces the contact list; the back button returns to the list.
 */
export class ContactDetails {
    #panel = document.getElementById('contactDetails');
    #list = document.getElementById('contactsList');
    #onEdit;
    #onDelete;


    /** @param {{ onEdit: (id: string) => void, onDelete: (id: string) => void }} actions */
    constructor({ onEdit, onDelete }) {
        this.#onEdit = onEdit;
        this.#onDelete = onDelete;
    }


    /**
     * Renders and animates in the given contact; on mobile hides the list.
     * @param {{ id: string, name: string, email: string, phone: string }} contact
     */
    show(contact) {
        const node = document.getElementById('contactDetailsTemplate').content.cloneNode(true);
        this.#fill(node, contact);
        this.#wire(node, contact.id);
        this.#panel.classList.remove('d-none');
        this.#panel.replaceChildren(node);
        const card = document.getElementById('contactDetailsCard');
        card.classList.remove('d-none');
        triggerTransitionIn(card, 'is-open');
        this.#list.classList.add('d-none');
    }


    /** Restores the empty placeholder panel and shows the list again. */
    reset() {
        const placeholder = document.getElementById('contactDetailsPlaceholderTemplate').content.cloneNode(true);
        this.#panel.replaceChildren(placeholder);
        this.#showList();
    }


    /** Closes the mobile action menu, if a contact is shown. */
    closeMenu() {
        this.#setMenuOpen(false);
    }


    /**
     * @param {DocumentFragment} node
     * @param {{ id: string, name: string, email: string, phone: string }} contact
     */
    #fill(node, contact) {
        const avatar = node.querySelector('.contact-details-avatar');
        avatar.style.background = getAvatarColorForId(contact.id);
        avatar.textContent = getInitials(contact.name);
        node.querySelector('.contact-details-name').textContent = contact.name;
        const email = node.querySelector('.contact-details-email');
        email.textContent = contact.email;
        email.href = `mailto:${contact.email}`;
        node.querySelector('.contact-details-phone').textContent = contact.phone;
    }


    /**
     * Wires edit/delete (both the desktop and the mobile menu copies), back button and menu.
     * @param {DocumentFragment} node
     * @param {string} id
     */
    #wire(node, id) {
        const act = (callback) => () => { this.closeMenu(); callback(id); };
        node.querySelectorAll('.contact-details-edit-btn').forEach((btn) => btn.addEventListener('click', act(this.#onEdit)));
        node.querySelectorAll('.contact-details-delete-btn').forEach((btn) => btn.addEventListener('click', act(this.#onDelete)));
        node.querySelector('.back-to-contacts-btn').addEventListener('click', () => this.#showList());
        node.querySelector('#menuContactBtn').addEventListener('click', () => this.#setMenuOpen(!this.#isMenuOpen()));
        node.querySelector('#contactMenuBackdrop').addEventListener('click', () => this.closeMenu());
    }


    /** Hides the details panel and shows the contact list (mobile). */
    #showList() {
        this.#panel.classList.add('d-none');
        this.#list.classList.remove('d-none');
    }


    /** @returns {boolean} */
    #isMenuOpen() {
        return !!document.querySelector('#contactMenu.contact_menu_open');
    }


    /** @param {boolean} open - shows or hides the mobile menu, its button state and backdrop */
    #setMenuOpen(open) {
        MENU_CLASSES.forEach(([selector, cls]) => document.querySelector(selector)?.classList.toggle(cls, open));
    }
}

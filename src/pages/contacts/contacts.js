import '../../utils/auth-guard.js';
import { initNavbar } from '../../components/navbar.js';
import { showToast } from '../../components/toast.js';
import { ContactList } from './contact-list.js';
import { ContactDetails } from './contact-details.js';
import { ContactOverlay } from './contact-overlay.js';
import { authService } from '../../services/auth-service.js';
import { contactStore } from '../../services/contact-store.js';

/** On desktop, clicking the selected contact again deselects it (mobile always shows details). */
const DESKTOP = window.matchMedia('(min-width: 1024px)');


/**
 * @param {Object<string, { email?: string }>} contacts
 * @param {string} email
 * @returns {boolean} true if a contact with this email already exists
 */
function hasContactWithEmail(contacts, email) {
    return Object.values(contacts).some((contact) => contact.email?.toLowerCase() === email.toLowerCase());
}


/**
 * The contacts page: keeps list and details in sync with the live contact
 * store and runs create/edit/delete through the contact dialogs.
 */
class ContactsPage {
    #activeId = null;
    #list = new ContactList((id) => this.#handleSelect(id));
    #details = new ContactDetails({ onEdit: (id) => this.#openEdit(id), onDelete: (id) => this.#openDelete(id) });
    #overlay = new ContactOverlay();


    /** Wires the add buttons, adds the current user as a contact if needed and starts rendering. */
    async init() {
        document.querySelectorAll('.desktop-add-contact-btn, .add-contact-btn').forEach((btn) =>
            btn.addEventListener('click', () => this.#openAdd()));
        await this.#addCurrentUser().catch((err) => console.error('Could not add you as a contact:', err));
        contactStore.subscribe((contacts) => this.#render(contacts));
    }


    /**
     * Re-renders the list on every store change; deselects the shown contact if
     * it was deleted in the meantime (by this or another user).
     * @param {Object} contacts
     */
    #render(contacts) {
        if (this.#activeId && !contacts[this.#activeId]) this.#deselect();
        this.#list.render(contacts, this.#activeId);
    }


    /** @param {string} id - shows the contact, or deselects it when clicked again on desktop */
    #handleSelect(id) {
        if (this.#activeId === id && DESKTOP.matches) return this.#deselect();
        this.#select(id);
    }


    /** @param {string} id - highlights the contact and shows its details */
    async #select(id) {
        const contact = await this.#contact(id);
        if (!contact) return;
        this.#activeId = id;
        this.#list.setActive(id);
        this.#details.show(contact);
    }


    /** Clears the selection and shows the placeholder panel. */
    #deselect() {
        this.#activeId = null;
        this.#list.setActive(null);
        this.#details.reset();
    }


    /** Opens the add dialog; the new contact is selected right after saving. */
    #openAdd() {
        this.#overlay.openAdd(async (values) => {
            const id = await contactStore.add(values);
            await this.#select(id);
            showToast('Contact successfully created');
        });
    }


    /** @param {string} id - opens the edit dialog for this contact */
    async #openEdit(id) {
        const contact = await this.#contact(id);
        if (!contact) return;
        this.#overlay.openEdit(contact, async (values) => {
            await contactStore.update(id, values);
            await this.#select(id);
            showToast('Contact updated');
        }, () => this.#openDelete(id));
    }


    /** @param {string} id - opens the delete confirmation for this contact */
    async #openDelete(id) {
        const contact = await this.#contact(id);
        if (!contact) return;
        this.#overlay.openDelete(contact, async () => {
            await contactStore.remove(id);
            this.#deselect();
            showToast('Contact deleted');
        });
    }


    /**
     * @param {string} id
     * @returns {Promise<{ id: string, name: string, email: string, phone: string }|undefined>}
     */
    async #contact(id) {
        const contact = await contactStore.getById(id);
        return contact ? { id, ...contact } : undefined;
    }


    /** Adds the logged-in (non-guest) user to the contact list once. */
    async #addCurrentUser() {
        const user = authService.currentUser;
        if (!user?.email) return;
        if (hasContactWithEmail(await contactStore.getAll(), user.email)) return;
        await contactStore.add({ name: user.name, email: user.email, phone: '' });
    }
}


initNavbar();
new ContactsPage().init();

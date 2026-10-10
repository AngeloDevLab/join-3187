import { ref, update } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';
import { db } from './firebase.js';
import { Store } from './store.js';
import { taskStore } from './task-store.js';


/** Live store for all contacts (`contacts/` in the database). */
export class ContactStore extends Store {
    /** Binds the store to the `contacts` collection. */
    constructor() {
        super('contacts');
    }


    /**
     * Finds a contact by email, ignoring case.
     * @param {string} email
     * @returns {Promise<string|null>} the contact's id, or null if there is none
     */
    async findByEmail(email) {
        const wanted = email.trim().toLowerCase();
        const contacts = await this.fetchOnce();
        return Object.keys(contacts).find((id) => contacts[id].email?.toLowerCase() === wanted) ?? null;
    }


    /**
     * Deletes a contact and removes it from every task's assignedTo list in one
     * atomic multi-path write, so no task is left pointing at a deleted contact.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const tasks = await taskStore.getAll();
        const changes = { [`contacts/${id}`]: null };
        Object.entries(tasks).forEach(([taskId, task]) => {
            if (!task.assignedTo?.includes(id)) return;
            changes[`tasks/${taskId}/assignedTo`] = task.assignedTo.filter((contactId) => contactId !== id);
        });
        await update(ref(db), changes);
    }
}


/** Shared instance used by every page. */
export const contactStore = new ContactStore();

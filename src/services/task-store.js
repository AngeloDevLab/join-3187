import { Store } from './store.js';
import { authService } from './auth-service.js';
import { todayIsoDate } from '../utils/helpers.js';


/**
 * The logged-in user as an internal task creator; guests have no email.
 * @returns {{ name: string, email?: string, type: 'internal' }}
 */
function currentCreator() {
    const user = authService.currentUser;
    if (!user || user.isGuest) return { name: 'Guest', type: 'internal' };
    return { name: user.name, email: user.email, type: 'internal' };
}


/** Live store for all board tasks (`tasks/` in the database). */
export class TaskStore extends Store {
    /** Binds the store to the `tasks` collection. */
    constructor() {
        super('tasks');
    }


    /**
     * Creates a task from task-form values at the end of the given column,
     * with the logged-in user as its internal creator.
     * @param {Object} values - fields from TaskForm#values
     * @param {string} column - e.g. 'triage'
     * @returns {Promise<string>} the new task's id
     */
    create(values, column) {
        return this.add({ ...values, column, order: Date.now(), createdAt: todayIsoDate(), creator: currentCreator() });
    }
}


/** Shared instance used by every page. */
export const taskStore = new TaskStore();

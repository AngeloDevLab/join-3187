import { Store } from './store.js';
import { todayIsoDate } from '../utils/helpers.js';


/** Live store for all board tasks (`tasks/` in the database). */
export class TaskStore extends Store {
    /** Binds the store to the `tasks` collection. */
    constructor() {
        super('tasks');
    }


    /**
     * Creates a task from task-form values at the end of the given column.
     * @param {Object} values - fields from TaskForm#values
     * @param {string} column - e.g. 'todo'
     * @returns {Promise<string>} the new task's id
     */
    create(values, column) {
        return this.add({ ...values, column, order: Date.now(), createdAt: todayIsoDate() });
    }
}


/** Shared instance used by every page. */
export const taskStore = new TaskStore();

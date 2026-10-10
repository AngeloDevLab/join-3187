import { Store } from './store.js';


/** Live store for all board tasks (`tasks/` in the database). */
export class TaskStore extends Store {
    /** Binds the store to the `tasks` collection. */
    constructor() {
        super('tasks');
    }
}


/** Shared instance used by every page. */
export const taskStore = new TaskStore();

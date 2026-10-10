import '../../utils/auth-guard.js';
import { initNavbar } from '../../components/navbar.js';
import { TaskForm } from '../../components/task-form/task-form.js';
import { taskStore } from '../../services/task-store.js';
import { pageUrl } from '../../utils/paths.js';

const REDIRECT_DELAY_MS = 1200;


/**
 * Saves the new task, then sends the user to the board once the toast was visible.
 * @param {import('../../components/task-form/task-form.js').TaskFormValues} values
 * @returns {Promise<void>}
 */
async function createTask(values) {
    await taskStore.create(values, 'todo');
    setTimeout(() => { window.location.href = pageUrl('board'); }, REDIRECT_DELAY_MS);
}


initNavbar();
new TaskForm(document, { onSubmit: createTask });

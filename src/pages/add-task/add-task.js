import '../../utils/auth-guard.js';
import { initNavbar } from '../../components/navbar.js';
import { initAddTaskForm, toFirebaseTask } from '../../components/add-task-form.js';
import { taskStore } from '../../services/task-store.js';
import { pageUrl } from '../../utils/paths.js';


initNavbar();
initAddTaskForm(document, {
    onSubmitSuccess: async (data) => {
        await taskStore.add(toFirebaseTask(data, 'todo'));
        setTimeout(() => { window.location.href = pageUrl('board'); }, 1200);
    },
});

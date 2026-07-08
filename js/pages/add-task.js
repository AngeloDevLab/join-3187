import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { initAddTaskForm, toFirebaseTask } from '../components/add-task-form.js';
import { saveTask } from '../firebase/cache.js';


initNavbar();
initAddTaskForm(document, {
    onSubmitSuccess: async (data) => {
        await saveTask(toFirebaseTask(data, 'todo'));
        setTimeout(() => { window.location.href = 'board.html'; }, 1200);
    },
});

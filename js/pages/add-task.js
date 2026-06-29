import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { initAddTaskForm, toFirebaseTask } from '../components/add-task-form.js';
import { saveTask } from '../firebase/cache.js';


initNavbar();
initAddTaskForm(document, {
    onSubmitSuccess: (data) => saveTask(toFirebaseTask(data, 'todo')),
});

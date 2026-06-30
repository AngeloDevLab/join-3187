import { validateField, clearError } from '../utils/form-validation.js';
import { showToast } from '../components/toast.js';
import { initSubtaskInput, getSubtasks, setSubtasks } from './subtask.js';
import { initCategoryDropdown, initDropdownAutoClose, setCategoryOption } from './task-category-dropdown.js';
import { initAssignedDropdown, resetAssignedDropdown, getSelectedContacts, selectAssignedContacts } from './task-assigned-dropdown.js';


const CATEGORY_OPTION = {
    userStory: { value: 'user-story', label: 'User Story' },
    technicalTask: { value: 'technical-task', label: 'Technical Task' },
};


// ── Priority ─────────────────────────────────────────────

/**
 * Removes `.selected` from all priority buttons and adds it to `clicked`.
 * @param {ParentNode} root
 * @param {HTMLButtonElement} clicked
 */
function selectPriorityBtn(root, clicked) {
    root.querySelectorAll('.priority-btn').forEach((btn) => btn.classList.remove('selected'));
    clicked.classList.add('selected');
}


/**
 * Returns the currently selected priority value.
 * @param {ParentNode} root
 * @returns {string}
 */
function getSelectedPriority(root) {
    return root.querySelector('.priority-btn.selected')?.dataset.priority ?? 'medium';
}


/**
 * Attaches click handlers to all priority buttons.
 * @param {ParentNode} root
 */
function initPriorityButtons(root) {
    root.querySelectorAll('.priority-btn').forEach((btn) => {
        btn.addEventListener('click', () => selectPriorityBtn(root, btn));
    });
}


// ── Fields & Validation ──────────────────────────────────

/**
 * Collects all validated field elements into one object.
 * @param {ParentNode} root
 * @returns {{ titleInput: HTMLInputElement, titleError: HTMLElement, dueDateInput: HTMLInputElement, dueDateError: HTMLElement, categorySelect: HTMLSelectElement, categoryError: HTMLElement }}
 */
function getFormFields(root) {
    return {
        titleInput: root.querySelector('#task-title'),
        titleError: root.querySelector('#taskTitleError'),
        dueDateInput: root.querySelector('#task-due-date'),
        dueDateError: root.querySelector('#taskDueDateError'),
        categorySelect: root.querySelector('#task-category'),
        categoryError: root.querySelector('#taskCategoryError'),
    };
}


/**
 * Returns true when all required task fields are filled.
 * @param {ReturnType<typeof getFormFields>} fields
 * @returns {boolean}
 */
function isTaskReady(fields) {
    return !!fields.titleInput.value.trim()
        && !!fields.dueDateInput.value
        && !!fields.categorySelect.value;
}


/**
 * Returns today's date as a local YYYY-MM-DD string, for use as a date input's min/value.
 * @returns {string}
 */
function getTodayDateString() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today - offset).toISOString().slice(0, 10);
}


/**
 * Visually dims the submit button when required fields are missing, without
 * disabling it so a click still triggers validation and shows the errors.
 * @param {HTMLButtonElement} btn
 * @param {ReturnType<typeof getFormFields>} fields
 */
function updateTaskBtn(btn, fields) {
    btn.classList.toggle('btn-pending', !isTaskReady(fields));
}


/**
 * Runs all required-field checks and returns true only if all pass.
 * @param {ReturnType<typeof getFormFields>} fields
 * @returns {boolean}
 */
function validateTaskForm(fields) {
    const { titleInput, titleError, dueDateInput, dueDateError, categorySelect, categoryError } = fields;
    const dueDateValid = !!dueDateInput.value && dueDateInput.value >= getTodayDateString();
    return [
        validateField(titleInput, titleError, !!titleInput.value.trim(), 'This field is required'),
        validateField(dueDateInput, dueDateError, dueDateValid, dueDateInput.value
            ? 'Date cannot be in the past' : 'This field is required'),
        validateField(categorySelect, categoryError, !!categorySelect.value, 'This field is required'),
    ].every(Boolean);
}


// ── Form Reset ───────────────────────────────────────────

/**
 * Resets the category dropdown label back to its placeholder text.
 * @param {ParentNode} root
 */
function resetCategoryDropdown(root) {
    const valueEl = root.querySelector('#categoryDropdown .dropdown-value');
    if (!valueEl) return;
    valueEl.textContent = 'Select task category';
    valueEl.classList.add('dropdown-placeholder');
}


/**
 * Empties all input values in the form.
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 */
function resetInputs(fields, root) {
    fields.titleInput.value = '';
    fields.dueDateInput.value = '';
    fields.dueDateInput.classList.remove('has-value');
    fields.categorySelect.value = '';
    resetCategoryDropdown(root);
    resetAssignedDropdown(root);
    root.querySelector('#task-description').value = '';
    root.querySelector('#task-subtask').value = '';
    root.querySelector('#subtaskList').innerHTML = '';
}


/**
 * Clears the error state for all validated fields.
 * @param {ReturnType<typeof getFormFields>} fields
 */
function resetErrors(fields) {
    const { titleInput, titleError, dueDateInput, dueDateError, categorySelect, categoryError } = fields;
    clearError(titleInput.closest('.input-wrapper'), titleError);
    clearError(dueDateInput.closest('.input-wrapper'), dueDateError);
    clearError(categorySelect.closest('.input-wrapper'), categoryError);
}


/**
 * Resets the entire form to its initial state.
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 */
function clearTaskForm(fields, root) {
    resetInputs(fields, root);
    resetErrors(fields);
    selectPriorityBtn(root, root.querySelector('.priority-btn[data-priority="medium"]'));
}


// ── Collecting Data ──────────────────────────────────────

/**
 * Builds a plain task-data object from the current form state.
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 * @returns {{ title: string, description: string, dueDate: string, priority: string, type: string, assigned: object[], subtasks: { title: string, done: boolean }[] }}
 */
function collectTaskData(fields, root) {
    return {
        title: fields.titleInput.value.trim(),
        description: root.querySelector('#task-description').value.trim(),
        dueDate: fields.dueDateInput.value,
        priority: getSelectedPriority(root),
        type: fields.categorySelect.value === 'user-story' ? 'User Story' : 'Technical Task',
        assigned: getSelectedContacts(root),
        subtasks: getSubtasks(root),
    };
}


/**
 * Maps collected form data to a Firebase-ready task object for the given column.
 * @param {ReturnType<typeof collectTaskData>} data
 * @param {string} column
 * @param {string} [createdAt] - Keeps the original creation date when editing; defaults to today.
 * @returns {Object}
 */
export function toFirebaseTask(data, column, createdAt = getTodayDateString()) {
    const subtasks = {};
    data.subtasks.forEach((s, i) => { subtasks[`subtask${i + 1}`] = { title: s.title, done: s.done }; });
    return {
        title: data.title,
        description: data.description,
        category: data.type === 'User Story' ? 'userStory' : 'technicalTask',
        priority: data.priority,
        column,
        assignedTo: data.assigned.map((c) => c.id),
        dueDate: data.dueDate,
        createdAt,
        subtasks,
    };
}


// ── Submit ───────────────────────────────────────────────

/**
 * Validates and submits the task form, shows confirmation, then clears the form.
 * @param {SubmitEvent} e
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 * @param {(data: ReturnType<typeof collectTaskData>) => void} [onSubmitSuccess]
 * @param {string} successMessage
 */
function handleSubmit(e, fields, root, onSubmitSuccess, successMessage) {
    e.preventDefault();
    if (!validateTaskForm(fields)) return;
    onSubmitSuccess?.(collectTaskData(fields, root));
    showToast(successMessage);
    clearTaskForm(fields, root);
    updateTaskBtn(e.submitter, fields);
}


/**
 * Wires up submit, clear/cancel, and date-color handlers for the task form.
 * @param {ParentNode} root
 * @param {(data: ReturnType<typeof collectTaskData>) => void} [onSubmitSuccess]
 * @param {() => void} [onCancel]
 * @param {string} successMessage
 */
function initTaskForm(root, onSubmitSuccess, onCancel, successMessage) {
    const form = root.querySelector('.task-form');
    if (!form) return;
    const fields = getFormFields(root);
    const submitBtn = form.querySelector('[type="submit"]');
    fields.dueDateInput.min = getTodayDateString();
    updateTaskBtn(submitBtn, fields);
    wireTaskFormEvents(root, form, fields, submitBtn, onSubmitSuccess, onCancel, successMessage);
}


/**
 * Attaches all event listeners for input feedback, submit and cancel to the task form.
 * @param {ParentNode} root
 * @param {HTMLFormElement} form
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {HTMLButtonElement} submitBtn
 * @param {Function} [onSubmitSuccess]
 * @param {Function} [onCancel]
 * @param {string} successMessage
 */
function wireTaskFormEvents(root, form, fields, submitBtn, onSubmitSuccess, onCancel, successMessage) {
    fields.titleInput.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.categorySelect.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.dueDateInput.addEventListener('change', () => {
        fields.dueDateInput.classList.toggle('has-value', !!fields.dueDateInput.value);
        updateTaskBtn(submitBtn, fields);
    });
    form.addEventListener('submit', (e) => handleSubmit(e, fields, root, onSubmitSuccess, successMessage));
    form.querySelector('.clear-btn')?.addEventListener('click', () =>
        onCancel ? onCancel() : clearTaskForm(fields, root));
}


/**
 * Relabels the modal for edit mode: heading, a single "Ok" submit button, no cancel button.
 * @param {ParentNode} root
 */
function relabelForEdit(root) {
    const heading = root.querySelector('h1');
    if (heading) heading.textContent = 'Edit Task';
    const submitBtn = root.querySelector('.task-form [type="submit"]');
    if (submitBtn?.firstChild) submitBtn.firstChild.textContent = 'Ok ';
    root.querySelector('.clear-btn')?.remove();
}


/**
 * Fills the form with an existing task's data for editing (all fields except
 * assigned contacts, which are selected once the dropdown finishes loading).
 * @param {ParentNode} root
 * @param {Object} task
 */
function prefillTaskForm(root, task) {
    const fields = getFormFields(root);
    fields.titleInput.value = task.title;
    root.querySelector('#task-description').value = task.description ?? '';
    fields.dueDateInput.value = task.dueDate;
    fields.dueDateInput.classList.add('has-value');
    const priorityBtn = root.querySelector(`.priority-btn[data-priority="${task.priority}"]`);
    if (priorityBtn) selectPriorityBtn(root, priorityBtn);
    const opt = CATEGORY_OPTION[task.category] ?? CATEGORY_OPTION.userStory;
    setCategoryOption(root, opt.value, opt.label);
    setSubtasks(root, Object.values(task.subtasks ?? {}));
    relabelForEdit(root);
}


/**
 * Initializes the add-task form within the given root (the document for the
 * standalone page, or a modal's dialog element when reused inside one).
 * @param {ParentNode} root
 * @param {{ onSubmitSuccess?: (data: ReturnType<typeof collectTaskData>) => void, onCancel?: () => void, editTask?: Object }} [options]
 */
export function initAddTaskForm(root, { onSubmitSuccess, onCancel, editTask } = {}) {
    initDropdownAutoClose();
    initPriorityButtons(root);
    initCategoryDropdown(root);
    const assignedReady = initAssignedDropdown(root);
    initSubtaskInput(root);
    if (editTask) prefillTaskForm(root, editTask);
    const successMessage = editTask ? 'Task updated' : 'Task added to board';
    initTaskForm(root, onSubmitSuccess, onCancel, successMessage);
    if (editTask) assignedReady.then(() => selectAssignedContacts(root, editTask.assignedTo ?? []));
}

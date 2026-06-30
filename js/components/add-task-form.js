import { validateField, clearError } from '../utils/form-validation.js';
import { showToast } from '../components/toast.js';
import { initSubtaskInput, getSubtasks } from './subtask.js';
import { initCategoryDropdown, initDropdownAutoClose } from './task-category-dropdown.js';
import { initAssignedDropdown, resetAssignedDropdown, getSelectedContacts } from './task-assigned-dropdown.js';


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
 * @returns {{ title: string, description: string, dueDate: string, priority: string, type: string, assigned: object[], subtasks: string[] }}
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
 * @returns {Object}
 */
export function toFirebaseTask(data, column) {
    const subtasks = {};
    data.subtasks.forEach((title, i) => { subtasks[`subtask${i + 1}`] = { title, done: false }; });
    return {
        title: data.title,
        description: data.description,
        category: data.type === 'User Story' ? 'userStory' : 'technicalTask',
        priority: data.priority,
        column,
        assignedTo: data.assigned.map((c) => c.id),
        dueDate: data.dueDate,
        createdAt: getTodayDateString(),
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
 */
function handleSubmit(e, fields, root, onSubmitSuccess) {
    e.preventDefault();
    if (!validateTaskForm(fields)) return;
    onSubmitSuccess?.(collectTaskData(fields, root));
    showToast('Task added to board');
    clearTaskForm(fields, root);
    updateTaskBtn(e.submitter, fields);
}


/**
 * Wires up submit, clear/cancel, and date-color handlers for the task form.
 * @param {ParentNode} root
 * @param {(data: ReturnType<typeof collectTaskData>) => void} [onSubmitSuccess]
 * @param {() => void} [onCancel]
 */
function initTaskForm(root, onSubmitSuccess, onCancel) {
    const form = root.querySelector('.task-form');
    if (!form) return;
    const fields = getFormFields(root);
    const submitBtn = form.querySelector('[type="submit"]');
    fields.dueDateInput.min = getTodayDateString();
    updateTaskBtn(submitBtn, fields);
    wireTaskFormEvents(root, form, fields, submitBtn, onSubmitSuccess, onCancel);
}


/**
 * Attaches all event listeners for input feedback, submit and cancel to the task form.
 * @param {ParentNode} root
 * @param {HTMLFormElement} form
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {HTMLButtonElement} submitBtn
 * @param {Function} [onSubmitSuccess]
 * @param {Function} [onCancel]
 */
function wireTaskFormEvents(root, form, fields, submitBtn, onSubmitSuccess, onCancel) {
    fields.titleInput.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.categorySelect.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.dueDateInput.addEventListener('change', () => {
        fields.dueDateInput.classList.toggle('has-value', !!fields.dueDateInput.value);
        updateTaskBtn(submitBtn, fields);
    });
    form.addEventListener('submit', (e) => handleSubmit(e, fields, root, onSubmitSuccess));
    form.querySelector('.clear-btn').addEventListener('click', () =>
        onCancel ? onCancel() : clearTaskForm(fields, root));
}


/**
 * Initializes the add-task form within the given root (the document for the
 * standalone page, or a modal's dialog element when reused inside one).
 * @param {ParentNode} root
 * @param {{ onSubmitSuccess?: (data: ReturnType<typeof collectTaskData>) => void, onCancel?: () => void }} [options]
 */
export function initAddTaskForm(root, { onSubmitSuccess, onCancel } = {}) {
    initDropdownAutoClose();
    initPriorityButtons(root);
    initCategoryDropdown(root);
    initAssignedDropdown(root);
    initSubtaskInput(root);
    initTaskForm(root, onSubmitSuccess, onCancel);
}

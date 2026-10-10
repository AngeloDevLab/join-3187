import { validateField, clearError } from '../../utils/form-validation.js';
import { todayIsoDate } from '../../utils/helpers.js';
import { showToast } from '../toast.js';
import { CategorySelect } from './category-select.js';
import { AssignedSelect } from './assigned-select.js';
import { SubtaskList } from './subtask-list.js';

const REQUIRED = 'This field is required';
const DEFAULT_PRIORITY = 'medium';


/**
 * @typedef {Object} TaskFormValues
 * @property {string} title
 * @property {string} description
 * @property {string} dueDate - YYYY-MM-DD
 * @property {'urgent'|'medium'|'low'} priority
 * @property {string} category - e.g. 'userStory'
 * @property {string[]} assignedTo - contact ids
 * @property {Object<string, { title: string, done: boolean }>} subtasks
 */


/**
 * Converts the subtask list into the keyed object stored in the database.
 * @param {{ title: string, done: boolean }[]} subtasks
 * @returns {Object<string, { title: string, done: boolean }>}
 */
function toSubtaskMap(subtasks) {
    return Object.fromEntries(subtasks.map((s, i) => [`subtask${i + 1}`, { title: s.title, done: s.done }]));
}


/**
 * The add/edit task form — used on the Add Task page and inside the board's
 * modals. Validates, then hands database-ready values to `onSubmit`; while
 * saving the submit button is disabled, and the success toast only appears
 * once saving actually succeeded.
 */
export class TaskForm {
    #root;
    #form;
    #submitBtn;
    #fields;
    #category;
    #assigned;
    #subtasks;
    #onSubmit;
    #onCancel;
    #successMessage;
    #busy = false;


    /**
     * @param {ParentNode} root - the document (Add Task page) or a modal's dialog
     * @param {{ onSubmit: (values: TaskFormValues) => Promise<void>, onCancel?: () => void, task?: Object }} options
     *   `task` switches the form to edit mode, prefilled with that task
     */
    constructor(root, { onSubmit, onCancel, task }) {
        this.#root = root;
        this.#form = root.querySelector('.task-form');
        this.#submitBtn = this.#form.querySelector('[type="submit"]');
        this.#fields = TaskForm.#queryFields(root);
        this.#category = new CategorySelect(root);
        this.#assigned = new AssignedSelect(root);
        this.#subtasks = new SubtaskList(root);
        this.#onSubmit = onSubmit;
        this.#onCancel = onCancel;
        this.#successMessage = task ? 'Task updated' : 'Task added to board';
        this.#init(task);
    }


    /** @returns {TaskFormValues} the current form state, ready to be stored */
    get values() {
        const { title, description, dueDate } = this.#fields;
        return {
            title: title.value.trim(),
            description: description.value.trim(),
            dueDate: dueDate.value,
            priority: this.#root.querySelector('.priority-btn.selected')?.dataset.priority ?? DEFAULT_PRIORITY,
            category: this.#category.value,
            assignedTo: this.#assigned.selectedIds,
            subtasks: toSubtaskMap(this.#subtasks.values),
        };
    }


    /** Resets every field, error and the priority back to the initial state. */
    reset() {
        const { title, description, dueDate } = this.#fields;
        [title, description, dueDate].forEach((input) => { input.value = ''; });
        dueDate.classList.remove('has-value');
        this.#category.reset();
        this.#assigned.reset();
        this.#subtasks.reset();
        this.#clearErrors();
        this.#selectPriority(DEFAULT_PRIORITY);
        this.#updateSubmitState();
    }


    /**
     * @param {ParentNode} root
     * @returns {{ title: HTMLInputElement, titleError: HTMLElement, description: HTMLTextAreaElement, dueDate: HTMLInputElement, dueDateError: HTMLElement, categoryError: HTMLElement }}
     */
    static #queryFields(root) {
        return {
            title: root.querySelector('#task-title'),
            titleError: root.querySelector('#taskTitleError'),
            description: root.querySelector('#task-description'),
            dueDate: root.querySelector('#task-due-date'),
            dueDateError: root.querySelector('#taskDueDateError'),
            categoryError: root.querySelector('#taskCategoryError'),
        };
    }


    /** @param {Object} [task] - prefills edit mode before the listeners are attached */
    #init(task) {
        this.#fields.dueDate.min = todayIsoDate();
        if (task) this.#prefill(task);
        this.#wire();
        this.#updateSubmitState();
    }


    /** Attaches input feedback, validation, priority, submit and cancel handlers. */
    #wire() {
        const { title, dueDate } = this.#fields;
        title.addEventListener('input', () => this.#updateSubmitState());
        this.#category.input.addEventListener('input', () => this.#updateSubmitState());
        dueDate.addEventListener('change', () => { dueDate.classList.toggle('has-value', !!dueDate.value); this.#updateSubmitState(); });
        title.addEventListener('blur', () => this.#validateTitle());
        dueDate.addEventListener('blur', () => this.#validateDueDate());
        this.#root.querySelectorAll('.priority-btn').forEach((btn) =>
            btn.addEventListener('click', () => this.#selectPriority(btn.dataset.priority)));
        this.#form.addEventListener('submit', (e) => this.#handleSubmit(e));
        this.#form.querySelector('.clear-btn')?.addEventListener('click', () => (this.#onCancel ? this.#onCancel() : this.reset()));
    }


    /** @param {SubmitEvent} e */
    async #handleSubmit(e) {
        e.preventDefault();
        if (this.#busy || !this.#validate()) return;
        this.#setBusy(true);
        try {
            await this.#onSubmit(this.values);
            showToast(this.#successMessage);
            this.reset();
        } catch (err) {
            console.error('Saving the task failed:', err);
            showToast('Saving failed. Please try again.');
        } finally {
            this.#setBusy(false);
        }
    }


    /** @param {boolean} busy - disables the submit button while saving (no double submits) */
    #setBusy(busy) {
        this.#busy = busy;
        this.#submitBtn.disabled = busy;
    }


    /** @returns {boolean} true if all required fields are valid; shows errors otherwise */
    #validate() {
        return [
            this.#validateTitle(),
            this.#validateDueDate(),
            validateField(this.#category.input, this.#fields.categoryError, !!this.#category.value, REQUIRED),
        ].every(Boolean);
    }


    /** @returns {boolean} */
    #validateTitle() {
        const { title, titleError } = this.#fields;
        return validateField(title, titleError, !!title.value.trim(), REQUIRED);
    }


    /** @returns {boolean} true if a due date is set and not in the past */
    #validateDueDate() {
        const { dueDate, dueDateError } = this.#fields;
        const valid = !!dueDate.value && dueDate.value >= todayIsoDate();
        return validateField(dueDate, dueDateError, valid, dueDate.value ? 'Date cannot be in the past' : REQUIRED);
    }


    /**
     * Dims (but does not disable) the submit button while required fields are
     * missing, so a click still runs validation and shows the errors.
     */
    #updateSubmitState() {
        const { title, dueDate } = this.#fields;
        const ready = !!title.value.trim() && !!dueDate.value && !!this.#category.value;
        this.#submitBtn.classList.toggle('btn-pending', !ready);
    }


    /** Clears the error state of all validated fields. */
    #clearErrors() {
        const { title, titleError, dueDate, dueDateError, categoryError } = this.#fields;
        clearError(title.closest('.input-wrapper'), titleError);
        clearError(dueDate.closest('.input-wrapper'), dueDateError);
        clearError(this.#category.input.closest('.input-wrapper'), categoryError);
    }


    /** @param {string} priority - 'urgent' | 'medium' | 'low' */
    #selectPriority(priority) {
        this.#root.querySelectorAll('.priority-btn').forEach((btn) =>
            btn.classList.toggle('selected', btn.dataset.priority === priority));
    }


    /**
     * Fills the form with an existing task and relabels it for editing.
     * @param {Object} task - raw task from the store
     */
    #prefill(task) {
        const { title, description, dueDate } = this.#fields;
        title.value = task.title;
        description.value = task.description ?? '';
        dueDate.value = task.dueDate;
        dueDate.classList.add('has-value');
        this.#selectPriority(task.priority ?? DEFAULT_PRIORITY);
        this.#category.value = task.category;
        this.#subtasks.values = Object.values(task.subtasks ?? {});
        this.#assigned.select(task.assignedTo ?? []);
        this.#relabelForEdit();
    }


    /** Edit mode: "Edit Task" heading, a single "Ok" submit button, no cancel/clear button. */
    #relabelForEdit() {
        const heading = this.#root.querySelector('h1');
        if (heading) heading.textContent = 'Edit Task';
        if (this.#submitBtn.firstChild) this.#submitBtn.firstChild.textContent = 'Ok ';
        this.#form.querySelector('.clear-btn')?.remove();
    }
}

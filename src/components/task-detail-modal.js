import { Modal } from './modal.js';
import { TaskForm } from './task-form/task-form.js';
import { showToast } from './toast.js';
import { PRIORITY_META, escapeHtml, getSubtaskProgress } from '../utils/helpers.js';
import { iconUrl } from '../utils/paths.js';


/**
 * Formats "YYYY-MM-DD" to "DD/MM/YYYY", or returns "—" when absent.
 * @param {string|undefined} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}


/**
 * @param {string} priority - 'urgent' | 'medium' | 'low'
 * @returns {string} the priority chip with label and icon
 */
function priorityHtml(priority) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
    return `<span class="priority-chip priority-chip--${meta.cls}">
        ${meta.label} <img src="${meta.icon}" alt="" width="18" height="18">
    </span>`;
}


/**
 * @param {import('../utils/task-view.js').TaskView['assigned']} assigned
 * @returns {string} one row per assigned contact, or a muted placeholder
 */
function assignedHtml(assigned) {
    if (!assigned.length) return '<p class="task-detail-muted">No contacts assigned</p>';
    const rows = assigned.map((c) => `<div class="task-detail-contact">
            <span class="avatar avatar-circle" style="background:${c.color}">${escapeHtml(c.initials)}</span>
            <span>${escapeHtml(c.name)}</span>
        </div>`).join('');
    return `<div class="task-detail-assigned-list">${rows}</div>`;
}


/**
 * @param {{ done: boolean }[]} subtasks
 * @returns {string} the progress bar plus done/total count
 */
function progressHtml(subtasks) {
    const { done, total, percent } = getSubtaskProgress(subtasks);
    return `<div class="progress-row">
        <div class="progress-bar"><div style="width:${percent}%"></div></div>
        <span>${done}/${total} Subtasks</span>
    </div>`;
}


/**
 * @param {import('../utils/task-view.js').TaskView['subtasks']} subtasks
 * @returns {string} the progress row plus one checkbox per subtask, or a placeholder
 */
function subtasksHtml(subtasks) {
    if (!subtasks.length) return '<p class="task-detail-muted">No subtasks</p>';
    const items = subtasks.map((s) => `<li class="task-detail-subtask">
        <label class="checkbox">
            <input type="checkbox" class="checkbox-input" data-key="${s.key}" ${s.done ? 'checked' : ''}>
            <span class="checkbox-icon" aria-hidden="true"></span>
            ${escapeHtml(s.title)}
        </label>
    </li>`).join('');
    return `${progressHtml(subtasks)}<ul class="task-detail-subtask-list">${items}</ul>`;
}


/**
 * @param {import('../utils/task-view.js').TaskView} task
 * @returns {string} category badge, close button, title and description
 */
function headerHtml(task) {
    return `<div class="task-header">
            <span class="task-category ${task.category.cls}">${escapeHtml(task.category.label)}</span>
            <button type="button" class="close-btn" aria-label="Close">✕</button>
        </div>
        <h2 class="task-detail-title">${escapeHtml(task.title)}</h2>
        <p class="task-detail-description">${escapeHtml(task.description)}</p>`;
}


/**
 * @param {import('../utils/task-view.js').TaskView} task
 * @returns {string} the due date and priority rows
 */
function metaHtml(task) {
    return `<div class="task-detail-row">
            <span class="task-detail-label">Due date:</span>
            <span>${formatDate(task.dueDate)}</span>
        </div>
        <div class="task-detail-row">
            <span class="task-detail-label">Priority:</span>
            ${priorityHtml(task.priority)}
        </div>`;
}


/**
 * @param {import('../utils/task-view.js').TaskView} task
 * @returns {string} the assignees and subtasks sections
 */
function sectionsHtml(task) {
    return `<div class="task-detail-section">
            <p class="task-detail-label">Assigned To:</p>
            ${assignedHtml(task.assigned)}
        </div>
        <div class="task-detail-section">
            <p class="task-detail-label">Subtasks</p>
            ${subtasksHtml(task.subtasks)}
        </div>`;
}


/** @returns {string} the delete and edit action buttons */
function actionsHtml() {
    return `<div class="task-detail-actions">
        <button type="button" class="task-detail-action task-detail-delete">
            <img src="${iconUrl('delete.svg')}" alt="" width="16"> Delete
        </button>
        <div class="task-detail-action-divider"></div>
        <button type="button" class="task-detail-action task-detail-edit">
            <img src="${iconUrl('edit.svg')}" alt="" width="16"> Edit
        </button>
    </div>`;
}


/**
 * A centered modal showing one task, with checkable subtasks, Delete, and an
 * Edit action that turns the same modal into the prefilled task form.
 */
export class TaskDetailModal {
    #task;
    #callbacks;
    #modal = null;


    /**
     * @param {import('../utils/task-view.js').TaskView} task
     * @param {{ onDelete: (id: string) => Promise<void>, onSave: (id: string, values: Object) => Promise<void>, onToggleSubtask: (id: string, subtasks: Object) => Promise<void> }} callbacks
     */
    constructor(task, callbacks) {
        this.#task = task;
        this.#callbacks = callbacks;
    }


    /** Builds and shows the detail view. */
    open() {
        const template = document.createElement('template');
        template.innerHTML = `<div class="task-detail">
            ${headerHtml(this.#task)}${metaHtml(this.#task)}${sectionsHtml(this.#task)}${actionsHtml()}
        </div>`;
        this.#modal = new Modal(template.content, { animation: 'center' }).open();
        const dialog = this.#modal.element;
        dialog.querySelector('.close-btn').addEventListener('click', () => this.#modal.close());
        dialog.querySelector('.task-detail-delete').addEventListener('click', () => this.#delete());
        dialog.querySelector('.task-detail-edit').addEventListener('click', () => this.#switchToEdit());
        dialog.querySelectorAll('.task-detail-subtask .checkbox-input').forEach((input) =>
            input.addEventListener('change', () => this.#toggleSubtask(input)));
    }


    /** Deletes the task and closes the modal; on failure it stays open with an error toast. */
    async #delete() {
        try {
            await this.#callbacks.onDelete(this.#task.id);
            this.#modal.close();
        } catch (err) {
            console.error('Deleting the task failed:', err);
            showToast('Could not delete the task. Please try again.');
        }
    }


    /**
     * Updates the progress bar right away and persists the new done state;
     * reverts the checkbox if saving fails.
     * @param {HTMLInputElement} input
     */
    async #toggleSubtask(input) {
        const subtask = this.#task.subtasks.find((s) => s.key === input.dataset.key);
        subtask.done = input.checked;
        this.#renderProgress();
        try {
            await this.#callbacks.onToggleSubtask(this.#task.id, this.#subtasksObject());
        } catch (err) {
            console.error('Saving the subtask failed:', err);
            subtask.done = input.checked = !input.checked;
            this.#renderProgress();
            showToast('Could not save the subtask. Please try again.');
        }
    }


    /** Re-renders the progress row in place. */
    #renderProgress() {
        const row = this.#modal.element.querySelector('.task-detail-subtask-list')?.previousElementSibling;
        if (row?.classList.contains('progress-row')) row.outerHTML = progressHtml(this.#task.subtasks);
    }


    /** @returns {Object<string, { title: string, done: boolean }>} subtasks in their stored, keyed shape */
    #subtasksObject() {
        return Object.fromEntries(this.#task.subtasks.map((s) => [s.key, { title: s.title, done: s.done }]));
    }


    /** Replaces the modal's content with the task form, prefilled for editing. */
    #switchToEdit() {
        const dialog = this.#modal.element;
        const node = document.getElementById('addTaskTemplate').content.cloneNode(true);
        node.querySelector('.add-task-modal')?.classList.add('add-task-modal--edit');
        node.querySelector('.add-task-modal h1')?.remove();
        dialog.classList.replace('modal--center', 'modal--right');
        dialog.replaceChildren(node);
        const close = () => this.#modal.close();
        new TaskForm(dialog, {
            task: this.#task.raw,
            onSubmit: async (values) => { await this.#callbacks.onSave(this.#task.id, values); close(); },
            onCancel: close,
        });
        dialog.querySelector('.close-btn')?.addEventListener('click', close);
    }
}

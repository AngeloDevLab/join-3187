import { openModal } from './modal.js';
import { initAddTaskForm } from './add-task-form.js';
import { PRIORITY_META, escapeHtml, getSubtaskProgress } from '../utils/helpers.js';


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
 * Returns HTML for the priority chip with label and icon.
 * @param {string} priority - 'urgent' | 'medium' | 'low'
 * @returns {string}
 */
function buildPriorityHtml(priority) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
    return `<span class="priority-chip priority-chip--${meta.cls}">
        ${meta.label} <img src="${meta.icon}" alt="" width="18" height="18">
    </span>`;
}


/**
 * Returns HTML rows for all assigned contacts.
 * @param {{ initials: string, color: string, name?: string }[]} [assigned]
 * @returns {string}
 */
function buildAssignedHtml(assigned) {
    if (!assigned?.length) return '<p class="task-detail-muted">No contacts assigned</p>';
    return assigned.map((c) => {
        const initials = escapeHtml(c.initials);
        const name = escapeHtml(c.name ?? c.initials);
        return `<div class="task-detail-contact">
            <span class="avatar" style="background:${c.color}">${initials}</span>
            <span>${name}</span>
        </div>`;
    }).join('');
}


/**
 * Returns HTML for the category badge, title and description.
 * @param {{ type: string, title: string, description: string }} todo
 * @returns {string}
 */
function buildDetailTop(todo) {
    const cls = todo.type === 'User Story' ? 'user-story' : 'technical';
    return `<span class="task-category ${cls}">${todo.type}</span>
        <h2 class="task-detail-title">${escapeHtml(todo.title)}</h2>
        <p class="task-detail-description">${escapeHtml(todo.description)}</p>`;
}


/**
 * Returns HTML for the due date and priority rows.
 * @param {{ dueDate?: string, priority: string }} todo
 * @returns {string}
 */
function buildDetailMeta(todo) {
    return `<div class="task-detail-row">
        <span class="task-detail-label">Due date:</span>
        <span>${formatDate(todo.dueDate)}</span>
    </div>
    <div class="task-detail-row">
        <span class="task-detail-label">Priority:</span>
        ${buildPriorityHtml(todo.priority)}
    </div>`;
}


/**
 * Returns the progress bar + done/total count row for a subtask list.
 * @param {{ done: boolean }[]} subtasks
 * @returns {string}
 */
function buildSubtaskProgressHtml(subtasks) {
    const { done, total, percent } = getSubtaskProgress(subtasks);
    return `<div class="progress-row">
        <div class="progress-bar"><div style="width:${percent}%"></div></div>
        <span>${done}/${total} Subtasks</span>
    </div>`;
}


/**
 * Returns checkable list items for each subtask.
 * @param {{ key: string, title: string, done: boolean }[]} subtasks
 * @returns {string}
 */
function buildSubtaskListHtml(subtasks) {
    return subtasks.map((s) => `<li class="task-detail-subtask">
        <label class="checkbox">
            <input type="checkbox" class="checkbox-input" data-key="${s.key}" ${s.done ? 'checked' : ''}>
            <span class="checkbox-icon" aria-hidden="true"></span>
            ${escapeHtml(s.title)}
        </label>
    </li>`).join('');
}


/**
 * Returns HTML for the assigned contacts and subtasks sections.
 * @param {{ assigned?: object[], subtasks: { key: string, title: string, done: boolean }[] }} todo
 * @returns {string}
 */
function buildDetailSections(todo) {
    const subtasksHtml = todo.subtasks.length
        ? `${buildSubtaskProgressHtml(todo.subtasks)}<ul class="task-detail-subtask-list">${buildSubtaskListHtml(todo.subtasks)}</ul>`
        : '<p class="task-detail-muted">No subtasks</p>';
    return `<div class="task-detail-section">
        <p class="task-detail-label">Assigned To:</p>
        ${buildAssignedHtml(todo.assigned)}
    </div>
    <div class="task-detail-section">
        <p class="task-detail-label">Subtasks</p>
        ${subtasksHtml}
    </div>`;
}


/**
 * Returns HTML for the delete and edit action buttons.
 * @returns {string}
 */
function buildDetailActions() {
    return `<div class="task-detail-actions">
        <button type="button" class="task-detail-action task-detail-delete">
            <img src="../assets/icons/delete.svg" alt="" width="16"> Delete
        </button>
        <div class="task-detail-action-divider"></div>
        <button type="button" class="task-detail-action task-detail-edit">
            <img src="../assets/icons/edit.svg" alt="" width="16"> Edit
        </button>
    </div>`;
}


/**
 * Assembles the full detail panel HTML.
 * @param {object} todo
 * @returns {string}
 */
function buildDetailHtml(todo) {
    return `<div class="task-detail">
        <button type="button" class="task-detail-close" aria-label="Close">✕</button>
        ${buildDetailTop(todo)}
        ${buildDetailMeta(todo)}
        ${buildDetailSections(todo)}
        ${buildDetailActions()}
    </div>`;
}


/**
 * Converts a subtasks array back into the Firebase-keyed object shape.
 * @param {{ key: string, title: string, done: boolean }[]} subtasks
 * @returns {Object}
 */
function buildSubtasksObject(subtasks) {
    const result = {};
    subtasks.forEach((s) => { result[s.key] = { title: s.title, done: s.done }; });
    return result;
}


/**
 * Re-renders the progress bar/count in place after a subtask checkbox changes.
 * @param {HTMLElement} dialog
 * @param {{ done: boolean }[]} subtasks
 */
function updateSubtaskProgressUi(dialog, subtasks) {
    const row = dialog.querySelector('.task-detail-subtask-list')?.previousElementSibling;
    if (row?.classList.contains('progress-row')) row.outerHTML = buildSubtaskProgressHtml(subtasks);
}


/**
 * Wires subtask checkboxes: toggling one updates the progress UI in place and persists via the callback.
 * @param {HTMLElement} dialog
 * @param {object} todo
 * @param {(id: string, subtasks: Object) => void} [onToggleSubtask]
 */
function wireSubtaskCheckboxes(dialog, todo, onToggleSubtask) {
    dialog.querySelectorAll('.task-detail-subtask .checkbox-input').forEach((input) => {
        input.addEventListener('change', () => {
            const sub = todo.subtasks.find((s) => s.key === input.dataset.key);
            if (sub) sub.done = input.checked;
            if (todo.raw?.subtasks?.[input.dataset.key]) todo.raw.subtasks[input.dataset.key].done = input.checked;
            updateSubtaskProgressUi(dialog, todo.subtasks);
            onToggleSubtask?.(todo.id, buildSubtasksObject(todo.subtasks));
        });
    });
}


/**
 * Replaces the modal's content in place with the add-task form, prefilled for editing.
 * @param {HTMLElement} dialog
 * @param {object} todo
 * @param {{ onSave?: Function, onClose: () => void }} options
 */
function switchToEditMode(dialog, todo, { onSave, onClose }) {
    const node = document.getElementById('addTaskTemplate').content.cloneNode(true);
    node.querySelector('.add-task-modal')?.classList.add('add-task-modal--edit');
    dialog.replaceChildren(node);
    initAddTaskForm(dialog, {
        editTask: todo.raw,
        onSubmitSuccess: (data) => { onSave?.(todo.id, todo.raw, data); onClose(); },
        onCancel: onClose,
    });
    dialog.querySelector('.add-task-modal-close')?.addEventListener('click', onClose);
}


/**
 * Opens a centered modal showing the detail view of the given task, with an
 * Edit action that turns the same modal into an in-place edit form.
 * @param {object} todo
 * @param {{ onDelete?: (id: string) => void|Promise<void>, onSave?: (id: string, task: Object, data: Object) => void, onToggleSubtask?: (id: string, subtasks: Object) => void }} [options]
 */
export function openTaskDetailModal(todo, { onDelete, onSave, onToggleSubtask } = {}) {
    const div = document.createElement('div');
    div.innerHTML = buildDetailHtml(todo);
    const { dialog, close } = openModal(div, { animation: 'center' });
    dialog.querySelector('.task-detail-close').addEventListener('click', close);
    dialog.querySelector('.task-detail-delete').addEventListener('click', async () => {
        await onDelete?.(todo.id);
        close();
    });
    dialog.querySelector('.task-detail-edit').addEventListener('click', () => {
        switchToEditMode(dialog, todo, { onSave, onClose: close });
    });
    wireSubtaskCheckboxes(dialog, todo, onToggleSubtask);
}

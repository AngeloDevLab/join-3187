import { openModal } from './modal.js';
import { PRIORITY_META, escapeHtml } from '../utils/helpers.js';


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
        ${meta.label} <img src="${meta.icon}" alt="" width="18" height="14">
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
 * Returns HTML for the assigned contacts and subtasks sections.
 * @param {{ assigned?: object[], subtasks: string }} todo
 * @returns {string}
 */
function buildDetailSections(todo) {
    const subtasksHtml = todo.subtasks
        ? `<p class="task-detail-muted">${todo.subtasks}</p>`
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
        <button type="button" class="task-detail-action">
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
 * Opens a right-slide modal showing the detail view of the given task.
 * @param {object} todo
 * @param {{ onDelete?: (id: string) => void|Promise<void> }} [options]
 */
export function openTaskDetailModal(todo, { onDelete } = {}) {
    const div = document.createElement('div');
    div.innerHTML = buildDetailHtml(todo);
    const { dialog, close } = openModal(div, { animation: 'center' });
    dialog.querySelector('.task-detail-close').addEventListener('click', close);
    dialog.querySelector('.task-detail-delete').addEventListener('click', async () => {
        await onDelete?.(todo.id);
        close();
    });
}

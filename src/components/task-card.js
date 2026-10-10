import { PRIORITY_META, escapeHtml, getSubtaskProgress } from '../utils/helpers.js';
import { iconUrl } from '../utils/paths.js';

const MAX_VISIBLE_AVATARS = 3;


/**
 * Returns avatar markup for a task's assigned contacts, capped to
 * MAX_VISIBLE_AVATARS with any remainder collapsed into a "+n" avatar.
 * @param {{ assigned: { initials: string, color: string }[] }} todo
 * @returns {string}
 */
function buildAvatarsHtml(todo) {
    const overflow = todo.assigned.length - MAX_VISIBLE_AVATARS;
    const avatars = todo.assigned.slice(0, MAX_VISIBLE_AVATARS)
        .map((c) => `<span class="avatar avatar-circle" style="background:${c.color}">${escapeHtml(c.initials)}</span>`);
    if (overflow > 0) avatars.push(`<span class="avatar avatar-circle avatar-more">+${overflow}</span>`);
    return avatars.join('');
}


/**
 * Returns the subtasks progress row markup for a task card, or '' when there are none.
 * @param {{ done: boolean }[]} subtasks
 * @returns {string}
 */
function buildSubtasksRowHtml(subtasks) {
    if (!subtasks.length) return '';
    const { done, total, percent } = getSubtaskProgress(subtasks);
    return `<div class="progress-row"><div class="progress-bar"><div style="width:${percent}%"></div></div><span>${done}/${total} Subtasks</span></div>`;
}


/**
 * Returns the priority icon markup for a task card.
 * @param {string} priority - 'urgent' | 'medium' | 'low'
 * @returns {string}
 */
function buildPriorityIconHtml(priority) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
    return `<img src="${meta.icon}" alt="${meta.label}" width="18" height="14">`;
}


/**
 * Returns the "Move To" nav markup for a task card, excluding its current column.
 * @param {{ id: string, column: string }} todo
 * @returns {string}
 */
function buildMoveNavHtml(todo) {
    const options = { todo: 'Todo', inProgress: 'In Progress', awaitFeedback: 'Await Feedback', done: 'Done' };
    const items = Object.entries(options)
        .filter(([key]) => key !== todo.column)
        .map(([key, label]) => `<li data-category="${key}" data-id="${todo.id}">${label}</li>`)
        .join('');
    return `<nav class="category-nav popup-menu dropdown"><h3>Move To</h3><ul>${items}</ul></nav>`;
}


/**
 * Returns the HTML markup for a single task card.
 * @param {{ id: string, title: string, description: string, type: string, subtasks: object[], priority: string }} todo
 * @returns {string}
 */
export function generateTodoHtml(todo) {
    const categoryClass = todo.type === 'User Story' ? 'user-story' : 'technical';
    const title = escapeHtml(todo.title);
    const description = escapeHtml(todo.description);
    const subtasksHtml = buildSubtasksRowHtml(todo.subtasks);
    const navHtml = buildMoveNavHtml(todo);
    return `<div class="task-card" data-id="${todo.id}" draggable="true" ondragstart="startDragging(event, '${todo.id}')" ondragend="stopDragging(event)">
    <div class="card-header">
        <span class="task-category ${categoryClass}">${todo.type}</span>
        <img src="${iconUrl('move.svg')}" alt="Move Icon Mobile" class="move-button" tabindex="0">
                ${navHtml}
        </div>
        <h4>${title}</h4>
        <p>${description}</p>
        ${subtasksHtml}
        <div class="card-bottom">
            <div>${buildAvatarsHtml(todo)}</div>
            <span class="priority">${buildPriorityIconHtml(todo.priority)}</span>
        </div>
    </div>`;
}

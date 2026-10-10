import { PRIORITY_META, escapeHtml, getSubtaskProgress } from '../../utils/helpers.js';
import { iconUrl } from '../../utils/paths.js';

const MAX_VISIBLE_AVATARS = 3;
const MOVE_TARGETS = { todo: 'Todo', inProgress: 'In Progress', awaitFeedback: 'Await Feedback', done: 'Done' };


/**
 * Returns avatar markup for a task's assigned contacts, capped to
 * MAX_VISIBLE_AVATARS with any remainder collapsed into a "+n" avatar.
 * @param {import('../../utils/task-view.js').TaskView} task
 * @returns {string}
 */
function avatarsHtml(task) {
    const overflow = task.assigned.length - MAX_VISIBLE_AVATARS;
    const avatars = task.assigned.slice(0, MAX_VISIBLE_AVATARS)
        .map((c) => `<span class="avatar avatar-circle" style="background:${c.color}">${escapeHtml(c.initials)}</span>`);
    if (overflow > 0) avatars.push(`<span class="avatar avatar-circle avatar-more">+${overflow}</span>`);
    return avatars.join('');
}


/**
 * Returns the subtasks progress row markup for a task card, or '' when there are none.
 * @param {{ done: boolean }[]} subtasks
 * @returns {string}
 */
function subtasksRowHtml(subtasks) {
    if (!subtasks.length) return '';
    const { done, total, percent } = getSubtaskProgress(subtasks);
    return `<div class="progress-row"><div class="progress-bar"><div style="width:${percent}%"></div></div><span>${done}/${total} Subtasks</span></div>`;
}


/**
 * @param {string} priority - 'urgent' | 'medium' | 'low'
 * @returns {string} the priority icon markup for a task card
 */
function priorityIconHtml(priority) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
    return `<img src="${meta.icon}" alt="${meta.label}" width="18" height="14">`;
}


/**
 * Returns the mobile "Move To" button and menu, listing every column except the current one.
 * @param {import('../../utils/task-view.js').TaskView} task
 * @returns {string}
 */
function moveMenuHtml(task) {
    const items = Object.entries(MOVE_TARGETS)
        .filter(([column]) => column !== task.column)
        .map(([column, label]) => `<li data-category="${column}" data-id="${task.id}">${label}</li>`)
        .join('');
    return `<img src="${iconUrl('move.svg')}" alt="Move Icon Mobile" class="move-button" tabindex="0">
        <nav class="category-nav popup-menu dropdown"><h3>Move To</h3><ul>${items}</ul></nav>`;
}


/**
 * Returns the HTML markup for a single, draggable task card.
 * @param {import('../../utils/task-view.js').TaskView} task
 * @returns {string}
 */
export function taskCardHtml(task) {
    return `<div class="task-card" data-id="${task.id}" draggable="true" ondragstart="board.startDragging(event, '${task.id}')" ondragend="board.stopDragging(event)">
        <div class="card-header">
            <span class="task-category ${task.category.cls}">${escapeHtml(task.category.label)}</span>
            ${moveMenuHtml(task)}
        </div>
        <h4>${escapeHtml(task.title)}</h4>
        <p>${escapeHtml(task.description)}</p>
        ${subtasksRowHtml(task.subtasks)}
        <div class="card-bottom">
            <div>${avatarsHtml(task)}</div>
            <span class="priority">${priorityIconHtml(task.priority)}</span>
        </div>
    </div>`;
}

import { PRIORITY_META, escapeHtml, getSubtaskProgress } from '../utils/helpers.js';


/**
 * Returns avatar markup for a task's assigned contacts.
 * @param {{ assigned: { initials: string, color: string }[] }} todo
 * @returns {string}
 */
function buildAvatarsHtml(todo) {
    return todo.assigned
        .map((c) => `<span class="avatar" style="background:${c.color}">${escapeHtml(c.initials)}</span>`)
        .join('');
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
    return `<img src="${meta.icon}" alt="${meta.label}" width="18" height="18">`;
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
    return `<div class="task-card" data-id="${todo.id}" draggable="true" ondragstart="startDragging(event, '${todo.id}')" ondragend="stopDragging(event)">
    <div class="card-header">
        <span class="task-category ${categoryClass}">${todo.type}</span>
        <img src="../assets/icons/move.svg" alt="Move Icon Mobile" class="move-button" onclick="toggleCategoryNav(event)" tabindex="0">
                <nav class="category-nav">
                 <h3>Move To</h3>
                    <ul>
                        <li onclick="moveToFromNav('todo', '${todo.id}')">Todo</li>
                        <li onclick="moveToFromNav('inProgress', '${todo.id}')">In Progress</li>
                        <li onclick="moveToFromNav('awaitFeedback', '${todo.id}')">Await Feedback</li>
                        <li onclick="moveToFromNav('done', '${todo.id}')">Done</li>
                    </ul>
                </nav>
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

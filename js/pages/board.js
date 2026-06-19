import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';

let todos = [
    { id: 0, title: 'Kochwelt Page & Recipe Recommender', description: 'Build start page with recipe recommendation...', type: 'User Story', category: 'inProgress', subtasks: '1/2 Subtasks', priority: '=' },
    { id: 1, title: 'HTML Base Template Creation', description: 'Create reusable HTML base templates...', type: 'Technical Task', category: 'awaitFeedback', subtasks: '', priority: '⌄' },
    { id: 2, title: 'Daily Kochwelt Recipe', description: 'Implement daily recipe and portion calculator...', type: 'User Story', category: 'awaitFeedback', subtasks: '', priority: '=' },
    { id: 3, title: 'CSS Architecture Planning', description: 'Define CSS naming conventions and structure...', type: 'Technical Task', category: 'done', subtasks: '2/2 Subtasks', priority: '⌃' }
];

let currentDraggedElement;

/** Renders all four board columns. */
function updateHtml() {
    renderColumn('todo');
    renderColumn('inProgress');
    renderColumn('awaitFeedback');
    renderColumn('done');
}

/**
 * Renders all tasks for a given category into its column container.
 * @param {string} category
 */
function renderColumn(category) {
    const column = todos.filter((t) => t.category === category);
    const container = document.getElementById(category);
    container.innerHTML = '';
    if (column.length === 0) {
        container.innerHTML = '<div class="empty-task">No tasks To do</div>';
        return;
    }
    column.forEach((todo) => { container.innerHTML += generateTodoHtml(todo); });
}

/**
 * Returns the HTML markup for a single task card.
 * @param {{ id: number, title: string, description: string, type: string, subtasks: string, priority: string }} todo
 * @returns {string}
 */
function generateTodoHtml(todo) {
    const categoryClass = todo.type === 'User Story' ? 'user-story' : 'technical';
    const subtasksHtml = todo.subtasks
        ? `<div class="progress-row"><div class="progress-bar"><div></div></div><span>${todo.subtasks}</span></div>`
        : '';
    return `<div class="task-card" draggable="true" ondragstart="startDragging(event, ${todo.id})" ondragend="stopDragging(event)">
        <span class="task-category ${categoryClass}">${todo.type}</span>
        <h4>${todo.title}</h4>
        <p>${todo.description}</p>
        ${subtasksHtml}
        <div class="card-bottom">
            <div><span class="avatar orange">AM</span><span class="avatar green">EM</span><span class="avatar purple">MB</span></div>
            <span class="priority">${todo.priority}</span>
        </div>
    </div>`;
}

/**
 * Stores the dragged task id and applies the tilt animation to the card.
 * @param {DragEvent} event
 * @param {number} id
 */
function startDragging(event, id) {
    currentDraggedElement = id;
    event.currentTarget.classList.add('dragging');
}

/**
 * Removes the tilt animation from the released card.
 * @param {DragEvent} event
 */
function stopDragging(event) { event.currentTarget.classList.remove('dragging'); }

/** @param {DragEvent} event */
function allowDrop(event) { event.preventDefault(); }

/**
 * Highlights a column when a dragged card enters it.
 * @param {string} id
 */
function highlightColumn(id) { document.getElementById(id).classList.add('drag-over'); }

/**
 * Removes the column highlight, only when truly leaving (not entering a child element).
 * @param {DragEvent} event
 * @param {string} id
 */
function unhighlightColumn(event, id) {
    const container = document.getElementById(id);
    if (!container.contains(event.relatedTarget)) container.classList.remove('drag-over');
}

/**
 * Moves the dragged task to a new category and re-renders.
 * @param {string} category
 */
function moveTo(category) {
    document.getElementById(category).classList.remove('drag-over');
    const todo = todos.find((t) => t.id === currentDraggedElement);
    todo.category = category;
    updateHtml();
}

window.startDragging = startDragging;
window.stopDragging = stopDragging;
window.allowDrop = allowDrop;
window.highlightColumn = highlightColumn;
window.unhighlightColumn = unhighlightColumn;
window.moveTo = moveTo;

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    updateHtml();
});

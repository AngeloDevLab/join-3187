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
    return `<div class="task-card" draggable="true" ondragstart="startDragging(${todo.id})">
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
 * Stores the id of the task being dragged.
 * @param {number} id
 */
function startDragging(id) { currentDraggedElement = id; }

/** @param {DragEvent} event */
function allowDrop(event) { event.preventDefault(); }

/**
 * Moves the dragged task to a new category and re-renders.
 * @param {string} category
 */
function moveTo(category) {
    const todo = todos.find((t) => t.id === currentDraggedElement);
    todo.category = category;
    updateHtml();
}

window.startDragging = startDragging;
window.allowDrop = allowDrop;
window.moveTo = moveTo;

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    updateHtml();
});

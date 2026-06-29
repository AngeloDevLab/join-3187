import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';
import { initAddTaskForm } from '../components/add-task-form.js';
import { openTaskDetailModal } from '../components/task-detail-modal.js';

const PRIORITY_SYMBOL = { urgent: '⌃', medium: '=', low: '⌄' };

let todos = [
    { id: 0, title: 'Kochwelt Page & Recipe Recommender', description: 'Build start page with recipe recommendation...', type: 'User Story', category: 'inProgress', subtasks: '1/2 Subtasks', priority: '=' },
    { id: 1, title: 'HTML Base Template Creation', description: 'Create reusable HTML base templates...', type: 'Technical Task', category: 'awaitFeedback', subtasks: '', priority: '⌄' },
    { id: 2, title: 'Daily Kochwelt Recipe', description: 'Implement daily recipe and portion calculator...', type: 'User Story', category: 'awaitFeedback', subtasks: '', priority: '=' },
    { id: 3, title: 'CSS Architecture Planning', description: 'Define CSS naming conventions and structure...', type: 'Technical Task', category: 'done', subtasks: '2/2 Subtasks', priority: '⌃' }
];

let categoryMessages = {
    todo: 'No tasks to do',
    inProgress: 'No tasks in progress',
    awaitFeedback: 'No tasks awaiting feedback',
    done: 'No tasks done'
};

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
        container.innerHTML = `<div class="empty-task">${categoryMessages[category]}</div>`
        return;
    }
    column.forEach((todo) => { container.innerHTML += generateTodoHtml(todo); });
}

/**
 * Returns avatar markup for a task's assigned contacts, or the placeholder
 * trio for seed tasks that don't carry an `assigned` list.
 * @param {{ assigned?: { initials: string, color: string }[] }} todo
 * @returns {string}
 */
function buildAvatarsHtml(todo) {
    if (!todo.assigned?.length) {
        return '<span class="avatar orange">AM</span><span class="avatar green">EM</span><span class="avatar purple">MB</span>';
    }
    return todo.assigned
        .map((c) => `<span class="avatar" style="background:${c.color}">${c.initials}</span>`)
        .join('');
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
    return `<div class="task-card" data-id="${todo.id}" draggable="true" ondragstart="startDragging(event, ${todo.id})" ondragend="stopDragging(event)">
    <div class="card-header">
        <span class="task-category ${categoryClass}">${todo.type}</span>
        <img src="../assets/icons/move.svg" alt="Move Icon Mobile" class="move-button" onclick="toggleCategoryNav(event)" tabindex="0">
                <nav class="category-nav">
                 <h3>Move To</h3>
                    <ul>
                        <li onclick="moveToFromNav('todo', ${todo.id})">Todo</li>
                        <li onclick="moveToFromNav('inProgress', ${todo.id})">In Progress</li>
                        <li onclick="moveToFromNav('awaitFeedback', ${todo.id})">Await Feedback</li>
                        <li onclick="moveToFromNav('done', ${todo.id})">Done</li>
                    </ul>
                </nav>
        </div>
        <h4>${todo.title}</h4>
        <p>${todo.description}</p>
        ${subtasksHtml}
        <div class="card-bottom">
            <div>${buildAvatarsHtml(todo)}</div>
            <span class="priority">${todo.priority}</span>
        </div>
    </div>`;
}

/**
 * Moves a task by id to a category (Klick statt Drag&Drop).
 * @param {string} category
 * @param {number} id
 */
function moveToFromNav(category, id) {
    const todo = todos.find((t) => t.id === id); 
    todo.category = category; 
    updateHtml(); 
}

function toggleCategoryNav(event) {
    let nav = event.target.nextElementSibling;
    nav.style.display = nav.style.display === 'block' ? 'inherit' : 'block';
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

/**
 * Builds a new todo from collected form data and adds it to the board.
 * @param {{ title: string, description: string, priority: string, type: string, assigned: object[], subtasks: string[] }} data
 * @param {string} status
 * @param {() => void} close
 */
function handleNewTask(data, status, close) {
    const id = Math.max(...todos.map((t) => t.id)) + 1;
    const subtasksLabel = data.subtasks.length ? `0/${data.subtasks.length} Subtasks` : '';
    todos.push({
        id, title: data.title, description: data.description, type: data.type,
        category: status, assigned: data.assigned, subtasks: subtasksLabel,
        priority: PRIORITY_SYMBOL[data.priority],
    });
    updateHtml();
    close();
}


/**
 * Opens the Add Task modal pre-targeted at the given column.
 * @param {string} status
 */
function openAddTaskModal(status) {
    const node = document.getElementById('addTaskTemplate').content.cloneNode(true);
    const { dialog, close } = openModal(node, { animation: 'right' });
    initAddTaskForm(dialog, { onSubmitSuccess: (data) => handleNewTask(data, status, close) });
    dialog.querySelector('.add-task-modal-close')?.addEventListener('click', close);
}


/**
 * Delegates card clicks to open the task detail modal, skipping drag controls.
 */
function initCardDetailClick() {
    document.querySelectorAll('.drag-area').forEach((area) => {
        area.addEventListener('click', (e) => {
            if (e.target.closest('.move-button, .category-nav')) return;
            const card = e.target.closest('.task-card');
            if (!card) return;
            const id = parseInt(card.dataset.id, 10);
            const todo = todos.find((t) => t.id === id);
            if (todo) openTaskDetailModal(todo);
        });
    });
}


/** Wires every "+" trigger on the board to open the Add Task modal for its column. */
function initAddTaskButtons() {
    document.querySelectorAll('[data-status]').forEach((btn) =>
        btn.addEventListener('click', () => openAddTaskModal(btn.dataset.status)));
}


window.startDragging = startDragging;
window.stopDragging = stopDragging;
window.allowDrop = allowDrop;
window.highlightColumn = highlightColumn;
window.unhighlightColumn = unhighlightColumn;
window.moveTo = moveTo;
window.moveToFromNav = moveToFromNav;
window.toggleCategoryNav = toggleCategoryNav; 

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    updateHtml();
    initAddTaskButtons();
    initCardDetailClick();
});

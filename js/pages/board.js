import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';
import { initAddTaskForm, toFirebaseTask } from '../components/add-task-form.js';
import { openTaskDetailModal } from '../components/task-detail-modal.js';
import { showToast } from '../components/toast.js';
import { getTasks, getContacts, saveTask, updateTask, removeTask } from '../firebase/cache.js';
import { getAvatarColorForId, getInitials, computeOrderBetween } from '../utils/helpers.js';
import { startDragGhost, stopDragGhost } from '../components/drag-ghost.js';
import { updateDropIndicator, clearDropIndicator, getDropNeighbors } from '../components/drop-indicator.js';
import { generateTodoHtml } from '../components/task-card.js';

const CATEGORY_LABEL = { userStory: 'User Story', technicalTask: 'Technical Task' };

let categoryMessages = {
    todo: 'No tasks to do',
    inProgress: 'No tasks in progress',
    awaitFeedback: 'No tasks awaiting feedback',
    done: 'No tasks done'
};

let currentDraggedElement;
let allTodos = [];
let currentSearchTerm = '';

/** Loads tasks and contacts from Firebase, then renders all four board columns. */
async function updateHtml() {
    const tasks = (await getTasks()) || {};
    const contacts = (await getContacts()) || {};
    allTodos = Object.entries(tasks).map(([id, task]) => toDisplayTodo(id, task, contacts));
    renderBoard();
}


/** Renders the board with the currently active search term. */
function renderBoard() {
    const todos = filterTodos(allTodos, currentSearchTerm);
    updateSearchMessage(todos.length);
    renderColumn('todo', todos);
    renderColumn('inProgress', todos);
    renderColumn('awaitFeedback', todos);
    renderColumn('done', todos);
}


/**
 * Converts a raw Firebase task into the display shape used for rendering.
 * @param {string} id
 * @param {Object} task
 * @param {Object} contacts
 * @returns {Object}
 */
function toDisplayTodo(id, task, contacts) {
    const subtasksList = Object.entries(task.subtasks ?? {}).map(([key, s]) => ({ key, title: s.title, done: !!s.done }));
    return {
        id,
        column: task.column,
        order: task.order ?? 0,
        title: task.title,
        description: task.description,
        type: CATEGORY_LABEL[task.category] ?? task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        subtasks: subtasksList,
        assigned: (task.assignedTo ?? [])
            .filter((cid) => contacts[cid])
            .map((cid) => ({ name: contacts[cid].name, initials: getInitials(contacts[cid].name), color: getAvatarColorForId(cid) })),
        raw: task,
    };
}


/**
 * Returns tasks whose title or description contains the search term.
 * @param {Array} todos
 * @param {string} searchTerm
 * @returns {Array}
 */
function filterTodos(todos, searchTerm) {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return todos;
    return todos.filter((todo) =>
        (todo.title ?? '').toLowerCase().includes(term) ||
        (todo.description ?? '').toLowerCase().includes(term));
}


/**
 * Shows a message when an active search has no results.
 * @param {number} resultCount
 */
function updateSearchMessage(resultCount) {
    const message = document.getElementById('boardSearchMessage');
    if (!message) return;
    message.hidden = !currentSearchTerm.trim() || resultCount > 0;
}


/**
 * Renders all tasks for a given category into its column container.
 * @param {string} category
 * @param {Array} todos
 */
function renderColumn(category, todos) {
    const column = todos.filter((t) => t.column === category).sort((a, b) => a.order - b.order);
    const container = document.getElementById(category);
    container.innerHTML = '';
    if (column.length === 0) {
        const message = currentSearchTerm.trim() ? 'No matching tasks' : categoryMessages[category];
        container.innerHTML = `<div class="empty-task">${message}</div>`;
        return;
    }
    column.forEach((todo) => { container.innerHTML += generateTodoHtml(todo); });
}


/**
 * Moves a task by id to a category (Klick statt Drag&Drop) and persists it.
 * @param {string} category
 * @param {string} id
 */
async function moveToFromNav(category, id) {
    await updateTask(id, { column: category, order: Date.now() });
    await updateHtml();
}


/**
 * Toggles the "Move To" category nav open/closed for a task card on mobile.
 * @param {MouseEvent} event
 */
function toggleCategoryNav(event) {
    let nav = event.target.nextElementSibling;
    nav.style.display = nav.style.display === 'block' ? 'inherit' : 'block';
}


/**
 * Stores the dragged task id, marks the card as dragging and starts the floating drag ghost.
 * @param {DragEvent} event
 * @param {string} id
 */
function startDragging(event, id) {
    currentDraggedElement = id;
    startDragGhost(event, event.currentTarget);
    event.currentTarget.classList.add('dragging');
}


/**
 * Restores the released card and removes the floating drag ghost.
 * @param {DragEvent} event
 */
function stopDragging(event) {
    event.currentTarget.classList.remove('dragging');
    stopDragGhost();
}


/**
 * Allows the drop and moves the insertion indicator to the closest position.
 * @param {DragEvent} event
 */
function allowDrop(event) {
    event.preventDefault();
    updateDropIndicator(event.currentTarget, event.clientY);
}


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
    if (!container.contains(event.relatedTarget)) {
        container.classList.remove('drag-over');
        clearDropIndicator();
    }
}


/**
 * Persists the dragged task's new column and order (from the drop indicator position), then re-renders.
 * Does nothing if the card was dropped back onto its original position.
 * @param {string} category
 */
async function moveTo(category) {
    document.getElementById(category).classList.remove('drag-over');
    const neighbors = getDropNeighbors();
    clearDropIndicator();
    if (!neighbors) return;
    const before = allTodos.find((t) => t.id === neighbors.beforeId)?.order;
    const after = allTodos.find((t) => t.id === neighbors.afterId)?.order;
    const order = computeOrderBetween(before, after);
    const todo = allTodos.find((t) => t.id === currentDraggedElement);
    if (todo) { todo.column = category; todo.order = order; renderBoard(); }
    await updateTask(currentDraggedElement, { column: category, order });
    await updateHtml();
}


/**
 * Saves a new task to Firebase for the given column and refreshes the board.
 * @param {Parameters<typeof toFirebaseTask>[0]} data
 * @param {string} status
 * @param {() => void} close
 */
async function handleNewTask(data, status, close) {
    await saveTask({ ...toFirebaseTask(data, status), order: Date.now() });
    await updateHtml();
    close();
}


/**
 * Opens the Add Task modal pre-targeted at the given column.
 * @param {string} status
 */
function openAddTaskModal(status) {
    const node = document.getElementById('addTaskTemplate').content.cloneNode(true);
    const { dialog, close } = openModal(node, { animation: 'right' });
    initAddTaskForm(dialog, { onSubmitSuccess: (data) => handleNewTask(data, status, close), onCancel: close });
    dialog.querySelector('.add-task-modal-close')?.addEventListener('click', close);
}


/**
 * Persists edited task data to Firebase, keeping its column and creation date, then refreshes the board.
 * @param {string} id
 * @param {Object} task
 * @param {Parameters<typeof toFirebaseTask>[0]} data
 */
async function handleSaveTask(id, task, data) {
    await updateTask(id, toFirebaseTask(data, task.column, task.createdAt));
    await updateHtml();
}


/**
 * Persists a toggled subtask's done state to Firebase and refreshes the board.
 * @param {string} id
 * @param {Object} subtasks
 */
async function handleToggleSubtask(id, subtasks) {
    await updateTask(id, { subtasks });
    await updateHtml();
}


/**
 * Deletes a task from Firebase, refreshes the board and notifies the user.
 * @param {string} id
 */
async function handleDeleteTask(id) {
    await removeTask(id);
    await updateHtml();
    showToast('Task deleted');
}


/**
 * Delegates card clicks to open the task detail modal, skipping drag controls.
 */
function initCardDetailClick() {
    document.querySelectorAll('.drag-area').forEach((area) => {
        area.addEventListener('click', async (e) => {
            if (e.target.closest('.move-button, .category-nav')) return;
            const card = e.target.closest('.task-card');
            if (!card) return;
            const tasks = (await getTasks()) || {};
            const task = tasks[card.dataset.id];
            if (!task) return;
            const contacts = (await getContacts()) || {};
            const todo = toDisplayTodo(card.dataset.id, task, contacts);
            openTaskDetailModal(todo, {
                onDelete: handleDeleteTask,
                onSave: handleSaveTask,
                onToggleSubtask: handleToggleSubtask,
            });
        });
    });
}


/** Wires the board search input to filter tasks while typing. */
function initBoardSearch() {
    const searchInput = document.getElementById('boardSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
        currentSearchTerm = searchInput.value;
        renderBoard();
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

initNavbar();
updateHtml();
initBoardSearch();
initAddTaskButtons();
initCardDetailClick();

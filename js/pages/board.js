import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';
import { initAddTaskForm, toFirebaseTask } from '../components/add-task-form.js';
import { openTaskDetailModal } from '../components/task-detail-modal.js';
import { showToast } from '../components/toast.js';
import { getTasks, getContacts, saveTask, updateTask, removeTask } from '../firebase/cache.js';
import { getAvatarColorForId, getInitials, PRIORITY_META, escapeHtml } from '../utils/helpers.js';

const CATEGORY_LABEL = { userStory: 'User Story', technicalTask: 'Technical Task' };

let categoryMessages = {
    todo: 'No tasks to do',
    inProgress: 'No tasks in progress',
    awaitFeedback: 'No tasks awaiting feedback',
    done: 'No tasks done'
};

let currentDraggedElement;

/** Loads tasks and contacts from Firebase, then renders all four board columns. */
async function updateHtml() {
    const tasks = (await getTasks()) || {};
    const contacts = (await getContacts()) || {};
    const todos = Object.entries(tasks).map(([id, task]) => toDisplayTodo(id, task, contacts));
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
    const subtasksList = Object.values(task.subtasks ?? {});
    const done = subtasksList.filter((s) => s.done).length;
    return {
        id,
        column: task.column,
        title: task.title,
        description: task.description,
        type: CATEGORY_LABEL[task.category] ?? task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        subtasks: subtasksList.length ? `${done}/${subtasksList.length} Subtasks` : '',
        assigned: (task.assignedTo ?? [])
            .filter((cid) => contacts[cid])
            .map((cid) => ({ name: contacts[cid].name, initials: getInitials(contacts[cid].name), color: getAvatarColorForId(cid) })),
    };
}


/**
 * Renders all tasks for a given category into its column container.
 * @param {string} category
 * @param {Array} todos
 */
function renderColumn(category, todos) {
    const column = todos.filter((t) => t.column === category);
    const container = document.getElementById(category);
    container.innerHTML = '';
    if (column.length === 0) {
        container.innerHTML = `<div class="empty-task">${categoryMessages[category]}</div>`
        return;
    }
    column.forEach((todo) => { container.innerHTML += generateTodoHtml(todo); });
}


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
 * Returns the HTML markup for a single task card.
 * @param {{ id: string, title: string, description: string, type: string, subtasks: string, priority: string }} todo
 * @returns {string}
 */
function generateTodoHtml(todo) {
    const categoryClass = todo.type === 'User Story' ? 'user-story' : 'technical';
    const title = escapeHtml(todo.title);
    const description = escapeHtml(todo.description);
    const subtasksHtml = todo.subtasks
        ? `<div class="progress-row"><div class="progress-bar"><div></div></div><span>${todo.subtasks}</span></div>`
        : '';
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
 * Moves a task by id to a category (Klick statt Drag&Drop) and persists it.
 * @param {string} category
 * @param {string} id
 */
async function moveToFromNav(category, id) {
    await updateTask(id, { column: category });
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
 * Stores the dragged task id and applies the tilt animation to the card.
 * @param {DragEvent} event
 * @param {string} id
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
 * Persists the dragged task's new column and re-renders.
 * @param {string} category
 */
async function moveTo(category) {
    document.getElementById(category).classList.remove('drag-over');
    await updateTask(currentDraggedElement, { column: category });
    await updateHtml();
}


/**
 * Saves a new task to Firebase for the given column and refreshes the board.
 * @param {Parameters<typeof toFirebaseTask>[0]} data
 * @param {string} status
 * @param {() => void} close
 */
async function handleNewTask(data, status, close) {
    await saveTask(toFirebaseTask(data, status));
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
            openTaskDetailModal(todo, { onDelete: handleDeleteTask, onEdit: (t) => openAddTaskModal(t.column) });
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

initNavbar();
updateHtml();
initAddTaskButtons();
initCardDetailClick();

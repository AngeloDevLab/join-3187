import '../../utils/auth-guard.js';
import { initNavbar } from '../../components/navbar.js';
import { Modal } from '../../components/modal.js';
import { Dropdown } from '../../components/dropdown.js';
import { TaskForm } from '../../components/task-form/task-form.js';
import { TaskDetailModal } from './task-detail-modal.js';
import { showToast } from '../../components/toast.js';
import { taskCardHtml } from './task-card.js';
import { startDragGhost, stopDragGhost } from './drag-ghost.js';
import { updateDropIndicator, clearDropIndicator, getDropNeighbors } from './drop-indicator.js';
import { taskStore } from '../../services/task-store.js';
import { contactStore } from '../../services/contact-store.js';
import { computeOrderBetween } from '../../utils/helpers.js';
import { toTaskView } from '../../utils/task-view.js';

/** Board columns in display order, with the message shown when a column is empty. */
const COLUMNS = {
    triage: 'No tasks in triage',
    todo: 'No tasks to do',
    inProgress: 'No tasks in progress',
    awaitFeedback: 'No tasks awaiting feedback',
    done: 'No tasks done',
};
const SAVE_ERROR = 'Could not save the change. Please try again.';


/**
 * The board page. Renders the columns live from the task and contact stores
 * and handles search, drag & drop, the mobile "Move To" menu and the add/detail
 * modals. The inline drag & drop attributes in board.html and on the task cards
 * call its public methods through `window.board`.
 */
class BoardPage {
    /** @type {import('../../utils/task-view.js').TaskView[]} */
    #tasks = [];
    #searchTerm = '';
    #draggedId = null;


    /** Subscribes to the stores and wires search, the "Add task" button and the columns. */
    init() {
        taskStore.subscribe(() => this.#refresh());
        contactStore.subscribe(() => this.#refresh());
        document.getElementById('boardSearch')?.addEventListener('input', (e) => this.#search(e.target.value));
        document.querySelectorAll('[data-status]').forEach((btn) =>
            btn.addEventListener('click', () => this.#openAddTask(btn.dataset.status)));
        document.querySelectorAll('.drag-area').forEach((area) => this.#wireColumn(area));
    }


    // ── Drag & drop (called from inline attributes) ──────────

    /**
     * Remembers the dragged task, marks its card and starts the floating drag ghost.
     * @param {DragEvent} event
     * @param {string} id
     */
    startDragging(event, id) {
        this.#draggedId = id;
        startDragGhost(event, event.currentTarget);
        event.currentTarget.classList.add('dragging');
    }


    /** @param {DragEvent} event - restores the released card and removes the drag ghost */
    stopDragging(event) {
        event.currentTarget.classList.remove('dragging');
        stopDragGhost();
    }


    /** @param {DragEvent} event - allows the drop and moves the insertion indicator under the cursor */
    allowDrop(event) {
        event.preventDefault();
        updateDropIndicator(event.currentTarget, event.clientX, event.clientY);
    }


    /** @param {string} column - highlights the column a dragged card entered */
    highlightColumn(column) {
        document.getElementById(column).classList.add('drag-over');
    }


    /**
     * Removes the highlight only when the cursor truly leaves the column (not when entering a child).
     * @param {DragEvent} event
     * @param {string} column
     */
    unhighlightColumn(event, column) {
        const container = document.getElementById(column);
        if (container.contains(event.relatedTarget)) return;
        container.classList.remove('drag-over');
        clearDropIndicator();
    }


    /**
     * Drops the dragged task at the indicator position: moves it locally right
     * away, then persists column and order. No-op when dropped back in place.
     * @param {string} column
     */
    async moveTo(column) {
        document.getElementById(column).classList.remove('drag-over');
        const neighbors = getDropNeighbors();
        clearDropIndicator();
        if (!neighbors) return;
        const order = computeOrderBetween(this.#orderOf(neighbors.beforeId), this.#orderOf(neighbors.afterId));
        this.#moveLocally(this.#draggedId, column, order);
        await this.#persist(taskStore.update(this.#draggedId, { column, order }));
    }


    // ── Rendering ────────────────────────────────────────────

    /** Rebuilds the task views from both stores; runs on every change to either. */
    async #refresh() {
        const tasks = await taskStore.getAll();
        const contacts = await contactStore.getAll();
        this.#tasks = Object.entries(tasks).map(([id, task]) => toTaskView(id, task, contacts));
        this.#render();
    }


    /** Renders every column with the active search applied. */
    #render() {
        const visible = this.#visibleTasks();
        const message = document.getElementById('boardSearchMessage');
        if (message) message.hidden = !this.#searchTerm.trim() || visible.length > 0;
        Object.keys(COLUMNS).forEach((column) => this.#renderColumn(column, visible));
    }


    /** @returns {import('../../utils/task-view.js').TaskView[]} tasks whose title or description match the search */
    #visibleTasks() {
        const term = this.#searchTerm.trim().toLowerCase();
        if (!term) return this.#tasks;
        return this.#tasks.filter((t) => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term));
    }


    /**
     * @param {string} column
     * @param {import('../../utils/task-view.js').TaskView[]} tasks
     */
    #renderColumn(column, tasks) {
        const cards = tasks.filter((t) => t.column === column).sort((a, b) => a.order - b.order);
        const empty = this.#searchTerm.trim() ? 'No matching tasks' : COLUMNS[column];
        document.getElementById(column).innerHTML = cards.length
            ? cards.map(taskCardHtml).join('')
            : `<div class="empty-task">${empty}</div>`;
    }


    /** @param {string} term - applies a new search term */
    #search(term) {
        this.#searchTerm = term;
        this.#render();
    }


    // ── Column interactions ──────────────────────────────────

    /** @param {HTMLElement} area - wires card clicks and horizontal wheel scrolling for one column */
    #wireColumn(area) {
        area.addEventListener('click', (e) => this.#handleColumnClick(e));
        area.addEventListener('wheel', (e) => {
            if (area.scrollWidth <= area.clientWidth) return;
            e.preventDefault();
            area.scrollLeft += e.deltaY;
        });
    }


    /**
     * One delegated handler per column: the move button toggles its menu, a menu
     * entry moves the task, a click anywhere else on a card opens its details.
     * @param {MouseEvent} e
     */
    #handleColumnClick(e) {
        const moveButton = e.target.closest('.move-button');
        if (moveButton) return this.#toggleMoveMenu(moveButton);
        const entry = e.target.closest('.category-nav li');
        if (entry) return this.#persist(taskStore.update(entry.dataset.id, { column: entry.dataset.category, order: Date.now() }));
        if (e.target.closest('.category-nav')) return;
        const card = e.target.closest('.task-card');
        if (card) this.#openDetail(card.dataset.id);
    }


    /** @param {HTMLElement} trigger - the card's move button; its menu is the next sibling */
    #toggleMoveMenu(trigger) {
        const menu = trigger.nextElementSibling;
        Dropdown.closeAll(menu);
        Dropdown.for(menu, trigger).toggle();
    }


    /** @param {string} column - opens the Add Task modal for that column */
    #openAddTask(column) {
        const node = document.getElementById('addTaskTemplate').content.cloneNode(true);
        const modal = new Modal(node, { animation: 'right' }).open();
        const close = () => modal.close();
        new TaskForm(modal.element, {
            onSubmit: async (values) => { await taskStore.create(values, column); close(); },
            onCancel: close,
        });
        modal.element.querySelector('.close-btn')?.addEventListener('click', close);
    }


    /** @param {string} id - opens the detail modal for that task */
    #openDetail(id) {
        const task = this.#tasks.find((t) => t.id === id);
        if (!task) return;
        new TaskDetailModal(task, {
            onDelete: async (taskId) => { await taskStore.remove(taskId); showToast('Task deleted'); },
            onSave: (taskId, values) => taskStore.update(taskId, values),
            onToggleSubtask: (taskId, subtasks) => taskStore.update(taskId, { subtasks }),
        }).open();
    }


    // ── Helpers ──────────────────────────────────────────────

    /**
     * @param {string|null} id
     * @returns {number|undefined}
     */
    #orderOf(id) {
        return this.#tasks.find((t) => t.id === id)?.order;
    }


    /**
     * Moves a task's view right away, before the database round trip finishes.
     * @param {string} id
     * @param {string} column
     * @param {number} order
     */
    #moveLocally(id, column, order) {
        const task = this.#tasks.find((t) => t.id === id);
        if (!task) return;
        Object.assign(task, { column, order });
        this.#render();
    }


    /**
     * Awaits a write and shows an error toast if it fails. Firebase then rolls
     * back its local change, so the live listener re-renders the previous state.
     * @param {Promise<void>} write
     */
    async #persist(write) {
        try {
            await write;
        } catch (err) {
            console.error('Saving the board change failed:', err);
            showToast(SAVE_ERROR);
        }
    }
}


const board = new BoardPage();
window.board = board;
initNavbar();
board.init();

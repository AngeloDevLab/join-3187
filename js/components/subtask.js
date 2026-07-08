import { escapeHtml } from '../utils/helpers.js';


/**
 * Creates a subtask list item with bullet, text, and edit/delete buttons.
 * The left button shows a trash icon and the right one a check icon while editing.
 * @param {string} text
 * @param {boolean} [done]
 * @returns {HTMLLIElement}
 */
function buildSubtaskItem(text, done = false) {
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.dataset.done = String(done);
    li.innerHTML = `
        <span class="subtask-bullet">•</span>
        <span class="subtask-text">${escapeHtml(text)}</span>
        <div class="subtask-item-actions">
            <button type="button" class="subtask-item-btn subtask-btn-left" aria-label="Edit">
                <img class="icon-default" src="../assets/icons/edit.svg" alt="" width="18" height="18">
                <img class="icon-editing" src="../assets/icons/delete.svg" alt="" width="18" height="18">
            </button>
            <span class="subtask-action-divider"></span>
            <button type="button" class="subtask-item-btn subtask-btn-right" aria-label="Delete">
                <img class="icon-default" src="../assets/icons/delete.svg" alt="" width="18" height="18">
                <img class="icon-editing" src="../assets/icons/check.svg" alt="" width="18" height="18">
            </button>
        </div>`;
    return li;
}


/**
 * Reads the subtask input and appends a new item to the list.
 * @param {ParentNode} root
 */
function addSubtask(root) {
    const input = root.querySelector('#task-subtask');
    const text = input.value.trim();
    if (!text) return;
    const list = root.querySelector('#subtaskList');
    list.appendChild(buildSubtaskItem(text));
    updateSubtaskOverflow(list);
    input.value = '';
    input.focus();
}


/**
 * Removes a subtask item and refreshes the collapsed/expanded overflow state.
 * @param {HTMLLIElement} li
 */
function removeSubtask(li) {
    const list = li.closest('.subtask-list');
    li.remove();
    updateSubtaskOverflow(list);
}


/**
 * Saves the edited text and restores the list item to its display state.
 * @param {HTMLLIElement} li
 * @param {HTMLInputElement} editInput
 * @param {HTMLElement} textEl
 */
function confirmEditSubtask(li, editInput, textEl) {
    const text = editInput.value.trim();
    if (text) textEl.textContent = text;
    editInput.remove();
    setEditingState(li, false);
}


/**
 * Toggles the editing class and updates the action buttons' labels.
 * @param {HTMLLIElement} li
 * @param {boolean} isEditing
 */
function setEditingState(li, isEditing) {
    li.classList.toggle('is-editing', isEditing);
    li.querySelector('.subtask-btn-left').setAttribute('aria-label', isEditing ? 'Delete' : 'Edit');
    li.querySelector('.subtask-btn-right').setAttribute('aria-label', isEditing ? 'Confirm' : 'Delete');
}


/**
 * Replaces the subtask text span with an inline editable input.
 * @param {HTMLLIElement} li
 */
function startEditSubtask(li) {
    if (li.classList.contains('is-editing')) return;
    const textEl = li.querySelector('.subtask-text');
    const editInput = document.createElement('input');
    editInput.className = 'subtask-edit-input';
    editInput.value = textEl.textContent;
    setEditingState(li, true);
    li.insertBefore(editInput, textEl);
    editInput.focus();
    editInput.addEventListener('blur', () => confirmEditSubtask(li, editInput, textEl));
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') editInput.blur();
        if (e.key === 'Escape') { editInput.value = textEl.textContent; editInput.blur(); }
    });
}


/**
 * Handles clicks inside the subtask list: the "+N more" trailer toggles
 * overflow, item clicks start editing, and the left/right action buttons
 * delete or confirm depending on the editing state.
 * @param {MouseEvent} e
 */
function handleSubtaskListClick(e) {
    const more = e.target.closest('.subtask-more');
    if (more) return toggleSubtaskOverflow(more.closest('.subtask-list'));
    const li = e.target.closest('.subtask-item');
    if (!li) return;
    const btn = e.target.closest('.subtask-item-btn');
    if (!btn) return startEditSubtask(li);
    const isEditing = li.classList.contains('is-editing');
    const isLeft = btn.classList.contains('subtask-btn-left');
    if (isLeft) return isEditing ? removeSubtask(li) : startEditSubtask(li);
    if (isEditing) li.querySelector('.subtask-edit-input')?.blur();
    else removeSubtask(li);
}


/**
 * Builds the trailing "+N more" (collapsed) or "Show less" (expanded) row.
 * @param {number} count
 * @param {boolean} expanded
 * @returns {HTMLLIElement}
 */
function buildMoreTrailer(count, expanded) {
    const li = document.createElement('li');
    li.className = 'subtask-more';
    li.textContent = expanded ? 'Show less' : `+${count} more`;
    return li;
}


/**
 * Shows at most 2 real items plus a "+N more" trailer when collapsed and
 * there are more than 3 subtasks; expanded shows everything, scrollable.
 * @param {HTMLElement} list
 */
function updateSubtaskOverflow(list) {
    const items = [...list.querySelectorAll('.subtask-item')];
    list.querySelector('.subtask-more')?.remove();
    if (items.length <= 3) {
        list.classList.remove('is-expanded');
        items.forEach((li) => li.classList.remove('is-hidden-overflow'));
        return;
    }
    if (list.classList.contains('is-expanded')) {
        items.forEach((li) => li.classList.remove('is-hidden-overflow'));
        list.appendChild(buildMoreTrailer(items.length, true));
        return;
    }
    items.forEach((li, i) => li.classList.toggle('is-hidden-overflow', i >= 2));
    list.insertBefore(buildMoreTrailer(items.length - 2, false), items[2]);
}


/**
 * Toggles between the collapsed 3-row view and the full scrollable list.
 * @param {HTMLElement} list
 */
function toggleSubtaskOverflow(list) {
    list.classList.toggle('is-expanded');
    updateSubtaskOverflow(list);
}


/**
 * Keeps the edit input focused on mousedown so clicking an action button
 * doesn't blur it first and exit editing before the click is handled.
 * @param {MouseEvent} e
 */
function handleSubtaskListMousedown(e) {
    if (e.target.closest('.subtask-item-btn')) e.preventDefault();
}


/**
 * Returns the current subtasks (title + done state) for use when saving the task.
 * @param {ParentNode} root
 * @returns {{ title: string, done: boolean }[]}
 */
export function getSubtasks(root) {
    return [...root.querySelectorAll('.subtask-item')].map((li) => ({
        title: li.querySelector('.subtask-text').textContent,
        done: li.dataset.done === 'true',
    }));
}


/**
 * Replaces the subtask list with the given subtasks, preserving their done state.
 * @param {ParentNode} root
 * @param {{ title: string, done: boolean }[]} subtasks
 */
export function setSubtasks(root, subtasks) {
    const list = root.querySelector('#subtaskList');
    if (!list) return;
    list.innerHTML = '';
    list.classList.remove('is-expanded');
    subtasks.forEach((s) => list.appendChild(buildSubtaskItem(s.title, s.done)));
    updateSubtaskOverflow(list);
}


/**
 * Sets up the subtask input: active state, Enter key, confirm/clear actions, and list delegation.
 * @param {ParentNode} root
 */
export function initSubtaskInput(root) {
    const input = root.querySelector('#task-subtask');
    const wrapper = input?.closest('.input-wrapper');
    if (!input || !wrapper) return;
    input.addEventListener('focus', () => wrapper.classList.add('is-active'));
    input.addEventListener('blur', (e) => {
        if (!wrapper.contains(e.relatedTarget)) wrapper.classList.remove('is-active');
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(root); } });
    root.querySelector('#subtaskConfirm')?.addEventListener('click', () => { addSubtask(root); input.focus(); });
    root.querySelector('#subtaskClear')?.addEventListener('click', () => { input.value = ''; input.focus(); });
    const list = root.querySelector('#subtaskList');
    list?.addEventListener('mousedown', handleSubtaskListMousedown);
    list?.addEventListener('click', handleSubtaskListClick);
}

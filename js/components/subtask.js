/**
 * Creates a subtask list item with bullet, text, and edit/delete buttons.
 * @param {string} text
 * @returns {HTMLLIElement}
 */
function buildSubtaskItem(text) {
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.innerHTML = `
        <span class="subtask-bullet">•</span>
        <span class="subtask-text">${text}</span>
        <div class="subtask-item-actions">
            <button type="button" class="subtask-item-btn" aria-label="Edit"><img src="../assets/icons/edit.svg" alt="" width="18" height="18"></button>
            <span class="subtask-action-divider"></span>
            <button type="button" class="subtask-item-btn" aria-label="Delete"><img src="../assets/icons/delete.svg" alt="" width="18" height="18"></button>
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
    root.querySelector('#subtaskList').appendChild(buildSubtaskItem(text));
    input.value = '';
    input.focus();
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
    li.classList.remove('is-editing');
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
    li.classList.add('is-editing');
    li.insertBefore(editInput, textEl);
    editInput.focus();
    editInput.addEventListener('blur', () => confirmEditSubtask(li, editInput, textEl));
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') editInput.blur();
        if (e.key === 'Escape') { editInput.value = textEl.textContent; editInput.blur(); }
    });
}


/**
 * Handles edit and delete clicks inside the subtask list via event delegation.
 * @param {MouseEvent} e
 */
function handleSubtaskListClick(e) {
    const btn = e.target.closest('.subtask-item-btn');
    if (!btn) return;
    const li = btn.closest('.subtask-item');
    if (btn.getAttribute('aria-label') === 'Edit') startEditSubtask(li);
    if (btn.getAttribute('aria-label') === 'Delete') li.remove();
}


/**
 * Returns the current subtask texts for use when saving the task.
 * @param {ParentNode} root
 * @returns {string[]}
 */
export function getSubtasks(root) {
    return [...root.querySelectorAll('.subtask-text')].map((el) => el.textContent);
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
    root.querySelector('#subtaskList')?.addEventListener('click', handleSubtaskListClick);
}

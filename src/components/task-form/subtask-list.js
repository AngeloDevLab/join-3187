import { escapeHtml } from '../../utils/helpers.js';
import { iconUrl } from '../../utils/paths.js';


/**
 * Returns the inner markup of one subtask row. While editing, the left button
 * shows a trash icon and the right one a check icon (swapped via CSS).
 * @param {string} text
 * @returns {string}
 */
function subtaskItemHtml(text) {
    const icon = (cls, name) => `<img class="${cls}" src="${iconUrl(name)}" alt="" width="18" height="18">`;
    return `<span class="subtask-bullet">•</span>
        <span class="subtask-text">${escapeHtml(text)}</span>
        <div class="subtask-item-actions">
            <button type="button" class="subtask-item-btn subtask-btn-left" aria-label="Edit">
                ${icon('icon-default', 'edit.svg')}${icon('icon-editing', 'delete.svg')}
            </button>
            <span class="subtask-action-divider"></span>
            <button type="button" class="subtask-item-btn subtask-btn-right" aria-label="Delete">
                ${icon('icon-default', 'delete.svg')}${icon('icon-editing', 'check.svg')}
            </button>
        </div>`;
}


/**
 * The subtask input of the task form plus its editable list:
 * add via Enter or the check button, edit inline, delete per row.
 */
export class SubtaskList {
    #input;
    #wrapper;
    #list;


    /** @param {ParentNode} root - the form's root (document or a modal dialog) */
    constructor(root) {
        this.#input = root.querySelector('#task-subtask');
        this.#wrapper = this.#input.closest('.input-wrapper');
        this.#list = root.querySelector('#subtaskList');
        this.#wireInput(root);
        this.#list.addEventListener('mousedown', (e) => { if (e.target.closest('.subtask-item-btn')) e.preventDefault(); });
        this.#list.addEventListener('click', (e) => this.#handleListClick(e));
    }


    /** @returns {{ title: string, done: boolean }[]} */
    get values() {
        return [...this.#list.querySelectorAll('.subtask-item')].map((li) => ({
            title: li.querySelector('.subtask-text').textContent,
            done: li.dataset.done === 'true',
        }));
    }


    /**
     * Replaces the list with the given subtasks, preserving their done state.
     * @param {{ title: string, done: boolean }[]} subtasks
     */
    set values(subtasks) {
        this.#list.innerHTML = '';
        subtasks.forEach((s) => this.#list.appendChild(this.#buildItem(s.title, s.done)));
    }


    /** Empties the input and the list. */
    reset() {
        this.#input.value = '';
        this.values = [];
    }


    /** @param {ParentNode} root */
    #wireInput(root) {
        this.#input.addEventListener('focus', () => this.#wrapper.classList.add('is-active'));
        this.#input.addEventListener('blur', (e) => {
            if (!this.#wrapper.contains(e.relatedTarget)) this.#wrapper.classList.remove('is-active');
        });
        this.#input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.#add(); } });
        root.querySelector('#subtaskConfirm').addEventListener('click', () => this.#add());
        root.querySelector('#subtaskClear').addEventListener('click', () => { this.#input.value = ''; this.#input.focus(); });
    }


    /**
     * @param {string} text
     * @param {boolean} [done]
     * @returns {HTMLLIElement}
     */
    #buildItem(text, done = false) {
        const li = document.createElement('li');
        li.className = 'subtask-item';
        li.dataset.done = String(done);
        li.innerHTML = subtaskItemHtml(text);
        return li;
    }


    /** Appends the input's text as a new subtask. */
    #add() {
        const text = this.#input.value.trim();
        if (text) this.#list.appendChild(this.#buildItem(text));
        this.#input.value = '';
        this.#input.focus();
    }


    /**
     * Row clicks start editing; the left/right buttons edit, delete or confirm
     * depending on whether the row is currently being edited.
     * @param {MouseEvent} e
     */
    #handleListClick(e) {
        const li = e.target.closest('.subtask-item');
        if (!li) return;
        const btn = e.target.closest('.subtask-item-btn');
        const isEditing = li.classList.contains('is-editing');
        if (!btn) return this.#startEdit(li);
        if (btn.classList.contains('subtask-btn-left')) return isEditing ? li.remove() : this.#startEdit(li);
        if (isEditing) li.querySelector('.subtask-edit-input')?.blur();
        else li.remove();
    }


    /**
     * Replaces the row's text with an inline input; Enter/blur saves, Escape cancels.
     * @param {HTMLLIElement} li
     */
    #startEdit(li) {
        if (li.classList.contains('is-editing')) return;
        const textEl = li.querySelector('.subtask-text');
        const editInput = Object.assign(document.createElement('input'), { className: 'subtask-edit-input', value: textEl.textContent });
        this.#setEditing(li, true);
        li.insertBefore(editInput, textEl);
        editInput.focus();
        editInput.addEventListener('blur', () => this.#confirmEdit(li, editInput, textEl));
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') editInput.blur();
            if (e.key === 'Escape') { editInput.value = textEl.textContent; editInput.blur(); }
        });
    }


    /**
     * @param {HTMLLIElement} li
     * @param {HTMLInputElement} editInput
     * @param {HTMLElement} textEl
     */
    #confirmEdit(li, editInput, textEl) {
        const text = editInput.value.trim();
        if (text) textEl.textContent = text;
        editInput.remove();
        this.#setEditing(li, false);
    }


    /**
     * @param {HTMLLIElement} li
     * @param {boolean} isEditing
     */
    #setEditing(li, isEditing) {
        li.classList.toggle('is-editing', isEditing);
        li.querySelector('.subtask-btn-left').setAttribute('aria-label', isEditing ? 'Delete' : 'Edit');
        li.querySelector('.subtask-btn-right').setAttribute('aria-label', isEditing ? 'Confirm' : 'Delete');
    }
}

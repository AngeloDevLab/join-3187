import { validateField, clearError } from '../utils/form-validation.js';
import { getCurrentUser } from '../firebase/auth.js';
import { getAll } from '../firebase/database.js';
import { getAvatarColor } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    initDropdownAutoClose();
    initPriorityButtons();
    initCategoryDropdown();
    initAssignedDropdown();
    initSubtaskInput();
    initTaskForm();
});


// ── Priority ─────────────────────────────────────────────

/**
 * Removes `.selected` from all priority buttons and adds it to `clicked`.
 * @param {HTMLButtonElement} clicked
 */
function selectPriorityBtn(clicked) {
    document.querySelectorAll('.priority-btn').forEach((btn) => btn.classList.remove('selected'));
    clicked.classList.add('selected');
}

/** Attaches click handlers to all priority buttons. */
function initPriorityButtons() {
    document.querySelectorAll('.priority-btn').forEach((btn) => {
        btn.addEventListener('click', () => selectPriorityBtn(btn));
    });
}

/**
 * Returns the currently selected priority value.
 * @returns {string}
 */
function getSelectedPriority() {
    return document.querySelector('.priority-btn.selected')?.dataset.priority ?? 'medium';
}


// ── Form Fields ──────────────────────────────────────────

/**
 * Collects all validated field elements into one object.
 * @returns {{ titleInput: HTMLInputElement, titleError: HTMLElement, dueDateInput: HTMLInputElement, dueDateError: HTMLElement, categorySelect: HTMLSelectElement, categoryError: HTMLElement }}
 */
function getFormFields() {
    return {
        titleInput: document.getElementById('task-title'),
        titleError: document.getElementById('taskTitleError'),
        dueDateInput: document.getElementById('task-due-date'),
        dueDateError: document.getElementById('taskDueDateError'),
        categorySelect: document.getElementById('task-category'),
        categoryError: document.getElementById('taskCategoryError'),
    };
}


// ── Validation ───────────────────────────────────────────

/**
 * Runs all required-field checks and returns true only if all pass.
 * @param {ReturnType<typeof getFormFields>} fields
 * @returns {boolean}
 */
function validateTaskForm(fields) {
    const { titleInput, titleError, dueDateInput, dueDateError, categorySelect, categoryError } = fields;
    return [
        validateField(titleInput, titleError, !!titleInput.value.trim(), 'This field is required'),
        validateField(dueDateInput, dueDateError, !!dueDateInput.value, 'This field is required'),
        validateField(categorySelect, categoryError, !!categorySelect.value, 'This field is required'),
    ].every(Boolean);
}


// ── Clear ────────────────────────────────────────────────

/** Resets the category dropdown label back to its placeholder text. */
function resetCategoryDropdown() {
    const valueEl = document.querySelector('#categoryDropdown .dropdown-value');
    if (!valueEl) return;
    valueEl.textContent = 'Select task category';
    valueEl.classList.add('dropdown-placeholder');
}

/**
 * Empties all input values in the form.
 * @param {ReturnType<typeof getFormFields>} fields
 */
function resetInputs(fields) {
    fields.titleInput.value = '';
    fields.dueDateInput.value = '';
    fields.dueDateInput.classList.remove('has-value');
    fields.categorySelect.value = '';
    resetCategoryDropdown();
    resetAssignedDropdown();
    document.getElementById('task-description').value = '';
    document.getElementById('task-subtask').value = '';
    document.getElementById('subtaskList').innerHTML = '';
}

/**
 * Clears the error state for all validated fields.
 * @param {ReturnType<typeof getFormFields>} fields
 */
function resetErrors(fields) {
    const { titleInput, titleError, dueDateInput, dueDateError, categorySelect, categoryError } = fields;
    clearError(titleInput.closest('.input-wrapper'), titleError);
    clearError(dueDateInput.closest('.input-wrapper'), dueDateError);
    clearError(categorySelect.closest('.input-wrapper'), categoryError);
}

/**
 * Resets the entire form to its initial state.
 * @param {ReturnType<typeof getFormFields>} fields
 */
function clearTaskForm(fields) {
    resetInputs(fields);
    resetErrors(fields);
    selectPriorityBtn(document.querySelector('.priority-btn[data-priority="medium"]'));
}


// ── Category Dropdown ────────────────────────────────────

/**
 * Collects DOM elements needed for the category dropdown.
 * @returns {{ dropdown: HTMLElement, hiddenInput: HTMLInputElement, valueEl: HTMLElement, trigger: HTMLButtonElement, errorEl: HTMLElement }}
 */
function getCategoryEls() {
    return {
        dropdown: document.getElementById('categoryDropdown'),
        hiddenInput: document.getElementById('task-category'),
        valueEl: document.querySelector('#categoryDropdown .dropdown-value'),
        trigger: document.querySelector('#categoryDropdown .dropdown-trigger'),
        errorEl: document.getElementById('taskCategoryError'),
    };
}

/**
 * @param {{ dropdown: HTMLElement, trigger: HTMLButtonElement }} els
 * @param {boolean} open
 */
function toggleDropdown(els, open) {
    els.dropdown.classList.toggle('is-open', open);
    els.trigger.setAttribute('aria-expanded', String(open));
}

/**
 * Selects an option: updates the hidden input, display text, and clears any error.
 * @param {HTMLElement} option
 * @param {ReturnType<typeof getCategoryEls>} els
 */
function pickCategoryOption(option, els) {
    els.hiddenInput.value = option.dataset.value;
    els.valueEl.textContent = option.textContent.trim();
    els.valueEl.classList.remove('dropdown-placeholder');
    clearError(els.hiddenInput.closest('.input-wrapper'), els.errorEl);
    toggleDropdown(els, false);
}

/** Closes any open dropdown when clicking outside it. */
function initDropdownAutoClose() {
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown.is-open').forEach((d) => {
            if (!d.contains(e.target)) {
                d.classList.remove('is-open');
                d.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

/** Sets up the category dropdown — toggle and selection. */
function initCategoryDropdown() {
    const els = getCategoryEls();
    if (!els.dropdown) return;
    els.trigger.addEventListener('click', () =>
        toggleDropdown(els, !els.dropdown.classList.contains('is-open')));
    els.dropdown.querySelectorAll('.dropdown-option').forEach((opt) =>
        opt.addEventListener('click', () => pickCategoryOption(opt, els)));
}


// ── Assigned Dropdown ────────────────────────────────────

/**
 * Builds a single assigned-to list item element.
 * @param {{ id: string, name: string, initials: string }} user
 * @param {string} color
 * @returns {HTMLLIElement}
 */
function buildAssignedItem(user, color) {
    const li = document.createElement('li');
    Object.assign(li.dataset, { id: user.id, name: user.name, initials: user.initials, color });
    li.className = 'dropdown-option assigned-option';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.innerHTML = `<span class="contact-avatar" style="background:${color}">${user.initials}</span>`
        + `<span class="contact-name">${user.name}</span>`
        + `<img src="../assets/icons/default-box.svg" class="contact-checkbox" alt="">`;
    return li;
}

/**
 * Toggles the selected state of a contact option and swaps the checkbox icon.
 * @param {HTMLLIElement} option
 */
function toggleAssignedContact(option) {
    const selected = option.classList.toggle('selected');
    option.querySelector('.contact-checkbox').src = selected
        ? '../assets/icons/checked-box.svg'
        : '../assets/icons/default-box.svg';
    option.setAttribute('aria-selected', String(selected));
}

/** Updates the trigger to show selected avatars or the placeholder text. */
function updateAssignedTrigger() {
    const selected = document.querySelectorAll('.assigned-option.selected');
    const valueEl = document.getElementById('assignedValue');
    if (!selected.length) {
        valueEl.className = 'dropdown-value dropdown-placeholder';
        valueEl.textContent = 'Select contacts to assign';
        return;
    }
    valueEl.className = 'dropdown-value assigned-chips';
    valueEl.innerHTML = [...selected]
        .map((opt) => `<span class="contact-avatar" style="background:${opt.dataset.color}">${opt.dataset.initials}</span>`)
        .join('');
}

/** Deselects all contacts and resets the trigger display. */
function resetAssignedDropdown() {
    document.querySelectorAll('.assigned-option.selected').forEach((opt) => {
        opt.classList.remove('selected');
        opt.querySelector('.contact-checkbox').src = '../assets/icons/default-box.svg';
        opt.setAttribute('aria-selected', 'false');
    });
    updateAssignedTrigger();
}

/**
 * Loads all users from Firebase, puts the current user first, and populates the list.
 */
async function loadAssignedContacts() {
    const list = document.getElementById('assignedList');
    if (!list) return;
    const users = await getAll('users');
    if (!users) return;
    const currentUser = getCurrentUser();
    const entries = Object.entries(users)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (a.id === currentUser?.id ? -1 : b.id === currentUser?.id ? 1 : 0));
    entries.forEach((user, i) => list.appendChild(buildAssignedItem(user, getAvatarColor(i))));
}

/** Sets up the assigned-to dropdown with event delegation for multi-select. */
function initAssignedDropdown() {
    const dropdown = document.getElementById('assignedDropdown');
    if (!dropdown) return;
    const trigger = document.getElementById('assignedTrigger');
    const list = document.getElementById('assignedList');
    trigger.addEventListener('click', () =>
        toggleDropdown({ dropdown, trigger }, !dropdown.classList.contains('is-open')));
    list.addEventListener('click', (e) => {
        const opt = e.target.closest('.assigned-option');
        if (opt) { toggleAssignedContact(opt); updateAssignedTrigger(); }
    });
    loadAssignedContacts();
}

/**
 * Returns an array of selected contact objects for use when saving a task.
 * @returns {{ id: string, name: string, initials: string, color: string }[]}
 */
function getSelectedContacts() {
    return [...document.querySelectorAll('.assigned-option.selected')]
        .map((opt) => ({ id: opt.dataset.id, name: opt.dataset.name, initials: opt.dataset.initials, color: opt.dataset.color }));
}


// ── Subtask ──────────────────────────────────────────────

/**
 * Creates a subtask list item with bullet, text, and edit/delete buttons.
 * @param {string} text
 * @returns {HTMLLIElement}
 */
function buildSubtaskItem(text) {
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.innerHTML = `<span class="subtask-bullet">•</span>`
        + `<span class="subtask-text">${text}</span>`
        + `<div class="subtask-item-actions">`
        + `<button type="button" class="subtask-item-btn" aria-label="Edit"><img src="../assets/icons/edit.svg" alt="" width="18" height="18"></button>`
        + `<span class="subtask-action-divider"></span>`
        + `<button type="button" class="subtask-item-btn" aria-label="Delete"><img src="../assets/icons/delete.svg" alt="" width="18" height="18"></button>`
        + `</div>`;
    return li;
}

/**
 * Reads the subtask input and appends a new item to the list.
 */
function addSubtask() {
    const input = document.getElementById('task-subtask');
    const text = input.value.trim();
    if (!text) return;
    document.getElementById('subtaskList').appendChild(buildSubtaskItem(text));
    input.value = '';
    input.focus();
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
 * @returns {string[]}
 */
function getSubtasks() {
    return [...document.querySelectorAll('.subtask-text')].map((el) => el.textContent);
}

/**
 * Sets up the subtask input: active state, Enter key, confirm/clear actions, and list delegation.
 */
function initSubtaskInput() {
    const input = document.getElementById('task-subtask');
    const wrapper = input?.closest('.input-wrapper');
    if (!input || !wrapper) return;
    input.addEventListener('focus', () => wrapper.classList.add('is-active'));
    input.addEventListener('blur', (e) => {
        if (!wrapper.contains(e.relatedTarget)) wrapper.classList.remove('is-active');
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } });
    document.getElementById('subtaskConfirm')?.addEventListener('click', () => { addSubtask(); input.focus(); });
    document.getElementById('subtaskClear')?.addEventListener('click', () => { input.value = ''; input.focus(); });
    document.getElementById('subtaskList')?.addEventListener('click', handleSubtaskListClick);
}


// ── Submit ───────────────────────────────────────────────

/**
 * @param {SubmitEvent} e
 * @param {ReturnType<typeof getFormFields>} fields
 */
function handleSubmit(e, fields) {
    e.preventDefault();
    if (!validateTaskForm(fields)) return;
    // TODO: persist task via Firebase — getSelectedPriority() returns current value
    console.log('Task ready, priority:', getSelectedPriority());
}

/** Wires up submit, clear, and date-color handlers. */
function initTaskForm() {
    const form = document.querySelector('.task-form');
    if (!form) return;
    const fields = getFormFields();
    fields.dueDateInput.addEventListener('change', () => {
        fields.dueDateInput.classList.toggle('has-value', !!fields.dueDateInput.value);
    });
    form.addEventListener('submit', (e) => handleSubmit(e, fields));
    form.querySelector('.clear-btn').addEventListener('click', () => clearTaskForm(fields));
}

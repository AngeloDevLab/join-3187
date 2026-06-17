import '../utils/auth-guard.js';
import { validateField, clearError } from '../utils/form-validation.js';
import { getCurrentUser } from '../firebase/auth.js';
import { showToast } from '../components/toast.js';
import { getUsers } from '../firebase/cache.js';
import { getAvatarColor } from '../utils/helpers.js';
import { initNavbar } from '../components/navbar.js';
import { initSubtaskInput, getSubtasks } from '../components/subtask.js';


// ── Priority ─────────────────────────────────────────────

/**
 * Removes `.selected` from all priority buttons and adds it to `clicked`.
 * @param {HTMLButtonElement} clicked
 */
function selectPriorityBtn(clicked) {
    document.querySelectorAll('.priority-btn').forEach((btn) => btn.classList.remove('selected'));
    clicked.classList.add('selected');
}


/**
 * Returns the currently selected priority value.
 * @returns {string}
 */
function getSelectedPriority() {
    return document.querySelector('.priority-btn.selected')?.dataset.priority ?? 'medium';
}


/** Attaches click handlers to all priority buttons. */
function initPriorityButtons() {
    document.querySelectorAll('.priority-btn').forEach((btn) => {
        btn.addEventListener('click', () => selectPriorityBtn(btn));
    });
}


// ── Fields & Validation ──────────────────────────────────

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


/**
 * Returns true when all required task fields are filled.
 * @param {ReturnType<typeof getFormFields>} fields
 * @returns {boolean}
 */
function isTaskReady(fields) {
    return !!fields.titleInput.value.trim()
        && !!fields.dueDateInput.value
        && !!fields.categorySelect.value;
}


/**
 * Enables or disables the submit button based on required field completion.
 * @param {HTMLButtonElement} btn
 * @param {ReturnType<typeof getFormFields>} fields
 */
function updateTaskBtn(btn, fields) {
    btn.disabled = !isTaskReady(fields);
}


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


// ── Category Dropdown ────────────────────────────────────

/**
 * Opens or closes a dropdown by toggling `is-open` and the aria-expanded attribute.
 * @param {{ dropdown: HTMLElement, trigger: HTMLButtonElement }} els
 * @param {boolean} open
 */
function toggleDropdown(els, open) {
    els.dropdown.classList.toggle('is-open', open);
    els.trigger.setAttribute('aria-expanded', String(open));
}


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
 * Selects an option: updates the hidden input, display text, and clears any error.
 * @param {HTMLElement} option
 * @param {ReturnType<typeof getCategoryEls>} els
 */
function pickCategoryOption(option, els) {
    els.hiddenInput.value = option.dataset.value;
    els.valueEl.textContent = option.textContent.trim();
    els.valueEl.classList.remove('dropdown-placeholder');
    els.hiddenInput.dispatchEvent(new Event('input'));
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


/** Sets up the category dropdown — toggle and option selection. */
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


/** Updates the trigger to show selected contact avatars or the placeholder text. */
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


/** Loads all users from the cache, puts the current user first, and populates the list. */
async function loadAssignedContacts() {
    const list = document.getElementById('assignedList');
    if (!list) return;
    const users = await getUsers();
    if (!users) return;
    const currentUser = getCurrentUser();
    const entries = Object.entries(users)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (a.id === currentUser?.id ? -1 : b.id === currentUser?.id ? 1 : 0));
    entries.forEach((user, i) => list.appendChild(buildAssignedItem(user, getAvatarColor(i))));
}


/**
 * Returns an array of selected contact objects for use when saving a task.
 * @returns {{ id: string, name: string, initials: string, color: string }[]}
 */
function getSelectedContacts() {
    return [...document.querySelectorAll('.assigned-option.selected')]
        .map((opt) => ({ id: opt.dataset.id, name: opt.dataset.name, initials: opt.dataset.initials, color: opt.dataset.color }));
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


// ── Form Reset ───────────────────────────────────────────

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


// ── Submit ───────────────────────────────────────────────

/**
 * Validates and submits the task form, shows confirmation, then clears the form.
 * @param {SubmitEvent} e
 * @param {ReturnType<typeof getFormFields>} fields
 */
async function handleSubmit(e, fields) {
    e.preventDefault();
    if (!validateTaskForm(fields)) return;
    // TODO: create('tasks', { title, dueDate, category, priority, assigned, subtasks }) via cache.js
    showToast('Task added to board');
    clearTaskForm(fields);
    e.submitter.disabled = true;
}


/** Wires up submit, clear, and date-color handlers for the task form. */
function initTaskForm() {
    const form = document.querySelector('.task-form');
    if (!form) return;
    const fields = getFormFields();
    const submitBtn = form.querySelector('[type="submit"]');
    updateTaskBtn(submitBtn, fields);
    fields.titleInput.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.categorySelect.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.dueDateInput.addEventListener('change', () => {
        fields.dueDateInput.classList.toggle('has-value', !!fields.dueDateInput.value);
        updateTaskBtn(submitBtn, fields);
    });
    form.addEventListener('submit', (e) => handleSubmit(e, fields));
    form.querySelector('.clear-btn').addEventListener('click', () => clearTaskForm(fields));
}


initNavbar();
initDropdownAutoClose();
initPriorityButtons();
initCategoryDropdown();
initAssignedDropdown();
initSubtaskInput();
initTaskForm();

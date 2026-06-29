import { validateField, clearError } from '../utils/form-validation.js';
import { getCurrentUser } from '../firebase/auth.js';
import { showToast } from '../components/toast.js';
import { getContacts } from '../firebase/cache.js';
import { getAvatarColor, getInitials } from '../utils/helpers.js';
import { initSubtaskInput, getSubtasks } from './subtask.js';


// ── Priority ─────────────────────────────────────────────

/**
 * Removes `.selected` from all priority buttons and adds it to `clicked`.
 * @param {ParentNode} root
 * @param {HTMLButtonElement} clicked
 */
function selectPriorityBtn(root, clicked) {
    root.querySelectorAll('.priority-btn').forEach((btn) => btn.classList.remove('selected'));
    clicked.classList.add('selected');
}


/**
 * Returns the currently selected priority value.
 * @param {ParentNode} root
 * @returns {string}
 */
function getSelectedPriority(root) {
    return root.querySelector('.priority-btn.selected')?.dataset.priority ?? 'medium';
}


/**
 * Attaches click handlers to all priority buttons.
 * @param {ParentNode} root
 */
function initPriorityButtons(root) {
    root.querySelectorAll('.priority-btn').forEach((btn) => {
        btn.addEventListener('click', () => selectPriorityBtn(root, btn));
    });
}


// ── Fields & Validation ──────────────────────────────────

/**
 * Collects all validated field elements into one object.
 * @param {ParentNode} root
 * @returns {{ titleInput: HTMLInputElement, titleError: HTMLElement, dueDateInput: HTMLInputElement, dueDateError: HTMLElement, categorySelect: HTMLSelectElement, categoryError: HTMLElement }}
 */
function getFormFields(root) {
    return {
        titleInput: root.querySelector('#task-title'),
        titleError: root.querySelector('#taskTitleError'),
        dueDateInput: root.querySelector('#task-due-date'),
        dueDateError: root.querySelector('#taskDueDateError'),
        categorySelect: root.querySelector('#task-category'),
        categoryError: root.querySelector('#taskCategoryError'),
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
 * Returns today's date as a local YYYY-MM-DD string, for use as a date input's min/value.
 * @returns {string}
 */
function getTodayDateString() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today - offset).toISOString().slice(0, 10);
}


/**
 * Visually dims the submit button when required fields are missing, without
 * disabling it so a click still triggers validation and shows the errors.
 * @param {HTMLButtonElement} btn
 * @param {ReturnType<typeof getFormFields>} fields
 */
function updateTaskBtn(btn, fields) {
    btn.classList.toggle('btn-pending', !isTaskReady(fields));
}


/**
 * Runs all required-field checks and returns true only if all pass.
 * @param {ReturnType<typeof getFormFields>} fields
 * @returns {boolean}
 */
function validateTaskForm(fields) {
    const { titleInput, titleError, dueDateInput, dueDateError, categorySelect, categoryError } = fields;
    const dueDateValid = !!dueDateInput.value && dueDateInput.value >= getTodayDateString();
    return [
        validateField(titleInput, titleError, !!titleInput.value.trim(), 'This field is required'),
        validateField(dueDateInput, dueDateError, dueDateValid, dueDateInput.value
            ? 'Date cannot be in the past' : 'This field is required'),
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
 * @param {ParentNode} root
 * @returns {{ dropdown: HTMLElement, hiddenInput: HTMLInputElement, valueEl: HTMLElement, trigger: HTMLButtonElement, errorEl: HTMLElement }}
 */
function getCategoryEls(root) {
    return {
        dropdown: root.querySelector('#categoryDropdown'),
        hiddenInput: root.querySelector('#task-category'),
        valueEl: root.querySelector('#categoryDropdown .dropdown-value'),
        trigger: root.querySelector('#categoryDropdown .dropdown-trigger'),
        errorEl: root.querySelector('#taskCategoryError'),
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


let dropdownAutoCloseInitialized = false;


/** Closes any open dropdown when clicking outside it (registered once, regardless of how many forms exist). */
function initDropdownAutoClose() {
    if (dropdownAutoCloseInitialized) return;
    dropdownAutoCloseInitialized = true;
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown.is-open').forEach((d) => {
            if (!d.contains(e.target)) {
                d.classList.remove('is-open');
                d.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}


/**
 * Sets up the category dropdown — toggle and option selection.
 * @param {ParentNode} root
 */
function initCategoryDropdown(root) {
    const els = getCategoryEls(root);
    if (!els.dropdown) return;
    els.trigger.addEventListener('click', () =>
        toggleDropdown(els, !els.dropdown.classList.contains('is-open')));
    els.dropdown.querySelectorAll('.dropdown-option').forEach((opt) =>
        opt.addEventListener('click', () => pickCategoryOption(opt, els)));
}


// ── Assigned Dropdown ────────────────────────────────────

/**
 * Builds a single assigned-to list item element.
 * @param {{ id: string, name: string }} contact
 * @param {string} color
 * @param {boolean} isYou
 * @returns {HTMLLIElement}
 */
function buildAssignedItem(contact, color, isYou) {
    const initials = getInitials(contact.name);
    const displayName = isYou ? `${contact.name} (You)` : contact.name;
    const li = document.createElement('li');
    Object.assign(li.dataset, { id: contact.id, name: contact.name, initials, color });
    li.className = 'dropdown-option assigned-option';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.innerHTML = `<span class="contact-avatar" style="background:${color}">${initials}</span>`
        + `<span class="contact-name">${displayName}</span>`
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


/**
 * Updates the chip row below the dropdown to show the selected contacts' avatars.
 * @param {ParentNode} root
 */
function updateAssignedTrigger(root) {
    const selected = root.querySelectorAll('.assigned-option.selected');
    root.querySelector('#assignedChipsDisplay').innerHTML = [...selected]
        .map((opt) => `<span class="contact-avatar" style="background:${opt.dataset.color}">${opt.dataset.initials}</span>`)
        .join('');
}


/**
 * Deselects all contacts and clears the chip display.
 * @param {ParentNode} root
 */
function resetAssignedDropdown(root) {
    root.querySelectorAll('.assigned-option.selected').forEach((opt) => {
        opt.classList.remove('selected');
        opt.querySelector('.contact-checkbox').src = '../assets/icons/default-box.svg';
        opt.setAttribute('aria-selected', 'false');
    });
    updateAssignedTrigger(root);
}


/**
 * Checks whether a contact represents the currently logged-in user.
 * @param {{ email?: string }} contact
 * @param {{ email?: string }|null} currentUser
 * @returns {boolean}
 */
function isCurrentUser(contact, currentUser) {
    return !!currentUser?.email && contact.email === currentUser.email;
}


/**
 * Loads all contacts from the cache, puts the current user first, and populates the list.
 * @param {ParentNode} root
 */
async function loadAssignedContacts(root) {
    const list = root.querySelector('#assignedList');
    if (!list) return;
    const contacts = await getContacts();
    if (!contacts) return;
    const currentUser = getCurrentUser();
    const entries = Object.entries(contacts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (isCurrentUser(a, currentUser) ? -1 : isCurrentUser(b, currentUser) ? 1 : 0));
    entries.forEach((c, i) => list.appendChild(buildAssignedItem(c, getAvatarColor(i), isCurrentUser(c, currentUser))));
}


/**
 * Returns an array of selected contact objects for use when saving a task.
 * @param {ParentNode} root
 * @returns {{ id: string, name: string, initials: string, color: string }[]}
 */
function getSelectedContacts(root) {
    return [...root.querySelectorAll('.assigned-option.selected')]
        .map((opt) => ({ id: opt.dataset.id, name: opt.dataset.name, initials: opt.dataset.initials, color: opt.dataset.color }));
}


/**
 * Sets up the assigned-to dropdown with event delegation for multi-select.
 * @param {ParentNode} root
 */
function initAssignedDropdown(root) {
    const dropdown = root.querySelector('#assignedDropdown');
    if (!dropdown) return;
    const trigger = root.querySelector('#assignedTrigger');
    const list = root.querySelector('#assignedList');
    trigger.addEventListener('click', () =>
        toggleDropdown({ dropdown, trigger }, !dropdown.classList.contains('is-open')));
    list.addEventListener('click', (e) => {
        const opt = e.target.closest('.assigned-option');
        if (opt) { toggleAssignedContact(opt); updateAssignedTrigger(root); }
    });
    loadAssignedContacts(root);
}


// ── Form Reset ───────────────────────────────────────────

/**
 * Resets the category dropdown label back to its placeholder text.
 * @param {ParentNode} root
 */
function resetCategoryDropdown(root) {
    const valueEl = root.querySelector('#categoryDropdown .dropdown-value');
    if (!valueEl) return;
    valueEl.textContent = 'Select task category';
    valueEl.classList.add('dropdown-placeholder');
}


/**
 * Empties all input values in the form.
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 */
function resetInputs(fields, root) {
    fields.titleInput.value = '';
    fields.dueDateInput.value = '';
    fields.dueDateInput.classList.remove('has-value');
    fields.categorySelect.value = '';
    resetCategoryDropdown(root);
    resetAssignedDropdown(root);
    root.querySelector('#task-description').value = '';
    root.querySelector('#task-subtask').value = '';
    root.querySelector('#subtaskList').innerHTML = '';
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
 * @param {ParentNode} root
 */
function clearTaskForm(fields, root) {
    resetInputs(fields, root);
    resetErrors(fields);
    selectPriorityBtn(root, root.querySelector('.priority-btn[data-priority="medium"]'));
}


// ── Collecting Data ──────────────────────────────────────

/**
 * Builds a plain task-data object from the current form state.
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 * @returns {{ title: string, description: string, dueDate: string, priority: string, type: string, assigned: object[], subtasks: string[] }}
 */
function collectTaskData(fields, root) {
    return {
        title: fields.titleInput.value.trim(),
        description: root.querySelector('#task-description').value.trim(),
        dueDate: fields.dueDateInput.value,
        priority: getSelectedPriority(root),
        type: fields.categorySelect.value === 'user-story' ? 'User Story' : 'Technical Task',
        assigned: getSelectedContacts(root),
        subtasks: getSubtasks(root),
    };
}


/**
 * Maps collected form data to a Firebase-ready task object for the given column.
 * @param {ReturnType<typeof collectTaskData>} data
 * @param {string} column
 * @returns {Object}
 */
export function toFirebaseTask(data, column) {
    const subtasks = {};
    data.subtasks.forEach((title, i) => { subtasks[`subtask${i + 1}`] = { title, done: false }; });
    return {
        title: data.title,
        description: data.description,
        category: data.type === 'User Story' ? 'userStory' : 'technicalTask',
        priority: data.priority,
        column,
        assignedTo: data.assigned.map((c) => c.id),
        dueDate: data.dueDate,
        createdAt: getTodayDateString(),
        subtasks,
    };
}


// ── Submit ───────────────────────────────────────────────

/**
 * Validates and submits the task form, shows confirmation, then clears the form.
 * @param {SubmitEvent} e
 * @param {ReturnType<typeof getFormFields>} fields
 * @param {ParentNode} root
 * @param {(data: ReturnType<typeof collectTaskData>) => void} [onSubmitSuccess]
 */
function handleSubmit(e, fields, root, onSubmitSuccess) {
    e.preventDefault();
    if (!validateTaskForm(fields)) return;
    onSubmitSuccess?.(collectTaskData(fields, root));
    showToast('Task added to board');
    clearTaskForm(fields, root);
    updateTaskBtn(e.submitter, fields);
}


/**
 * Wires up submit, clear/cancel, and date-color handlers for the task form.
 * @param {ParentNode} root
 * @param {(data: ReturnType<typeof collectTaskData>) => void} [onSubmitSuccess]
 * @param {() => void} [onCancel]
 */
function initTaskForm(root, onSubmitSuccess, onCancel) {
    const form = root.querySelector('.task-form');
    if (!form) return;
    const fields = getFormFields(root);
    const submitBtn = form.querySelector('[type="submit"]');
    fields.dueDateInput.min = getTodayDateString();
    updateTaskBtn(submitBtn, fields);
    fields.titleInput.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.categorySelect.addEventListener('input', () => updateTaskBtn(submitBtn, fields));
    fields.dueDateInput.addEventListener('change', () => {
        fields.dueDateInput.classList.toggle('has-value', !!fields.dueDateInput.value);
        updateTaskBtn(submitBtn, fields);
    });
    form.addEventListener('submit', (e) => handleSubmit(e, fields, root, onSubmitSuccess));
    form.querySelector('.clear-btn').addEventListener('click', () =>
        onCancel ? onCancel() : clearTaskForm(fields, root));
}


/**
 * Initializes the add-task form within the given root (the document for the
 * standalone page, or a modal's dialog element when reused inside one).
 * @param {ParentNode} root
 * @param {{ onSubmitSuccess?: (data: ReturnType<typeof collectTaskData>) => void, onCancel?: () => void }} [options]
 */
export function initAddTaskForm(root, { onSubmitSuccess, onCancel } = {}) {
    initDropdownAutoClose();
    initPriorityButtons(root);
    initCategoryDropdown(root);
    initAssignedDropdown(root);
    initSubtaskInput(root);
    initTaskForm(root, onSubmitSuccess, onCancel);
}
import { toggleDropdown } from './task-category-dropdown.js';
import { getCurrentUser } from '../firebase/auth.js';
import { getContacts } from '../firebase/cache.js';
import { getAvatarColor, getInitials, escapeHtml } from '../utils/helpers.js';


/**
 * Builds a single assigned-to list item element.
 * @param {{ id: string, name: string }} contact
 * @param {string} color
 * @param {boolean} isYou
 * @returns {HTMLLIElement}
 */
function buildAssignedItem(contact, color, isYou) {
    const initials = escapeHtml(getInitials(contact.name));
    const displayName = escapeHtml(isYou ? `${contact.name} (You)` : contact.name);
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
export function resetAssignedDropdown(root) {
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
export function getSelectedContacts(root) {
    return [...root.querySelectorAll('.assigned-option.selected')]
        .map((opt) => ({ id: opt.dataset.id, name: opt.dataset.name, initials: opt.dataset.initials, color: opt.dataset.color }));
}


/**
 * Sets up the assigned-to dropdown with event delegation for multi-select.
 * @param {ParentNode} root
 */
export function initAssignedDropdown(root) {
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

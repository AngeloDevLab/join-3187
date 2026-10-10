import { toggleDropdown } from './task-category-dropdown.js';
import { authService } from '../services/auth-service.js';
import { contactStore } from '../services/contact-store.js';
import { getAvatarColorForId, getInitials, escapeHtml } from '../utils/helpers.js';
import { iconUrl } from '../utils/paths.js';

const MAX_VISIBLE_CHIPS = 4;


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
    li.innerHTML = `<span class="contact-avatar avatar-circle" style="background:${color}">${initials}</span>`
        + `<span class="contact-name">${displayName}</span>`
        + `<img src="${iconUrl('default-box.svg')}" class="contact-checkbox" alt="">`;
    return li;
}


/**
 * Toggles the selected state of a contact option and swaps the checkbox icon.
 * @param {HTMLLIElement} option
 */
function toggleAssignedContact(option) {
    const selected = option.classList.toggle('selected');
    option.querySelector('.contact-checkbox').src = selected
        ? iconUrl('checked-box.svg')
        : iconUrl('default-box.svg');
    option.setAttribute('aria-selected', String(selected));
}


/**
 * Builds the avatar chip markup for a single selected contact.
 * @param {HTMLLIElement} opt
 * @returns {string}
 */
function buildChipAvatar(opt) {
    return `<span class="contact-avatar avatar-circle" style="background:${opt.dataset.color}">${opt.dataset.initials}</span>`;
}


/**
 * Updates the chip row below the dropdown to show up to MAX_VISIBLE_CHIPS
 * selected contacts' avatars, collapsing any remainder into a "+n" chip.
 * @param {ParentNode} root
 */
function updateAssignedTrigger(root) {
    const selected = [...root.querySelectorAll('.assigned-option.selected')];
    const overflow = selected.length - MAX_VISIBLE_CHIPS;
    const chips = selected.slice(0, MAX_VISIBLE_CHIPS).map(buildChipAvatar);
    if (overflow > 0) chips.push(`<span class="contact-avatar avatar-circle contact-avatar-more">+${overflow}</span>`);
    root.querySelector('#assignedChipsDisplay').innerHTML = chips.join('');
}


/**
 * Deselects all contacts, clears the chip display, and resets the search.
 * @param {ParentNode} root
 */
export function resetAssignedDropdown(root) {
    root.querySelectorAll('.assigned-option.selected').forEach((opt) => {
        opt.classList.remove('selected');
        opt.querySelector('.contact-checkbox').src = iconUrl('default-box.svg');
        opt.setAttribute('aria-selected', 'false');
    });
    updateAssignedTrigger(root);
    root.querySelector('#assignedValue').value = '';
    filterAssignedOptions(root, '');
}


/**
 * Shows only the assigned-option items whose contact name matches the query.
 * @param {ParentNode} root
 * @param {string} query
 */
function filterAssignedOptions(root, query) {
    const q = query.trim().toLowerCase();
    root.querySelectorAll('.assigned-option').forEach((opt) => {
        opt.classList.toggle('is-filtered', !opt.dataset.name.toLowerCase().includes(q));
    });
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
    const contacts = await contactStore.getAll();
    const currentUser = authService.currentUser;
    const entries = Object.entries(contacts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (isCurrentUser(a, currentUser) ? -1 : isCurrentUser(b, currentUser) ? 1 : 0));
    entries.forEach((c) => list.appendChild(buildAssignedItem(c, getAvatarColorForId(c.id), isCurrentUser(c, currentUser))));
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
 * Selects the given contact ids in an already-loaded assigned dropdown, e.g. when prefilling for an edit.
 * @param {ParentNode} root
 * @param {string[]} ids
 */
export function selectAssignedContacts(root, ids) {
    const idSet = new Set(ids);
    root.querySelectorAll('.assigned-option').forEach((opt) => {
        if (idSet.has(opt.dataset.id)) toggleAssignedContact(opt);
    });
    updateAssignedTrigger(root);
}


/**
 * Toggles the clicked contact's selected state and refreshes the chip row.
 * @param {ParentNode} root
 * @param {MouseEvent} e
 */
function handleAssignedListClick(root, e) {
    const opt = e.target.closest('.assigned-option');
    if (opt) { toggleAssignedContact(opt); updateAssignedTrigger(root); }
}


/**
 * Opens the dropdown and resets the search to a fresh full list, unless
 * it's already open (avoids re-clearing an in-progress search on re-click).
 * @param {ParentNode} root
 * @param {{ dropdown: HTMLElement, trigger: HTMLElement, searchInput: HTMLInputElement }} els
 */
function openAssignedDropdown(root, els) {
    if (els.dropdown.classList.contains('is-open')) return;
    toggleDropdown(els, true);
    els.searchInput.value = '';
    filterAssignedOptions(root, '');
    els.searchInput.focus();
}


/**
 * Closes the dropdown and clears the search back to its placeholder.
 * @param {ParentNode} root
 * @param {{ dropdown: HTMLElement, trigger: HTMLElement, searchInput: HTMLInputElement }} els
 */
function closeAssignedDropdown(root, els) {
    toggleDropdown(els, false);
    els.searchInput.value = '';
    filterAssignedOptions(root, '');
}


/**
 * Closes and clears the search once focus leaves the whole widget - not on
 * every blur, since selecting an option or clicking the arrow also blurs
 * the search input without the user actually leaving the dropdown.
 * @param {ParentNode} root
 * @param {{ dropdown: HTMLElement, trigger: HTMLElement, searchInput: HTMLInputElement }} els
 * @param {FocusEvent} e
 */
function handleAssignedFocusOut(root, els, e) {
    if (els.dropdown.contains(e.relatedTarget)) return;
    closeAssignedDropdown(root, els);
}


/**
 * Prevents mousedown on non-input parts of the widget from blurring the
 * search input, so clicking the arrow or an option doesn't close things.
 * @param {HTMLElement} trigger
 * @param {HTMLInputElement} searchInput
 * @param {HTMLElement} list
 */
function preventAssignedBlur(trigger, searchInput, list) {
    trigger.addEventListener('mousedown', (e) => { if (e.target !== searchInput) e.preventDefault(); });
    list.addEventListener('mousedown', (e) => { if (e.target.closest('.assigned-option')) e.preventDefault(); });
}


/**
 * Toggles the dropdown closed when the arrow is clicked while open,
 * otherwise opens it (e.g. clicking into the search input).
 * @param {ParentNode} root
 * @param {{ dropdown: HTMLElement, trigger: HTMLElement, searchInput: HTMLInputElement }} els
 * @param {MouseEvent} e
 */
function handleAssignedTriggerClick(root, els, e) {
    const isArrowClick = e.target.closest('.dropdown-arrow');
    if (isArrowClick && els.dropdown.classList.contains('is-open')) {
        closeAssignedDropdown(root, els);
        return;
    }
    openAssignedDropdown(root, els);
}


/**
 * Sets up the assigned-to dropdown with event delegation for multi-select
 * and name search.
 * @param {ParentNode} root
 * @returns {Promise<void>} Resolves once contacts have been loaded into the list.
 */
export function initAssignedDropdown(root) {
    const dropdown = root.querySelector('#assignedDropdown');
    if (!dropdown) return Promise.resolve();
    const trigger = root.querySelector('#assignedTrigger');
    const searchInput = root.querySelector('#assignedValue');
    const list = root.querySelector('#assignedList');
    const els = { dropdown, trigger, searchInput };
    preventAssignedBlur(trigger, searchInput, list);
    trigger.addEventListener('click', (e) => handleAssignedTriggerClick(root, els, e));
    searchInput.addEventListener('focus', () => openAssignedDropdown(root, els));
    searchInput.addEventListener('input', () => filterAssignedOptions(root, searchInput.value));
    dropdown.addEventListener('focusout', (e) => handleAssignedFocusOut(root, els, e));
    list.addEventListener('click', (e) => handleAssignedListClick(root, e));
    return loadAssignedContacts(root);
}

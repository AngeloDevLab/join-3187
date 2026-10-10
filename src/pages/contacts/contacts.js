import '../../utils/auth-guard.js';
import { initNavbar } from '../../components/navbar.js';
import { authService } from '../../services/auth-service.js';
import { getAvatarColorForId, getInitials, triggerTransitionIn } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { contactStore } from '../../services/contact-store.js';
import { toggleContactMenu, closeContactMenu, closeContactMenuIfRendered } from '../../components/contact-menu.js';
import { getAddContactFields, getEditContactFields, validateContactFields, wireContactFormBlur } from '../../components/contact-form.js';
import {
    openAddContactOverlay as showAddContactOverlay,
    openEditContactOverlay as showEditContactOverlay,
    openDeleteContactOverlay as showDeleteContactOverlay,
    closeContactOverlay,
} from '../../components/contact-overlay.js';

let activeContactId = null;

/** Adds the logged-in user to contacts if needed, then keeps the list in sync with the store. */
async function init() {
    await addCurrentUserToContacts();
    contactStore.subscribe(renderContacts);
}


/** Adds the logged-in user to the contact list once, if available. */
async function addCurrentUserToContacts() {
    const currentUser = authService.currentUser;
    if (!currentUser?.email) return;
    const contacts = await contactStore.getAll();
    if (hasContactWithEmail(contacts, currentUser.email)) return;
    await contactStore.add({ name: currentUser.name, email: currentUser.email, phone: '' });
}


/**
 * Checks whether a contact with this email already exists.
 * @param {Object} contacts
 * @param {string} email
 * @returns {boolean}
 */
function hasContactWithEmail(contacts, email) {
    return Object.values(contacts).some((contact) => contact.email?.toLowerCase() === email.toLowerCase());
}


/**
 * Returns all contacts as an array, sorted alphabetically by name.
 * @param {Object} contacts
 * @returns {Array<{id: string, name: string, email: string, phone: string}>}
 */
function getSortedContacts(contacts) {
    return Object.entries(contacts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Renders all contacts grouped by first letter; runs on every store change.
 * @param {Object} contacts
 */
function renderContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    container.innerHTML = '';
    renderGroupedContacts(groupByFirstLetter(getSortedContacts(contacts)), container);
    syncActiveContact(contacts);
}


/**
 * Keeps the selected contact highlighted after a re-render, or deselects it
 * if it was deleted in the meantime (by this or another user).
 * @param {Object} contacts
 */
function syncActiveContact(contacts) {
    if (activeContactId === null) return;
    if (!contacts[activeContactId]) return deselectContact();
    document.getElementById(`contact-card-${activeContactId}`)?.classList.add('active');
}


/**
 * Groups an array of contacts by the first letter of their name.
 * @param {Array} list
 * @returns {Object}
 */
function groupByFirstLetter(list) {
    return list.reduce((groups, contact) => {
        const letter = contact.name.charAt(0).toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(contact);
        return groups;
    }, {});
}


/**
 * Appends grouped contact cards into the container.
 * @param {Object} grouped
 * @param {HTMLElement} container
 */
function renderGroupedContacts(grouped, container) {
    for (const letter in grouped) {
        const group = document.createElement('div');
        group.className = 'contact-group';
        const heading = document.createElement('h3');
        heading.textContent = letter;
        group.appendChild(heading);
        const divider = document.createElement('hr');
        divider.className = 'contact-group-divider';
        group.appendChild(divider);
        grouped[letter].forEach((contact) => group.appendChild(buildContactCardNode(contact)));
        container.appendChild(group);
    }
}


/**
 * Builds a contact card element from the card template, filled with this contact's data.
 * @param {{ id: string, name: string, email: string }} contact
 * @returns {HTMLElement}
 */
function buildContactCardNode(contact) {
    const node = document.getElementById('contactCardTemplate').content.cloneNode(true);
    const card = node.querySelector('.contact-card');
    const avatar = card.querySelector('.contact-avatar');
    const emailEl = card.querySelector('.contact-card-email');

    card.id = `contact-card-${contact.id}`;
    card.addEventListener('click', () => handleContactCardClick(contact.id));
    card.querySelector('.contact-card-name').textContent = contact.name;

    avatar.style.background = getAvatarColorForId(contact.id);
    avatar.textContent = getInitials(contact.name);

    emailEl.textContent = contact.email;

    return card;
}


/**
 * Handles a contact card click: on desktop, clicking the already-selected
 * contact deselects it again; otherwise shows its details.
 * @param {string} contactId
 */
function handleContactCardClick(contactId) {
    if (activeContactId === contactId && window.innerWidth >= 1024) {
        deselectContact();
        return;
    }
    showContactDetails(contactId);
}


/** Deselects the active contact and resets the details panel to its placeholder. */
function deselectContact() {
    document.getElementById(`contact-card-${activeContactId}`)?.classList.remove('active');
    activeContactId = null;
    resetContactDetails();
}


/**
 * Shows the detail panel for a contact; on mobile hides the list.
 * @param {string} contactId
 */
async function showContactDetails(contactId) {
    const contact = await getContactById(contactId);
    if (!contact) return;
    setActiveContactCard(contactId);
    const details = document.getElementById('contactDetails');
    details.classList.remove('d-none');
    details.innerHTML = '';
    details.appendChild(buildContactDetailsNode(contact));
    showContactDetailsCard();
    document.getElementById('contactsList').classList.add('d-none');
}


/**
 * Marks the selected contact card as active.
 * @param {string} contactId
 */
function setActiveContactCard(contactId) {
    if (activeContactId !== null) {
        document.getElementById(`contact-card-${activeContactId}`)?.classList.remove('active');
    }
    document.getElementById(`contact-card-${contactId}`)?.classList.add('active');
    activeContactId = contactId;
}


/** Shows the animated contact details card after it was rendered. */
function showContactDetailsCard() {
    const card = document.getElementById('contactDetailsCard');
    card.classList.remove('d-none');
    triggerTransitionIn(card, 'is-open');
}


/**
 * Builds the contact details panel from the template, filled with this contact's data.
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 * @returns {DocumentFragment}
 */
function buildContactDetailsNode(contact) {
    const node = document.getElementById('contactDetailsTemplate').content.cloneNode(true);
    fillContactDetailsNode(node, contact);
    return node;
}


/**
 * Fills the avatar/name/email/phone fields in a cloned contact details node.
 * @param {DocumentFragment} node
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 */
function fillContactDetailsFields(node, contact) {
    const avatar = node.querySelector('.contact-details-avatar');
    avatar.style.background = getAvatarColorForId(contact.id);
    avatar.textContent = getInitials(contact.name);
    node.querySelector('.contact-details-name').textContent = contact.name;
    const emailEl = node.querySelector('.contact-details-email');
    emailEl.textContent = contact.email;
    emailEl.href = `mailto:${contact.email}`;
    node.querySelector('.contact-details-phone').textContent = contact.phone;
}


/**
 * Wires the edit/delete action buttons (desktop and mobile menu copies) in a
 * cloned contact details node.
 * @param {DocumentFragment} node
 * @param {string} contactId
 */
function wireContactDetailsActions(node, contactId) {
    node.querySelectorAll('.contact-details-edit-btn').forEach((btn) =>
        btn.addEventListener('click', (e) => { e.stopPropagation(); openEditContactOverlay(contactId); }));
    node.querySelectorAll('.contact-details-delete-btn').forEach((btn) =>
        btn.addEventListener('click', (e) => { e.stopPropagation(); openDeleteContactOverlay(contactId); }));
}


/**
 * Wires the "back to list" button and the mobile contact menu toggle/backdrop
 * in a cloned contact details node.
 * @param {DocumentFragment} node
 */
function wireContactDetailsNav(node) {
    node.querySelector('.back-to-contacts-btn').addEventListener('click', showContactsList);
    node.querySelector('#menuContactBtn').addEventListener('click', toggleContactMenu);
    node.querySelector('#contactMenuBackdrop').addEventListener('click', closeContactMenu);
    node.querySelector('#contactMenu').addEventListener('click', closeContactMenu);
}


/**
 * Fills and wires a cloned contact details node with this contact's data and actions.
 * @param {DocumentFragment} node
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 */
function fillContactDetailsNode(node, contact) {
    fillContactDetailsFields(node, contact);
    wireContactDetailsActions(node, contact.id);
    wireContactDetailsNav(node);
}


/** Opens the add contact overlay. */
function openAddContactOverlay() {
    showAddContactOverlay(createContact);
    wireContactFormBlur(getAddContactFields());
}


/**
 * Opens the edit overlay for a contact.
 * @param {string} contactId
 */
async function openEditContactOverlay(contactId) {
    closeContactMenuIfRendered();
    const contact = await getContactById(contactId);
    if (!contact) return;
    showEditContactOverlay(contact, (e) => saveEditedContact(e, contactId), () => openDeleteContactOverlay(contactId));
    wireContactFormBlur(getEditContactFields());
}


/**
 * Opens the delete confirmation overlay for a contact.
 * @param {string} contactId
 */
async function openDeleteContactOverlay(contactId) {
    closeContactMenuIfRendered();
    const contact = await getContactById(contactId);
    if (!contact) return;
    showDeleteContactOverlay(contact, () => deleteContact(contactId));
}


/**
 * Creates a new contact in Firebase and selects it.
 * @param {SubmitEvent} event
 */
async function createContact(event) {
    event.preventDefault();
    const fields = getAddContactFields();
    if (!validateContactFields(fields)) return;

    const id = await contactStore.add({
        name: fields.nameInput.value.trim(),
        email: fields.emailInput.value.trim(),
        phone: fields.phoneInput.value.trim(),
    });
    closeContactOverlay();
    await showContactDetails(id);
    showToast('Contact successfully created');
}


/**
 * Saves edited contact data to Firebase and refreshes the current view.
 * @param {SubmitEvent} event
 * @param {string} contactId
 */
async function saveEditedContact(event, contactId) {
    event.preventDefault();
    const fields = getEditContactFields();
    if (!validateContactFields(fields)) return;

    await contactStore.update(contactId, {
        name: fields.nameInput.value.trim(),
        email: fields.emailInput.value.trim(),
        phone: fields.phoneInput.value.trim(),
    });
    closeContactOverlay();
    await showContactDetails(contactId);
}


/**
 * Deletes a contact from Firebase and resets the details panel.
 * @param {string} contactId
 */
async function deleteContact(contactId) {
    await contactStore.remove(contactId);
    activeContactId = null;
    closeContactOverlay();
    resetContactDetails();
}


/**
 * Finds a contact by id.
 * @param {string} contactId
 * @returns {Promise<{ id: string, name: string, email: string, phone: string } | undefined>}
 */
async function getContactById(contactId) {
    const contact = await contactStore.getById(contactId);
    return contact ? { id: contactId, ...contact } : undefined;
}


/** Restores the empty contact details panel. */
function resetContactDetails() {
    const details = document.getElementById('contactDetails');
    details.classList.add('d-none');
    details.innerHTML = '';
    details.appendChild(document.getElementById('contactDetailsPlaceholderTemplate').content.cloneNode(true));
    document.getElementById('contactsList').classList.remove('d-none');
}


/** Shows the contacts list panel and hides details (mobile). */
function showContactsList() {
    document.getElementById('contactDetails').classList.add('d-none');
    document.getElementById('contactsList').classList.remove('d-none');
}


/** Wires the static "add contact" trigger buttons outside any template. */
function initContactsPageListeners() {
    document.querySelectorAll('.desktop-add-contact-btn, .add-contact-btn').forEach((btn) =>
        btn.addEventListener('click', openAddContactOverlay));
}


initNavbar();
init();
initContactsPageListeners();

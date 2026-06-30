import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { getCurrentUser } from '../firebase/auth.js';
import { getAvatarColorForId, getInitials } from '../utils/helpers.js';
import { getContacts, saveContact, updateContact, removeContact } from '../firebase/cache.js';

let activeContactId = null;

/** Adds the logged-in user to contacts if needed, then renders the list. */
async function init() {
    await addCurrentUserToContacts();
    await renderContacts();
}


/** Adds the logged-in user to the contact list once, if available. */
async function addCurrentUserToContacts() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return;
    const contacts = (await getContacts()) || {};
    if (hasContactWithEmail(contacts, currentUser.email)) return;
    await saveContact({ name: currentUser.name, email: currentUser.email, phone: '' });
}


/**
 * Checks whether a contact with this email already exists.
 * @param {Object} contacts
 * @param {string} email
 * @returns {boolean}
 */
function hasContactWithEmail(contacts, email) {
    return Object.values(contacts).some((contact) => contact.email.toLowerCase() === email.toLowerCase());
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


/** Loads contacts from cache and renders them grouped by first letter. */
async function renderContacts() {
    const contacts = (await getContacts()) || {};
    const container = document.getElementById('contactsContainer');
    container.innerHTML = '';
    const grouped = groupByFirstLetter(getSortedContacts(contacts));
    renderGroupedContacts(grouped, container);
}


/**
 * Groups an array of contacts by the first letter of their name.
 * @param {Array} list
 * @returns {Object}
 */
function groupByFirstLetter(list) {
    const groupedContacts = {};

    for (let i = 0; i < list.length; i++) {
        const contact = list[i];
        const letter = contact.name.charAt(0);

        if (!groupedContacts[letter]) {
            groupedContacts[letter] = [];
        }

        groupedContacts[letter].push(contact);
    }

    return groupedContacts;
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
    card.id = `contact-card-${contact.id}`;
    card.setAttribute('onclick', `showContactDetails('${contact.id}')`);
    avatar.style.background = getAvatarColorForId(contact.id);
    avatar.textContent = getInitials(contact.name);
    card.querySelector('.contact-card-name').textContent = contact.name;
    const emailEl = card.querySelector('.contact-card-email');
    emailEl.textContent = contact.email;
    emailEl.href = `mailto:${contact.email}`;
    return card;
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
    if (window.innerWidth < 1024) {
        document.getElementById('contactsList').classList.add('d-none');
    }
}


/** Marks the selected contact card as active. */
function setActiveContactCard(contactId) {
    if (activeContactId !== null) {
        document.getElementById(`contact-card-${activeContactId}`).classList.remove('active');
    }

    document.getElementById(`contact-card-${contactId}`).classList.add('active');
    activeContactId = contactId;
}


/** Shows the animated contact details card after it was rendered. */
function showContactDetailsCard() {
    requestAnimationFrame(() => {
        document.getElementById('contactDetailsCard').classList.remove('d-none');
    });
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
 * Fills the avatar/name/email/phone fields and wires the edit/delete action buttons
 * (desktop and mobile menu copies) in a cloned contact details node.
 * @param {DocumentFragment} node
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 */
function fillContactDetailsNode(node, contact) {
    const avatar = node.querySelector('.contact-details-avatar');
    avatar.style.background = getAvatarColorForId(contact.id);
    avatar.textContent = getInitials(contact.name);
    node.querySelector('.contact-details-name').textContent = contact.name;
    const emailEl = node.querySelector('.contact-details-email');
    emailEl.textContent = contact.email;
    emailEl.href = `mailto:${contact.email}`;
    node.querySelector('.contact-details-phone').textContent = contact.phone;
    node.querySelectorAll('.contact-details-edit-btn').forEach((btn) =>
        btn.setAttribute('onclick', `event.stopPropagation(); openEditContactOverlay('${contact.id}')`));
    node.querySelectorAll('.contact-details-delete-btn').forEach((btn) =>
        btn.setAttribute('onclick', `event.stopPropagation(); openDeleteContactOverlay('${contact.id}')`));
}


/**
 * Opens the add contact overlay.
 */
function openAddContactOverlay() {
    renderContactOverlay(buildAddContactOverlayNode());
}


/**
 * Opens the edit overlay for a contact.
 * @param {string} contactId
 */
async function openEditContactOverlay(contactId) {
    closeMenuContactIfRendered();
    const contact = await getContactById(contactId);
    if (!contact) return;
    renderContactOverlay(buildEditContactOverlayNode(contact));
}


/**
 * Opens the delete confirmation overlay for a contact.
 * @param {string} contactId
 */
async function openDeleteContactOverlay(contactId) {
    closeMenuContactIfRendered();
    const contact = await getContactById(contactId);
    if (!contact) return;
    renderContactOverlay(buildDeleteContactOverlayNode(contact));
}


/**
 * Renders and animates a contact overlay.
 * @param {Node} node
 */
function renderContactOverlay(node) {
    closeContactOverlay();
    document.getElementById('contactOverlayContainer').appendChild(node);
    requestAnimationFrame(() => {
        document.getElementById('contactOverlay').classList.add('contact-overlay-open');
    });
}


/** Closes the active contact overlay. */
function closeContactOverlay() {
    document.getElementById('contactOverlayContainer').innerHTML = '';
}


/**
 * Builds the add-contact overlay node by cloning its template (fully static, no data to fill).
 * @returns {DocumentFragment}
 */
function buildAddContactOverlayNode() {
    return document.getElementById('addContactOverlayTemplate').content.cloneNode(true);
}


/**
 * Builds the edit-contact overlay node from the template, prefilled with this contact's data.
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 * @returns {DocumentFragment}
 */
function buildEditContactOverlayNode(contact) {
    const node = document.getElementById('editContactOverlayTemplate').content.cloneNode(true);
    node.querySelector('.contact-edit-name-input').value = contact.name;
    node.querySelector('.contact-edit-email-input').value = contact.email;
    node.querySelector('.contact-edit-phone-input').value = contact.phone;
    node.querySelector('form').setAttribute('onsubmit', `saveEditedContact(event, '${contact.id}')`);
    node.querySelector('.contact-edit-delete-btn').setAttribute('onclick', `deleteContact('${contact.id}')`);
    return node;
}


/**
 * Builds the delete-confirmation overlay node from the template for this contact.
 * @param {{ id: string, name: string }} contact
 * @returns {DocumentFragment}
 */
function buildDeleteContactOverlayNode(contact) {
    const node = document.getElementById('deleteContactOverlayTemplate').content.cloneNode(true);
    node.querySelector('.contact-delete-message').textContent = `Delete ${contact.name}?`;
    node.querySelector('.contact-delete-confirm-btn').setAttribute('onclick', `deleteContact('${contact.id}')`);
    return node;
}


/**
 * Creates a new contact in Firebase and selects it.
 * @param {SubmitEvent} event
 */
async function createContact(event) {
    event.preventDefault();
    const name = document.getElementById('addContactName').value.trim();
    const email = document.getElementById('addContactEmail').value.trim();
    const phone = document.getElementById('addContactPhone').value.trim();
    if (!name || !email || !phone) return;

    const id = await saveContact({ name, email, phone });
    closeContactOverlay();
    await renderContacts();
    await showContactDetails(id);
}


/**
 * Saves edited contact data to Firebase and refreshes the current view.
 * @param {SubmitEvent} event
 * @param {string} contactId
 */
async function saveEditedContact(event, contactId) {
    event.preventDefault();
    const data = {
        name: document.getElementById('editContactName').value.trim(),
        email: document.getElementById('editContactEmail').value.trim(),
        phone: document.getElementById('editContactPhone').value.trim(),
    };

    await updateContact(contactId, data);
    closeContactOverlay();
    await renderContacts();
    await showContactDetails(contactId);
}


/**
 * Deletes a contact from Firebase and resets the details panel.
 * @param {string} contactId
 */
async function deleteContact(contactId) {
    await removeContact(contactId);
    activeContactId = null;
    closeContactOverlay();
    await renderContacts();
    resetContactDetails();
}


/**
 * Finds a contact by id.
 * @param {string} contactId
 * @returns {Promise<{ id: string, name: string, email: string, phone: string } | undefined>}
 */
async function getContactById(contactId) {
    const contacts = (await getContacts()) || {};
    return contacts[contactId] ? { id: contactId, ...contacts[contactId] } : undefined;
}


/** Restores the empty contact details panel. */
function resetContactDetails() {
    const details = document.getElementById('contactDetails');
    details.classList.add('d-none');
    details.innerHTML = '';
    details.appendChild(document.getElementById('contactDetailsPlaceholderTemplate').content.cloneNode(true));
    document.getElementById('contactsList').classList.remove('d-none');
}


/** Closes the mobile menu only when it exists in the DOM. */
function closeMenuContactIfRendered() {
    if (document.getElementById('contactMenu')) closeMenuContact();
}


/** Shows the contacts list panel and hides details (mobile). */
function showContactsList() {
    document.getElementById('contactDetails').classList.add('d-none');
    document.getElementById('contactsList').classList.remove('d-none');
}


/** Toggles the mobile contact action menu open/closed. */
function toggleMenuContact() {
    document.getElementById('contactMenu').classList.toggle('contact_menu_open');
    document.getElementById('menuContactBtn').classList.toggle('menu_contact_btn_active');
    document.getElementById('contactMenuBackdrop').classList.toggle('contact_menu_backdrop_open');
}


/** Closes the mobile contact action menu. */
function closeMenuContact() {
    document.getElementById('contactMenu').classList.remove('contact_menu_open');
    document.getElementById('menuContactBtn').classList.remove('menu_contact_btn_active');
    document.getElementById('contactMenuBackdrop').classList.remove('contact_menu_backdrop_open');
}

window.showContactDetails = showContactDetails;
window.showContactsList = showContactsList;
window.toggleMenuContact = toggleMenuContact;
window.closeMenuContact = closeMenuContact;
window.openAddContactOverlay = openAddContactOverlay;
window.openEditContactOverlay = openEditContactOverlay;
window.openDeleteContactOverlay = openDeleteContactOverlay;
window.closeContactOverlay = closeContactOverlay;
window.saveEditedContact = saveEditedContact;
window.createContact = createContact;
window.deleteContact = deleteContact;

initNavbar();
init();

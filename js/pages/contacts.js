import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { getCurrentUser } from '../firebase/auth.js';
import { getAvatarColorForId, getInitials, escapeHtml } from '../utils/helpers.js';
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
 * Appends grouped contact HTML into the container.
 * @param {Object} grouped
 * @param {HTMLElement} container
 */
function renderGroupedContacts(grouped, container) {
    let contactsHTML = '';

    for (const letter in grouped) {
        contactsHTML += `<div class="contact-group"><h3>${letter}</h3>`;

        for (let i = 0; i < grouped[letter].length; i++) {
            contactsHTML += getContactTemplate(grouped[letter][i]);
        }

        contactsHTML += '</div>';
    }

    container.innerHTML = contactsHTML;
}


/**
 * Returns the card HTML for a single contact.
 * @param {{ id: string, name: string, email: string }} contact
 * @returns {string}
 */
function getContactTemplate(contact) {
    const name = escapeHtml(contact.name);
    const email = escapeHtml(contact.email);
    const initials = escapeHtml(getInitials(contact.name));

    return `<div id="contact-card-${contact.id}" class="contact-card" onclick="showContactDetails('${contact.id}')">
        <div class="contact-avatar" style="background:${getAvatarColorForId(contact.id)}">${initials}</div>
        <div><h4>${name}</h4><a href="mailto:${email}">${email}</a></div>
    </div>`;
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
    details.innerHTML = getContactDetailsTemplate(contact);
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
 * Returns the detail panel HTML for a contact.
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 * @returns {string}
 */
function getContactDetailsTemplate(contact) {
    const name = escapeHtml(contact.name);
    const email = escapeHtml(contact.email);
    const phone = escapeHtml(contact.phone);
    const initials = escapeHtml(getInitials(contact.name));

    return `<div class="contact-details-header">
        <div class="contact-details-title-row">
            <h1>Contacts</h1>
            <button class="back-to-contacts-btn" onclick="showContactsList()">←</button>
        </div>
        <p>Better with a team</p>
    </div>
    <div id="contactDetailsCard" class="contact-details-card d-none">
        <div class="contact-details-profile">
            <div class="contact-details-avatar" style="background:${getAvatarColorForId(contact.id)}">${initials}</div>
            <div class="contact-details-name-actions">
                <h2>${name}</h2>
                <div class="desktop-contact-actions">
                    <button onclick="openEditContactOverlay('${contact.id}')"><img src="../assets/icons/menu_contact_pencil.svg" alt="">Edit</button>
                    <button onclick="openDeleteContactOverlay('${contact.id}')"><img src="../assets/icons/menu_contact_trash.svg" alt="">Delete</button>
                </div>
            </div>
        </div>
        <div class="contact-information-title">Contact Information</div>
        <div class="contact-information">
            <h4>Email</h4>
            <a href="mailto:${email}">${email}</a>
            <h4>Phone</h4>
            <p>${phone}</p>
            <button id="menuContactBtn" class="menu_contact_btn" onclick="toggleMenuContact()" aria-label="Contact menu">
                <img src="../assets/icons/menu_contact.svg" alt="">
            </button>
            <div id="contactMenuBackdrop" class="contact_menu_backdrop" onclick="closeMenuContact()"></div>
            <div id="contactMenu" class="contact_menu" onclick="closeMenuContact()">
                <button class="contact_menu_option" onclick="event.stopPropagation(); openEditContactOverlay('${contact.id}')"><img src="../assets/icons/menu_contact_pencil.svg" alt="">Edit</button>
                <button class="contact_menu_option" onclick="event.stopPropagation(); openDeleteContactOverlay('${contact.id}')"><img src="../assets/icons/menu_contact_trash.svg" alt="">Delete</button>
            </div>
        </div>
    </div>`;
}


/**
 * Opens the add contact overlay.
 */
function openAddContactOverlay() {
    renderContactOverlay(getAddContactOverlayTemplate());
}


/**
 * Opens the edit overlay for a contact.
 * @param {string} contactId
 */
async function openEditContactOverlay(contactId) {
    closeMenuContactIfRendered();
    const contact = await getContactById(contactId);
    if (!contact) return;
    renderContactOverlay(getEditContactOverlayTemplate(contact));
}


/**
 * Opens the delete confirmation overlay for a contact.
 * @param {string} contactId
 */
async function openDeleteContactOverlay(contactId) {
    closeMenuContactIfRendered();
    const contact = await getContactById(contactId);
    if (!contact) return;
    renderContactOverlay(getDeleteContactOverlayTemplate(contact));
}


/**
 * Renders and animates a contact overlay.
 * @param {string} template
 */
function renderContactOverlay(template) {
    closeContactOverlay();
    document.getElementById('contactOverlayContainer').innerHTML = template;
    requestAnimationFrame(() => {
        document.getElementById('contactOverlay').classList.add('contact-overlay-open');
    });
}


/** Closes the active contact overlay. */
function closeContactOverlay() {
    document.getElementById('contactOverlayContainer').innerHTML = '';
}


/**
 * Returns the add contact overlay HTML.
 * @returns {string}
 */
function getAddContactOverlayTemplate() {
    return `<div id="contactOverlay" class="contact-overlay-backdrop" onclick="closeContactOverlay()">
        <section class="contact-overlay contact-add-overlay" onclick="event.stopPropagation()">
            <button class="contact-overlay-close" onclick="closeContactOverlay()" aria-label="Close">&times;</button>
            <div class="contact-overlay-brand">
                <img src="../assets/icons/join_logo.svg" alt="Join">
                <h2>Add contact</h2>
                <p>Tasks are better with a team!</p>
                <div></div>
            </div>
            <form class="contact-edit-form contact-add-form" onsubmit="createContact(event)">
                <div class="contact-add-avatar" aria-hidden="true">
                    <img src="../assets/icons/person.svg" alt="">
                </div>
                <div class="contact-add-fields">
                    <label class="contact-input-wrapper">
                        <input id="addContactName" type="text" placeholder="Name" autocomplete="name" required>
                        <img src="../assets/icons/person.svg" alt="">
                    </label>
                    <label class="contact-input-wrapper">
                        <input id="addContactEmail" type="email" placeholder="Email" autocomplete="email" required>
                        <img src="../assets/icons/mail.svg" alt="">
                    </label>
                    <label class="contact-input-wrapper">
                        <input id="addContactPhone" type="tel" placeholder="Phone" autocomplete="tel" required>
                        <span aria-hidden="true">&#9742;</span>
                    </label>
                    <div class="contact-overlay-actions contact-add-actions">
                        <button type="button" class="contact-secondary-btn" onclick="closeContactOverlay()">Cancel &times;</button>
                        <button type="submit" class="contact-primary-btn">Create contact &#10003;</button>
                    </div>
                </div>
            </form>
        </section>
    </div>`;
}


/**
 * Returns the edit overlay HTML.
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 * @returns {string}
 */
function getEditContactOverlayTemplate(contact) {
    const name = escapeHtml(contact.name);
    const email = escapeHtml(contact.email);
    const phone = escapeHtml(contact.phone);

    return `<div id="contactOverlay" class="contact-overlay-backdrop" onclick="closeContactOverlay()">
        <section class="contact-overlay contact-edit-overlay" onclick="event.stopPropagation()">
            <button class="contact-overlay-close" onclick="closeContactOverlay()" aria-label="Close">&times;</button>
            <div class="contact-overlay-brand">
                <img src="../assets/icons/join_logo.svg" alt="Join">
                <h2>Edit contact</h2>
                <div></div>
            </div>
            <form class="contact-edit-form" onsubmit="saveEditedContact(event, '${contact.id}')">
                <input id="editContactName" type="text" value="${name}" placeholder="Name" autocomplete="name" required>
                <input id="editContactEmail" type="email" value="${email}" placeholder="Email" autocomplete="email" required>
                <input id="editContactPhone" type="tel" value="${phone}" placeholder="Phone" autocomplete="tel" required>
                <div class="contact-overlay-actions">
                    <button type="button" class="contact-secondary-btn" onclick="deleteContact('${contact.id}')">Delete</button>
                    <button type="submit" class="contact-primary-btn">Save</button>
                </div>
            </form>
        </section>
    </div>`;
}


/**
 * Returns the delete confirmation overlay HTML.
 * @param {{ id: string, name: string }} contact
 * @returns {string}
 */
function getDeleteContactOverlayTemplate(contact) {
    const name = escapeHtml(contact.name);

    return `<div id="contactOverlay" class="contact-overlay-backdrop" onclick="closeContactOverlay()">
        <section class="contact-overlay contact-delete-overlay" onclick="event.stopPropagation()">
            <button class="contact-overlay-close" onclick="closeContactOverlay()" aria-label="Close">&times;</button>
            <div class="contact-overlay-brand">
                <img src="../assets/icons/join_logo.svg" alt="Join">
                <h2>Delete contact</h2>
                <div></div>
            </div>
            <div class="contact-delete-content">
                <p>Delete ${name}?</p>
                <div class="contact-overlay-actions">
                    <button type="button" class="contact-secondary-btn" onclick="closeContactOverlay()">Cancel</button>
                    <button type="button" class="contact-primary-btn" onclick="deleteContact('${contact.id}')">Delete</button>
                </div>
            </div>
        </section>
    </div>`;
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
    details.innerHTML = `<div class="desktop-contact-placeholder">
        <h1>Contacts</h1>
        <div></div>
        <p>Better with a team</p>
    </div>`;
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

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    init();
});

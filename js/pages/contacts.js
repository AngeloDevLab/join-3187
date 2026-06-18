import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';

const contacts = [
    { id: 1,  name: 'Anton Mayer',    email: 'anton@gmail.com',    phone: '+49 123 456789', initials: 'AM', color: 'bg-orange' },
    { id: 2,  name: 'Anja Schulz',    email: 'anja@gmail.com',     phone: '+49 123 456789', initials: 'AS', color: 'bg-purple' },
    { id: 3,  name: 'Benedikt Ziegler', email: 'benedikt@gmail.com', phone: '+49 123 456789', initials: 'BZ', color: 'bg-blue' },
    { id: 4,  name: 'David Eisenberg', email: 'david@gmail.com',   phone: '+49 123 456789', initials: 'DE', color: 'bg-orange' },
    { id: 5,  name: 'Eva Fischer',    email: 'eva@gmail.com',      phone: '+49 123 456789', initials: 'EF', color: 'bg-purple' },
    { id: 6,  name: 'Felix Wagner',   email: 'felix@gmail.com',    phone: '+49 123 456789', initials: 'FW', color: 'bg-blue' },
    { id: 7,  name: 'Greta Klein',    email: 'greta@gmail.com',    phone: '+49 123 456789', initials: 'GK', color: 'bg-orange' },
    { id: 8,  name: 'Hannah Becker',  email: 'hannah@gmail.com',   phone: '+49 123 456789', initials: 'HB', color: 'bg-purple' },
    { id: 9,  name: 'Jonas Hoffmann', email: 'jonas@gmail.com',    phone: '+49 123 456789', initials: 'JH', color: 'bg-blue' },
    { id: 10, name: 'Lena Richter',   email: 'lena@gmail.com',     phone: '+49 123 456789', initials: 'LR', color: 'bg-orange' },
];

let activeContactId = null;

/** Sorts contacts alphabetically and renders the list. */
function init() {
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    renderContacts();
}

/** Renders all contacts grouped by first letter. */
function renderContacts() {
    const container = document.getElementById('contactsContainer');
    container.innerHTML = '';
    const grouped = groupByFirstLetter(contacts);
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
 * @param {{ id: number, initials: string, color: string, name: string, email: string }} contact
 * @returns {string}
 */
function getContactTemplate(contact) {
    return `<div id="contact-card-${contact.id}" class="contact-card" onclick="showContactDetails(${contact.id})">
        <div class="contact-avatar ${contact.color}">${contact.initials}</div>
        <div><h4>${contact.name}</h4><a href="mailto:${contact.email}">${contact.email}</a></div>
    </div>`;
}

/**
 * Shows the detail panel for a contact; on mobile hides the list.
 * @param {number} contactId
 */
function showContactDetails(contactId) {
    const contact = getContactById(contactId);
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
 * @param {{ initials: string, color: string, name: string, email: string, phone: string }} contact
 * @returns {string}
 */
function getContactDetailsTemplate(contact) {
    return `<div class="contact-details-header">
        <div class="contact-details-title-row">
            <h1>Contacts</h1>
            <button class="back-to-contacts-btn" onclick="showContactsList()">←</button>
        </div>
        <p>Better with a team</p>
    </div>
    <div id="contactDetailsCard" class="contact-details-card d-none">
        <div class="contact-details-profile">
            <div class="contact-details-avatar ${contact.color}">${contact.initials}</div>
            <div class="contact-details-name-actions">
                <h2>${contact.name}</h2>
                <div class="desktop-contact-actions">
                    <button onclick="openEditContactOverlay(${contact.id})"><img src="../assets/icons/menu_contact_pencil.svg" alt="">Edit</button>
                    <button onclick="openDeleteContactOverlay(${contact.id})"><img src="../assets/icons/menu_contact_trash.svg" alt="">Delete</button>
                </div>
            </div>
        </div>
        <div class="contact-information-title">Contact Information</div>
        <div class="contact-information">
            <h4>Email</h4>
            <a href="mailto:${contact.email}">${contact.email}</a>
            <h4>Phone</h4>
            <p>${contact.phone}</p>
            <button id="menuContactBtn" class="menu_contact_btn" onclick="toggleMenuContact()" aria-label="Contact menu">
                <img src="../assets/icons/menu_contact.svg" alt="">
            </button>
            <div id="contactMenuBackdrop" class="contact_menu_backdrop" onclick="closeMenuContact()"></div>
            <div id="contactMenu" class="contact_menu" onclick="closeMenuContact()">
                <button class="contact_menu_option" onclick="event.stopPropagation(); openEditContactOverlay(${contact.id})"><img src="../assets/icons/menu_contact_pencil.svg" alt="">Edit</button>
                <button class="contact_menu_option" onclick="event.stopPropagation(); openDeleteContactOverlay(${contact.id})"><img src="../assets/icons/menu_contact_trash.svg" alt="">Delete</button>
            </div>
        </div>
    </div>`;
}

/**
 * Opens the edit overlay for a contact.
 * @param {number} contactId
 */
function openEditContactOverlay(contactId) {
    closeMenuContactIfRendered();
    const contact = getContactById(contactId);
    if (!contact) return;
    renderContactOverlay(getEditContactOverlayTemplate(contact));
}

/**
 * Opens the delete confirmation overlay for a contact.
 * @param {number} contactId
 */
function openDeleteContactOverlay(contactId) {
    closeMenuContactIfRendered();
    const contact = getContactById(contactId);
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
 * Returns the edit overlay HTML.
 * @param {{ id: number, name: string, email: string, phone: string }} contact
 * @returns {string}
 */
function getEditContactOverlayTemplate(contact) {
    const name = escapeAttribute(contact.name);
    const email = escapeAttribute(contact.email);
    const phone = escapeAttribute(contact.phone);

    return `<div id="contactOverlay" class="contact-overlay-backdrop" onclick="closeContactOverlay()">
        <section class="contact-overlay contact-edit-overlay" onclick="event.stopPropagation()">
            <button class="contact-overlay-close" onclick="closeContactOverlay()" aria-label="Close">&times;</button>
            <div class="contact-overlay-brand">
                <img src="../assets/icons/join_logo.svg" alt="Join">
                <h2>Edit contact</h2>
                <div></div>
            </div>
            <form class="contact-edit-form" onsubmit="saveEditedContact(event, ${contact.id})">
                <input id="editContactName" type="text" value="${name}" placeholder="Name" autocomplete="name" required>
                <input id="editContactEmail" type="email" value="${email}" placeholder="Email" autocomplete="email" required>
                <input id="editContactPhone" type="tel" value="${phone}" placeholder="Phone" autocomplete="tel" required>
                <div class="contact-overlay-actions">
                    <button type="button" class="contact-secondary-btn" onclick="deleteContact(${contact.id})">Delete</button>
                    <button type="submit" class="contact-primary-btn">Save</button>
                </div>
            </form>
        </section>
    </div>`;
}

/**
 * Returns the delete confirmation overlay HTML.
 * @param {{ id: number, name: string }} contact
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
                    <button type="button" class="contact-primary-btn" onclick="deleteContact(${contact.id})">Delete</button>
                </div>
            </div>
        </section>
    </div>`;
}

/**
 * Saves edited contact data and refreshes the current view.
 * @param {SubmitEvent} event
 * @param {number} contactId
 */
function saveEditedContact(event, contactId) {
    event.preventDefault();
    const contact = getContactById(contactId);
    if (!contact) return;
    contact.name = document.getElementById('editContactName').value.trim();
    contact.email = document.getElementById('editContactEmail').value.trim();
    contact.phone = document.getElementById('editContactPhone').value.trim();
    contact.initials = getInitials(contact.name);
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    closeContactOverlay();
    renderContacts();
    showContactDetails(contactId);
}

/**
 * Deletes a contact and resets the details panel.
 * @param {number} contactId
 */
function deleteContact(contactId) {
    const contactIndex = getContactIndexById(contactId);
    if (contactIndex === -1) return;
    contacts.splice(contactIndex, 1);
    activeContactId = null;
    closeContactOverlay();
    renderContacts();
    resetContactDetails();
}

/**
 * Gets initials from a contact name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
    const nameParts = name.split(' ');
    let initials = '';

    for (let i = 0; i < nameParts.length; i++) {
        if (nameParts[i] !== '' && initials.length < 2) {
            initials += nameParts[i].charAt(0).toUpperCase();
        }
    }

    return initials;
}

/**
 * Finds a contact by id.
 * @param {number} contactId
 * @returns {Object | undefined}
 */
function getContactById(contactId) {
    for (let i = 0; i < contacts.length; i++) {
        if (contacts[i].id === contactId) {
            return contacts[i];
        }
    }
}

/**
 * Finds the index of a contact by id.
 * @param {number} contactId
 * @returns {number}
 */
function getContactIndexById(contactId) {
    for (let i = 0; i < contacts.length; i++) {
        if (contacts[i].id === contactId) {
            return i;
        }
    }

    return -1;
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

/**
 * Escapes text before inserting it as HTML.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);
}

/**
 * Escapes text before inserting it into an HTML attribute.
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
    return escapeHtml(value);
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
window.openEditContactOverlay = openEditContactOverlay;
window.openDeleteContactOverlay = openDeleteContactOverlay;
window.closeContactOverlay = closeContactOverlay;
window.saveEditedContact = saveEditedContact;
window.deleteContact = deleteContact;

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    init();
});

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
    return list.reduce((acc, contact) => {
        const letter = contact.name.charAt(0);
        (acc[letter] = acc[letter] || []).push(contact);
        return acc;
    }, {});
}

/**
 * Appends grouped contact HTML into the container.
 * @param {Object} grouped
 * @param {HTMLElement} container
 */
function renderGroupedContacts(grouped, container) {
    for (const letter in grouped) {
        container.innerHTML += `<div class="contact-group"><h3>${letter}</h3>${grouped[letter].map(getContactTemplate).join('')}</div>`;
    }
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
    const contact = contacts.find((c) => c.id === contactId);
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
                    <button><img src="../assets/icons/menu_contact_pencil.svg" alt="">Edit</button>
                    <button><img src="../assets/icons/menu_contact_trash.svg" alt="">Delete</button>
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
                <button class="contact_menu_option" onclick="event.stopPropagation()"><img src="../assets/icons/menu_contact_pencil.svg" alt="">Edit</button>
                <button class="contact_menu_option" onclick="event.stopPropagation()"><img src="../assets/icons/menu_contact_trash.svg" alt="">Delete</button>
            </div>
        </div>
    </div>`;
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

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    init();
});

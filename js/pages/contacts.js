const contacts = [
    {
        id: 1,
        name: "Anton Mayer",
        email: "anton@gmail.com",
        phone: "+49 123 456789",
        initials: "AM",
        color: "bg-orange"
    },
    {
        id: 2,
        name: "Anja Schulz",
        email: "anja@gmail.com",
        phone: "+49 123 456789",
        initials: "AS",
        color: "bg-purple"
    },
    {
        id: 3,
        name: "Benedikt Ziegler",
        email: "benedikt@gmail.com",
        phone: "+49 123 456789",
        initials: "BZ",
        color: "bg-blue"
    },
    {
        id: 4,
        name: "David Eisenberg",
        email: "david@gmail.com",
        phone: "+49 123 456789",
        initials: "DE",
        color: "bg-orange"
    },
    {
        id: 5,
        name: "Eva Fischer",
        email: "eva@gmail.com",
        phone: "+49 123 456789",
        initials: "EF",
        color: "bg-purple"
    },
    {
        id: 6,
        name: "Felix Wagner",
        email: "felix@gmail.com",
        phone: "+49 123 456789",
        initials: "FW",
        color: "bg-blue"
    },
    {
        id: 7,
        name: "Greta Klein",
        email: "greta@gmail.com",
        phone: "+49 123 456789",
        initials: "GK",
        color: "bg-orange"
    },
    {
        id: 8,
        name: "Hannah Becker",
        email: "hannah@gmail.com",
        phone: "+49 123 456789",
        initials: "HB",
        color: "bg-purple"
    },
    {
        id: 9,
        name: "Jonas Hoffmann",
        email: "jonas@gmail.com",
        phone: "+49 123 456789",
        initials: "JH",
        color: "bg-blue"
    },
    {
        id: 10,
        name: "Lena Richter",
        email: "lena@gmail.com",
        phone: "+49 123 456789",
        initials: "LR",
        color: "bg-orange"      
    }
];

// Initializes the contacts page by rendering the contacts list
function init() {
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    renderContacts();
}

// Render all contacts 
function renderContacts() {
    let container = document.getElementById("contactsContainer");
    container.innerHTML = "";
    let groupedContacts = {};
    for (let i = 0; i < contacts.length; i++) {
        let contact = contacts[i];
        let firstLetter = contact.name.charAt(0);
        if (!groupedContacts[firstLetter]) {
            groupedContacts[firstLetter] = [];
        }
        groupedContacts[firstLetter].push(contact);
    }

    renderGroupedContacts(groupedContacts, container);
}

// Render contacts grouped by their first letter
function renderGroupedContacts(groupedContacts, container) {
    for (let letter in groupedContacts) {
        container.innerHTML += `
            <div class="contact-group">
                <h3>${letter}</h3>
                ${getContactsByLetter(groupedContacts[letter])}
            </div>
        `;
    }
}

// Returns the HTML for a group of contacts that share the same first letter
function getContactsByLetter(contactsArray) {
    let html = "";
    for (let i = 0; i < contactsArray.length; i++) {
        html += getContactTemplate(contactsArray[i]);
    }
    return html;
}

// Returns the HTML template for contact card
function getContactTemplate(contact) {
    return `
        <div class="contact-card" onclick="showContactDetails(${contact.id})">
            <div class="contact-avatar ${contact.color}">
                ${contact.initials}
            </div>

            <div>
                <h4>${contact.name}</h4>
                <a href="mailto:${contact.email}">
                    ${contact.email}
                </a>
            </div>
        </div>
    `;
}

function showContactDetails(contactId) {
    let contact = contacts.find(contact => contact.id === contactId);
    let detailsContainer = document.getElementById("contactDetails");
    let contactsList = document.getElementById("contactsList");

    detailsContainer.classList.remove("d-none");
    detailsContainer.innerHTML = getContactDetailsTemplate(contact);

    if (window.innerWidth < 1024) {
        contactsList.classList.add("d-none");
    }
}

function getContactDetailsTemplate(contact) {
    return `
        <div class="contact-details-header">
            <div class="contact-details-title-row">
                <h1>Contacts</h1>
                <button class="back-to-contacts-btn" onclick="showContactsList()">
                    ←
                </button>
            </div>
            <p>Better with a team</p>
        </div>

        <div class="contact-details-profile">
            <div class="contact-details-avatar ${contact.color}">
                ${contact.initials}
            </div>

            <div class="contact-details-name-actions">
                <h2>${contact.name}</h2>

                <div class="desktop-contact-actions">
                    <button>
                        <img src="../assets/icons/menu_contact_pencil.svg" alt="">
                        Edit
                    </button>

                    <button>
                        <img src="../assets/icons/menu_contact_trash.svg" alt="">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <div class="contact-information-title">
            Contact Information
        </div>

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
                <button class="contact_menu_option" onclick="event.stopPropagation()"> <img src="../assets/icons/menu_contact_pencil.svg" alt=""> Edit </button>
                <button class="contact_menu_option" onclick="event.stopPropagation()"> <img src="../assets/icons/menu_contact_trash.svg" alt=""> Delete </button>
            </div>
        </div>
    `;
}

function showContactsList() {
    let detailsContainer = document.getElementById("contactDetails");
    let contactsList = document.getElementById("contactsList");

    detailsContainer.classList.add("d-none");
    contactsList.classList.remove("d-none");
}

function toggleMenuContact() {
    let menu = document.getElementById("contactMenu");
    let button = document.getElementById("menuContactBtn");
    let backdrop = document.getElementById("contactMenuBackdrop");

    menu.classList.toggle("contact_menu_open");
    button.classList.toggle("menu_contact_btn_active");
    backdrop.classList.toggle("contact_menu_backdrop_open");
}

function closeMenuContact() {
    let menu = document.getElementById("contactMenu");
    let button = document.getElementById("menuContactBtn");
    let backdrop = document.getElementById("contactMenuBackdrop");

    menu.classList.remove("contact_menu_open");
    button.classList.remove("menu_contact_btn_active");
    backdrop.classList.remove("contact_menu_backdrop_open");
}

init();
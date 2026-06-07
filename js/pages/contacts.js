const contacts = [
    {
        name: "Anton Mayer",
        email: "anton@gmail.com",
        phone: "+49 123 456789",
        initials: "AM",
        color: "bg-orange"
    },
    {
        name: "Anja Schulz",
        email: "anja@gmail.com",
        phone: "+49 123 456789",
        initials: "AS",
        color: "bg-purple"
    },
    {
        name: "Benedikt Ziegler",
        email: "benedikt@gmail.com",
        phone: "+49 123 456789",
        initials: "BZ",
        color: "bg-blue"
    },
    {
        name: "David Eisenberg",
        email: "david@gmail.com",
        phone: "+49 123 456789",
        initials: "DE",
        color: "bg-orange"
    },
    {
        name: "Eva Fischer",
        email: "eva@gmail.com",
        phone: "+49 123 456789",
        initials: "EF",
        color: "bg-purple"
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
        <div class="contact-card">
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

init();
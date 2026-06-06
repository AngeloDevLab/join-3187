const contacts = [
    {
        name: "Anton Mayer",
        email: "anton@gmail.com",
        phone: "+49 123 456789",
        initials: "AM",
        color: "bg-orange"
    },
    {
        name: "Benedikt Ziegler",
        email: "benedikt@gmail.com",
        phone: "+49 123 456789",
        initials: "BZ",
        color: "bg-blue"
    }
];

// Initializes the contacts page by rendering the contacts list.
function init() {
    renderContacts();
}

// Render all contacts
function renderContacts() {
    let container = document.getElementById("contactsContainer");
    container.innerHTML = "";
    for (let i = 0; i < contacts.length; i++) {
        container.innerHTML += getContactTemplate(contacts[i]);
    }
}

// Returns the HTML template for contact card.
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
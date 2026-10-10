import { getAvatarColorForId, getInitials } from '../../utils/helpers.js';


/**
 * Sorts contacts by name and groups them by their first letter.
 * @param {Object<string, { name: string }>} contacts
 * @returns {Map<string, Array<{ id: string, name: string, email: string }>>}
 */
function groupByFirstLetter(contacts) {
    const groups = new Map();
    Object.entries(contacts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((contact) => {
            const letter = contact.name.charAt(0).toUpperCase();
            groups.set(letter, [...(groups.get(letter) ?? []), contact]);
        });
    return groups;
}


/**
 * The alphabetically grouped contact list. Re-renders completely on every
 * store change and keeps the selected contact highlighted.
 */
export class ContactList {
    #container = document.getElementById('contactsContainer');
    #onSelect;


    /** @param {(id: string) => void} onSelect - called when a contact card is clicked */
    constructor(onSelect) {
        this.#onSelect = onSelect;
    }


    /**
     * @param {Object<string, { name: string, email: string }>} contacts
     * @param {string|null} activeId - contact to highlight
     */
    render(contacts, activeId) {
        const groups = [...groupByFirstLetter(contacts)].map(([letter, list]) => this.#group(letter, list));
        this.#container.replaceChildren(...groups);
        this.setActive(activeId);
    }


    /** @param {string|null} id - highlights this contact's card, or none */
    setActive(id) {
        this.#container.querySelectorAll('.contact-card.active').forEach((card) => card.classList.remove('active'));
        if (id) document.getElementById(`contact-card-${id}`)?.classList.add('active');
    }


    /**
     * @param {string} letter
     * @param {Array<{ id: string, name: string, email: string }>} contacts
     * @returns {HTMLDivElement} heading, divider and one card per contact
     */
    #group(letter, contacts) {
        const group = document.createElement('div');
        group.className = 'contact-group';
        const heading = Object.assign(document.createElement('h3'), { textContent: letter });
        const divider = Object.assign(document.createElement('hr'), { className: 'contact-group-divider' });
        group.append(heading, divider, ...contacts.map((contact) => this.#card(contact)));
        return group;
    }


    /**
     * @param {{ id: string, name: string, email: string }} contact
     * @returns {HTMLElement} a contact card cloned from the page template
     */
    #card(contact) {
        const card = document.getElementById('contactCardTemplate').content.firstElementChild.cloneNode(true);
        card.id = `contact-card-${contact.id}`;
        card.addEventListener('click', () => this.#onSelect(contact.id));
        card.querySelector('.contact-card-name').textContent = contact.name;
        card.querySelector('.contact-card-email').textContent = contact.email ?? '';
        const avatar = card.querySelector('.contact-avatar');
        avatar.style.background = getAvatarColorForId(contact.id);
        avatar.textContent = getInitials(contact.name);
        return card;
    }
}

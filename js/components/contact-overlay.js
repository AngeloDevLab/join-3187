import { getAvatarColorForId, getInitials } from '../utils/helpers.js';


/**
 * Wires the backdrop-click-to-close, panel-click-stop-propagation and the close/cancel
 * buttons shared by every contact overlay template.
 * @param {DocumentFragment} node
 */
function wireOverlayClose(node) {
    node.querySelector('.contact-overlay-backdrop').addEventListener('click', closeContactOverlay);
    node.querySelector('.contact-overlay').addEventListener('click', (e) => e.stopPropagation());
    node.querySelectorAll('.close-btn, .overlay-cancel-btn').forEach((btn) =>
        btn.addEventListener('click', closeContactOverlay));
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
export function closeContactOverlay() {
    document.getElementById('contactOverlayContainer').innerHTML = '';
}


/**
 * Opens the add-contact overlay and wires its form submit.
 * @param {(event: SubmitEvent) => void} onSubmit
 */
export function openAddContactOverlay(onSubmit) {
    const node = document.getElementById('addContactOverlayTemplate').content.cloneNode(true);
    wireOverlayClose(node);
    node.querySelector('form').addEventListener('submit', onSubmit);
    renderContactOverlay(node);
}


/**
 * Opens the edit overlay for a contact, prefilled with its data.
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 * @param {(event: SubmitEvent) => void} onSubmit
 * @param {() => void} onDelete
 */
export function openEditContactOverlay(contact, onSubmit, onDelete) {
    const node = document.getElementById('editContactOverlayTemplate').content.cloneNode(true);
    wireOverlayClose(node);
    const avatar = node.querySelector('.contact-edit-avatar');
    avatar.style.background = getAvatarColorForId(contact.id);
    avatar.textContent = getInitials(contact.name);
    node.querySelector('.contact-edit-name-input').value = contact.name;
    node.querySelector('.contact-edit-email-input').value = contact.email;
    node.querySelector('.contact-edit-phone-input').value = contact.phone;
    node.querySelector('form').addEventListener('submit', onSubmit);
    node.querySelector('.contact-edit-delete-btn').addEventListener('click', onDelete);
    renderContactOverlay(node);
}


/**
 * Opens the delete confirmation overlay for a contact.
 * @param {{ name: string }} contact
 * @param {() => void} onConfirm
 */
export function openDeleteContactOverlay(contact, onConfirm) {
    const node = document.getElementById('deleteContactOverlayTemplate').content.cloneNode(true);
    wireOverlayClose(node);
    node.querySelector('.contact-delete-message').textContent = `Delete ${contact.name}?`;
    node.querySelector('.contact-delete-confirm-btn').addEventListener('click', onConfirm);
    renderContactOverlay(node);
}

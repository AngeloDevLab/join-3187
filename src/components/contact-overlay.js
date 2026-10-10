import { Modal } from './modal.js';
import { getAvatarColorForId, getInitials } from '../utils/helpers.js';

let activeModal = null;


/** Closes the active contact overlay, if one is open. */
export function closeContactOverlay() {
    activeModal?.close();
    activeModal = null;
}


/**
 * Opens a contact overlay dialog from the given template and wires its close/cancel buttons.
 * @param {string} templateId
 * @returns {HTMLDialogElement}
 */
function openContactModal(templateId) {
    closeContactOverlay();
    const node = document.getElementById(templateId).content.cloneNode(true);
    const modal = new Modal(node, { animation: 'contact' }).open();
    activeModal = modal;
    modal.element.addEventListener('close', () => { if (activeModal === modal) activeModal = null; });
    modal.element.querySelectorAll('.close-btn, .overlay-cancel-btn').forEach((btn) =>
        btn.addEventListener('click', closeContactOverlay));
    return modal.element;
}


/**
 * Opens the add-contact overlay and wires its form submit.
 * @param {(event: SubmitEvent) => void} onSubmit
 */
export function openAddContactOverlay(onSubmit) {
    const dialog = openContactModal('addContactOverlayTemplate');
    dialog.querySelector('form').addEventListener('submit', onSubmit);
}


/**
 * Opens the edit overlay for a contact, prefilled with its data.
 * @param {{ id: string, name: string, email: string, phone: string }} contact
 * @param {(event: SubmitEvent) => void} onSubmit
 * @param {() => void} onDelete
 */
export function openEditContactOverlay(contact, onSubmit, onDelete) {
    const dialog = openContactModal('editContactOverlayTemplate');
    const avatar = dialog.querySelector('.contact-edit-avatar');
    avatar.style.background = getAvatarColorForId(contact.id);
    avatar.textContent = getInitials(contact.name);
    dialog.querySelector('.contact-edit-name-input').value = contact.name;
    dialog.querySelector('.contact-edit-email-input').value = contact.email;
    dialog.querySelector('.contact-edit-phone-input').value = contact.phone;
    dialog.querySelector('form').addEventListener('submit', onSubmit);
    dialog.querySelector('.contact-edit-delete-btn').addEventListener('click', onDelete);
}


/**
 * Opens the delete confirmation overlay for a contact.
 * @param {{ name: string }} contact
 * @param {() => void} onConfirm
 */
export function openDeleteContactOverlay(contact, onConfirm) {
    const dialog = openContactModal('deleteContactOverlayTemplate');
    dialog.querySelector('.contact-delete-message').textContent = `Delete ${contact.name}?`;
    dialog.querySelector('.contact-delete-confirm-btn').addEventListener('click', onConfirm);
}

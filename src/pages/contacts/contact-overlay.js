import { Modal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { getAvatarColorForId, getInitials } from '../../utils/helpers.js';
import { validateField, validateOnBlur, isValidEmail, isValidPhone, restrictToDigits } from '../../utils/form-validation.js';

/** Validation per contact field; the input ids are `<prefix><Key>` (e.g. addContactName). */
const FIELD_RULES = [
    { key: 'name', test: (value) => !!value.trim(), message: 'This field is required' },
    { key: 'email', test: isValidEmail, message: 'Please enter a valid email' },
    { key: 'phone', test: isValidPhone, message: 'Please enter a valid phone number' },
];


/**
 * @typedef {{ key: string, test: (value: string) => boolean, message: string, input: HTMLInputElement, error: HTMLElement }} BoundField
 * @typedef {{ name: string, email: string, phone: string }} ContactValues
 */


/**
 * The add, edit and delete dialogs of the contacts page. Forms are validated
 * here; `onSubmit` receives trimmed values, and the dialog closes only once the
 * returned promise resolved — on failure it stays open with an error toast.
 */
export class ContactOverlay {
    #modal = null;


    /** @param {(values: ContactValues) => Promise<void>} onSubmit */
    openAdd(onSubmit) {
        const dialog = this.#open('addContactOverlayTemplate');
        this.#wireForm(dialog, 'addContact', onSubmit);
    }


    /**
     * @param {{ id: string, name: string, email: string, phone: string }} contact
     * @param {(values: ContactValues) => Promise<void>} onSubmit
     * @param {() => void} onDelete
     */
    openEdit(contact, onSubmit, onDelete) {
        const dialog = this.#open('editContactOverlayTemplate');
        const avatar = dialog.querySelector('.contact-edit-avatar');
        avatar.style.background = getAvatarColorForId(contact.id);
        avatar.textContent = getInitials(contact.name);
        const fields = this.#wireForm(dialog, 'editContact', onSubmit);
        fields.forEach((field) => { field.input.value = contact[field.key] ?? ''; });
        dialog.querySelector('.contact-edit-delete-btn').addEventListener('click', onDelete);
    }


    /**
     * @param {{ name: string }} contact
     * @param {() => Promise<void>} onConfirm
     */
    openDelete(contact, onConfirm) {
        const dialog = this.#open('deleteContactOverlayTemplate');
        dialog.querySelector('.contact-delete-message').textContent = `Delete ${contact.name}?`;
        const button = dialog.querySelector('.contact-delete-confirm-btn');
        button.addEventListener('click', () => this.#run(button, onConfirm, 'Could not delete the contact. Please try again.'));
    }


    /** Closes the open dialog, if any. */
    close() {
        this.#modal?.close();
        this.#modal = null;
    }


    /**
     * Opens a dialog from a template (closing any other) and wires its close/cancel buttons.
     * @param {string} templateId
     * @returns {HTMLDialogElement}
     */
    #open(templateId) {
        this.close();
        const node = document.getElementById(templateId).content.cloneNode(true);
        this.#modal = new Modal(node, { animation: 'contact' }).open();
        this.#modal.element.querySelectorAll('.close-btn, .overlay-cancel-btn').forEach((btn) =>
            btn.addEventListener('click', () => this.close()));
        return this.#modal.element;
    }


    /**
     * Binds the validation rules to the dialog's inputs and wires blur validation and submit.
     * @param {HTMLDialogElement} dialog
     * @param {'addContact'|'editContact'} prefix
     * @param {(values: ContactValues) => Promise<void>} onSubmit
     * @returns {BoundField[]}
     */
    #wireForm(dialog, prefix, onSubmit) {
        const fields = FIELD_RULES.map((rule) => {
            const id = `${prefix}${rule.key[0].toUpperCase()}${rule.key.slice(1)}`;
            return { ...rule, input: dialog.querySelector(`#${id}`), error: dialog.querySelector(`#${id}Error`) };
        });
        fields.forEach((f) => validateOnBlur(f.input, f.error, () => f.test(f.input.value), f.message));
        restrictToDigits(fields.find((f) => f.key === 'phone').input);
        const form = dialog.querySelector('form');
        form.addEventListener('submit', (e) => this.#submit(e, form, fields, onSubmit));
        return fields;
    }


    /**
     * @param {SubmitEvent} e
     * @param {HTMLFormElement} form
     * @param {BoundField[]} fields
     * @param {(values: ContactValues) => Promise<void>} onSubmit
     */
    #submit(e, form, fields, onSubmit) {
        e.preventDefault();
        const valid = fields.map((f) => validateField(f.input, f.error, f.test(f.input.value), f.message)).every(Boolean);
        if (!valid) return;
        const values = Object.fromEntries(fields.map((f) => [f.key, f.input.value.trim()]));
        this.#run(form.querySelector('[type="submit"]'), () => onSubmit(values), 'Could not save the contact. Please try again.');
    }


    /**
     * Runs an action with its button disabled (no double submits); closes on
     * success, keeps the dialog open and shows `errorMessage` on failure.
     * @param {HTMLButtonElement} button
     * @param {() => Promise<void>} action
     * @param {string} errorMessage
     */
    async #run(button, action, errorMessage) {
        if (button.disabled) return;
        button.disabled = true;
        try {
            await action();
            this.close();
        } catch (err) {
            console.error(errorMessage, err);
            showToast(errorMessage);
        } finally {
            button.disabled = false;
        }
    }
}

import { validateField, validateOnBlur, isValidEmail } from '../utils/form-validation.js';


/**
 * Collects the add-contact form's input/error element pairs.
 * @returns {{nameInput: HTMLInputElement, nameError: HTMLElement, emailInput: HTMLInputElement, emailError: HTMLElement, phoneInput: HTMLInputElement, phoneError: HTMLElement}}
 */
export function getAddContactFields() {
    return {
        nameInput: document.getElementById('addContactName'),
        nameError: document.getElementById('addContactNameError'),
        emailInput: document.getElementById('addContactEmail'),
        emailError: document.getElementById('addContactEmailError'),
        phoneInput: document.getElementById('addContactPhone'),
        phoneError: document.getElementById('addContactPhoneError'),
    };
}


/**
 * Collects the edit-contact form's input/error element pairs.
 * @returns {{nameInput: HTMLInputElement, nameError: HTMLElement, emailInput: HTMLInputElement, emailError: HTMLElement, phoneInput: HTMLInputElement, phoneError: HTMLElement}}
 */
export function getEditContactFields() {
    return {
        nameInput: document.getElementById('editContactName'),
        nameError: document.getElementById('editContactNameError'),
        emailInput: document.getElementById('editContactEmail'),
        emailError: document.getElementById('editContactEmailError'),
        phoneInput: document.getElementById('editContactPhone'),
        phoneError: document.getElementById('editContactPhoneError'),
    };
}


/**
 * Validates name/email/phone fields, showing inline errors for any that fail.
 * @param {ReturnType<typeof getAddContactFields>} fields
 * @returns {boolean}
 */
export function validateContactFields(fields) {
    const { nameInput, nameError, emailInput, emailError, phoneInput, phoneError } = fields;
    return [
        validateField(nameInput, nameError, !!nameInput.value.trim(), 'This field is required'),
        validateField(emailInput, emailError, isValidEmail(emailInput.value), 'Please enter a valid email'),
        validateField(phoneInput, phoneError, !!phoneInput.value.trim(), 'This field is required'),
    ].every(Boolean);
}


/**
 * Validates each field as soon as focus leaves it, ahead of submit.
 * @param {ReturnType<typeof getAddContactFields>} fields
 */
export function wireContactFormBlur(fields) {
    validateOnBlur(fields.nameInput, fields.nameError, () => !!fields.nameInput.value.trim(), 'This field is required');
    validateOnBlur(fields.emailInput, fields.emailError, () => isValidEmail(fields.emailInput.value), 'Please enter a valid email');
    validateOnBlur(fields.phoneInput, fields.phoneError, () => !!fields.phoneInput.value.trim(), 'This field is required');
}

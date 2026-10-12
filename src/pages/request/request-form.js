import { validateField, isValidEmail } from '../../utils/form-validation.js';

/** One rule per field: input/error element ids, the check and the error message. */
const RULES = [
    { key: 'name', input: 'requestName', error: 'requestNameError', valid: (f) => !!f.name.value.trim(), message: 'Please enter your name.' },
    { key: 'email', input: 'requestEmail', error: 'requestEmailError', valid: (f) => isValidEmail(f.email.value), message: 'Please enter a valid email address.' },
    { key: 'subject', input: 'requestSubject', error: 'requestSubjectError', valid: (f) => !!f.subject.value.trim(), message: 'Please enter a subject.' },
    { key: 'message', input: 'requestMessage', error: 'requestMessageError', valid: (f) => !!f.message.value.trim(), message: 'Please describe your request.' },
];


/**
 * The stakeholder request form. Each field is validated on blur and on submit;
 * the submit button is dimmed until every rule passes.
 */
export class RequestForm {
    #form = document.getElementById('requestForm');
    #submitButton = this.#form.querySelector('[type="submit"]');
    #inputs = Object.fromEntries(RULES.map((rule) => [rule.key, document.getElementById(rule.input)]));
    #onSubmit;


    /** @param {(values: {name: string, email: string, subject: string, message: string}) => void} onSubmit - gets the trimmed values once all fields are valid */
    constructor(onSubmit) {
        this.#onSubmit = onSubmit;
        RULES.forEach((rule) => this.#wireField(rule));
        this.#form.addEventListener('submit', (e) => this.#submit(e));
        this.#updateSubmitState();
    }


    /** @param {typeof RULES[number]} rule - live button state on input, validation on blur */
    #wireField(rule) {
        const input = this.#inputs[rule.key];
        input.addEventListener('input', () => this.#updateSubmitState());
        input.addEventListener('blur', () => this.#check(rule));
    }


    /**
     * @param {typeof RULES[number]} rule
     * @returns {boolean} true if the field is valid; shows or clears its error
     */
    #check(rule) {
        return validateField(this.#inputs[rule.key], document.getElementById(rule.error), rule.valid(this.#inputs), rule.message);
    }


    /** Dims (but does not disable) the button until all rules pass, so a click still shows the errors. */
    #updateSubmitState() {
        this.#submitButton.classList.toggle('btn-pending', !RULES.every((rule) => rule.valid(this.#inputs)));
    }


    /** @param {SubmitEvent} e - validates every field, then hands the values to onSubmit */
    #submit(e) {
        e.preventDefault();
        if (!RULES.map((rule) => this.#check(rule)).every(Boolean)) return;
        const values = Object.fromEntries(RULES.map((rule) => [rule.key, this.#inputs[rule.key].value.trim()]));
        this.#onSubmit(values);
    }
}

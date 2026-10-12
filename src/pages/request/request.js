import { showToast } from '../../components/toast.js';
import { RequestForm } from './request-form.js';


/**
 * The stakeholder request page: switches between the info view (usage and
 * how it works) and the request form.
 */
class RequestPage {
    #info = document.getElementById('requestInfo');
    #formView = document.getElementById('requestFormView');


    /** Wires the buttons that switch between the info view and the form. */
    init() {
        document.getElementById('openRequestFormBtn').addEventListener('click', () => this.#show('form'));
        document.getElementById('backToInfoBtn').addEventListener('click', () => this.#show('info'));
        new RequestForm(() => this.#send());
    }


    /** @param {'info'|'form'} view - shows that view and hides the other */
    #show(view) {
        this.#info.classList.toggle('is-hidden', view !== 'info');
        this.#formView.classList.toggle('is-hidden', view !== 'form');
        window.scrollTo(0, 0);
    }


    /** Placeholder until the n8n webhook exists: the form is valid, but nothing is sent yet. */
    #send() {
        showToast('Sending requests is not connected yet.');
    }
}


new RequestPage().init();

import { showToast } from '../../components/toast.js';
import { sendRequest } from '../../services/request-service.js';
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
        new RequestForm((values) => this.#send(values));
    }


    /** @param {'info'|'form'} view - shows that view and hides the other */
    #show(view) {
        this.#info.classList.toggle('is-hidden', view !== 'info');
        this.#formView.classList.toggle('is-hidden', view !== 'form');
        window.scrollTo(0, 0);
    }


    /**
     * Sends the request to n8n and returns to the info view on success.
     * @param {{ name: string, email: string, subject: string, message: string }} values
     * @returns {Promise<boolean>} true once n8n accepted it, so the form clears itself
     */
    async #send(values) {
        try {
            await sendRequest(values);
            this.#show('info');
            showToast('Your request has been sent');
            return true;
        } catch {
            showToast('Your request could not be sent. Please try again.', 2500);
            return false;
        }
    }
}


new RequestPage().init();

/** n8n webhook that mails stakeholder requests to the Join inbox — local n8n until it runs on the server. */
const REQUEST_WEBHOOK_URL = 'http://localhost:5678/webhook/join-request';


/**
 * Sends a stakeholder request to n8n, which forwards it to the Join inbox,
 * where the Issue Collector workflow turns it into a ticket.
 * @param {{ name: string, email: string, subject: string, message: string }} values
 * @returns {Promise<void>} rejects when n8n is unreachable or refuses the request
 */
export async function sendRequest(values) {
    const response = await fetch(REQUEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error(`Request webhook answered ${response.status}`);
}

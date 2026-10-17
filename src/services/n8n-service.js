/** Base URL of the n8n webhooks on the Hetzner server. */
const N8N_WEBHOOK_URL = 'https://n8n.angelodevelopment.de/webhook';


/**
 * POSTs JSON to one n8n webhook.
 * @param {string} path - webhook path, e.g. 'join-request'
 * @param {Object} body
 * @returns {Promise<void>} rejects when n8n is unreachable or refuses the request
 */
async function postToWebhook(path, body) {
    const response = await fetch(`${N8N_WEBHOOK_URL}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
    });
    if (!response.ok) throw new Error(`n8n webhook ${path} answered ${response.status}`);
}


/**
 * Sends a stakeholder request to n8n, which forwards it to the Join inbox,
 * where the Issue Collector workflow turns it into a ticket.
 * @param {{ name: string, email: string, subject: string, message: string }} values
 * @returns {Promise<void>} rejects when n8n is unreachable or refuses the request
 */
export function sendRequest(values) {
    return postToWebhook('join-request', values);
}


/**
 * Tells n8n that a stakeholder's task changed columns. n8n waits a few minutes,
 * re-reads the task and only goes on if `movedAt` still matches, i.e. no later
 * move happened, so dragging back and forth sends at most one mail. Failures
 * are only logged, since the move itself is already saved.
 * @param {string} taskId
 * @param {number} movedAt - the timestamp written with this move
 */
export function notifyColumnChange(taskId, movedAt) {
    postToWebhook('join-column-change', { taskId, movedAt })
        .catch((err) => console.error('Could not notify n8n about the column change:', err));
}

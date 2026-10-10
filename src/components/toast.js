import { Modal } from './modal.js';

/**
 * Shows a centered toast that flies in from below. Blocks background clicks while visible.
 * @param {string} message
 * @param {number} [duration=1500]
 */
export function showToast(message, duration = 1500) {
    new Modal(message, { animation: 'bottom' }).open(duration);
}

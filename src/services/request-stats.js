import { ref, onValue } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';
import { db } from './firebase.js';

/** Daily cap enforced by the n8n Issue Collector workflow. */
export const DAILY_REQUEST_LIMIT = 10;


/**
 * Today's key in `requestStats/` — n8n counts per day in Berlin time, so the page must too.
 * @returns {string} e.g. "2026-10-13"
 */
function todayInBerlin() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}


/**
 * Calls `callback` with the number of tickets n8n created from requests today,
 * once and again after every change. Readable without login (see database.rules.json).
 * If the count can't be loaded, it falls back to 0 so the page still shows up.
 * @param {(count: number) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeTodayCount(callback) {
    return onValue(ref(db, `requestStats/${todayInBerlin()}/count`),
        (snapshot) => callback(snapshot.val() ?? 0),
        (err) => { console.error('Could not load the request count:', err); callback(0); });
}

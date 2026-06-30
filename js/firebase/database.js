import { DB_URL } from './config.js';

/**
 * Throws a descriptive error if a Firebase response was not successful,
 * so failed requests surface clearly instead of failing silently or
 * crashing later with a confusing JSON-parse error.
 * @param {Response} res
 * @param {string} action
 */
function assertOk(res, action) {
    if (!res.ok) throw new Error(`Firebase request failed (${action}): ${res.status} ${res.statusText}`);
}

/**
 * Fetches all entries from a collection. Returns null if the collection is empty.
 * @param {string} collection
 * @returns {Promise<Object|null>}
 */
export async function getAll(collection) {
    const res = await fetch(`${DB_URL}/${collection}.json`);
    assertOk(res, `getAll ${collection}`);
    return res.json();
}

/**
 * Creates a new entry in a collection and returns the Firebase-generated ID.
 * @param {string} collection
 * @param {Object} data
 * @returns {Promise<string>} Firebase-generated ID
 */
export async function create(collection, data) {
    const res = await fetch(`${DB_URL}/${collection}.json`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    assertOk(res, `create ${collection}`);
    const { name: id } = await res.json();
    return id;
}

/**
 * Partially updates an existing entry in a collection (PATCH — merges fields).
 * @param {string} collection
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<void>}
 */
export async function update(collection, id, data) {
    const res = await fetch(`${DB_URL}/${collection}/${id}.json`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    assertOk(res, `update ${collection}/${id}`);
}

/**
 * Deletes a single entry from a collection by ID.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(collection, id) {
    const res = await fetch(`${DB_URL}/${collection}/${id}.json`, { method: 'DELETE' });
    assertOk(res, `remove ${collection}/${id}`);
}

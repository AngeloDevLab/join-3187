import { DB_URL } from './config.js';

/**
 * Fetches all entries from a collection. Returns null if the collection is empty.
 * @param {string} collection
 * @returns {Promise<Object|null>}
 */
export async function getAll(collection) {
    const res = await fetch(`${DB_URL}/${collection}.json`);
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
    await fetch(`${DB_URL}/${collection}/${id}.json`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

/**
 * Deletes a single entry from a collection by ID.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(collection, id) {
    await fetch(`${DB_URL}/${collection}/${id}.json`, { method: 'DELETE' });
}

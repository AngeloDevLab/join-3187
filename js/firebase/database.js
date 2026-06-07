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
 * Deletes a single entry from a collection by ID.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(collection, id) {
  await fetch(`${DB_URL}/${collection}/${id}.json`, { method: 'DELETE' });
}

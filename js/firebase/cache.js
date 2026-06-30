import { getAll, create, update, remove } from './database.js';

const memory = {};

/**
 * Reads from memory → Firebase (in that order).
 * Populates the memory layer on a cache miss.
 * @param {string} key  Firebase collection name
 * @returns {Promise<Object|null>}
 */
async function cached(key) {
    if (key in memory) return memory[key];
    const data = await getAll(key);
    memory[key] = data;
    return data;
}

/**
 * Adds a new entry to cache without refetching Firebase.
 * @param {string} key @param {string} id @param {Object} data
 */
function addToCache(key, id, data) {
    if (!(key in memory)) return;
    if (memory[key] === null) memory[key] = {};
    memory[key][id] = data;
}

/**
 * Removes an entry from cache without refetching Firebase.
 * @param {string} key @param {string} id
 */
function removeFromCache(key, id) {
    if (!(key in memory) || memory[key] === null) return;
    delete memory[key][id];
}

/**
 * Merges partial data into an existing cache entry without refetching Firebase.
 * @param {string} key @param {string} id @param {Object} data
 */
function updateInCache(key, id, data) {
    if (!(key in memory)) return;
    if (memory[key] === null) memory[key] = {};
    memory[key][id] = { ...memory[key][id], ...data };
}


/** @returns {Promise<Object|null>} */
export const getTasks    = () => cached('tasks');
/** @returns {Promise<Object|null>} */
export const getContacts = () => cached('contacts');
/** @returns {Promise<Object|null>} */
export const getUsers    = () => cached('users');


/**
 * Persists a new task and updates the cache.
 * @param {Object} data
 * @returns {Promise<string>} Firebase-generated ID
 */
export async function saveTask(data) {
    const id = await create('tasks', data);
    addToCache('tasks', id, data);
    return id;
}


/**
 * Partially updates a task in Firebase and syncs the cache.
 * @param {string} id @param {Object} data
 */
export async function updateTask(id, data) {
    await update('tasks', id, data);
    updateInCache('tasks', id, data);
}


/** @param {string} id */
export async function removeTask(id) {
    await remove('tasks', id);
    removeFromCache('tasks', id);
}


/**
 * Persists a new contact and updates the cache.
 * @param {Object} data
 * @returns {Promise<string>} Firebase-generated ID
 */
export async function saveContact(data) {
    const id = await create('contacts', data);
    addToCache('contacts', id, data);
    return id;
}


/**
 * Partially updates a contact in Firebase and syncs the cache.
 * @param {string} id @param {Object} data
 */
export async function updateContact(id, data) {
    await update('contacts', id, data);
    updateInCache('contacts', id, data);
}


/** @param {string} id */
export async function removeContact(id) {
    await remove('contacts', id);
    removeFromCache('contacts', id);
}

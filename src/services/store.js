import {
    ref,
    child,
    onValue,
    push,
    update as dbUpdate,
    remove as dbRemove,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';
import { db } from './firebase.js';


/**
 * Base class for one Realtime Database collection (e.g. "tasks").
 * Keeps a live copy of the collection through a single onValue listener,
 * started lazily on first use, and notifies subscribers on every change —
 * including changes made by other users or by external automations (n8n).
 */
export class Store {
    #ref;
    #data = {};
    #hasData = false;
    #loaded = null;
    #subscribers = new Set();


    /** @param {string} path - collection path in the database, e.g. 'tasks' */
    constructor(path) {
        this.#ref = ref(db, path);
    }


    /**
     * Starts the realtime listener once and resolves after the first snapshot.
     * @returns {Promise<void>}
     */
    #listen() {
        this.#loaded ??= new Promise((resolve, reject) => {
            onValue(this.#ref, (snapshot) => {
                this.#data = snapshot.val() ?? {};
                this.#hasData = true;
                resolve();
                this.#subscribers.forEach((callback) => callback(this.#data));
            }, reject);
        });
        return this.#loaded;
    }


    /**
     * @returns {Promise<Object<string, Object>>} all entries keyed by their id
     */
    async getAll() {
        await this.#listen();
        return this.#data;
    }


    /**
     * @param {string} id
     * @returns {Promise<Object|undefined>}
     */
    async getById(id) {
        await this.#listen();
        return this.#data[id];
    }


    /**
     * Calls `callback` with all entries once they are loaded and again after every change.
     * @param {(entries: Object<string, Object>) => void} callback
     * @returns {() => void} unsubscribe function
     */
    subscribe(callback) {
        this.#subscribers.add(callback);
        if (this.#hasData) callback(this.#data);
        else this.#listen().catch((err) => console.error(`Could not load ${this.#ref.key}:`, err));
        return () => this.#subscribers.delete(callback);
    }


    /**
     * Creates a new entry with a Firebase-generated id.
     * @param {Object} data
     * @returns {Promise<string>} the new id
     */
    async add(data) {
        const newRef = push(this.#ref, data);
        await newRef;
        return newRef.key;
    }


    /**
     * Merges the given fields into an existing entry.
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<void>}
     */
    async update(id, data) {
        await dbUpdate(child(this.#ref, id), data);
    }


    /**
     * Deletes an entry.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        await dbRemove(child(this.#ref, id));
    }
}

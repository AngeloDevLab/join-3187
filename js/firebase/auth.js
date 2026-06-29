import { getAll, create } from './database.js';

/** @returns {string} First letter of each word, max 2 chars — e.g. "Max Mustermann" → "MM" */
function deriveInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('').slice(0, 2);
}

/**
 * Persists the current user to sessionStorage.
 * @param {{ id: string, name: string, initials: string, email?: string }} user
 */
function setSession(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

/**
 * Returns the current user from sessionStorage, or null if not logged in.
 * @returns {{ id: string, name: string, initials: string, email?: string }|null}
 */
export function getCurrentUser() {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}

/** Removes the current user from sessionStorage. */
export function clearSession() {
    sessionStorage.removeItem('currentUser');
}

/**
 * Searches all users in the DB for a matching email. Returns null if not found.
 * @param {string} email
 * @returns {Promise<{id: string, name: string, email: string, initials: string}|null>}
 */
async function findUserByEmail(email) {
    const users = await getAll('users');
    if (!users) return null;
    return Object.entries(users)
        .map(([id, data]) => ({ id, ...data }))
        .find(u => u.email === email) ?? null;
}

/**
 * Finds the user by email and stores them in the session.
 * Throws if no account exists for that email.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function loginUser(email) {
    const user = await findUserByEmail(email);
    if (!user) throw new Error('No account found. Please sign up.');
    setSession({ id: user.id, name: user.name, initials: user.initials, email: user.email });
}

/**
 * Creates a new user entry in the DB and stores them in the session.
 * Throws if the email is already registered.
 * @param {string} name
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function registerUser(name, email) {
    const existing = await findUserByEmail(email);
    if (existing) throw new Error('Already registered. Please log in.');
    const initials = deriveInitials(name);
    const id = await create('users', { name, email, initials });
    setSession({ id, name, initials, email });
}

/** Sets a local-only guest session — no DB entry created. */
export function loginAsGuest() {
    setSession({ id: 'guest', name: 'Guest', initials: 'G' });
}

/**
 * Clears the session. Caller handles redirect so the intro animation
 * replays naturally on index.html load.
 * @returns {void}
 */
export function logoutUser() {
    clearSession();
}

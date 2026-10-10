import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signOut,
    updateProfile,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { auth } from './firebase.js';
import { contactStore } from './contact-store.js';
import { getInitials } from '../utils/helpers.js';

const SIGNUP_ERRORS = {
    'auth/email-already-in-use': 'Already registered. Please log in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Please choose a stronger password.',
};
const SIGNUP_FALLBACK_ERROR = 'Sign up failed. Please try again.';


/**
 * @typedef {Object} AppUser
 * @property {string} id - Firebase Auth uid
 * @property {string} name
 * @property {string} initials
 * @property {string|null} email - null for guests
 * @property {boolean} isGuest
 */


/**
 * Wraps Firebase Authentication: login, signup, guest login, logout and
 * access to the current user in the shape the app works with.
 */
export class AuthService {
    #auth;
    #firstAuthState;


    /**
     * @param {import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js').Auth} firebaseAuth
     */
    constructor(firebaseAuth) {
        this.#auth = firebaseAuth;
        this.#firstAuthState = new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }


    /**
     * Resolves once Firebase has restored any existing session for this tab.
     * @returns {Promise<boolean>} true if a user (registered or guest) is logged in
     */
    async ready() {
        return !!(await this.#firstAuthState);
    }


    /**
     * The logged-in user, or null. Only reliable after {@link AuthService#ready} resolved.
     * @returns {AppUser|null}
     */
    get currentUser() {
        const user = this.#auth.currentUser;
        if (!user) return null;
        if (user.isAnonymous) return { id: user.uid, name: 'Guest', initials: 'G', email: null, isGuest: true };
        const name = user.displayName || user.email;
        return { id: user.uid, name, initials: getInitials(name), email: user.email, isGuest: false };
    }


    /**
     * Logs a registered user in. Rejects on wrong credentials; callers show one
     * unspecific message so a failed attempt never reveals which field was wrong.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<void>}
     */
    async login(email, password) {
        await signInWithEmailAndPassword(this.#auth, email.trim(), password);
    }


    /**
     * Creates an account with a display name and a matching contact, then logs
     * out again so the user explicitly logs in afterwards.
     * @param {string} name
     * @param {string} email
     * @param {string} password
     * @returns {Promise<void>} rejects with a user-facing error message
     */
    async register(name, email, password) {
        try {
            const { user } = await createUserWithEmailAndPassword(this.#auth, email.trim(), password);
            await updateProfile(user, { displayName: name.trim() });
            await contactStore.add({ name: name.trim(), email: email.trim(), phone: '' });
            await signOut(this.#auth);
        } catch (err) {
            throw new Error(SIGNUP_ERRORS[err.code] ?? SIGNUP_FALLBACK_ERROR);
        }
    }


    /**
     * Logs in as a guest via an anonymous Firebase account.
     * @returns {Promise<void>}
     */
    async loginAsGuest() {
        await signInAnonymously(this.#auth);
    }


    /**
     * Logs the current user out.
     * @returns {Promise<void>}
     */
    async logout() {
        await signOut(this.#auth);
    }
}


/** Shared instance used by every page. */
export const authService = new AuthService(auth);

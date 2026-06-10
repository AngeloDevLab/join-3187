import { getCurrentUser } from '../firebase/auth.js';

/**
 * Redirects to the login page if no user session exists.
 * Import this module at the top of every protected page.
 */
if (!getCurrentUser()) {
    window.location.href = '../index.html';
}

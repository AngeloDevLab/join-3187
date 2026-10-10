import { getCurrentUser } from '../services/auth.js';
import { pageUrl } from './paths.js';

/**
 * Redirects to the login page if no user session exists.
 * Import this module at the top of every protected page.
 */
if (!getCurrentUser()) {
    window.location.href = pageUrl('login');
}

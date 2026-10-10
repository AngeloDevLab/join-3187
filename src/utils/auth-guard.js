import { authService } from '../services/auth-service.js';
import { pageUrl } from './paths.js';

/*
 * Import this module first in every protected page script. Its top-level await
 * holds the page script back until Firebase has restored the session; without a
 * logged-in user it redirects to the login page and never resolves, so the page
 * script does not run at all.
 */
if (!(await authService.ready())) {
    window.location.replace(pageUrl('login'));
    await new Promise(() => {});
}

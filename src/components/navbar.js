import { authService } from '../services/auth-service.js';
import { Dropdown } from './dropdown.js';
import { pageUrl } from '../utils/paths.js';


/**
 * Highlights the link whose data-page matches the current page: the parent
 * nav-item for main nav-links, or the link itself for nav-legal links.
 * @param {HTMLElement} sidebar
 */
function setActiveLink(sidebar) {
    const path = window.location.pathname;
    sidebar.querySelectorAll('[data-page]').forEach((a) => {
        const isActive = path.endsWith(a.dataset.page);
        const target = a.classList.contains('nav-link') ? a.parentElement : a;
        target.classList.toggle('active', isActive);
    });
}


/** Fills the header avatar button with the current user's initials. */
function initHeaderAvatar() {
    const btn = document.getElementById('headerAvatarBtn');
    if (btn) btn.textContent = authService.currentUser?.initials ?? '?';
}


/** Wires the header avatar to toggle the user dropdown; any entry click closes it again. */
function initHeaderDropdown() {
    const btn = document.getElementById('headerAvatarBtn');
    const nav = document.getElementById('headerDropdown');
    if (!btn || !nav) return;
    const dropdown = new Dropdown(nav, btn);
    btn.addEventListener('click', () => dropdown.toggle());
    nav.querySelectorAll('a, button').forEach((el) => el.addEventListener('click', () => dropdown.close()));
}


/** Logs the user out and redirects to login. */
function initLogoutBtn() {
    document.getElementById('headerLogoutBtn')?.addEventListener('click', async () => {
        await authService.logout();
        window.location.href = pageUrl('login');
    });
}


/** Activates active-link highlighting, header avatar, dropdown and logout for the static sidebar/header markup. */
export function initNavbar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) setActiveLink(sidebar);
    initHeaderAvatar();
    initHeaderDropdown();
    initLogoutBtn();
}

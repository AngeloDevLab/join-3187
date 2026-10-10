import { getCurrentUser, logoutUser } from '../services/auth.js';
import { toggleDropdown, initDropdownAutoClose } from './task-category-dropdown.js';
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
    if (btn) btn.textContent = getCurrentUser()?.initials ?? '?';
}


/** Toggles the user dropdown open/closed, using the shared dropdown pattern. */
function initHeaderDropdown() {
    const btn = document.getElementById('headerAvatarBtn');
    const nav = document.getElementById('headerDropdown');
    if (!btn || !nav) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown({ dropdown: nav, trigger: btn }, !nav.classList.contains('is-open'));
    });
    nav.querySelectorAll('a, button').forEach((el) =>
        el.addEventListener('click', () => toggleDropdown({ dropdown: nav, trigger: btn }, false)));
}


/** Clears session and redirects to login. */
function initLogoutBtn() {
    document.getElementById('headerLogoutBtn')?.addEventListener('click', () => {
        logoutUser();
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
    initDropdownAutoClose();
}

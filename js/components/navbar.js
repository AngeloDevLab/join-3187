import { getCurrentUser, logoutUser } from '../firebase/auth.js';


/**
 * Highlights the nav-item whose link matches the current page.
 * @param {HTMLElement} sidebar
 */
function setActiveLink(sidebar) {
    const path = window.location.pathname;
    sidebar.querySelectorAll('.nav-link').forEach((a) => {
        a.parentElement.classList.toggle('active', path.endsWith(a.dataset.page));
    });
}


/** Fills the header avatar button with the current user's initials. */
function initHeaderAvatar() {
    const btn = document.getElementById('headerAvatarBtn');
    if (btn) btn.textContent = getCurrentUser()?.initials ?? '?';
}


/** Toggles the user dropdown open/closed. */
function initHeaderDropdown() {
    const btn = document.getElementById('headerAvatarBtn');
    const nav = document.getElementById('headerDropdown');
    if (!btn || !nav) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); nav.classList.toggle('open'); });
    document.addEventListener('click', () => nav.classList.remove('open'));
}


/** Clears session and redirects to login. */
function initLogoutBtn() {
    document.getElementById('headerLogoutBtn')?.addEventListener('click', () => {
        logoutUser();
        window.location.href = '../index.html';
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

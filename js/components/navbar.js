import { getCurrentUser, logoutUser } from '../firebase/auth.js';

const ROOT = new URL('../../', import.meta.url).href;

/** @param {string} name @returns {string} */
const icon = (name) => `${ROOT}assets/icons/${name}`;

const NAV_ITEMS = [
    { page: 'summary.html', src: 'summary.svg', label: 'Summary' },
    { page: 'add-task.html', src: 'edit_square.svg', label: 'Add Task' },
    { page: 'board.html', src: 'board.svg', label: 'Board' },
    { page: 'contacts.html', src: 'contact.svg', label: 'Contacts' },
];

/** @returns {string} */
function navItemsHTML() {
    return NAV_ITEMS.map(({ page, src, label }) =>
        `<li class="nav-item"><a href="${ROOT}pages/${page}" class="nav-link" data-page="${page}">` +
        `<img src="${icon(src)}" class="nav-icon" alt="">${label}</a></li>`
    ).join('');
}

/** @returns {string} */
function sidebarHTML() {
    return `<img src="${icon('join_logo.svg')}" alt="Join" class="nav-logo">`
        + `<ul class="nav-list">${navItemsHTML()}</ul>`
        + `<div class="nav-legal">`
        + `<a href="${ROOT}pages/privacy.html">Privacy Policy</a>`
        + `<a href="${ROOT}pages/imprint.html">Imprint</a>`
        + `</div>`;
}

/**
 * Sets the active class on the nav item matching the current page.
 * @param {HTMLElement} sidebar
 */
function setActiveLink(sidebar) {
    const path = window.location.pathname;
    sidebar.querySelectorAll('.nav-link').forEach((a) => {
        a.parentElement.classList.toggle('active', path.endsWith(a.dataset.page));
    });
}

/** @returns {string} */
function dropdownLinksHTML() {
    return `<li class="header-help-mobile"><a href="${ROOT}pages/help.html">Help</a></li>`
        + `<li><a href="${ROOT}pages/imprint.html">Legal Notice</a></li>`
        + `<li><a href="${ROOT}pages/privacy.html">Privacy Policy</a></li>`
        + `<li><button type="button" id="headerLogoutBtn">Logout</button></li>`;
}

/** @returns {string} */
function headerHTML() {
    const initials = getCurrentUser()?.initials ?? '?';
    return `<img src="${icon('favicon.svg')}" alt="Join" class="header-logo-mobile">`
        + `<p class="header-tagline">Kanban Project Management Tool</p>`
        + `<div class="header-user">`
        + `<a href="${ROOT}pages/help.html" class="header-help"><img src="${icon('help.svg')}" alt="Help"></a>`
        + `<button type="button" class="header-avatar" id="headerAvatarBtn">${initials}</button>`
        + `<nav class="header-dropdown" id="headerDropdown"><ul>${dropdownLinksHTML()}</ul></nav>`
        + `</div>`;
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
        window.location.href = `${ROOT}index.html`;
    });
}

/**
 * Renders sidebar and header into their placeholder elements.
 * @param {{ sidebarId?: string, headerId?: string }} [opts]
 */
export function initNavbar({ sidebarId = 'app-sidebar', headerId = 'app-header' } = {}) {
    const sidebar = document.getElementById(sidebarId);
    const header = document.getElementById(headerId);
    if (sidebar) { sidebar.innerHTML = sidebarHTML(); setActiveLink(sidebar); }
    if (header) { header.innerHTML = headerHTML(); initHeaderDropdown(); initLogoutBtn(); }
}

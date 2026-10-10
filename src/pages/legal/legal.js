import { initNavbar } from '../../components/navbar.js';
import { authService } from '../../services/auth-service.js';
import { escapeHtml } from '../../utils/helpers.js';
import { iconUrl } from '../../utils/paths.js';


/** Fills the header user bar and nav list based on whether a user is logged in. */
function updateNavForAuthStatus() {
    const user = authService.currentUser;
    const navList = document.querySelector('.nav-list');
    const userBar = document.querySelector('.header-user');
    userBar.innerHTML = user ? getUserBarHTML(user) : '';
    navList.innerHTML = getNavListHTML(!!user);
    navList.style.visibility = 'visible';
    userBar.style.visibility = 'visible';
}


/**
 * Returns the header user bar HTML: help link, avatar button and dropdown menu.
 * @param {{ initials: string }} user
 * @returns {string}
 */
function getUserBarHTML(user) {
    return `<a href="../help/help.html" class="header-help"><img src="${iconUrl('help.svg')}" alt="Help"></a>
        <button type="button" class="header-avatar" id="headerAvatarBtn">${escapeHtml(user.initials)}</button>
        <nav class="header-dropdown popup-menu dropdown" id="headerDropdown">
            <ul>
                <li class="header-help-mobile"><a href="../help/help.html">Help</a></li>
                <li><a href="../legal/imprint.html">Legal Notice</a></li>
                <li><a href="../legal/privacy.html">Privacy Policy</a></li>
                <li><button type="button" id="headerLogoutBtn">Logout</button></li>
            </ul>
        </nav>`;
}


/**
 * Returns the sidebar nav list HTML for either the logged-in or logged-out state.
 * @param {boolean} isLoggedIn
 * @returns {string}
 */
function getNavListHTML(isLoggedIn) {
    return isLoggedIn
        ? `<li class="nav-item"><a href="../summary/summary.html" class="nav-link" data-page="summary.html"><img src="${iconUrl('summary.svg')}" class="nav-icon" alt="">Summary</a></li>
           <li class="nav-item"><a href="../add-task/add-task.html" class="nav-link" data-page="add-task.html"><img src="${iconUrl('edit_square.svg')}" class="nav-icon" alt="">Add Task</a></li>
           <li class="nav-item"><a href="../board/board.html" class="nav-link" data-page="board.html"><img src="${iconUrl('board.svg')}" class="nav-icon" alt="">Board</a></li>
           <li class="nav-item"><a href="../contacts/contacts.html" class="nav-link" data-page="contacts.html"><img src="${iconUrl('contact.svg')}" class="nav-icon" alt="">Contacts</a></li>`
        : `<li class="nav-item"><a href="../../../index.html" class="nav-link" data-page="login.html"><img src="${iconUrl('login.svg')}" class="nav-icon" alt="">Login</a></li>
           <li class="nav-item nav-legal-mobile"><a href="../legal/privacy.html" data-page="privacy.html">Privacy Policy</a></li>
           <li class="nav-item nav-legal-mobile"><a href="../legal/imprint.html" data-page="imprint.html">Legal Notice</a></li>`;
}


/**
 * Navigates back to the previous page in browser history.
 */
function goBack() {
    history.back();
}


/** Waits for the restored session (legal pages are public), then renders the nav and wires the page. */
async function initLegalPage() {
    await authService.ready();
    updateNavForAuthStatus();
    initNavbar();
    document.getElementById('legalBackBtn').addEventListener('click', goBack);
}


initLegalPage();
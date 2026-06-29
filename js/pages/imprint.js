import { initNavbar } from '../components/navbar.js';
import { getCurrentUser } from '../firebase/auth.js';

function updateNavForAuthStatus() {
    const user = getCurrentUser();
    const navList = document.querySelector('.nav-list');
    const userBar = document.querySelector('.header-user');

    userBar.innerHTML = user ? getUserBarHTML(user) : '';
    navList.innerHTML = getNavListHTML(!!user);
    navList.style.visibility = 'visible'; 
    userBar.style.visibility = 'visible'; 
}

function getUserBarHTML(user) {
    return `<a href="help.html" class="header-help"><img src="../assets/icons/help.svg" alt="Help"></a>
        <button type="button" class="header-avatar" id="headerAvatarBtn">${user.initials}</button>
        <nav class="header-dropdown" id="headerDropdown">
            <ul>
                <li class="header-help-mobile"><a href="help.html">Help</a></li>
                <li><a href="imprint.html">Legal Notice</a></li>
                <li><a href="privacy.html">Privacy Policy</a></li>
                <li><button type="button" id="headerLogoutBtn">Logout</button></li>
            </ul>
        </nav>`;
}

function getNavListHTML(isLoggedIn) {
    return isLoggedIn
        ? `<li class="nav-item"><a href="summary.html" class="nav-link" data-page="summary.html"><img src="../assets/icons/summary.svg" class="nav-icon" alt="">Summary</a></li>
           <li class="nav-item"><a href="add-task.html" class="nav-link" data-page="add-task.html"><img src="../assets/icons/edit_square.svg" class="nav-icon" alt="">Add Task</a></li>
           <li class="nav-item"><a href="board.html" class="nav-link" data-page="board.html"><img src="../assets/icons/board.svg" class="nav-icon" alt="">Board</a></li>
           <li class="nav-item"><a href="contacts.html" class="nav-link" data-page="contacts.html"><img src="../assets/icons/contact.svg" class="nav-icon" alt="">Contacts</a></li>`
        : `<li class="nav-item"><a href="../index.html" class="nav-link" data-page="login.html"><img src="../assets/icons/login.svg" class="nav-icon" alt="">Login</a></li>
           <li class="nav-item nav-legal-mobile"><a href="privacy.html">Privacy Policy</a></li>
           <li class="nav-item nav-legal-mobile"><a href="imprint.html">Legal Notice</a></li>`;
}

updateNavForAuthStatus();
initNavbar();
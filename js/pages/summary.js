import { initNavbar } from '../components/navbar.js';

/** Disables pointer events on the greeting overlay after its fade-out animation ends. */
function initGreetingOverlay() {
    let overlay = document.querySelector('.greeting-overlay');

    let isMobile = window.matchMedia('(max-width: 768px)').matches; // mobiler Breakpoint for CSS
    if (!isMobile) return;

    let justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
    if (!justLoggedIn) {
        overlay.style.display = 'none';
        return;
    } // Checks if your logged in and disables Animation for already logged in Users
    sessionStorage.removeItem('justLoggedIn');
    overlay.addEventListener('animationend', (e) => {
        e.target.style.pointerEvents = 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initGreetingOverlay();
});
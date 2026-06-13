import { initNavbar } from '../components/navbar.js';

/** Disables pointer events on the greeting overlay after its fade-out animation ends. */
function initGreetingOverlay() {
    document.querySelector('.greeting-overlay')?.addEventListener('animationend', (e) => {
        e.target.style.pointerEvents = 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initGreetingOverlay();
});
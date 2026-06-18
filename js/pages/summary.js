import { initNavbar } from '../components/navbar.js';
import { getCurrentUser } from "../firebase/auth.js";

document.querySelectorAll('.summary-card').forEach(element => {
  element.addEventListener('click', () => {
    window.location.href = './board.html'; 
  });
});

/** Disables pointer events on the greeting overlay after its fade-out animation ends. */
function initGreetingOverlay() {
    let overlay = document.querySelector('.greeting-overlay');
    let isMobile = window.matchMedia('(max-width: 768px)').matches
    if (!isMobile) {
        setGreetingName(overlay);
        return;
    } // for Desktop
    if (sessionStorage.getItem('justLoggedIn') !== 'true') {
        overlay.style.display = 'none';
        return;
    } // for Mobile
    sessionStorage.removeItem('justLoggedIn');
    setGreetingName(overlay);
    overlay.addEventListener('animationend', (e) => {
        e.target.style.pointerEvents = 'none';
    });
}

function setGreetingName(overlay) {
    let user = getCurrentUser();
    let greeting = getGreetingDate();
    overlay.querySelector('p').innerHTML = `${greeting}, <span  class="username">${user.name}</span>`;
    if (user.name === 'Guest') {
     overlay.querySelector('p').textContent = `${greeting}!`;   
    }
}

function getGreetingDate() {
    let hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initGreetingOverlay();
});
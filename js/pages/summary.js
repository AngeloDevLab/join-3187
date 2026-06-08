function initGreetingOverlay() {
  document.querySelector('.greeting-overlay')?.addEventListener('animationend', (e) => {
    e.target.style.pointerEvents = 'none';
  });
}

// muss ins allgemeine JS für alle Seiten, damit die Navigation überall funktioniert

function initActiveNav() {
  document.querySelectorAll('nav ul li a').forEach(link => {
    if (link.href === window.location.href) {
      link.parentElement.classList.add('active');
    }
  });
}

initGreetingOverlay();
initActiveNav();

// muss ins allgemeine JS für alle Seiten, damit die Navigation überall funktioniert
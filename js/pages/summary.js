document.querySelector('.greeting-overlay').addEventListener('animationend', (e) => {
  e.target.style.pointerEvents = 'none'; /* ← */
});
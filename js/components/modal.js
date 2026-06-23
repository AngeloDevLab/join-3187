/**
 * Animates the modal out, then closes and removes it from the DOM.
 * Uses a setTimeout fallback in case transitionend does not fire.
 * @param {HTMLDialogElement} dialog
 */
function closeModal(dialog) {
    dialog.classList.remove('is-open');
    let done = false;
    const finish = () => { if (done) return; done = true; dialog.close(); dialog.remove(); };
    dialog.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') finish(); });
    setTimeout(finish, 350);
}

/**
 * Closes the modal on Escape (native 'cancel' event) or on a click that
 * lands on the dialog itself rather than its content (i.e. the backdrop).
 * @param {HTMLDialogElement} dialog
 * @param {() => void} close
 */
function attachDismissHandlers(dialog, close) {
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
}

/**
 * Opens a modal dialog with the given content and slide-in animation.
 * @param {string | Node} content
 * @param {{ animation?: 'bottom' | 'right' | 'center', duration?: number | null }} [options]
 * @returns {{ close: () => void, dialog: HTMLDialogElement }}
 */
export function openModal(content, { animation = 'right', duration = null } = {}) {
    const dialog = document.createElement('dialog');
    dialog.className = `modal modal--${animation}`;
    if (typeof content === 'string') dialog.textContent = content;
    else dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
    const close = () => closeModal(dialog);
    attachDismissHandlers(dialog, close);
    if (duration) setTimeout(close, duration);
    return { close, dialog };
}

const TRANSPARENT_PIXEL = new Image();
TRANSPARENT_PIXEL.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ycQeacQAAAA';

let dragGhost;
let dragGhostOffset = { x: 0, y: 0 };


/**
 * Builds a floating clone styled like the drag state, positioned at the card's current spot.
 * @param {HTMLElement} card
 * @param {DOMRect} rect
 * @returns {HTMLElement}
 */
function createDragGhost(card, rect) {
    const ghost = card.cloneNode(true);
    ghost.classList.add('drag-image');
    ghost.style.position = 'fixed';
    ghost.style.width = `${card.offsetWidth}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);
    return ghost;
}


/**
 * Moves the floating drag ghost so it stays under the cursor at its initial grab point.
 * @param {DragEvent} event
 */
function moveDragGhost(event) {
    if (!dragGhost) return;
    dragGhost.style.left = `${event.clientX - dragGhostOffset.x}px`;
    dragGhost.style.top = `${event.clientY - dragGhostOffset.y}px`;
}


/**
 * Hides the native drag image and starts a custom floating drag ghost that tracks the cursor.
 * @param {DragEvent} event
 * @param {HTMLElement} card
 */
export function startDragGhost(event, card) {
    const rect = card.getBoundingClientRect();
    dragGhostOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.dataTransfer.setDragImage(TRANSPARENT_PIXEL, 0, 0);
    dragGhost = createDragGhost(card, rect);
    document.addEventListener('dragover', moveDragGhost);
}


/** Removes the floating drag ghost and stops tracking the cursor. */
export function stopDragGhost() {
    document.removeEventListener('dragover', moveDragGhost);
    dragGhost?.remove();
    dragGhost = null;
}

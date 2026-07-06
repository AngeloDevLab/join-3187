let indicatorEl = null;


/** Returns the shared indicator element, sized to match the dragged card. */
function getIndicator() {
    if (!indicatorEl) {
        indicatorEl = document.createElement('div');
        indicatorEl.className = 'drop-indicator';
    }
    const draggingCard = document.querySelector('.task-card.dragging');
    if (draggingCard) {
        indicatorEl.style.height = `${draggingCard.offsetHeight}px`;
        indicatorEl.style.width = `${draggingCard.offsetWidth}px`;
    }
    return indicatorEl;
}


/**
 * Whether a column lays its cards out side by side (below the 1366px board
 * breakpoint) rather than stacked, so the drop position must go by clientX.
 * @param {HTMLElement} container
 * @returns {boolean}
 */
function isRowLayout(container) {
    return getComputedStyle(container).flexDirection === 'row';
}


/**
 * Finds the first card the cursor is past the midpoint of, along whichever
 * axis the column currently lays cards out on.
 * @param {HTMLElement} container
 * @param {number} clientX
 * @param {number} clientY
 * @returns {HTMLElement|null}
 */
function findCardToInsertBefore(container, clientX, clientY) {
    const cards = [...container.querySelectorAll('.task-card:not(.dragging)')];
    if (isRowLayout(container)) {
        return cards.find((card) => clientX < card.getBoundingClientRect().left + card.offsetWidth / 2) ?? null;
    }
    return cards.find((card) => clientY < card.getBoundingClientRect().top + card.offsetHeight / 2) ?? null;
}


/**
 * Finds the next real task card after an element, skipping non-card nodes like the indicator.
 * @param {HTMLElement} el
 * @returns {HTMLElement|null}
 */
function nextRealCard(el) {
    let sibling = el.nextElementSibling;
    while (sibling && !sibling.classList.contains('task-card')) sibling = sibling.nextElementSibling;
    return sibling;
}


/**
 * Returns true when the target position is exactly where the dragged card already is.
 * @param {HTMLElement} container
 * @param {HTMLElement|null} beforeCard
 * @returns {boolean}
 */
function isOriginalPosition(container, beforeCard) {
    const ghost = container.querySelector('.task-card.dragging');
    return !!ghost && nextRealCard(ghost) === beforeCard;
}


/**
 * Shows/moves the drop indicator inside a column at the position closest to the cursor,
 * or hides it when that position matches the dragged card's original spot.
 * @param {HTMLElement} container
 * @param {number} clientX
 * @param {number} clientY
 */
export function updateDropIndicator(container, clientX, clientY) {
    const beforeCard = findCardToInsertBefore(container, clientX, clientY);
    if (isOriginalPosition(container, beforeCard)) {
        clearDropIndicator();
        return;
    }
    const indicator = getIndicator();
    if (beforeCard) beforeCard.before(indicator);
    else container.appendChild(indicator);
}


/** Removes the drop indicator from the DOM. */
export function clearDropIndicator() {
    indicatorEl?.remove();
}


/**
 * Returns the ids of the task cards immediately before/after the current indicator position,
 * or null when the indicator is hidden (the dragged card is already at that position).
 * @returns {{ beforeId: string|null, afterId: string|null }|null}
 */
export function getDropNeighbors() {
    if (!indicatorEl?.isConnected) return null;
    const before = indicatorEl.previousElementSibling;
    const after = indicatorEl.nextElementSibling;
    return {
        beforeId: before?.classList.contains('task-card') ? before.dataset.id : null,
        afterId: after?.classList.contains('task-card') ? after.dataset.id : null,
    };
}

import '../../utils/auth-guard.js';
import { initNavbar } from '../../components/navbar.js';
import { authService } from '../../services/auth-service.js';
import { taskStore } from '../../services/task-store.js';
import { escapeHtml } from '../../utils/helpers.js';
import { pageUrl } from '../../utils/paths.js';

/** Makes each summary card behave as a link to the board (click or Enter key). */
function initSummaryCardLinks() {
    document.querySelectorAll('.summary-card').forEach((element) => {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'link');
        element.addEventListener('click', () => { window.location.href = pageUrl('board'); });
        element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                window.location.href = pageUrl('board');
            }
        });
    });
}


/** Shows the greeting overlay on mobile (on first login) or sets the name directly on desktop. */
function initGreetingOverlay() {
    const overlay = document.querySelector('.greeting-overlay');
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) { setGreetingName(overlay); return; }
    if (sessionStorage.getItem('justLoggedIn') !== 'true') { overlay.style.display = 'none'; return; }
    playMobileGreeting(overlay);
}


/**
 * Fills the greeting name and disables pointer events after the mobile overlay animation ends.
 * @param {HTMLElement} overlay
 */
function playMobileGreeting(overlay) {
    sessionStorage.removeItem('justLoggedIn');
    setGreetingName(overlay);
    overlay.addEventListener('animationend', (e) => {
        e.target.style.pointerEvents = 'none';
    });
}


/**
 * Fills the greeting overlay with a time-of-day greeting and the user's name.
 * @param {HTMLElement} overlay
 */
function setGreetingName(overlay) {
    const user = authService.currentUser;
    const greeting = getGreetingDate();
    const text = overlay.querySelector('p');
    if (user.isGuest) {
        text.textContent = `${greeting}!`;
        return;
    }
    text.innerHTML = `${greeting}, <span class="username">${escapeHtml(user.name)}</span>`;
}


/**
 * Returns a time-of-day greeting based on the current hour.
 * @returns {string}
 */
function getGreetingDate() {
    let hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}


// ── Summary counts ───────────────────────────────────────

/**
 * Counts tasks per board column and priority from the raw tasks object. The
 * upcoming deadline only considers urgent tasks that are not done yet.
 * @param {Object<string, {column: string, priority: string, dueDate: string}>} tasks
 * @returns {{ todo: number, done: number, inProgress: number, awaitingFeedback: number, total: number, urgent: number, nextUrgentDue: string|null }}
 */
function computeSummaryCounts(tasks) {
    const list = Object.values(tasks ?? {});
    const byColumn = (col) => list.filter((t) => t.column === col).length;
    const urgent = list.filter((t) => t.priority === 'urgent');
    const openDueDates = urgent.filter((t) => t.column !== 'done' && t.dueDate).map((t) => t.dueDate).sort();
    return {
        todo: byColumn('todo'),
        done: byColumn('done'),
        inProgress: byColumn('inProgress'),
        awaitingFeedback: byColumn('awaitFeedback'),
        total: list.length,
        urgent: urgent.length,
        nextUrgentDue: openDueDates[0] ?? null,
    };
}


/**
 * Formats an ISO date string (YYYY-MM-DD) as "Month D, YYYY". Parsed as a
 * local date — `new Date('YYYY-MM-DD')` alone would be UTC and show the
 * previous day in time zones west of UTC.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDueDate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}


/**
 * Writes computed counts and the next urgent due date into the summary cards.
 * @param {ReturnType<typeof computeSummaryCounts>} counts
 */
function renderSummaryCounts(counts) {
    document.getElementById('summaryTodo').textContent = counts.todo;
    document.getElementById('summaryDone').textContent = counts.done;
    document.getElementById('summaryUrgent').textContent = counts.urgent;
    document.getElementById('summaryBoardTotal').textContent = counts.total;
    document.getElementById('summaryInProgress').textContent = counts.inProgress;
    document.getElementById('summaryAwaitFeedback').textContent = counts.awaitingFeedback;
    document.getElementById('summaryUrgentDate').textContent =
        counts.nextUrgentDue ? formatDueDate(counts.nextUrgentDue) : '-';
}


initNavbar();
initSummaryCardLinks();
initGreetingOverlay();
taskStore.subscribe((tasks) => renderSummaryCounts(computeSummaryCounts(tasks)));

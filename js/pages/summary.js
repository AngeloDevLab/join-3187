import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';
import { getCurrentUser } from '../firebase/auth.js';
import { getTasks } from '../firebase/cache.js';

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


/**
 * Fills the greeting overlay with a time-of-day greeting and the user's name.
 * @param {HTMLElement} overlay
 */
function setGreetingName(overlay) {
    let user = getCurrentUser();
    let greeting = getGreetingDate();
    overlay.querySelector('p').innerHTML = `${greeting}, <span  class="username">${user.name}</span>`;
    if (user.name === 'Guest') {
     overlay.querySelector('p').textContent = `${greeting}!`;
    }
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
 * Counts tasks per board column and priority from the raw tasks object.
 * @param {Object<string, {column: string, priority: string, dueDate: string}>} tasks
 * @returns {{ todo: number, done: number, inProgress: number, awaitingFeedback: number, total: number, urgent: number, nextUrgentDue: string|null }}
 */
function computeSummaryCounts(tasks) {
    const list = Object.values(tasks ?? {});
    const byColumn = (col) => list.filter((t) => t.column === col).length;
    const urgentDueDates = list.filter((t) => t.priority === 'urgent').map((t) => t.dueDate).sort();
    return {
        todo: byColumn('todo'),
        done: byColumn('done'),
        inProgress: byColumn('inprogress'),
        awaitingFeedback: byColumn('awaitingfeedback'),
        total: list.length,
        urgent: urgentDueDates.length,
        nextUrgentDue: urgentDueDates[0] ?? null,
    };
}


/**
 * Formats an ISO date string (YYYY-MM-DD) as "Month D, YYYY".
 * @param {string} isoDate
 * @returns {string}
 */
function formatDueDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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


/** Loads tasks from the cache and renders the summary card counts. */
async function loadSummaryCounts() {
    const tasks = await getTasks();
    renderSummaryCounts(computeSummaryCounts(tasks));
}


initNavbar();
initGreetingOverlay();
loadSummaryCounts();

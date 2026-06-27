import '../utils/auth-guard.js';
import { initNavbar } from '../components/navbar.js';


/**
 * Navigates back to the previous page in browser history.
 */
function goBack() {
    history.back();
}


initNavbar();
document.getElementById('helpBackBtn').addEventListener('click', goBack);

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { initializeAuth, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

/** The single Firebase app instance shared by all services. */
export const app = initializeApp(firebaseConfig);

/** Firebase Auth, scoped to the browser tab: closing the tab logs the user out. */
export const auth = initializeAuth(app, { persistence: browserSessionPersistence });

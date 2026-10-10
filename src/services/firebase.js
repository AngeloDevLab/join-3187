import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { initializeAuth, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

/** The single Firebase app instance shared by all services. */
export const app = initializeApp(firebaseConfig);

/** Firebase Auth, scoped to the browser tab: closing the tab logs the user out. */
export const auth = initializeAuth(app, { persistence: browserSessionPersistence });

/** Realtime Database; requests carry the logged-in user's token automatically. */
export const db = getDatabase(app);

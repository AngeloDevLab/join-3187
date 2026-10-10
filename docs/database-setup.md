# Firebase Setup

How to run Join against your own Firebase project. The free **Spark plan** is enough.

## 1. Create a Project and a Realtime Database

1. Open the [Firebase Console](https://console.firebase.google.com/) → **Add project** (Google Analytics can be disabled).
2. **Build → Realtime Database → Create database**, choose a location (e.g. `europe-west1`) and start in *locked mode*. The real rules follow in step 4.

## 2. Enable Authentication

1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable:
   - **Email/Password** (only the first toggle; the passwordless email link stays off)
   - **Anonymous**: guests sign in this way
3. Optional: under **Settings**, enable the automatic clean-up of anonymous accounts. Every guest login creates one.
4. Under **Settings → Authorized domains**, add every domain the app runs on:
   - `127.0.0.1`: VS Code Live Server opens the app there (`localhost` is listed by default)
   - your GitHub Pages domain (`<user>.github.io`) and any custom domain

## 3. Register the Web App

1. Gear icon → **Project settings → General → Your apps** → web icon `</>` → register the app (Firebase Hosting is not needed).
2. Copy the config object into [src/services/firebase-config.js](../src/services/firebase-config.js):

```javascript
export const firebaseConfig = {
    apiKey: '…',
    authDomain: '<project>.firebaseapp.com',
    databaseURL: 'https://<project>-default-rtdb.<region>.firebasedatabase.app',
    projectId: '<project>',
    storageBucket: '<project>.firebasestorage.app',
    messagingSenderId: '…',
    appId: '…',
};
```

> This file is **committed on purpose**. A Firebase web config is not a secret. Anyone loading the site can read it, and GitHub Pages needs it to run the app. Access is protected by Authentication and the security rules. Real secrets, such as service account keys or n8n credentials, must never be committed.

## 4. Security Rules

**Realtime Database → Rules**: paste the content of [database.rules.json](../database.rules.json) and publish:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "tasks":    { ".read": "auth != null", ".write": "auth != null" },
    "contacts": { ".read": "auth != null", ".write": "auth != null" }
  }
}
```

Only logged-in users, guests included, can access `tasks` and `contacts`; everything else is denied. Requests without a token, for example a plain `curl` against the REST API, get `401 Unauthorized`.

## 5. Seed Data (optional)

[docs/initial-data.json](initial-data.json) contains sample tasks and contacts. In **Realtime Database → Data**, use ⋮ → **Import JSON** to load it.

> Importing **replaces the whole database**, including contacts created by registered users. Only import into an empty or test database.

## 6. Run

Serve the project root over HTTP (e.g. VS Code Live Server or `npx serve .`) and open `index.html`. ES modules do not load from `file://`.

---

## External Access (e.g. n8n)

Automations that write to the database, such as the planned email issue collector, should authenticate with a **service account** (Project settings → Service accounts). Service accounts bypass the security rules. Keep their keys out of the repository.

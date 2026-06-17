# Auth — Flow & Decisions

## Protected Pages

All pages except `index.html`, `imprint.html`, and `privacy.html` require a logged-in user.
Protection is enforced by importing the auth guard as the **first import** in each page script:

```javascript
import '../utils/auth-guard.js'; // runs immediately, redirects if no session
```

`auth-guard.js` checks `sessionStorage` for a current user and redirects to `index.html`
if none is found. Because it runs at module parse time (before `DOMContentLoaded`),
the page never renders for unauthenticated users.

---

## Flow Overview

```
index.html (Login/Signup)
  └── js/pages/auth.js          — UI logic (forms, animations, validation)
        ├── js/firebase/auth.js  — session management, DB reads/writes
        └── js/firebase/database.js — raw fetch wrapper (REST)
```

On every protected page:
```
js/utils/auth-guard.js  — reads sessionStorage, redirects to index.html if no user
```

---

## Login Flow

1. User fills email + password → clicks "Log in"
2. `handleLoginSubmit` validates: email format + password non-empty
3. `loginUser(email)` calls `findUserByEmail` → `getAll('users')` from Firebase
4. Match found → `setSession({ id, name, initials })` writes to `sessionStorage`
5. `exitAndRedirect` fades the card, shows toast, navigates to `pages/summary.html`

No password check on login — passwords are not stored in Firebase.
The email alone identifies the user. This is intentional for this project scope.

---

## Signup Flow

1. Submit button is **disabled** until all fields pass live validation:
   - Name non-empty
   - Email matches `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` (requires TLD)
   - Password non-empty
   - Confirm password matches password
   - Privacy Policy checkbox checked
2. `registerUser(name, email)` checks for duplicate email via `findUserByEmail`
3. Duplicate → throws, error shown on email field
4. New user → `create('users', { name, email, initials })` → `setSession`
5. Toast + redirect to `pages/summary.html`

---

## Guest Login

`loginAsGuest()` writes `{ id: 'guest', name: 'Guest', initials: 'G' }` to sessionStorage.
No DB entry is created. Guest data is lost when the tab closes.

---

## Session

- Storage: `sessionStorage` (cleared on tab close, survives page navigation)
- Key: `currentUser` → `{ id, name, initials }`
- Read via `getCurrentUser()` — used by auth-guard and any page that needs the current user
- Cleared via `logoutUser()` + redirect to `index.html` (caller handles redirect so the intro animation replays)

---

## Decisions

**Why sessionStorage and not Firebase Auth?**
Firebase Auth adds SDK overhead and complexity (token refresh, onAuthStateChanged, etc.).
For this project, a simple email lookup + sessionStorage is sufficient. If real security
becomes a requirement, migrating to Firebase Auth is the natural next step.

**Why no password storage?**
Storing passwords securely requires hashing (bcrypt etc.) which isn't available in plain
Firebase Realtime Database without a backend function. Omitted intentionally for project scope.

**Why disable the signup button instead of showing errors on submit?**
Prevents the empty-submit error flash. The user knows what's missing before clicking,
rather than after. Login button stays always-enabled (fewer fields, less friction).

**Why a custom email regex instead of `input.validity.valid`?**
The browser's built-in email validation (`validity.valid`) accepts `user@domain` without
a TLD. The regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` requires at least a two-character TLD.

**Why `initials` are derived and stored, not computed on the fly?**
Initials are displayed in avatars across multiple pages. Storing them avoids re-deriving
from the name on every render and keeps the user object self-contained.

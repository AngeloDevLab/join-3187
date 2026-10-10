# Auth — Flow & Decisions

Join uses **Firebase Authentication** with two sign-in methods:

- **Email/password** for registered users
- **Anonymous** sign-in for guests

All auth logic lives in one class, `AuthService` ([src/services/auth-service.js](../src/services/auth-service.js)). Pages use the shared instance `authService` and never call the Firebase SDK themselves.

```
index.html
  └── src/pages/auth/auth.js           AuthPage — intro, card switch, transitions
        ├── login-form.js              LoginForm — login + guest button
        ├── signup-form.js             SignupForm — validation rules + register
        └── password-toggle.js         PasswordToggle — show/hide password
              └── authService          (src/services/auth-service.js)
                    └── Firebase Auth  (initialized in src/services/firebase.js)
```

---

## AuthService API

| Member | Purpose |
|---|---|
| `ready()` | Resolves once Firebase has restored any existing session; resolves to `true` if someone is logged in |
| `currentUser` | `{ id, name, initials, email, isGuest }` or `null` — only reliable after `ready()` |
| `login(email, password)` | Signs a registered user in; rejects on wrong credentials |
| `register(name, email, password)` | Creates the account, sets the display name, adds a matching contact, then signs out again |
| `loginAsGuest()` | Signs in anonymously |
| `logout()` | Signs out |

For guests, `currentUser` is `{ name: 'Guest', initials: 'G', email: null, isGuest: true }`. Pages check `isGuest` — never the name — to tell guests apart.

---

## Protected Pages

Every page except `index.html`, `imprint.html` and `privacy.html` requires a logged-in user (registered or guest). The page script imports the guard as its **first import**:

```javascript
import '../../utils/auth-guard.js';
```

The guard ([src/utils/auth-guard.js](../src/utils/auth-guard.js)) uses a top-level `await`:

1. It waits for `authService.ready()`, so the page script never runs before the session is known.
2. Without a user it redirects to the login page with `location.replace()`, then waits on a promise that never resolves. The page script therefore never runs, and no data is requested.

The legal pages are public but adapt their navigation to the login state, so they also await `authService.ready()` before rendering.

---

## Login Flow

1. `LoginForm` checks that the email is well-formed and the password is not empty.
2. `authService.login()` → Firebase verifies the credentials.
3. Both buttons stay disabled while the request runs. After a success they stay disabled until the page navigates away.
4. On success, `AuthPage` fades out the card, shows a toast and opens the summary. It also sets `sessionStorage.justLoggedIn` so the summary plays its mobile greeting once.
5. On failure, both fields are marked invalid with **one unspecific message**, so a failed attempt never reveals whether the email exists.

## Signup Flow

1. `SignupForm` defines one validation rule per field (name, email, password ≥ 6 characters, matching confirmation, accepted privacy policy). Each rule is checked on blur and on submit; the submit button is dimmed until all rules pass.
2. `authService.register()` creates the Firebase account, sets the display name and adds the user to `contacts/`, so they can be assigned to tasks right away.
3. The service then signs out again. The user lands back on the login card and logs in explicitly.
4. Firebase error codes (e.g. `auth/email-already-in-use`) are mapped to readable messages and shown on the email field.

## Guest Login

`authService.loginAsGuest()` creates an anonymous Firebase account. Guests have the same read/write rights as registered users, so reviewers can try every feature without signing up. Old anonymous accounts can be cleaned up automatically in the Firebase console (Authentication → Settings).

## Session

- Firebase Auth runs with **session persistence**: the login survives page navigation but ends when the tab is closed.
- `logout()` signs out; the navbar then redirects to the login page, which replays the intro.

---

## Decisions

**Why Firebase Authentication instead of a custom session?**
The first version only checked that an email existed and kept the user in `sessionStorage` — there was no password check. Firebase Auth gives real password verification and a token that the database can check through its security rules. The SDK loads from the CDN, so the app still needs no build step.

**Why anonymous sign-in for guests?**
A guest needs a real auth token, otherwise the security rules (`auth != null`) would lock them out. Anonymous accounts give guests that token without an email.

**Why sign out right after signup?**
This keeps the original UX: register, see "Account created!", then log in. It also confirms the password the user just chose.

**Why validate the password length on the client?**
Firebase rejects passwords shorter than 6 characters. Checking the same limit in the form shows the error at the field before a request is sent.

**Why a custom email regex instead of `input.validity.valid`?**
The browser accepts `user@domain` without a TLD. `isValidEmail()` in [form-validation.js](../src/utils/form-validation.js) requires one.

**Why are initials never stored?**
They are derived from the name via `getInitials()` wherever an avatar renders. For the current user, `AuthService` derives them from the Firebase display name.

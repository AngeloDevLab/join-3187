# Join

A Kanban project management tool built as a Multi-Page Application (MPA) with vanilla JavaScript and Firebase — originally developed as an agile group project at Developer Akademie.

## Features

- Sign up and log in with email and password (Firebase Authentication), or log in as a guest
- Kanban board with the columns To Do, In Progress, Awaiting Feedback and Done
- Create, edit and delete tasks — with category, priority, due date, assignees and subtasks
- Drag & drop between columns (desktop), "Move to" menu (mobile)
- **Live updates:** changes by other users show up instantly on every open page, without a reload
- Task search by title and description
- Contact management (add, edit, delete — deleting a contact also unassigns it from all tasks)
- Summary dashboard with task counts, next urgent deadline and a time-based greeting
- Responsive from 320px, mobile-first
- Help page, Legal Notice and Privacy Policy

## Tech Stack

- HTML, CSS, JavaScript (ES modules, ES2022 classes) — no framework, no build step
- Firebase Authentication (email/password + anonymous guest login)
- Firebase Realtime Database via the Firebase JS SDK, loaded from the gstatic CDN

## Getting Started

The app runs straight from the repository, but it has to be **served over HTTP** — ES modules do not load from `file://`.

1. Clone the repository:
   ```bash
   git clone https://github.com/AngeloDevLab/join-3187.git
   ```
2. Serve the project root with any static server, e.g. the VS Code *Live Server* extension, or:
   ```bash
   npx serve .
   ```
3. Open `index.html` through that server, then log in as a guest or create an account.

The repository is already connected to its Firebase project. To run it against your own project, follow [docs/database-setup.md](docs/database-setup.md).

## Project Structure

```
join/
├── index.html              # Login / Sign up (entry point)
├── database.rules.json     # Realtime Database security rules
├── public/                 # Static files: fonts, icons
├── docs/                   # Architecture and setup documentation
└── src/
    ├── styles/             # Design tokens (variables.css) and shared styles
    ├── components/         # UI used by several pages: Modal, Dropdown, navbar, toast, task-form/
    ├── services/           # Firebase setup, AuthService, live data stores
    ├── utils/              # Plain helper functions (validation, paths, auth guard, …)
    └── pages/              # One folder per page: its HTML, CSS, page script and page-only classes
        ├── auth/           #   used by index.html
        ├── summary/  board/  add-task/  contacts/  help/
        └── legal/          #   imprint.html + privacy.html
```

## Architecture

```
Page script (e.g. BoardPage)
  ├── authService     — who is logged in (Firebase Auth)
  └── taskStore / contactStore
        └── one realtime listener per collection (Firebase SDK, onValue)
              → every change re-renders the subscribed pages
```

- **Auth:** [docs/auth.md](docs/auth.md) — login, signup, guest, route protection
- **Data:** [docs/data-layer.md](docs/data-layer.md) — stores, live updates, writes
- **Schema:** [docs/database-schema.md](docs/database-schema.md) — collections and fields

## Tech Decisions

- **Vanilla JS, no build step** — the project requirement; the Firebase SDK comes from its official CDN as ES modules, so no npm is needed
- **MPA over SPA** — every page is a static HTML file; markup lives in the HTML (`<template>` for repeated parts), JavaScript only adds behaviour
- **Classes where state and behaviour belong together** — services, stores, forms and page controllers are classes with native private members (`#field`); stateless helpers stay plain functions
- **Firebase Authentication** — real password check and session handling; guests get an anonymous account with the same rights as registered users
- **Realtime listeners instead of a request cache** — pages subscribe to the stores, so the board stays in sync across users and with external automations
- **Security rules** — only logged-in users (incl. guests) can read or write; see [database.rules.json](database.rules.json)
- **CSS custom properties** — all design tokens live in `src/styles/variables.css`
- **Avatar colors derived from the contact id** — the same contact always gets the same color everywhere

## Notes

- All users (incl. guests) share the same board and contacts
- The Firebase web config in `src/services/firebase-config.js` is public by design; access is protected by Authentication and the security rules — never commit service account keys or other credentials
- Tested in current Chrome, Firefox, Safari and Edge

## Team

| Name | Role |
|---|---|
| Christian M. | Developer |
| Mahad Yussuf Nur | Developer |
| Louis Juchem | Developer |
| Angelo Pietsch | Developer |

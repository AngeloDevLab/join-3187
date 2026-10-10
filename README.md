# Join

A collaborative Kanban board built as a Multi-Page Application (MPA), developed as part of an agile group project.

## Tech Stack

- HTML, CSS, JavaScript (Vanilla)
- Firebase (Realtime Database / Authentication)

## Features

- User registration & login (incl. guest login)
- Kanban board with columns: To Do, In Progress, Awaiting Feedback, Done
- Create, edit, and delete tasks
- Subtasks with progress indicator
- Drag & drop between columns (desktop)
- Real-time task search
- Contact management (add, edit, delete — deleting a contact also unassigns it from any tasks)
- Responsive design (from 320px, mobile-first)
- Time-based greeting message
- Dashboard with task overview
- Help / FAQ page
- Legal Notice & Privacy Policy

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AngeloDevLab/join-3187.git
   ```

2. Create a Firebase project at [firebase.google.com](https://firebase.google.com)

3. In the Firebase console, enable **Authentication** with the *Email/Password* and *Anonymous* providers, then put your web app config into `src/services/firebase-config.js` (see `docs/database-setup.md`). The web config is not a secret — access is protected by Firebase Auth and the database rules

4. Open `index.html` in your browser – no build step required

## Project Structure

```
join/
├── index.html          # Login / Register
├── public/             # Static files: fonts, icons
└── src/
    ├── styles/         # Design tokens + shared styles
    ├── pages/          # One folder per page (HTML + CSS + JS):
    │                   #   summary, board, add-task, contacts, help, auth, legal (imprint + privacy)
    ├── components/     # Reusable UI components
    ├── services/       # Firebase config, auth and data access
    └── utils/          # Utility functions
```

## Notes

- All users (incl. guest) share the same board and contacts
- Sensitive data (Firebase credentials etc.) must **not** be pushed to the repository
- Before submission: add at least 5 tasks and 10 contacts
- Tested in: Chrome, Firefox, Safari, Edge (latest versions)

## Tech Decisions

- **Vanilla JS over a framework** — kept simple per project requirements, no build step needed
- **MPA over SPA** — each page is independent, no client-side routing required
- **Firebase Realtime Database over Firestore** — simpler API for this use case
- **CSS custom properties** — all design tokens (colors, spacing, typography) defined in `src/styles/variables.css`
- **Avatar colors assigned by contact ID hash** — deterministic, same contact always gets the same color everywhere (contacts list, task cards, assigned-to dropdown)

## Team

| Name | Role |
|---|---|
| Christian M. | Developer |
| Mahad Yussuf Nur | Developer |
| Louis Juchem | Developer |
| Angelo Pietsch | Developer |
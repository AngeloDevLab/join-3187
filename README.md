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
- Contact management (add, edit, delete)
- Responsive design (from 320px, mobile-first)
- Time-based greeting message
- Dashboard with task overview
- Legal Notice & Privacy Policy

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-repo>/join.git
   ```

2. Create a Firebase project at [firebase.google.com](https://firebase.google.com)

3. Add your Firebase config to `js/firebase/config.js` – **never push this to the repository**, exclude it via `.gitignore` instead

4. Open `index.html` in your browser – no build step required

## Project Structure

```
join/
├── index.html          # Login / Landing page
├── pages/              # All other HTML pages
│   ├── board.html
│   ├── add-task.html
│   ├── contacts.html
│   ├── summary.html
│   ├── imprint.html
│   └── privacy.html
├── css/                # Global and page-specific stylesheets
├── js/
│   ├── pages/          # One JS module per page
│   ├── components/     # Reusable UI components
│   ├── utils/          # Utility functions
│   └── firebase/       # Firebase config and database access
└── assets/
    ├── fonts/
    └── icons/
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
- **CSS custom properties** — all design tokens (colors, spacing, typography) defined in `css/variables.css`
- **Avatar colors assigned by name hash** — deterministic, same contact always gets the same color

## Team

| Name | Role |
|---|---|
| Christian M. | Developer |
| Mahad Yussuf Nur | Developer |
| Louis Juchem | Developer |
| Angelo Pietsch | Developer |
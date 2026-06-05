# Join — Project Management Tool

Join is a project management tool for visualizing task status and responsibilities. Group project at Developer Akademie, built collaboratively in an agile team environment.

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (no build tool, no framework)
- **Backend:** Firebase (Authentication + Realtime Database)
- **Architecture:** Multi Page Application (MPA)

## Project Structure

```
/
├── index.html          # Login / Landing Page
├── pages/              # All other HTML pages
├── css/
│   ├── variables.css   # CSS custom properties (colors, spacing, fonts)
│   ├── global.css      # Global styles incl. legal pages (Imprint, Privacy)
│   └── *.css           # Page-specific stylesheets
├── js/
│   ├── pages/          # One JS module per page
│   ├── components/     # Reusable UI components (navbar, toast, task-card)
│   ├── utils/          # Utility functions (auth-guard, helpers)
│   └── firebase/       # Firebase configuration and database access
└── assets/
    ├── fonts/
    └── icons/
```

## Conventions

- All CSS variables are defined exclusively in `css/variables.css`
- One JS file per page in `js/pages/`
- Firebase logic stays in `js/firebase/` — no direct Firebase calls in page scripts
- Imprint and Privacy styles live in `css/global.css` (no separate stylesheet needed)

## Pages

| Page | HTML | CSS | JS |
|---|---|---|---|
| Login / Register | `index.html` | `css/auth.css` | `js/pages/auth.js` |
| Summary | `pages/summary.html` | `css/summary.css` | `js/pages/summary.js` |
| Board | `pages/board.html` | `css/board.css` | `js/pages/board.js` |
| Add Task | `pages/add-task.html` | `css/add-task.css` | `js/pages/add-task.js` |
| Contacts | `pages/contacts.html` | `css/contacts.css` | `js/pages/contacts.js` |
| Imprint | `pages/imprint.html` | _(global.css)_ | — |
| Privacy | `pages/privacy.html` | _(global.css)_ | — |

## Firebase

- Config in `js/firebase/config.js`
- Auth wrapper in `js/firebase/auth.js`
- Database access in `js/firebase/database.js`
- Route protection (Auth Guard) in `js/utils/auth-guard.js`

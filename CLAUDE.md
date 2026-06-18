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
│   ├── global/
│   │   ├── base.css      # @font-face, resets, typography
│   │   ├── layout.css    # .app-layout, .app-main + desktop grid
│   │   ├── navbar.css    # .app-sidebar, .app-header + nav components
│   │   ├── buttons.css   # .btn, .btn-primary, .btn-secondary
│   │   ├── inputs.css    # input, textarea, select, date-input
│   │   └── dropdown.css  # .dropdown, .assigned-option, contact chips
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
- Shared styles live in `css/global/` — import only what each page needs
- Page-specific styles only in the corresponding `css/*.css` — never add page-specific rules to `css/global/`
- Import order per page: `variables.css` → `global/*` → page stylesheet

## JavaScript Rules

- **Max 14 lines per function** — if a function exceeds this, split it
- **Max 400 lines per script** — including JSDoc; extract to a component if exceeded
- **2 blank lines between functions** — consistent throughout every script
- **JSDoc required on every function** — document parameters and return values
- Reusable logic belongs in `js/components/` or `js/utils/`, not in page scripts
- Navbar component (`js/components/navbar.js`) renders the shared navigation dynamically — do not copy-paste navbar HTML into individual pages
- **No `DOMContentLoaded` wrapper** — all scripts use `type="module"` which defers automatically; call init functions directly at the top level at the end of the file
- **`import '../utils/auth-guard.js'` must be the first import** in every protected page script (all pages except `index.html`, `imprint.html`, `privacy.html`)
- **Never import from `js/firebase/database.js` in page scripts** — always go through `js/firebase/cache.js`

## Component Responsibilities

| Component | File | Status |
|---|---|---|
| Navbar / Sidebar | `js/components/navbar.js` | in progress (colleague) |
| Modal / Drawer | `js/components/modal.js` | done |
| Toast | `js/components/toast.js` | done |
| Subtask input | `js/components/subtask.js` | done |
| Form validation | `js/utils/form-validation.js` | done |
| Auth Guard | `js/utils/auth-guard.js` | done |

## Pages

| Page | HTML | CSS | JS |
|---|---|---|---|
| Login / Register | `index.html` | `css/auth.css` | `js/pages/auth.js` |
| Summary | `pages/summary.html` | `css/summary.css` | `js/pages/summary.js` |
| Board | `pages/board.html` | `css/board.css` | `js/pages/board.js` |
| Add Task | `pages/add-task.html` | `css/add-task.css` | `js/pages/add-task.js` |
| Contacts | `pages/contacts.html` | `css/contacts.css` | `js/pages/contacts.js` |
| Imprint | `pages/imprint.html` | _(global/base.css)_ | — |
| Privacy | `pages/privacy.html` | _(global/base.css)_ | — |

## Firebase

- Config in `js/firebase/config.js`
- Auth wrapper in `js/firebase/auth.js` — session management, login, signup, guest
- Database access in `js/firebase/database.js` — raw REST fetch wrapper (internal only)
- Cache layer in `js/firebase/cache.js` — memory + sessionStorage + Firebase; **use this in page scripts**
- Route protection in `js/utils/auth-guard.js`

## CSS Global Files

| File | Purpose |
|---|---|
| `variables.css` | All CSS custom properties — colors, spacing, typography, radii |
| `global/base.css` | Font-face, resets, typography |
| `global/layout.css` | `.app-layout`, `.app-main`, desktop grid |
| `global/navbar.css` | `.app-sidebar`, `.app-header`, nav components |
| `global/buttons.css` | `.btn`, `.btn-primary`, `.btn-secondary`, disabled state |
| `global/inputs.css` | `input`, `textarea`, `select`, date input |
| `global/dropdown.css` | `.dropdown`, `.assigned-option`, contact chips |
| `global/modal.css` | `.modal`, `::backdrop`, slide-from-bottom/right animations |

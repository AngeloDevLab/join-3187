## Git Workflow
- `main` is always stable
- For each feature/fix: branch off `main`
  - Naming: `feature/short-description` or `fix/short-description`
- Done? Open a PR to `main`
- At least 1 other team member reviews and merges
- Delete branch after merge

## Code Conventions

### Structure
- Each page has one folder in `src/pages/<page>/` holding its HTML, CSS and page script. Classes that only this page uses live next to the page script. Anything used by more than one page goes to `src/components/`.
- Firebase is only touched in `src/services/`. Pages use `authService`, `taskStore` and `contactStore`, never the SDK directly.
- In JavaScript, never hard-code asset or page paths: use `iconUrl('name.svg')` and `pageUrl('board')` from `src/utils/paths.js`.
- Markup stays in the HTML (static navbar, `<template>` for repeated parts); JavaScript only fills and wires it.

### JavaScript
- Max **14 lines per function or method**, max **400 lines per file**.
- **JSDoc on every function and method** — parameters and return values.
- **2 blank lines** between functions and methods.
- Classes where state and behaviour belong together; plain functions for stateless helpers. Internal members are private (`#field`, `#method()`); only what other modules need is public.
- Protected page scripts import `../../utils/auth-guard.js` **first**.
- No `DOMContentLoaded` wrapper — scripts are `type="module"` and call their init code at the end of the file.
- Render from store subscriptions; do not re-render manually after a write.
- Await every write and show an error toast on failure; disable submit buttons while saving.

### CSS
- All custom properties live in `src/styles/variables.css`.
- Shared styles live in `src/styles/`; page-specific rules go only into the page's own stylesheet.
- Import order per page: `variables.css` → shared styles → page stylesheet.
- Mobile-first, three tiers only — base (≤ 767px), `@media (min-width: 768px)`, `@media (min-width: 1024px)`. Any other breakpoint gets a one-line comment explaining why.

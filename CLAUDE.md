# Join — Projektmanagement-Tool

Join ist ein Projektmanagement-Tool zur Visualisierung von Aufgaben-Status und Verantwortlichkeiten. Gruppenproject der Developer Akademie mit dem Ziel, eine umfangreiche Software in agiler Teamarbeit zu entwickeln.

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (kein Build-Tool, kein Framework)
- **Backend:** Firebase (Authentication + Realtime Database)
- **Architektur:** Multi Page Application (MPA)

## Projektstruktur

```
/
├── index.html          # Login / Landing Page
├── pages/              # Alle weiteren HTML-Seiten
├── css/
│   ├── variables.css   # CSS Custom Properties (Farben, Abstände, Fonts)
│   ├── global.css      # Globale Styles inkl. Legal Pages (Imprint, Privacy)
│   └── *.css           # Seitenspezifische Stylesheets
├── js/
│   ├── pages/          # Ein JS-Modul pro Seite
│   ├── components/     # Wiederverwendbare UI-Komponenten (navbar, toast, task-card)
│   ├── utils/          # Hilfsfunktionen (auth-guard, helpers)
│   └── firebase/       # Firebase-Konfiguration und Datenbankzugriffe
└── assets/
    ├── fonts/
    └── icons/
```

## Konventionen

- CSS-Variablen ausschließlich in `css/variables.css` definieren
- Pro Seite genau eine JS-Datei in `js/pages/`
- Firebase-Logik bleibt in `js/firebase/` — keine direkten Firebase-Calls in Page-Scripts
- Imprint- und Privacy-Styles leben in `css/global.css` (kein eigenes Stylesheet nötig)

## Seiten

| Seite | HTML | CSS | JS |
|---|---|---|---|
| Login / Register | `index.html` | `css/auth.css` | `js/pages/auth.js` |
| Summary | `pages/summary.html` | `css/summary.css` | `js/pages/summary.js` |
| Board | `pages/board.html` | `css/board.css` | `js/pages/board.js` |
| Add Task | `pages/add-task.html` | `css/add-task.css` | `js/pages/add-task.js` |
| Contacts | `pages/contacts.html` | `css/contacts.css` | `js/pages/contacts.js` |
| Imprint | `pages/imprint.html` | _(global.css)_ | — |
| Privacy | `pages/privacy.html` | _(global.css)_ | — |

## Firebase

- Config liegt in `js/firebase/config.js`
- Auth-Wrapper in `js/firebase/auth.js`
- Datenbankzugriffe in `js/firebase/database.js`
- Route-Schutz (Auth Guard) in `js/utils/auth-guard.js`

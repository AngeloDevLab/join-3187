# Join

Ein kollaboratives Kanban-Board als Multi-Page-Application (MPA), entwickelt im Rahmen einer agilen Gruppenarbeit.

## Tech Stack

- HTML, CSS, JavaScript (Vanilla)
- Firebase (Realtime Database / Authentication)

## Features

- Benutzerregistrierung & Login (inkl. Gast-Login)
- Kanban-Board mit den Spalten: To Do, In Progress, Awaiting Feedback, Done
- Tasks erstellen, bearbeiten, löschen
- Subtasks mit Fortschrittsanzeige
- Drag & Drop zwischen Spalten (Desktop)
- Echtzeit-Suche nach Tasks
- Kontaktverwaltung (hinzufügen, bearbeiten, löschen)
- Responsive Design (ab 320px, mobile-first)
- Begrüßungsnachricht je nach Tageszeit
- Dashboard mit Task-Übersicht
- Legal Notice & Privacy Policy

## Setup

1. Repository klonen:
   ```bash
   git clone https://github.com/<euer-repo>/join.git
   ```

2. Firebase-Projekt anlegen unter [firebase.google.com](https://firebase.google.com)

3. Firebase-Config in die App eintragen (z.B. `firebase.js` oder `config.js`) – **niemals in das Repository pushen**, stattdessen z.B. als Umgebungsvariablen oder lokal excluded via `.gitignore`

4. `index.html` im Browser öffnen – kein Build-Schritt notwendig

## Projektstruktur

```
join/
├── index.html          # Startseite / Login
├── board.html          # Kanban-Board
├── add-task.html       # Task erstellen
├── contacts.html       # Kontaktliste
├── summary.html        # Dashboard
├── legal-notice.html
├── privacy-policy.html
├── css/
├── js/
└── assets/
```

## Hinweise

- Alle Nutzer (inkl. Gast) teilen sich dasselbe Board und dieselben Kontakte
- Sensible Daten (Firebase-Credentials etc.) gehören **nicht** ins Repository
- Vor Abgabe: mindestens 5 Tasks und 10 Kontakte anlegen
- Getestet in: Chrome, Firefox, Safari, Edge (aktuellste Versionen)

## Team

| Name | Rolle |
|---|---|
| Christian M. | Developer |
| Mahad Yussuf Nur | Developer |
| Louis Juchem | Developer |
| Angelo Pietsch | Developer |
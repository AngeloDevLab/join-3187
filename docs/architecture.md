# Architecture

Join is a multi-page app: every page is a static HTML file with one page script. Shared logic sits in a few layers below the pages; only `src/services/` talks to Firebase.

## Layers

```mermaid
flowchart TB
    subgraph pages["src/pages/"]
        auth["auth<br/>AuthPage · LoginForm · SignupForm"]
        board["board<br/>BoardPage · TaskDetailModal"]
        contacts["contacts<br/>ContactsPage · ContactList · ContactDetails"]
        other["summary · add-task · help · legal"]
    end

    subgraph components["src/components/ (shared)"]
        taskform["TaskForm<br/>CategorySelect · AssignedSelect · SubtaskList"]
        ui["Modal · Dropdown · toast · navbar"]
    end

    subgraph services["src/services/"]
        authService["authService"]
        stores["taskStore · contactStore<br/>(Store base class)"]
        firebase["firebase.js<br/>app · auth · db"]
    end

    subgraph cloud["Firebase"]
        fbAuth["Authentication<br/>email/password · anonymous"]
        rtdb[("Realtime Database<br/>tasks · contacts")]
    end

    pages --> components
    pages --> services
    components --> services
    authService --> firebase
    stores --> firebase
    firebase --> fbAuth
    firebase --> rtdb
```

Rules that keep this shape:

- Pages and components never import the Firebase SDK; they only use `authService`, `taskStore` and `contactStore`.
- `src/components/` only holds what several pages use; page-only classes live in their page folder.

## Opening a protected page

```mermaid
sequenceDiagram
    autonumber
    participant Page as Page script (e.g. board.js)
    participant Guard as auth-guard.js
    participant Auth as authService
    participant Store as taskStore
    participant DB as Realtime Database

    Page->>Guard: import (first import)
    Guard->>Auth: await ready()
    alt not logged in
        Auth-->>Guard: false
        Guard->>Guard: redirect to login, never resolve
        Note over Page: page script does not run
    else logged in (user or guest)
        Auth-->>Guard: true
        Guard-->>Page: continue
        Page->>Store: subscribe(render)
        Store->>DB: onValue(tasks) — starts the listener
        DB-->>Store: snapshot
        Store-->>Page: render(tasks)
    end
```

## Saving a change

The page writes to the store and **does not re-render itself** — the listener does that, for this tab and for everyone else who has the board open.

```mermaid
sequenceDiagram
    autonumber
    participant UI as BoardPage
    participant Store as taskStore
    participant DB as Realtime Database
    participant Other as Other open tabs / users

    UI->>Store: update(id, { column: 'done' })
    Store->>DB: write (with auth token)
    Note over Store,UI: SDK applies the write locally first
    Store-->>UI: onValue → render (instant)
    alt write accepted
        DB-->>Other: onValue → render
    else write rejected (e.g. offline, rules)
        DB-->>Store: error — local change rolled back
        Store-->>UI: onValue → render previous state
        UI->>UI: error toast
    end
```

External writers — such as the planned n8n issue collector — write to the database directly with a service account. Every open page picks the change up through the same listener, without any extra code.

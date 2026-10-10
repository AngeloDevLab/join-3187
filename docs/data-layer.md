# Data Layer — Flow & Decisions

All data access goes through **live stores**: one per collection, built on the Firebase JS SDK. Pages subscribe to a store and re-render whenever its data changes — whether the change came from this tab, another user or an external automation.

```
Page (BoardPage, ContactsPage, summary, TaskForm, …)
  └── taskStore / contactStore             src/services/task-store.js, contact-store.js
        └── Store (base class)             src/services/store.js
              └── one onValue listener per collection
                    └── Firebase Realtime Database (SDK, src/services/firebase.js)
```

**Rule:** page scripts and components never import the Firebase SDK. They only use `taskStore`, `contactStore` and `authService`.

---

## Store API

`Store` is the base class; `TaskStore` (`tasks/`) and `ContactStore` (`contacts/`) extend it. Each exports one shared instance.

| Method | Purpose |
|---|---|
| `subscribe(callback)` | Calls `callback(entries)` once the data is loaded and again after every change. Returns an unsubscribe function. |
| `getAll()` | Resolves to all entries, keyed by id (`{}` when empty) |
| `getById(id)` | Resolves to one entry or `undefined` |
| `add(data)` | Creates an entry with a Firebase-generated id; resolves to the id |
| `update(id, data)` | Merges fields into an entry |
| `remove(id)` | Deletes an entry |
| `taskStore.create(values, column)` | Adds a task from form values and sets `column`, `order` (end of column) and `createdAt` |
| `contactStore.remove(id)` | Override: also removes the contact from every task's `assignedTo` |

The listener starts **lazily**, on the first `subscribe`/`getAll`/`getById`. The login page, for example, can add a contact during signup without ever loading the contact list.

---

## Read Flow

```
first subscribe() / getAll()
  └── onValue(ref)  ── first snapshot ──► data kept in the store
                                          └── every subscriber is called

every later change (any user, any tab, n8n, the console)
  └── onValue fires again ──► data replaced ──► subscribers re-render
```

There is exactly one listener per collection and page. `getAll()` and `getById()` read from the store's copy; they do not trigger requests.

## Write Flow

```
taskStore.update(id, { column: 'done' })
  ├── Firebase applies the write locally right away → onValue fires → page re-renders
  └── the write is sent to the server
        ├── success → nothing else to do
        └── failure → Firebase rolls the local change back → onValue fires → page shows the old state
                      the caller catches the error and shows an error toast
```

Pages therefore never re-render manually after a write. Saving and rendering are decoupled: the write goes to the store, and the subscription handles the UI.

`contactStore.remove(id)` is one **multi-path update**: it deletes `contacts/<id>` and rewrites the `assignedTo` list of every affected task in one atomic write. No task is ever left pointing at a deleted contact.

---

## Error Handling

Every write is awaited by its caller, and failures end in an error toast instead of an unhandled rejection:

| Where | On failure |
|---|---|
| `TaskForm` submit | Error toast; form stays filled; submit button re-enabled |
| `BoardPage` moves (drag & drop, "Move to") | Error toast; Firebase rollback restores the card |
| `TaskDetailModal` delete / subtask toggle | Error toast; the checkbox jumps back |
| Contact dialogs | Error toast; dialog stays open |

Submit buttons are disabled while a save is running, so a double click cannot create duplicates.

---

## Security

The database only accepts requests with a valid Firebase Auth token. The rules live in [database.rules.json](../database.rules.json):

- `tasks` and `contacts`: read and write for any logged-in user (`auth != null`), guests included
- everything else: denied

External services such as an n8n workflow authenticate with a **service account**, which bypasses the rules — the rules do not need loosening for automations.

---

## Decisions

**Why realtime listeners instead of the earlier request cache?**
The first version fetched each collection once per page over REST and cached it in memory, so other users' changes only appeared after a reload. With `onValue`, the board stays in sync across users and shows tasks created by external automations instantly. The listener's local copy also covers the cache's original purpose.

**Why the Firebase SDK instead of REST?**
The SDK attaches the auth token to every request automatically, so the security rules can protect the data. It also provides realtime listeners and local write handling. It loads as ES modules from the official CDN, so the app still runs without npm or a build step.

**Why a base class?**
Tasks and contacts need identical read, write and subscribe behaviour. `Store` implements it once, and the subclasses only add what is specific to them.

**Why keep the data keyed by id (`Object<string, …>`) instead of arrays?**
That is how the Realtime Database stores collections. Pages convert to arrays where they need sorting, for example the board via `toTaskView()`.

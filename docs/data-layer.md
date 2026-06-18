# Data Layer — Flow & Decisions

## Architecture

```
Page Script (e.g. board.js, summary.js)
  └── js/firebase/cache.js       — single entry point for all data access
        ├── Memory (module-level object, lives as long as the page is open)
        ├── sessionStorage        — survives page navigation within a session
        └── js/firebase/database.js — raw Firebase REST calls (last resort)
```

**Rule: page scripts never import `database.js` directly. Only `cache.js`.**

---

## Read Flow

```
getTasks() / getContacts() / getUsers()
  │
  ├─ memory hit?       → return immediately (no I/O)
  │
  ├─ sessionStorage hit? → populate memory → return (no Firebase call)
  │
  └─ cache miss        → fetch from Firebase
                          → write to sessionStorage
                          → write to memory
                          → return
```

On a typical session: Firebase is called **once per collection per tab**.
Every subsequent read (same page or after navigation) is served from cache.

---

## Write Flow

```
saveTask(data) / saveContact(data)
  │
  ├─ write to Firebase (POST)
  └─ update memory + sessionStorage in place  ← no refetch needed
     (addToCache adds the new entry by ID)

removeTask(id) / removeContact(id)
  │
  ├─ delete from Firebase (DELETE)
  └─ remove from memory + sessionStorage in place
```

Writes never trigger a refetch — the cache is updated directly with the
known change, keeping reads fast and Firebase calls minimal.

---

## Known Limitations

| Scenario | Behaviour |
|---|---|
| Same tab, own writes | Always consistent — cache updated on every write |
| Multiple tabs, same user | Each tab has its own cache — no sync between tabs |
| Two users simultaneously | Stale until page refresh — accepted trade-off |
| Tab close / reopen | sessionStorage cleared — fresh fetch on next visit |

Multi-tab synchronisation is **out of scope** for this project.
Firebase Realtime listeners (`onValue`) would be needed for that.

---

## Decisions

**Why three layers instead of just sessionStorage?**
The in-memory layer avoids `JSON.parse` on every read within the same page.
On data-heavy pages (board with many tasks), this matters.

**Why sessionStorage and not localStorage?**
sessionStorage is scoped to a tab and cleared on close. This prevents a returning
user from seeing data cached from a previous session without a fresh fetch.
localStorage would require explicit cache invalidation logic across sessions.

**Why update the cache in place on writes instead of invalidating?**
Invalidating forces a Firebase refetch on the next read. Updating in place
is cheaper and correct — we know exactly what changed.
The only edge case is concurrent writes from another user, which is already
a known limitation (see above).

**Why not use the Firebase SDK with real-time listeners?**
The SDK adds significant bundle weight and requires `npm`. This project runs
without a build tool and uses the Firebase REST API directly. Real-time sync
can be added later if the project requirements change.

# Data Layer — Flow & Decisions

## Architecture

```
Page Script (e.g. board.js, summary.js)
  └── js/firebase/cache.js       — single entry point for all data access
        ├── Memory (module-level object, lives only as long as the current page)
        └── js/firebase/database.js — raw Firebase REST calls (on a cache miss)
```

**Rule: page scripts never import `database.js` directly. Only `cache.js`.**

Because this is an MPA, every page navigation is a full browser navigation — the JS module
graph (and with it the `memory` object) is torn down and rebuilt from scratch. The cache
only avoids repeat Firebase calls for reads that happen *within* one page's lifetime
(e.g. re-rendering the board after a drag-and-drop); it does not persist across pages.

---

## Read Flow

```
getTasks() / getContacts() / getUsers()
  │
  ├─ memory hit?  → return immediately (no I/O)
  │
  └─ cache miss   → fetch from Firebase
                     → write to memory
                     → return
```

Within a single page load, Firebase is called **once per collection**. Navigating to a
different page always triggers a fresh fetch, since the memory cache doesn't survive
the navigation.

---

## Write Flow

```
saveTask(data) / saveContact(data)
  │
  ├─ write to Firebase (POST)
  └─ update memory in place  ← no refetch needed
     (addToCache adds the new entry by ID)

removeTask(id)
  │
  ├─ delete from Firebase (DELETE)
  └─ remove from memory in place

removeContact(id)
  │
  ├─ strip this contact's id from every task's assignedTo list (updateTask per affected task)
  ├─ delete the contact from Firebase (DELETE)
  └─ remove from memory in place
```

Writes never trigger a refetch — the cache is updated directly with the
known change, keeping reads fast and Firebase calls minimal.
`removeContact` is the one write that fans out to a second collection: it must clean up
`tasks` before the contact itself disappears, otherwise a task could keep referencing a
contact id that no longer exists.

---

## Known Limitations

| Scenario | Behaviour |
|---|---|
| Same page, own writes | Always consistent — cache updated on every write |
| Navigating to another page | Fresh Firebase fetch — memory cache doesn't survive navigation |
| Multiple tabs, same user | Each page/tab has its own cache — no sync between them |
| Two users simultaneously | Stale until the next page load — accepted trade-off |

Multi-tab / multi-user synchronisation is **out of scope** for this project.
Firebase Realtime listeners (`onValue`) would be needed for that.

---

## Decisions

**Why an in-memory layer at all, if it doesn't survive navigation?**
It still avoids redundant Firebase round-trips for the many reads that happen within a
single page's lifetime (e.g. re-rendering the board after every drag-and-drop, or
re-reading contacts after every add/edit/delete).

**Why not sessionStorage or localStorage for the data cache?**
That was the original plan, but it turned out unnecessary: each page already does exactly
one fetch per collection on load, and reads within that page hit memory. Persisting across
navigations would mean writing extra cache-invalidation logic (staleness after another
tab's write) for a saving that doesn't matter at this project's data volume.

**Why update the cache in place on writes instead of invalidating?**
Invalidating forces a Firebase refetch on the next read. Updating in place
is cheaper and correct — we know exactly what changed.
The only edge case is concurrent writes from another user, which is already
a known limitation (see above).

**Why not use the Firebase SDK with real-time listeners?**
The SDK adds significant bundle weight and requires `npm`. This project runs
without a build tool and uses the Firebase REST API directly. Real-time sync
can be added later if the project requirements change.

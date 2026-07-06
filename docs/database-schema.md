# Firebase Database Schema

> Status: Finalized

## Structure

```
users/
  {userId}/
    name: ""
    email: ""

tasks/
  {taskId}/
    title: ""
    description: ""
    category: "userStory"       # userStory | technicalTask
    priority: "medium"          # urgent | medium | low
    column: "todo"              # todo | inProgress | awaitFeedback | done
    order: 0                    # sort position within its column, set on create/drag-and-drop
    assignedTo: [contactId, ...]
    dueDate: timestamp
    createdAt: timestamp
    subtasks/
      {subtaskId}/
        title: ""
        done: false

contacts/
  {contactId}/
    name: ""
    email: ""
    phone: ""
```

## Decisions

| Topic | Decision |
|---|---|
| Board | Globally shared — all users see the same tasks and contacts |
| Contacts | Global — no `createdBy`, no `userId` reference |
| User entry | Created on signup with `name` and `email` only — `initials` is never persisted, it's derived from `name` on demand (`getInitials()` in `helpers.js`), same as for contacts |
| Guest login | No entry in `users/` — guest gets the exact same full read/write access as a registered user (create/edit/delete tasks and contacts), so employers reviewing the project can test every feature without signing up |
| Contact deletion | Removing a contact also strips its id from every task's `assignedTo` array (see `unassignContactFromTasks` in `cache.js`), so no task keeps referencing a deleted contact |
| Subtasks | Nested under task (Option A) — simpler queries, data lives with the task |
| Auth | Login only checks that the email exists — no password check, passwords are never persisted. Intentional simplification for this project's scope (see `docs/auth.md`) |

## Board Columns

| Key | Label |
|---|---|
| `todo` | To Do |
| `inProgress` | In Progress |
| `awaitFeedback` | Awaiting Feedback |
| `done` | Done |
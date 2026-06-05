# Firebase Database Schema

> Draft — to be finalized in team meeting before implementation.

## Structure

```
users/
  {userId}/
    name: ""
    email: ""
    createdAt: timestamp

tasks/
  {taskId}/
    title: ""
    description: ""
    category: "userStory"       # userStory | technicalTask
    priority: "medium"          # urgent | medium | low
    column: "todo"              # todo | inprogress | awaitingfeedback | done
    assignedTo: [userId, ...]   # array — multiple assignees possible
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

## Open Questions (discuss in meeting)

- **Contacts ownership** — are contacts shared across all users (global) or per user?
  - README says "all users share the same board and contacts" → suggests global
  - If global: remove any userId reference from contacts
  - If per user: add `createdBy: {userId}` to contacts

- **Guest login** — does a guest get a real user entry in `users/`?
  - Firebase Anonymous Auth creates a uid, so yes — but name/email would be empty
  - Or: skip writing guest users to the database entirely

- **Subtasks** — nested under task (Option A) vs. own top-level collection (Option B)
  - Option A (nested): simpler queries, data lives with the task
  - Option B (separate): easier to query all subtasks independently, more flexible
  - Recommendation: Option A unless subtasks need to be queried across tasks

## Board Columns

| Key | Label |
|---|---|
| `todo` | To Do |
| `inprogress` | In Progress |
| `awaitingfeedback` | Awaiting Feedback |
| `done` | Done |

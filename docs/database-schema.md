# Firebase Database Schema

> Status: Finalized

## Structure

```
users/
  {userId}/
    name: ""
    initials: ""
    email: ""

tasks/
  {taskId}/
    title: ""
    description: ""
    category: "userStory"       # userStory | technicalTask
    priority: "medium"          # urgent | medium | low
    column: "todo"              # todo | inprogress | awaitingfeedback | done
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
| User entry | Created on signup with `name`, `email`, and `initials` — initials are displayed in the header |
| Guest login | No entry in `users/` — guest receives read-only access to the board |
| Subtasks | Nested under task (Option A) — simpler queries, data lives with the task |
| Auth | Form validation active, backend validation as placeholder — real implementation follows |

## Board Columns

| Key | Label |
|---|---|
| `todo` | To Do |
| `inprogress` | In Progress |
| `awaitingfeedback` | Awaiting Feedback |
| `done` | Done |
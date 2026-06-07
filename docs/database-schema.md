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

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Board | Global geteilt — alle User sehen dieselben Tasks und Contacts |
| Contacts | Global — kein `createdBy`, kein `userId` Bezug |
| User-Eintrag | Wird beim Signup angelegt, nur `name` und `email` — wird für Initialen im Header gebraucht |
| Guest Login | Kein Eintrag in `users/` — Guest bekommt nur Lesezugriff auf das Board |
| Subtasks | Nested unter Task (Option A) — einfachere Queries, Daten leben beim Task |
| Auth | Formvalidierung aktiv, Backend-Validierung als Platzhalter — echte Implementierung folgt |

## Board Columns

| Key | Label |
|---|---|
| `todo` | To Do |
| `inprogress` | In Progress |
| `awaitingfeedback` | Awaiting Feedback |
| `done` | Done |
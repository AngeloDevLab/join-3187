# Firebase Database Schema

## Structure

```
tasks/
  {taskId}/                     # Firebase push id
    title: ""
    description: ""             # may be empty
    category: "userStory"       # userStory | technicalTask | bug
    priority: "medium"          # urgent | medium | low
    column: "triage"            # triage | todo | inProgress | awaitFeedback | done
    order: 1791637043949        # sort position within the column (see below)
    assignedTo: [contactId, …]  # optional — omitted when nobody is assigned
    dueDate: "2026-11-30"       # YYYY-MM-DD (date input format)
    createdAt: "2026-10-10"     # YYYY-MM-DD, set once on creation
    aiGenerated: true           # optional — set by n8n on tickets created from emails
    creator/                    # who created the task (missing on tasks from before 2026-10)
      name: ""
      email: ""                 # omitted for guests
      type: "internal"          # internal (team member, set by TaskStore.create) | external (stakeholder, set by n8n)
    subtasks/                   # optional — omitted when there are none
      subtask1/
        title: ""
        done: false

contacts/
  {contactId}/                  # Firebase push id
    name: ""
    email: ""
    phone: ""                   # digits, optional leading "+"; may be empty for self-added users

requestStats/
  {date}/                       # YYYY-MM-DD in Berlin time, e.g. "2026-10-13"
    count: 3                    # tickets the n8n Issue Collector created from emails that day
```

There is no `users/` collection: accounts live in **Firebase Authentication**, which stores the email, the password hash and the display name. Registering also creates a matching entry in `contacts/`.

## Field Notes

| Field | Notes |
|---|---|
| `category` | The database key. Labels ("User Story") and badge classes come from `CATEGORY_META` in [task-view.js](../src/utils/task-view.js); the task form's options use the keys as `data-value` |
| `order` | New tasks get `Date.now()` and land at the end of their column. Drag & drop places a task between two neighbours with the midpoint of their orders (`computeOrderBetween()` in [helpers.js](../src/utils/helpers.js)), so no other task has to be rewritten |
| `assignedTo` | Contact ids. Ids of deleted contacts are removed together with the contact (see below); the UI also skips unknown ids |
| `creator` | Stored by value, not as a contact id, so it survives deleting the contact and also works for stakeholders who are no contact. The task detail finds the member's contact by email for the "Profile" link; external creators get a mailto "E-mail" link |
| `subtasks` | Keyed `subtask1…n` in list order; the keys are regenerated whenever the task is saved from the form |
| empty values | The Realtime Database does not store empty arrays or objects, so `assignedTo: []` or `subtasks: {}` simply disappear. Readers treat a missing field as empty |

## Decisions

| Topic | Decision |
|---|---|
| Board | Globally shared — all users see the same tasks and contacts |
| Contacts | Global — no owner field |
| Accounts | Firebase Authentication; no user data duplicated in the database except the self-contact created on signup |
| Guest login | Anonymous Firebase account — same read/write access as a registered user, so reviewers can test every feature without signing up |
| Access | `tasks` and `contacts` only for authenticated requests (incl. guests); `requestStats` is publicly readable for the stakeholder page, and only n8n writes it (service account, bypasses the rules); see [database.rules.json](../database.rules.json) |
| Request limit | n8n reads `requestStats/<today>` before calling the AI and increments it after creating a ticket; at 10 the mail goes to "zu bearbeiten" instead. The request page shows the same counter live |
| Contact deletion | One multi-path update removes the contact and strips its id from every task's `assignedTo` (`ContactStore.remove()`) |
| Subtasks | Nested under the task — read and written together with it |
| Initials / avatar colors | Never stored — derived from the name and the contact id when rendering |

## Board Columns

| Key | Label |
|---|---|
| `triage` | Triage — backlog; every new task lands here (Add Task and n8n) |
| `todo` | To Do |
| `inProgress` | In Progress |
| `awaitFeedback` | Awaiting Feedback |
| `done` | Done |

# Firebase Setup

## Prerequisites

- Google Account
- Firebase Project (free Spark Plan is sufficient)

## 1. Create a Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name — Google Analytics can be disabled

## 2. Create a Realtime Database

1. In the left menu under "Build" → "Realtime Database"
2. Click "Create database"
3. Choose a location (e.g. `europe-west1`)
4. Select test mode — rules can be adjusted later

## 3. Configure the Project

1. Click the gear icon (top left) → "Project settings"
2. Scroll down to "Your apps" → register a Web App
3. Enter the base URL into `config.js`:

```javascript
// config.js
export const DB_URL = "https://{your-project}.firebaseio.com"
```

The base URL can be found in the Realtime Database under "Data" — it is displayed directly above the data tree.

> `config.js` is listed in `.gitignore` — do not commit it. Only `config.example.js` goes into the repo.

## 4. Database Rules

In test mode, read and write access is open. For production the rules should be adjusted:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## 5. API Usage

All requests go against:
```
{FIREBASE_BASE_URL}/{collection}.json
```

| Method | Description |
|---|---|
| `GET` | Read data |
| `POST` | Create a new entry (Firebase generates the ID) |
| `PUT` | Overwrite an entry |
| `PATCH` | Partially update an entry |
| `DELETE` | Delete an entry |

Example:
```javascript
import { DB_URL } from './config.js'

// Fetch all tasks
const res = await fetch(`${DB_URL}/tasks.json`)
const data = await res.json()
```
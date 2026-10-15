# n8n — Issue Collector

Turns stakeholder emails into tickets in Join's Triage column.

| Workflow | Trigger | What it does |
|---|---|---|
| `issue-collector.json` | new mail in the inbox (IMAP) | skips auto-replies, checks the daily limit, lets Gemini analyse the mail (category, title, priority, deadline, subtasks), creates the ticket, replies and moves the mail to `erledigt` / `zu bearbeiten` |
| `request-form.json` | `POST /webhook/join-request` | validates the stakeholder form and mails it to the inbox (Reply-To = stakeholder) |
| `column-change.json` | `POST /webhook/join-column-change` | waits 5 minutes, re-reads the task and mails the external creator if it now sits in a new column |

The two webhook workflows must be active (published); the IMAP workflow too, once n8n runs permanently.

## Run locally

```bash
cd n8n
cp .env.example .env   # then set N8N_ENCRYPTION_KEY
docker compose up -d
```

Open http://localhost:5678 and create the owner account on first start.
Credentials (Gmail IMAP/SMTP, AI API, Firebase) are entered in the n8n UI only — they live in the Docker volume, never in this repo.

## Server

In production n8n runs on a Hetzner Cloud server (Ubuntu, Docker) at `https://n8n.angelodevelopment.de`:

- **Caddy** (`/opt/caddy`) is the only container with open ports (80/443). It gets the HTTPS certificate automatically and forwards the subdomain to `n8n:5678` over the shared Docker network `web`.
- **n8n** (`/opt/n8n`) uses the same compose file as above, but without `ports:`, joined to the `web` network, plus:
  ```yaml
  - N8N_HOST=n8n.angelodevelopment.de
  - N8N_PROTOCOL=https
  - WEBHOOK_URL=https://n8n.angelodevelopment.de/
  - N8N_PROXY_HOPS=1
  ```
- The data was moved from the local instance by copying the Docker volume and `.env` — the same `N8N_ENCRYPTION_KEY` keeps the saved credentials readable.
- Hetzner blocks outgoing SMTP on ports 25 and 465 for new accounts, so the SMTP credential uses `smtp.gmail.com:587` (STARTTLS).

## Workflows

Exported workflows live in `workflows/` (mounted into the container at `/workflows`).

```bash
# export all workflows (one JSON file each), then strip owner data and rename
docker compose exec n8n n8n export:workflow --all --separate --pretty --output=/workflows/
node clean-exports.mjs

# import them into a fresh instance
docker compose exec n8n n8n import:workflow --separate --input=/workflows
```

Exports contain credential names and IDs, but no secrets. `clean-exports.mjs` removes the `shared` block, which holds the owner's name and email.

A fresh instance also needs the community node `n8n-nodes-imap` (Settings → Community nodes), which moves processed mails to the `erledigt` / `zu bearbeiten` folders.

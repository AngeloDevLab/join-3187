# n8n — Issue Collector

Turns stakeholder emails into tickets in Join's Triage column.

## Run locally

```bash
cd n8n
cp .env.example .env   # then set N8N_ENCRYPTION_KEY
docker compose up -d
```

Open http://localhost:5678 and create the owner account on first start.
Credentials (Gmail IMAP/SMTP, AI API, Firebase) are entered in the n8n UI only — they live in the Docker volume, never in this repo.

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

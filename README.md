# team-in-a-box
📦

## Setup
Setup requires many manual steps at the moment unfortunately, will automate more of it later.

### Digital ocean
Create digital ocean account and set `DIGITAL_OCEAN_TOKEN` to a personal access token.

Generate ssh key via `./scripts/ssh-keygen.sh your_email@example.com`.

Add the ssh key to your digital ocean account (name the key 'local-tiab')

### Cloudflare
Create a cloudflare account to be able to deploy workers

### MongoDB
- Create a mongo account and spin up a free tier db
- Create a mongo atlas app
- Give it permission to write and read to everything
- Create a username/password combo
- Will need to add `readAndWriteAll` roles to all tables
- [Set up vector search index](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain-js/#create-the-atlas-vector-search-index) on slack_data collection

### Slack
Make a slack app
Add inbound-event-worker to the slack app (https://api.slack.com/apps/A07HPTF0BMF/event-subscriptions?)

### Add to root .env
```
DIGITAL_OCEAN_TOKEN
DIGITAL_OCEAN_DROPLET_IP
DIGITAL_OCEAN_SSH_FINGERPRINT

CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN

ANTHROPIC_API_KEY
OPENAI_API_KEY

TIAB_DOCKER_REGISTRY

NEON_DB_USER
NEON_DB_PASS
NEON_DB_HOST
NEON_DB_NAME
```

### Syncing secrets
After modifying the root .env file, you'll need to sync the secrets for each cloduflare worker (eventually will do in bulk).
Cd into apps/{some_worker} and run `npm run sync-secrets`

### Brain
Set
```
BRAIN_SECRET_TOKEN={your_secret_here}
```

### Github

Create a github org
Create [github apps](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) per persona
Add in app id, client id, and secret to persona DB record

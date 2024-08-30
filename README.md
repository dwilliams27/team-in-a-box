# team-in-a-box
📦

## Setup

### Digital ocean
Create digital ocean account and set `DIGITAL_OCEAN_TOKEN` to a personal access token.

Generate ssh key via `./scripts/ssh-keygen.sh your_email@example.com`.

Add the ssh key to your digital ocean account (name the key 'local-tiab')

### Cloudflare
Create a cloudflare account to be able to deploy workers

### MongoDB
Create a mongo account and spin up a free tier db
You will also need to create a mongo atlas app. Put the app id in the .env file
Will also need to enable api key based login in the mongo atlas app

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
TIAB_DOCKER_REGISTRY

MONGO_DB_URI

ATLAS_APP_ID
ATLAS_APP_PUBLIC_KEY
ATLAS_APP_PRIVATE_KEY
```


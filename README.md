## team-in-a-box
📦

### Building infra

#### Env vars to set
ANTHROPIC_API_KEY
LANGCHAIN_API_KEY
TAVILY_API_KEY
MONGO_DB_URI

#### event-stream-lambda
Processes inbound events from webhooks like slack and posts to SQS for processing.

```sh
./build.sh
# Use output api_gateway_url in Slack App webhook
```


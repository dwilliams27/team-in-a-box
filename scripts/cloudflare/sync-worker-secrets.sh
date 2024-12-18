#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
# Specify the .env file path
ENV_FILE="$PROJECT_ROOT/.env"

# Specify the secrets you want to include
SECRETS=("DATABASE_URL" "OPENAI_API_KEY")

# Initialize an empty JSON object
json="{"

# Loop through the specified secrets
for secret in "${SECRETS[@]}"; do
    # Extract the value for each secret
    value=$(grep "^$secret=" "$ENV_FILE" | sed 's/^[^=]*=//; s/^"//; s/"$//')
    
    # Add the secret and value to the JSON object
    json+="\"$secret\":\"$value\","
done

# Remove the trailing comma and close the JSON object
json="${json%,}}"

echo "$json"

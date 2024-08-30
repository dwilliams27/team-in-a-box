#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <email_address>"
    exit 1
fi

email="$1"
key_name="tiab-do-ssh-key"

ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/$key_name

echo -e "\nYour public key:"
cat ~/.ssh/${key_name}.pub
curl -X POST -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $DIGITAL_OCEAN_TOKEN" \
  -d '{
    "name": "brain",
    "size": "s-1vcpu-512mb-10gb",
    "region": "nyc1",
    "image": "ubuntu-24-04-x64",
    "ssh_keys": ["'"$DIGITAL_OCEAN_SSH_FINGERPRINT"'"],
    "tags": ["project:box"]
  }' \
  "https://api.digitalocean.com/v2/droplets"

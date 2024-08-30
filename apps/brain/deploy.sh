#!/bin/bash

# Build the Docker image
docker-compose build

# Tag the image
docker tag brain:latest $TIAB_DOCKER_REGISTRY/brain:latest

# Push the image to your Docker registry
docker push $TIAB_DOCKER_REGISTRY/brain:latest

# SSH into your Digital Ocean droplet and pull/run the new image
ssh root@$DIGITAL_OCEAN_DROPLET_IP << EOF
  docker pull $TIAB_DOCKER_REGISTRY/brain:latest
  docker stop brain || true
  docker rm brain || true
  docker run -d --name brain -p 3000:3000 $TIAB_DOCKER_REGISTRY/brain:latest
EOF

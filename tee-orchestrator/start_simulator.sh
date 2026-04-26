#!/bin/bash
# Stop and remove existing simulator if any
docker stop dstack-simulator 2>/dev/null || true
docker rm dstack-simulator 2>/dev/null || true

# Run the simulator
# It needs to expose the socket to the host so it can be mounted into other containers
docker run -d --name dstack-simulator \
  -v /var/run/dstack.sock:/var/run/dstack.sock \
  phalanetwork/dstack-simulator

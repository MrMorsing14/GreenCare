#!/bin/sh
# Runs from the official nginx image's /docker-entrypoint.d before nginx starts.
# Backgrounds a loop that reloads nginx every 6h so renewed Let's Encrypt certs
# are picked up without restarting the container.
( while :; do sleep 6h; nginx -s reload; done ) &

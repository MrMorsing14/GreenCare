#!/usr/bin/env bash
# Bootstrap Let's Encrypt certificates for GreenCare.
#
# Solves the chicken-and-egg problem: nginx won't start if its 443 server block
# references certs that don't exist yet. We drop in a temporary self-signed cert,
# start nginx, obtain the real cert over HTTP-01, then reload.
#
# Usage:  cp .env.example .env  &&  edit .env  &&  ./init-letsencrypt.sh
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example to .env and fill it in." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; . ./.env; set +a

: "${DOMAIN:?Set DOMAIN in .env}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL in .env}"

# Set to 1 to hit Let's Encrypt's staging API while testing (avoids rate limits)
STAGING=0

cert_path="./certbot/conf/live/$DOMAIN"

echo "### Creating dummy certificate for $DOMAIN ..."
mkdir -p "$cert_path" ./certbot/www
docker run --rm -v "$(pwd)/certbot/conf:/etc/letsencrypt" certbot/certbot \
  sh -c "openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'"

echo "### Starting nginx ..."
docker compose up -d nginx

echo "### Deleting dummy certificate ..."
docker run --rm -v "$(pwd)/certbot/conf:/etc/letsencrypt" certbot/certbot \
  sh -c "rm -rf /etc/letsencrypt/live/$DOMAIN \
    /etc/letsencrypt/archive/$DOMAIN \
    /etc/letsencrypt/renewal/$DOMAIN.conf"

echo "### Requesting Let's Encrypt certificate for $DOMAIN ..."
staging_arg=""
if [ "$STAGING" != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  $staging_arg \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos --no-eff-email \
  -d "$DOMAIN"

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload

echo "### Done. Bring the full stack up with:  docker compose up -d"

#!/bin/sh
set -e

HTML=/usr/share/nginx/html/in-person-portal

# Runtime config for the Angular app and the SOR server
envsubst < $HTML/assets/env.template.js > $HTML/assets/env.js
envsubst < /app/.env.template > /app/.env

# nginx config: only substitute our variables, keep nginx's own $uri etc.
if [ -n "$GIPS_UPSTREAM" ]; then
  export GIPS_LOCATION="location /gips/ { proxy_pass ${GIPS_UPSTREAM%/}/gips/; proxy_ssl_server_name on; proxy_set_header Host \$proxy_host; }"
else
  export GIPS_LOCATION=""
fi
envsubst '${PORT} ${SOR_SERVER_PORT} ${GIPS_LOCATION}' < /app/nginx.conf.template > /etc/nginx/http.d/portal.conf

node /app/Server.js &
exec nginx -g 'daemon off;'

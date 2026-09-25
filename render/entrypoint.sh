#!/bin/sh
set -e

HTML=/usr/share/nginx/html/in-person-portal

# The portal POSTs credential offers to <oid4vciHost>/offer from the browser.
# Proxy that through nginx so the call is same-origin (no CORS needed on the
# issuer), and point the app at the proxy.
if [ -n "$OID_4_VCI_HOST" ]; then
  export OFFER_LOCATION="location = /offer { proxy_pass ${OID_4_VCI_HOST%/}/offer; proxy_ssl_server_name on; proxy_set_header Host \$proxy_host; }"
  OID_4_VCI_HOST=""
else
  export OFFER_LOCATION=""
fi

# Runtime config for the Angular app and the SOR server
envsubst < $HTML/assets/env.template.js > $HTML/assets/env.js
envsubst < /app/.env.template > /app/.env

# nginx config: only substitute our variables, keep nginx's own $uri etc.
if [ -n "$GIPS_UPSTREAM" ]; then
  export GIPS_LOCATION="location /gips/ { proxy_pass ${GIPS_UPSTREAM%/}/gips/; proxy_ssl_server_name on; proxy_set_header Host \$proxy_host; }"
else
  export GIPS_LOCATION=""
fi
envsubst '${PORT} ${SOR_SERVER_PORT} ${GIPS_LOCATION} ${OFFER_LOCATION}' < /app/nginx.conf.template > /etc/nginx/http.d/portal.conf

node /app/Server.js &
exec nginx -g 'daemon off;'

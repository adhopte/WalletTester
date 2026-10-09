#!/bin/sh
set -e

HTML=/usr/share/nginx/html/in-person-portal

# ISSUER_URL / PORTAL_USE_CASES take precedence over the older OID_4_VCI_HOST /
# SUPPORTED_USE_CASES names, so a service created with the old names follows the
# image defaults unless the new names are set explicitly.
OID_4_VCI_HOST="${ISSUER_URL:-$OID_4_VCI_HOST}"
export SUPPORTED_USE_CASES="${PORTAL_USE_CASES:-$SUPPORTED_USE_CASES}"
# Shown in the portal footer; Render sets RENDER_GIT_COMMIT
export APP_VERSION="$(printf '%s' "${APP_VERSION:-$RENDER_GIT_COMMIT}" | cut -c1-7)"

# The portal POSTs credential offers to <oid4vciHost>/offer from the browser.
# Proxy that through nginx so the call is same-origin (no CORS needed on the
# issuer), and point the app at the proxy.
if [ -n "$OID_4_VCI_HOST" ]; then
  # Origin/Referer are dropped so the issuer sees a plain server-to-server call
  # (like the Bruno collection), not a cross-origin browser request.
  ISSUER_PROXY="proxy_ssl_server_name on; proxy_set_header Host \$proxy_host; proxy_set_header Origin \"\"; proxy_set_header Referer \"\"; proxy_connect_timeout 10s; proxy_read_timeout 30s;"
  # /offer creates offers; the metadata lets the portal pick valid credential configuration ids
  export OFFER_LOCATION="location = /offer { proxy_pass ${OID_4_VCI_HOST%/}/offer; $ISSUER_PROXY } location = /.well-known/openid-credential-issuer { proxy_pass ${OID_4_VCI_HOST%/}/.well-known/openid-credential-issuer; proxy_set_header Accept application/json; $ISSUER_PROXY }"
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

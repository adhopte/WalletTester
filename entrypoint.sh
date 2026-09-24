#!/bin/sh

# Optionally generate env.js for Angular Js 
envsubst < /usr/share/nginx/html/in-person-portal/assets/env.template.js > /usr/share/nginx/html/in-person-portal/assets/env.js

# Optionally generate .env for node server
envsubst < /app/.env.template > /app/.env

# Start Node.js in background
node Server.js &

# Start Nginx in foreground
nginx -g 'daemon off;'

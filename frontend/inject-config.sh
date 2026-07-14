#!/bin/sh
# =============================================================
# inject-config.sh — Runs inside Nginx docker container on startup
# Generates config.js dynamically based on the API_BASE env var
# =============================================================

echo "window.CONFIG = { API_BASE: '${API_BASE:-/api}' };" > /usr/share/nginx/html/config.js

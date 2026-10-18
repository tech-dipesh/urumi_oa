#!/usr/bin/env bash
set -euo pipefail
apps="woo-mcp gateway time-mcp notes-mcp"
for app in $apps; do docker build -f apps/Dockerfile --build-arg APP="$app" -t "$app:0.1.0" .; done
k3d image import woo-mcp:0.1.0 gateway:0.1.0 time-mcp:0.1.0 notes-mcp:0.1.0 -c urumi

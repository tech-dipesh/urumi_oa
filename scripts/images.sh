#!/usr/bin/env bash
set -euo pipefail
docker build -f apps/woo-mcp/Dockerfile -t woo-mcp:0.1.0 .
k3d image import woo-mcp:0.1.0 -c urumi

#!/usr/bin/env bash
set -uo pipefail
ctx="${KUBE_CONTEXT:-k3d-urumi}"
k() { kubectl --context "$ctx" "$@"; }
k -n platform scale deployment/time-mcp deployment/notes-mcp --replicas=1
k -n platform rollout restart deployment/notes-mcp
k -n platform rollout status deployment/notes-mcp --timeout=90s
bash scripts/check.sh
echo
echo "keep this part off screen while recording"
echo "store admin:      admin / $(k -n store get secret store-secrets -o jsonpath='{.data.wp-admin-password}' | base64 -d)   http://store.localhost:8080/wp-admin"
echo "dashboard admin:  admin@urumi.local / $(k -n platform get secret gateway-secrets -o jsonpath='{.data.admin-password}' | base64 -d)   http://app.localhost:8080"

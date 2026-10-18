#!/usr/bin/env bash
set -euo pipefail
k() { kubectl --context k3d-urumi "$@"; }
for ns in platform store; do k create namespace "$ns" --dry-run=client -o yaml | k apply -f -; done
if ! k -n store get secret store-secrets >/dev/null 2>&1; then
  k -n store create secret generic store-secrets --from-literal=mysql-root-password="$(openssl rand -hex 16)" --from-literal=mysql-password="$(openssl rand -hex 16)" --from-literal=wp-admin-password="$(openssl rand -hex 12)"
  echo "wp admin password:"
  k -n store get secret store-secrets -o jsonpath='{.data.wp-admin-password}' | base64 -d
  echo
fi
k -n store get secret woo-mcp-secrets >/dev/null 2>&1 || k -n store create secret generic woo-mcp-secrets --from-literal=consumer-key="ck_$(openssl rand -hex 20)" --from-literal=consumer-secret="cs_$(openssl rand -hex 20)" --from-literal=mcp-token="$(openssl rand -hex 24)"
echo "secrets ready"

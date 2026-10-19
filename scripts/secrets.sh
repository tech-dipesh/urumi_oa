#!/usr/bin/env bash
set -euo pipefail
k() { kubectl --context "${KUBE_CONTEXT:-k3d-urumi}" "$@"; }
for ns in platform store; do k create namespace "$ns" --dry-run=client -o yaml | k apply -f -; done
if ! k -n store get secret store-secrets >/dev/null 2>&1; then
  k -n store create secret generic store-secrets --from-literal=mysql-root-password="$(openssl rand -hex 16)" --from-literal=mysql-password="$(openssl rand -hex 16)" --from-literal=wp-admin-password="$(openssl rand -hex 12)"
  echo "wp admin password:"
  k -n store get secret store-secrets -o jsonpath='{.data.wp-admin-password}' | base64 -d
  echo
fi
k -n store get secret woo-mcp-secrets >/dev/null 2>&1 || k -n store create secret generic woo-mcp-secrets --from-literal=consumer-key="ck_$(openssl rand -hex 20)" --from-literal=consumer-secret="cs_$(openssl rand -hex 20)" --from-literal=mcp-token="$(openssl rand -hex 24)"
if ! k -n platform get secret gateway-secrets >/dev/null 2>&1; then
  woo_token="$(k -n store get secret woo-mcp-secrets -o jsonpath='{.data.mcp-token}' | base64 -d)"
  k -n platform create secret generic gateway-secrets --from-literal=postgres-password="$(openssl rand -hex 16)" --from-literal=secret-key="$(openssl rand -hex 32)" --from-literal=woo-mcp-token="$woo_token"
fi
if [ -z "$(k -n platform get secret gateway-secrets -o jsonpath='{.data.admin-password}')" ]; then
  admin_pw="$(openssl rand -hex 12)"
  k -n platform patch secret gateway-secrets --type merge -p "{\"stringData\":{\"admin-password\":\"$admin_pw\"}}"
  echo "gateway admin login: admin@urumi.local / $admin_pw"
fi
echo "secrets ready"

#!/usr/bin/env bash
set -euo pipefail
for ns in platform store; do kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -; done
kubectl -n store get secret store-secrets >/dev/null 2>&1 && echo "store-secrets already there" && exit 0
kubectl -n store create secret generic store-secrets --from-literal=mysql-root-password="$(openssl rand -hex 16)" --from-literal=mysql-password="$(openssl rand -hex 16)" --from-literal=wp-admin-password="$(openssl rand -hex 12)"
echo "wp admin password:"
kubectl -n store get secret store-secrets -o jsonpath='{.data.wp-admin-password}' | base64 -d
echo

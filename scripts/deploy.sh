#!/usr/bin/env bash
set -euo pipefail
helm upgrade --install platform charts/platform --kube-context "${KUBE_CONTEXT:-k3d-urumi}" -n platform -f "charts/platform/values-${1:-local}.yaml" --timeout 15m
kubectl --context "${KUBE_CONTEXT:-k3d-urumi}" get pods -A | grep -E "store|platform"

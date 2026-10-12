#!/usr/bin/env bash
set -euo pipefail
helm upgrade --install platform charts/platform -n platform -f "charts/platform/values-${1:-local}.yaml" --timeout 15m
kubectl get pods -A | grep -E "store|platform"

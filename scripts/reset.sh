#!/usr/bin/env bash
set -uo pipefail
helm uninstall platform -n platform --kube-context k3d-urumi || true
kubectl --context k3d-urumi -n platform delete secret -l owner=helm || true
kubectl --context k3d-urumi delete namespace store --wait=true || true
echo "clean, now run pn secrets then pn release"

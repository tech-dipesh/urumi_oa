#!/usr/bin/env bash
set -euo pipefail
k3d cluster list urumi >/dev/null 2>&1 && echo "cluster urumi already up" && exit 0
k3d cluster create urumi -p "80:80@loadbalancer" --wait
kubectl get nodes

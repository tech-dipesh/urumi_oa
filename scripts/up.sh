#!/usr/bin/env bash
set -euo pipefail
port="${HTTP_PORT:-8080}"
k3d cluster list urumi >/dev/null 2>&1 || k3d cluster create urumi --api-port 127.0.0.1:6550 -p "${port}:80@loadbalancer" --wait
k3d kubeconfig merge urumi -d -s >/dev/null
api="$(docker port k3d-urumi-serverlb 6443/tcp | sed -n '1s/.*://p')"
kubectl config set-cluster k3d-urumi --server="https://127.0.0.1:${api}"
kubectl --context k3d-urumi get nodes
echo "store will be at http://store.localhost:${port}"

#!/usr/bin/env bash
set -euo pipefail
key="${GROQ_API_KEY:-${GROQ_API:-}}"
[ -n "$key" ] || { read -r -s -p "paste your Groq API key (hidden): " key; echo; }
kubectl --context "${KUBE_CONTEXT:-k3d-urumi}" -n platform patch secret gateway-secrets --type merge -p "{\"stringData\":{\"groq-api-key\":\"$key\"}}"
kubectl --context "${KUBE_CONTEXT:-k3d-urumi}" -n platform rollout restart deployment/gateway
echo "groq key stored in the cluster secret, gateway restarting"

#!/usr/bin/env bash
set -uo pipefail
url=http://woo-mcp.store.svc.cluster.local:3000/healthz
run() { kubectl --context k3d-urumi -n platform run "$1" --rm -i --restart=Never --labels="app=$2" --image=curlimages/curl:latest --image-pull-policy=IfNotPresent -- curl -s -o /dev/null -w "%{http_code}\n" --max-time 6 "$url"; }
echo "pod labeled app=gateway (expect 200):"
run np-allowed gateway
echo "pod labeled app=intruder (expect 000, blocked):"
run np-denied intruder

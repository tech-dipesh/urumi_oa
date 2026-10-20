#!/usr/bin/env bash
set -uo pipefail
port="${HTTP_PORT:-8080}"
ctx="${KUBE_CONTEXT:-k3d-urumi}"
code() { curl -s -o /dev/null -m 8 -w "%{http_code}" --resolve "$1:$port:127.0.0.1" "${@:3}" "http://$1:$port$2"; }
echo "store home (expect 200):           $(code store.localhost /)"
echo "dashboard (expect 200):            $(code app.localhost /)"
echo "api without login (expect 401):    $(code app.localhost /api/servers)"
echo "mcp without key (expect 401):      $(code app.localhost /mcp -X POST -H 'Content-Type: application/json' -d '{}')"
echo "pods that are not ready:"
notready="$(kubectl --context "$ctx" get pods -A --no-headers | awk '{split($3, r, "/"); if ($4 != "Completed" && r[1] != r[2]) print}')"
echo "${notready:-none}"

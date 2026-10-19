#!/usr/bin/env bash
set -euo pipefail
ctx=k3d-urumi
token="$(kubectl --context $ctx -n platform get secret gateway-secrets -o jsonpath='{.data.bootstrap-token}' | base64 -d)"
kubectl --context $ctx -n platform port-forward svc/gateway 3100:3000 >/dev/null &
pf=$!
trap 'kill $pf' EXIT
sleep 4
api() { curl -s -H "Authorization: Bearer $token" "http://localhost:3100$1"; echo; }
call() { curl -s -X POST http://localhost:3100/mcp -H "Authorization: Bearer $token" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "$1"; echo; }
echo "without token (expect 401):"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/api/servers
echo "servers and status:"
api /api/servers | grep -o '"name":"[a-z-]*"\|"status":"[a-z]*"' | paste -sd' '
echo "tools through the gateway:"
call '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -o '"name":"[a-z_]*__[a-z_]*"'
echo "time:"
call '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"time__get_time","arguments":{"timezone":"Asia/Kolkata"}}}'
echo "note:"
call '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"notes__add_note","arguments":{"text":"gateway works"}}}'
echo "orders from the store:"
call '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"woo__list_orders","arguments":{}}}'

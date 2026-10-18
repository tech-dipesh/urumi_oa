#!/usr/bin/env bash
set -euo pipefail
ctx=k3d-urumi
token="$(kubectl --context $ctx -n store get secret woo-mcp-secrets -o jsonpath='{.data.mcp-token}' | base64 -d)"
kubectl --context $ctx -n store port-forward svc/woo-mcp 3000:3000 >/dev/null &
pf=$!
trap 'kill $pf' EXIT
sleep 4
call() { curl -s -X POST http://localhost:3000/mcp -H "Authorization: Bearer $token" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "$1"; echo; }
echo "without token (expect 401):"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{}'
echo "tools:"
call '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -o '"name":"[a-z_]*"'
echo "products:"
call '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_products","arguments":{}}}'
echo "orders:"
call '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_orders","arguments":{}}}'

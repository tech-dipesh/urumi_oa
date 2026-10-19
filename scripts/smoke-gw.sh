#!/usr/bin/env bash
set -euo pipefail
ctx=k3d-urumi
url=http://localhost:3100
admin_email="${ADMIN_EMAIL:-admin@urumi.local}"
admin_pw="$(kubectl --context $ctx -n platform get secret gateway-secrets -o jsonpath='{.data.admin-password}' | base64 -d)"
kubectl --context $ctx -n platform port-forward svc/gateway 3100:3000 >/dev/null &
pf=$!
jar="$(mktemp)"
trap 'kill $pf; rm -f "$jar"' EXIT
sleep 4
api() { curl -s -b "$jar" -H "Content-Type: application/json" "$@"; }
field() { grep -o "\"$1\":\"[^\"]*\"" | head -1 | cut -d'"' -f4; }
echo "without login (expect 401):"
curl -s -o /dev/null -w "%{http_code}\n" $url/api/servers
echo "admin login:"
curl -s -c "$jar" -H "Content-Type: application/json" -d "{\"email\":\"$admin_email\",\"password\":\"$admin_pw\"}" $url/api/auth/login
echo
echo "servers and status:"
api $url/api/servers | grep -o '"name":"[a-z-]*","url"\|"status":"[a-z]*"' | sed 's/,"url"//' | paste -sd' '
echo "invite member bob (409 means he already exists):"
api -X POST -d '{"email":"bob@urumi.local"}' -o /dev/null -w "%{http_code}\n" $url/api/users
bob_id="$(api $url/api/users | grep -o '"id":"[^"]*","email":"bob@urumi.local"' | cut -d'"' -f4)"
echo "admin issues an api key for bob:"
made="$(api -X POST -d "{\"label\":\"smoke\",\"user_id\":\"$bob_id\"}" $url/api/keys)"
key="$(echo "$made" | field key)"
key_id="$(echo "$made" | field id)"
echo "${key:0:8}... (shown once, stored hashed)"
mcp() { curl -s -X POST $url/mcp -H "Authorization: Bearer $key" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "$1"; echo; }
echo "bob sees these tools:"
mcp '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -o '"name":"[a-z_]*__[a-z_]*"' | paste -sd' '
echo "bob saves a note:"
mcp '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"notes__add_note","arguments":{"text":"bob was here"}}}'
echo "bob asks the store for orders:"
mcp '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"woo__list_orders","arguments":{}}}'
echo "audit log, newest first:"
api "$url/api/audit?limit=4" | grep -o '"user_email":"[^"]*"\|"tool":"[^"]*"\|"ok":[a-z]*' | paste -sd' '
echo "revoke bob's key (204), then bob calls again (expect 401):"
api -X DELETE -o /dev/null -w "%{http_code}\n" $url/api/keys/$key_id
curl -s -o /dev/null -w "%{http_code}\n" -X POST $url/mcp -H "Authorization: Bearer $key" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":4,"method":"tools/list"}'

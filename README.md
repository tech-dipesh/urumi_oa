# Urumi FDE Intern Online Assessement
- We have to build a stateful app which a persistant storage with the Helm, ingress,  namespaces, Secrets, volumes, Ingress requests and limits, probes
- It work on the MCP gateway with from a kubernetes. Our commercen sotre is on the first data with the admin connect ot the mcp servers and everbody uses all of the throught a endpoints or we're making a unified dashboard.
- Kubernetes, which run's on the stateful with the Helm, Ingress, Secrets, Probes with Limit to the Local to the VPS.
- Ai toolling with the MCP to build a server
- Build a smallest POD.
- A Team with the MCP Gateway on teh Kubernetes. Which the real Wocommerce stores is on the first data source. A Admin can connect more MCP servers at once.
- Which also provided a one endpoint or the chat on the dashboard.


## Assets:
![Api Keys](assets/chat.png)
![Chat](assets/chat.png)
![Members](assets/members.png)
![Payment Successful](assets/payment-successful.png)
![Servers](assets/servers.png)
![Urumi Shop](assets/urumi-shop.png)

![architecture](assets/architecture.svg)

Upstream servers answer only to the gateway pod. Clients never see an upstream credential, and their own key is never forwarded.

## Stack:
- Kubernetes K3s, with the same distribution runs' on a laptop and on a VPS with helms charts don't change.
- One unified helm charts with simple one liner to move to a prod.
- For the Security Prupose the Secrets are made outside from the helm so it doesn't be on the git or the release history.
- Using a `TypeScript` for the stateless Streamable Http with the any replica can avaible and answer it.
- `Postgres` With the raw very small tables.
- Rest api endpoints with the `Api Keys` where the stateless work over the network.
- Using a Groq Free tier for the calling a key with a kubernetes secret.


## Local setup
- Need: `Docker Desktop, k3d, kubectl, Helm` # Pnpm for the package manager.
``` bash
pnpm cluster &&  pnpm secrets
pnpm images
pnpm release
pnpm groq
```

# Port is running on the: `8080` Where the secrets will given a login credentials.

# Build:
- Can place a order from a: `http://store.localhost:8080` even add a Sample mug as a Admin.
- Admin Page is on the: `http://store.localhost:8080/wp-admin` `admin` always user.
- The Dashboard is on the: `http://app.localhost:8080` for the dashboard the email is: `admin@urumi.local`: We can do a action such as, Add a Servers, Invite Members, Create Keys and even read a logs.
- for connectino a mcp clients we need a api keys.
`claude mcp add --transport http urumi http://app.localhost:8080/mcp --header "Authorization: Bearer umk_" ` We've to replace with our mcp keys of umk
- The Chat tab will ask through  a groq qhixh calls the groq.

## Production:
`helm upgrade --install platform charts/platform -n platform -f charts/platform/values-prod.yaml`:
  - We Need a domain/vps/dns for production.

## Checking a System:
`pn smoke` (Store), `pn smoke-gw` (Login Keys)

## Try a  Extra Things:
- for the failure isolation and the name collision where the credentials are encrypted at rest, with the non root read only containers.

## Design:
- Which the gateway opens a short MCP sessoin with the per call. one Extra Handshae no stale connection or any replca can answer.
- Chat and external clients use the unified tool runner so it can audited uder immutable log.
- Secret are created outside on the Helm ecosystem for the Security Purpose.




## Helm charts and values
- `charts/platform` is the umbrella. Subcharts: `store` (WordPress, MySQL, setup job), `woo-mcp`, `gateway` (gateway and Postgres), `mcp-extras` (time and notes servers), `dashboard` (and the ingress).
- `values-local.yaml` and `values-prod.yaml` are the only difference between local and prod.

## system Design:
- The gateway will keeps the no connection so it opens a short MCP session.
- Chat and external clients use the same tool runner so every call is under the real user.
- Postgres with raw SQL i've not used a orm.
- For the tool aggregation every tool is named with: `server_tool` with so while server calling can have both time and notes `ping`
- List a ask with all enabled servers in the parallel with return the connected one. A call can splits the name or find and server.
- From 3 second to listing and 10 second to call. a slow or dead server always give a clear error message
- **Production** the changes will be a dns two recores, store host app hoste. Ingress cert manager. Storage Class set in values. local uses the k3s default. Secrets for the same script aginst the VPS
### Threat Model:
- Shared upstream credentials mode with a member can never sees them but can use everything that they allow, through the tools.
- Clients token will not be apsses on with the upstream could keep reply them. The gateway willl use the upstream own secret credentials.
-The member to member can't see a other user keys, session or the audit logs. But they share the tools and groq key quota.  But admin have a full priviledge.
### STand out thing that i can say i try even a minimal:
- Failure isolation and name collision graceful handling: `apps/gateway/src/core/tools.ts`, `upstream/connect.ts`
- Credentials will be encrypted at the rest: `apps/gateway/src/crypto.ts`
- The non root users will have only read only containers and network policies: `charts/platform/charts/*/templates`
- For why server is unreachable we are storing on the log on every call find out from: `kubectl logs deployment/gateway -n platform`

# Thanks
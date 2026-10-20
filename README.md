# Urumi FDE Intern Online Assessement
- We have to build a stateful app which a persistant storage with the Helhelp, ingress,  namespaces, Secrets, volumes, Ingress requests and limits, probes
It work on the MCP gateway with from a kubernetes. Our commercen sotre is on the first data with the admin connect ot the mcp servers and everbody uses all of the throught a endpoints or we're making a unified dashboard.
- Kubernetes, which run's on the stateful with the Helm, Ingress, Secrets, Probes with Limit to the Local to the VPS.
- Ai toolling with the MCP to build a server
- Build a smallest POD.

## Tech Stack:
- k3d: runs k3s inside docker, same k3s as a vps, works on windows with git bash
- helm umbrella chart: one release, one subchart per component, only values change per env
- secrets made outside helm (scripts/secrets.sh), so they never land in release history
- wp-cli job over manual setup: a fresh install works with zero clicks

## Already Build:
A small Kubernetes cluster inside Docker (k3d), with Traefik as the front door.
A database (MySQL) with its own storage that survives restarts.
WordPress with its own storage.
A one-time setup job that installs WooCommerce, turns on cash on delivery, adds a free shipping method and creates the sample product.
Helm that installs all of this from one chart, with secrets created separately.

## setup
``` bash
pnpm cluster
pnpm secrets
pnpm release
```
with open: `http://store.localhost for adding the sample mug of the cart`
Also for the admin: `http://store.localhost/wp-admin` for the user admin: `pn secrets`

## local domain

`*.localhost` resolves to 127.0.0.1 in browsers, no hosts file edits. k3d maps host port 80 to the cluster, if port 80 is busy change it in scripts/up.sh and use that port in the url.

## prod

`pnpm release prod` renders with values-prod.yaml: https, a real host, tls via cert-manager, bigger volumes and limits. same templates, only values change.

## stages
1. cluster and store (this)
2. woocommerce mcp server
3. gateway core
4. team and access
5. dashboard, chat agent, prod notes


## Steps:
- `kubectl get pods -n store -w`
- Next tab: `pn release`
- With Kubectl: `kubectl logs -l app=wp-setup -n store -c fetch --tail=20`

## Now For Making a Even bigger:
## STack I Use:
- The `k3` for the same distribution run's on the lapop on a VPs with a Helm Charts only values.
- The helm is one subchart per component: with a `local/prod` are only diff.
- For secrets ii'm making outside of helm.
- With a stateless streamable http .
- Postgres database
- For the rest api use a woocommerce with a stateless which works over the network 
## setup:
```
pnpm cluster && pnpm secrets
pnpm images
pnpm release
pnpm groq
```
- We need a `Docker, k38, kubectl, Helm and pnpm`
We can place a order on the: `http://store.localhost:8080` we can also checkout a admin page. `http://store.localhost:8080/wp-admin` (`admin`)
- The Dashboard is on the different of: `http://app.localhost:8080` with a: `admin@urumi.local` where we add a servers invite a members and create a key.
## For Mcp: `claude mcp add --transport http urumi http://app.localhost:8080/mcp --header "Authorization: Bearer umk_..." `
- but we need a api key here.
## Production Deploy (k3 with vps):  `helm upgrade --install platform charts/platform -n platform -f charts/platform/values-prod.yaml`
## For the upgrade and rollback i'm adding on: [docs/production.md](docs/production.md).

## Check: `pnpm smoke` (store tools), `pnpm smoke-gw` (login, keys, audit, revoke), `pnpm netpol` (network policy).
## docs
- [system design and tradeoffs](docs/design.md)
- [threat model](docs/threat-model.md)
- [production deploy, upgrade, rollback](docs/production.md)
# Urumi FDE Intern Online Assessement
- We have to build a stateful app which a persistant storage with the Helhelp, ingress,  namespaces, Secrets, volumes, Ingress requests and limits, probes

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
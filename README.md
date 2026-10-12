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


## setup
``` bash
pnpm cluster
pnpm secrets
pnpm release
```
with open: `http://store.localhost for adding the sample mug of the cart`
Also for the admin: `http://store.localhost/wp-admin` for the user admin: `pn secrets`


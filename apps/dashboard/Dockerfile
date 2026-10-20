FROM node:24-alpine AS build
WORKDIR /repo
RUN npm install -g pnpm@12
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/woo-mcp/package.json apps/woo-mcp/
COPY apps/gateway/package.json apps/gateway/
COPY apps/time-mcp/package.json apps/time-mcp/
COPY apps/notes-mcp/package.json apps/notes-mcp/
COPY apps/dashboard/package.json apps/dashboard/
RUN pnpm install --frozen-lockfile --filter dashboard...
COPY apps/dashboard apps/dashboard
RUN pnpm --filter dashboard build

FROM nginxinc/nginx-unprivileged:alpine
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 8080

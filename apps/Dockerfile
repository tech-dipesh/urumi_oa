FROM node:24-alpine AS build
ARG APP
WORKDIR /repo
RUN npm install -g pnpm@12
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/woo-mcp/package.json apps/woo-mcp/
COPY apps/gateway/package.json apps/gateway/
COPY apps/time-mcp/package.json apps/time-mcp/
COPY apps/notes-mcp/package.json apps/notes-mcp/
COPY apps/dashboard/package.json apps/dashboard/
RUN pnpm install --frozen-lockfile --filter ${APP}...
COPY apps/${APP} apps/${APP}
RUN pnpm --filter ${APP} build

FROM node:24-alpine
ARG APP
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/${APP}/dist/server.js ./server.js
USER node
EXPOSE 3000
CMD ["node", "server.js"]

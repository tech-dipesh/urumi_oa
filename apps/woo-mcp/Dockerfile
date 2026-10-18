FROM node:24-alpine AS build
WORKDIR /repo
RUN npm install -g pnpm@12
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/woo-mcp/package.json apps/woo-mcp/
RUN pnpm install --frozen-lockfile --filter woo-mcp...
COPY apps/woo-mcp apps/woo-mcp
RUN pnpm --filter woo-mcp build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/woo-mcp/dist/server.js ./server.js
USER node
EXPOSE 3000
CMD ["node", "server.js"]

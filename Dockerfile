# Imagens da API e do web a partir do monorepo (contexto = raiz).
# Uso: docker compose up --build   (targets "api" e "web")

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# ---------- API: só dependências de produção; roda o .ts direto (ADR-010)
FROM base AS api
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod --filter @healthtech/api...
COPY packages/shared/src packages/shared/src
COPY apps/api/src apps/api/src
RUN find apps/api/src -name '*.test.ts' -delete
USER node
WORKDIR /app/apps/api
EXPOSE 3333
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${API_PORT:-3333}/health/live || exit 1
# Aplica migrations pendentes e sobe a API.
CMD ["sh", "-c", "node src/db/migrate.ts && exec node src/server.ts"]

# ---------- Web: build estático do Vite
FROM base AS web-build
RUN pnpm install --frozen-lockfile --filter @healthtech/web...
COPY packages/shared/src packages/shared/src
COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @healthtech/web build

FROM nginx:1.29-alpine AS web
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

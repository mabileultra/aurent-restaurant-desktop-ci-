# Pharmacy frontend — p-aurent.uz
# Build context: repo root (pnpm workspace + packages/*)
FROM node:20-alpine AS build
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY pharmacy-frontend/package.json ./pharmacy-frontend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --filter pharmacy-frontend...

COPY pharmacy-frontend ./pharmacy-frontend
WORKDIR /repo/pharmacy-frontend
ARG VITE_API_URL=/api/v1
ARG VITE_MAIN_APP_URL=https://aurent.uz
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAIN_APP_URL=$VITE_MAIN_APP_URL
RUN pnpm run build

FROM nginx:1.27-alpine
COPY --from=build /repo/pharmacy-frontend/dist /usr/share/nginx/html
COPY pharmacy-frontend/nginx-maps.conf /etc/nginx/conf.d/00-maps.conf
COPY pharmacy-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

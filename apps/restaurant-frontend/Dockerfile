# Restaurant frontend — r-aurent.uz
# Build context: repo root (pnpm workspace + packages/*)
FROM node:20-alpine AS build
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/restaurant-frontend/package.json ./apps/restaurant-frontend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  if [ -f pnpm-lock.yaml ]; then pnpm install --filter restaurant-frontend... --frozen-lockfile; \
  else pnpm install --filter restaurant-frontend...; fi

COPY apps/restaurant-frontend ./apps/restaurant-frontend
WORKDIR /repo/apps/restaurant-frontend
ARG VITE_API_URL=/api/v1
ARG VITE_MAIN_APP_URL=https://aurent.uz
ARG VITE_LICENSE_NUMBER=1.3
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAIN_APP_URL=$VITE_MAIN_APP_URL
ENV VITE_LICENSE_NUMBER=$VITE_LICENSE_NUMBER
RUN pnpm run build

FROM nginx:1.27-alpine
COPY --from=build /repo/apps/restaurant-frontend/dist /usr/share/nginx/html
COPY apps/restaurant-frontend/nginx-maps.conf /etc/nginx/conf.d/00-maps.conf
COPY apps/restaurant-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

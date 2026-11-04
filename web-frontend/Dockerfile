# syntax=docker/dockerfile:1
# Build context: repo root (pnpm workspace + packages/*)
FROM node:20-alpine AS build
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY web-frontend/package.json ./web-frontend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --filter pos-frontend...

COPY web-frontend ./web-frontend
WORKDIR /repo/web-frontend
ARG VITE_API_URL=/api/v1
ARG VITE_SUPPORT_PHONE=
ARG VITE_SUPPORT_TELEGRAM_BOT=
ARG VITE_RESTAURANT_APP_URL=
ARG VITE_PHARMACY_APP_URL=
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_ENVIRONMENT=production
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
ARG VITE_SENTRY_RELEASE=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPPORT_PHONE=$VITE_SUPPORT_PHONE
ENV VITE_SUPPORT_TELEGRAM_BOT=$VITE_SUPPORT_TELEGRAM_BOT
ENV VITE_RESTAURANT_APP_URL=$VITE_RESTAURANT_APP_URL
ENV VITE_PHARMACY_APP_URL=$VITE_PHARMACY_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
ENV VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE
ENV VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE
RUN pnpm run build

FROM nginx:1.27-alpine
COPY --from=build /repo/web-frontend/dist /usr/share/nginx/html
COPY web-frontend/nginx-maps.conf /etc/nginx/conf.d/00-maps.conf
COPY web-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

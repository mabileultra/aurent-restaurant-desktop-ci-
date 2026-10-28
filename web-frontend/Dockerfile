# syntax=docker/dockerfile:1
# Build
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_URL=/api/v1
ARG VITE_SUPPORT_PHONE=
ARG VITE_SUPPORT_TELEGRAM_BOT=
ARG VITE_RESTAURANT_APP_URL=
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_ENVIRONMENT=production
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
ARG VITE_SENTRY_RELEASE=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPPORT_PHONE=$VITE_SUPPORT_PHONE
ENV VITE_SUPPORT_TELEGRAM_BOT=$VITE_SUPPORT_TELEGRAM_BOT
ENV VITE_RESTAURANT_APP_URL=$VITE_RESTAURANT_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
ENV VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE
ENV VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE
RUN pnpm run build

# Serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-maps.conf /etc/nginx/conf.d/00-maps.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

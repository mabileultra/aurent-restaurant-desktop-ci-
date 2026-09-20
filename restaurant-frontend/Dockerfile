# Restaurant frontend (Phase 1 — separate SPA)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --cache /root/.npm

COPY . .
ARG VITE_API_URL=/api/v1
ARG VITE_MAIN_APP_URL=https://aurent.uz
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAIN_APP_URL=$VITE_MAIN_APP_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-maps.conf /etc/nginx/conf.d/00-maps.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

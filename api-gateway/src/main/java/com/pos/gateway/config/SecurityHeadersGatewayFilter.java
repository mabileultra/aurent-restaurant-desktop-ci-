package com.pos.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Базовые security-заголовки для всех ответов gateway.
 */
@Component
public class SecurityHeadersGatewayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpHeaders headers = exchange.getResponse().getHeaders();
        if (!headers.containsKey(HttpHeaders.X_CONTENT_TYPE_OPTIONS)) {
            headers.add(HttpHeaders.X_CONTENT_TYPE_OPTIONS, "nosniff");
        }
        if (!headers.containsKey(HttpHeaders.X_FRAME_OPTIONS)) {
            headers.add(HttpHeaders.X_FRAME_OPTIONS, "SAMEORIGIN");
        }
        if (!headers.containsKey("Referrer-Policy")) {
            headers.add("Referrer-Policy", "strict-origin-when-cross-origin");
        }
        if (!headers.containsKey("Permissions-Policy")) {
            headers.add("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}

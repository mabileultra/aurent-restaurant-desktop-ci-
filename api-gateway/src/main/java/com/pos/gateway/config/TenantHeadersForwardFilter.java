package com.pos.gateway.config;

import com.pos.shared.http.TenantHeaders;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Пробрасывает tenant-заголовки клиента в upstream без изменения значений.
 */
@Component
public class TenantHeadersForwardFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var request = exchange.getRequest();
        var builder = request.mutate();

        copyHeader(request, builder, TenantHeaders.COMPANY_ID);
        copyHeader(request, builder, TenantHeaders.USER_ROLES);
        copyHeader(request, builder, TenantHeaders.USER_ID);

        return chain.filter(exchange.mutate().request(builder.build()).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private static void copyHeader(
        org.springframework.http.server.reactive.ServerHttpRequest request,
        org.springframework.http.server.reactive.ServerHttpRequest.Builder builder,
        String headerName
    ) {
        String value = request.getHeaders().getFirst(headerName);
        if (value != null && !value.isBlank()) {
            builder.header(headerName, value);
        }
    }
}

package com.pos.gateway.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Legacy pharmacy warehouse API lived under {@code /api/v1/warehouse/pharmacy/**}
 * in web-backend. After cutover use {@code /api/v1/pharmacy/**} on pharmacy-service.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class LegacyPharmacyGoneFilter implements WebFilter {

    private static final String LEGACY_PREFIX = "/api/v1/warehouse/pharmacy";

    private final byte[] bodyBytes;

    public LegacyPharmacyGoneFilter(ObjectMapper objectMapper) throws JsonProcessingException {
        this.bodyBytes = objectMapper.writeValueAsBytes(Map.of(
            "status", 410,
            "error", "Gone",
            "message", "Pharmacy warehouse API moved to /api/v1/pharmacy/** (pharmacy-service)",
            "pathPrefix", "/api/v1/pharmacy"
        ));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (!path.startsWith(LEGACY_PREFIX)) {
            return chain.filter(exchange);
        }
        exchange.getResponse().setStatusCode(HttpStatus.GONE);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bodyBytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}

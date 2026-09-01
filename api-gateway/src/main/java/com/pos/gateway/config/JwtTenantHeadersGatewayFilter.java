package com.pos.gateway.config;

import com.pos.shared.http.TenantHeaders;
import com.pos.shared.jwt.JwtClaims;
import com.pos.shared.jwt.JwtClaimsExtractor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Устанавливает tenant-заголовки из JWT (не доверяет клиентским X-Company-Id / X-User-Roles).
 */
@Component
public class JwtTenantHeadersGatewayFilter implements GlobalFilter, Ordered {

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var request = exchange.getRequest();
        var builder = request.mutate();

        builder.headers(headers -> {
            headers.remove(TenantHeaders.COMPANY_ID);
            headers.remove(TenantHeaders.USER_ROLES);
            headers.remove(TenantHeaders.USER_ID);
        });

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (jwtSecret != null && !jwtSecret.isBlank()
            && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                JwtClaims claims = JwtClaimsExtractor.extract(authHeader.substring(7), jwtSecret);
                String clientCompanyHeader = request.getHeaders().getFirst(TenantHeaders.COMPANY_ID);
                Integer companyId = JwtClaimsExtractor.resolveCompanyIdSecure(
                    claims.companyId(), claims.role(), clientCompanyHeader
                );
                builder.header(TenantHeaders.USER_ID, claims.userId().toString());
                builder.header(TenantHeaders.USER_ROLES, claims.role());
                if (companyId != null) {
                    builder.header(TenantHeaders.COMPANY_ID, companyId.toString());
                }
            } catch (Exception ignored) {
                // upstream services validate JWT independently
            }
        }

        return chain.filter(exchange.mutate().request(builder.build()).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

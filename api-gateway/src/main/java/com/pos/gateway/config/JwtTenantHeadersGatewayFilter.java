package com.pos.gateway.config;

import com.pos.shared.gateway.GatewayContextStamp;
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

import java.util.UUID;

/**
 * Проверяет JWT один раз и подписывает tenant-заголовки.
 * Клиентские X-Company-Id, X-User-Id, X-User-Roles и X-Gateway-Stamp всегда стираются.
 */
@Component
public class JwtTenantHeadersGatewayFilter implements GlobalFilter, Ordered {

    private final String jwtSecret;
    private final String contextSecret;

    public JwtTenantHeadersGatewayFilter(
        @Value("${app.jwt.secret:}") String jwtSecret,
        @Value("${app.gateway.context-secret:}") String contextSecret
    ) {
        this.jwtSecret = jwtSecret;
        this.contextSecret = contextSecret;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var request = exchange.getRequest();
        String clientCompanyHeader = request.getHeaders().getFirst(TenantHeaders.COMPANY_ID);
        var builder = request.mutate();

        builder.headers(headers -> {
            headers.remove(TenantHeaders.COMPANY_ID);
            headers.remove(TenantHeaders.USER_ROLES);
            headers.remove(TenantHeaders.USER_ID);
            headers.remove(TenantHeaders.GATEWAY_STAMP);
        });

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (jwtSecret != null && !jwtSecret.isBlank()
            && authHeader != null && authHeader.startsWith("Bearer ")) {
            applyVerifiedContext(builder, authHeader.substring(7), clientCompanyHeader);
        }

        return chain.filter(exchange.mutate().request(builder.build()).build());
    }

    private void applyVerifiedContext(
        org.springframework.http.server.reactive.ServerHttpRequest.Builder builder,
        String token,
        String clientCompanyHeader
    ) {
        try {
            JwtClaims claims = JwtClaimsExtractor.extract(token, jwtSecret);
            Integer companyId = JwtClaimsExtractor.resolveCompanyIdSecure(
                claims.companyId(), claims.role(), clientCompanyHeader
            );
            UUID userId = claims.userId();
            String role = claims.role();
            builder.header(TenantHeaders.USER_ID, userId.toString());
            builder.header(TenantHeaders.USER_ROLES, role);
            if (companyId != null) {
                builder.header(TenantHeaders.COMPANY_ID, companyId.toString());
            }
            String stamp = GatewayContextStamp.sign(userId, companyId, role, contextSecret);
            if (stamp != null) {
                builder.header(TenantHeaders.GATEWAY_STAMP, stamp);
            }
        } catch (Exception ignored) {
            // битый токен заголовки не получает; сервисы сами его не доверяют
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

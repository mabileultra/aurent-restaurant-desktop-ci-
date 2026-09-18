package com.pos.shared.gateway;

import com.pos.shared.jwt.JwtClaims;
import com.pos.shared.jwt.JwtClaimsExtractor;

import java.util.Optional;

/**
 * Сначала подпись gateway. Если её нет или она битая, запасной путь — проверка JWT.
 * Голые заголовки компании без подписи и без токена не проходят.
 */
public final class RequestActorResolver {

    private RequestActorResolver() {
    }

    public static Optional<GatewayActor> resolve(
        String userId,
        String companyId,
        String role,
        String stamp,
        String contextSecret,
        String authorizationHeader,
        String jwtSecret
    ) {
        Optional<GatewayActor> stamped = GatewayContextStamp.verify(
            userId, companyId, role, stamp, contextSecret
        );
        if (stamped.isPresent()) {
            return stamped;
        }
        String token = bearerToken(authorizationHeader);
        if (token == null || jwtSecret == null || jwtSecret.isBlank()) {
            return Optional.empty();
        }
        try {
            JwtClaims claims = JwtClaimsExtractor.extract(token, jwtSecret);
            Integer resolvedCompany = JwtClaimsExtractor.resolveCompanyIdSecure(
                claims.companyId(), claims.role(), companyId
            );
            return Optional.of(new GatewayActor(claims.userId(), resolvedCompany, claims.role()));
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
    }

    private static String bearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authorizationHeader.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}

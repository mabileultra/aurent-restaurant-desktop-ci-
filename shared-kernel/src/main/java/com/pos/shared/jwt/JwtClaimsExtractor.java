package com.pos.shared.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * Парсинг JWT claims без Spring-зависимостей.
 */
public final class JwtClaimsExtractor {

    private JwtClaimsExtractor() {
    }

    public static Claims parseAllClaims(String token, String secretKey) {
        return Jwts.parser()
            .verifyWith(signingKey(secretKey))
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public static Integer extractCompanyId(Claims claims) {
        Object value = claims.get(JwtClaimNames.COMPANY_ID);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    public static UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public static boolean extractFlag(Claims claims, String name) {
        Object value = claims.get(name);
        if (value instanceof Boolean flag) {
            return flag;
        }
        return value != null && Boolean.parseBoolean(value.toString());
    }

    public static String extractPrimaryRole(Claims claims) {
        Object roles = claims.get(JwtClaimNames.ROLES);
        if (roles instanceof List<?> list && !list.isEmpty()) {
            return list.get(0).toString();
        }
        return "USER";
    }

    public static JwtClaims extract(String token, String secretKey) {
        Claims claims = parseAllClaims(token, secretKey);
        return new JwtClaims(
            extractUserId(claims),
            extractCompanyId(claims),
            extractPrimaryRole(claims)
        );
    }

    public static boolean isTokenParsable(String token, String secretKey) {
        try {
            parseAllClaims(token, secretKey);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Company id из JWT. Заголовок X-Company-Id принимается только для platform-ролей
     * (SUPER_ADMIN), когда в токене нет company_id — иначе клиент не может подменить tenant.
     */
    public static Integer resolveCompanyIdSecure(
        Integer claimsCompanyId,
        String role,
        String headerValue
    ) {
        if (claimsCompanyId != null) {
            return claimsCompanyId;
        }
        if (!isPlatformScopeRole(role)) {
            return null;
        }
        return parseHeaderCompanyId(headerValue);
    }

    /**
     * @deprecated используйте {@link #resolveCompanyIdSecure}; оставлено для совместимости internal-call.
     */
    @Deprecated
    public static Integer resolveCompanyId(Integer claimsCompanyId, String headerValue) {
        if (claimsCompanyId != null) {
            return claimsCompanyId;
        }
        return parseHeaderCompanyId(headerValue);
    }

    public static boolean isPlatformScopeRole(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }
        String normalized = role.trim().toUpperCase();
        return "SUPER_ADMIN".equals(normalized)
            || "PLATFORM_ADMIN".equals(normalized)
            || "PLATFORM_ANALYTICS".equals(normalized);
    }

    private static Integer parseHeaderCompanyId(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(headerValue.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static SecretKey signingKey(String secretKey) {
        return io.jsonwebtoken.security.Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}

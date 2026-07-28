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
     * Company id из claims, с fallback на заголовок (например, для сервис-к-сервис вызовов,
     * где токен не несёт company id, но его прокидывает вызывающая сторона).
     */
    public static Integer resolveCompanyId(Integer claimsCompanyId, String headerValue) {
        if (claimsCompanyId != null) {
            return claimsCompanyId;
        }
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

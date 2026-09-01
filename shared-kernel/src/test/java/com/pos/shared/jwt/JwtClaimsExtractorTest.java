package com.pos.shared.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtClaimsExtractorTest {

    private static final String SECRET = "change-me-use-at-least-32-chars-for-hs256!!";
    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Test
    void extract_readsCompanyUserAndRole() {
        String token = tokenWithClaims(7, List.of("MANAGER"));

        JwtClaims claims = JwtClaimsExtractor.extract(token, SECRET);

        assertEquals(USER_ID, claims.userId());
        assertEquals(7, claims.companyId());
        assertEquals("MANAGER", claims.role());
    }

    @Test
    void isTokenParsable_rejectsInvalidToken() {
        assertFalse(JwtClaimsExtractor.isTokenParsable("invalid", SECRET));
    }

    @Test
    void resolveCompanyIdSecure_ignoresHeaderForRegularUser() {
        assertEquals(7, JwtClaimsExtractor.resolveCompanyIdSecure(7, "MANAGER", "999"));
        assertNull(JwtClaimsExtractor.resolveCompanyIdSecure(null, "MANAGER", "999"));
    }

    @Test
    void resolveCompanyIdSecure_allowsHeaderForSuperAdmin() {
        assertEquals(42, JwtClaimsExtractor.resolveCompanyIdSecure(null, "SUPER_ADMIN", "42"));
    }

    private static String tokenWithClaims(Integer companyId, List<String> roles) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
            .subject(USER_ID.toString())
            .claim(JwtClaimNames.COMPANY_ID, companyId)
            .claim(JwtClaimNames.ROLES, roles)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(key)
            .compact();
    }
}

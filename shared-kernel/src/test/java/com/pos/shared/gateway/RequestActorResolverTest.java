package com.pos.shared.gateway;

import com.pos.shared.jwt.JwtClaimNames;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestActorResolverTest {

    private static final String JWT_SECRET = "change-me-use-at-least-32-chars-for-hs256!!";
    private static final String CONTEXT_SECRET = "gateway-context-test-secret-32chars!!";
    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Test
    void signedGatewayContextIsAccepted() {
        String stamp = GatewayContextStamp.sign(USER_ID, 7, "MANAGER", CONTEXT_SECRET);

        GatewayActor actor = RequestActorResolver.resolve(
            USER_ID.toString(), "7", "MANAGER", stamp, CONTEXT_SECRET, null, JWT_SECRET
        ).orElseThrow();

        assertEquals(7, actor.companyId());
        assertEquals("MANAGER", actor.role());
    }

    @Test
    void spoofedCompanyWithoutStampOrTokenIsRejected() {
        Optional<GatewayActor> actor = RequestActorResolver.resolve(
            USER_ID.toString(), "999", "ADMIN", null, CONTEXT_SECRET, null, JWT_SECRET
        );

        assertFalse(actor.isPresent());
    }

    @Test
    void forgedStampDoesNotOpenAnotherCompany() {
        String stamp = GatewayContextStamp.sign(USER_ID, 7, "MANAGER", CONTEXT_SECRET);

        assertFalse(RequestActorResolver.resolve(
            USER_ID.toString(), "999", "MANAGER", stamp, CONTEXT_SECRET, null, JWT_SECRET
        ).isPresent());
    }

    @Test
    void jwtFallbackIgnoresSpoofedCompanyForRegularUser() {
        String token = token(7, "CASHIER");

        GatewayActor actor = RequestActorResolver.resolve(
            null, "999", null, null, CONTEXT_SECRET, "Bearer " + token, JWT_SECRET
        ).orElseThrow();

        assertEquals(7, actor.companyId());
        assertEquals("CASHIER", actor.role());
    }

    @Test
    void invalidStampFallsBackToJwtInsteadOfHeaders() {
        String token = token(7, "MANAGER");

        GatewayActor actor = RequestActorResolver.resolve(
            USER_ID.toString(), "999", "ADMIN", "forged", CONTEXT_SECRET, "Bearer " + token, JWT_SECRET
        ).orElseThrow();

        assertEquals(7, actor.companyId());
        assertEquals("MANAGER", actor.role());
    }

    @Test
    void brokenTokenWithoutStampIsRejected() {
        assertTrue(RequestActorResolver.resolve(
            USER_ID.toString(), "7", "MANAGER", null, CONTEXT_SECRET, "Bearer not-a-token", JWT_SECRET
        ).isEmpty());
    }

    private static String token(Integer companyId, String role) {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
            .subject(USER_ID.toString())
            .claim(JwtClaimNames.COMPANY_ID, companyId)
            .claim(JwtClaimNames.ROLES, List.of(role))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(key)
            .compact();
    }
}

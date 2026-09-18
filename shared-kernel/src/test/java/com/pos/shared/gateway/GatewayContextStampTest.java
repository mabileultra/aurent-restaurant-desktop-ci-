package com.pos.shared.gateway;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GatewayContextStampTest {

    private static final String SECRET = "gateway-context-test-secret-32chars!!";
    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Test
    void verifyAcceptsStampForTheSignedCompany() {
        String stamp = GatewayContextStamp.sign(USER_ID, 7, "MANAGER", SECRET);

        GatewayActor actor = GatewayContextStamp.verify(
            USER_ID.toString(), "7", "MANAGER", stamp, SECRET
        ).orElseThrow();

        assertEquals(USER_ID, actor.userId());
        assertEquals(7, actor.companyId());
        assertEquals("MANAGER", actor.role());
    }

    @Test
    void spoofedCompanyWithoutMatchingStampIsRejected() {
        String stamp = GatewayContextStamp.sign(USER_ID, 7, "MANAGER", SECRET);

        assertFalse(GatewayContextStamp.verify(USER_ID.toString(), "999", "MANAGER", stamp, SECRET).isPresent());
        assertFalse(GatewayContextStamp.verify(USER_ID.toString(), "999", "MANAGER", null, SECRET).isPresent());
        assertFalse(GatewayContextStamp.verify(USER_ID.toString(), "999", "MANAGER", "forged", SECRET).isPresent());
    }

    @Test
    void blankSecretDoesNotSignOrTrustHeaders() {
        assertTrue(GatewayContextStamp.sign(USER_ID, 7, "MANAGER", "  ") == null);
        assertFalse(GatewayContextStamp.verify(USER_ID.toString(), "7", "MANAGER", "anything", "").isPresent());
    }
}

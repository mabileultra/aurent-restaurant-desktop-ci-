package com.pos.shared.gateway;

import com.pos.shared.http.TenantHeaders;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OutboundCallerHeadersTest {

    private static final String SECRET = "gateway-context-test-secret-32chars!!";
    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Test
    void signedCallForwardsStampAndDropsJwt() {
        String stamp = GatewayContextStamp.sign(USER_ID, 7, "MANAGER", SECRET);

        Map<String, String> headers = OutboundCallerHeaders.select(
            USER_ID.toString(), "7", "MANAGER", stamp, "Bearer user-token", SECRET
        );

        assertEquals("7", headers.get(TenantHeaders.COMPANY_ID));
        assertEquals(stamp, headers.get(TenantHeaders.GATEWAY_STAMP));
        assertFalse(headers.containsKey(OutboundCallerHeaders.AUTHORIZATION));
    }

    @Test
    void missingStampFallsBackToJwtOnly() {
        Map<String, String> headers = OutboundCallerHeaders.select(
            USER_ID.toString(), "999", "ADMIN", null, "Bearer user-token", SECRET
        );

        assertEquals("Bearer user-token", headers.get(OutboundCallerHeaders.AUTHORIZATION));
        assertFalse(headers.containsKey(TenantHeaders.COMPANY_ID));
    }

    @Test
    void spoofedHeadersWithoutTokenAreNotForwarded() {
        assertTrue(OutboundCallerHeaders.select(
            USER_ID.toString(), "999", "ADMIN", "forged", null, SECRET
        ).isEmpty());
    }
}

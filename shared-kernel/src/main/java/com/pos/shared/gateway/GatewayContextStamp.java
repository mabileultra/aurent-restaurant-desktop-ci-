package com.pos.shared.gateway;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/**
 * Подпись tenant-заголовков секретом gateway. Клиент без секрета подделать её не может.
 */
public final class GatewayContextStamp {

    private static final String HMAC = "HmacSHA256";

    private GatewayContextStamp() {
    }

    public static String sign(UUID userId, Integer companyId, String role, String secret) {
        if (userId == null || role == null || role.isBlank() || !hasSecret(secret)) {
            return null;
        }
        return hmac(canonical(userId.toString(), companyId, role.trim()), secret);
    }

    public static Optional<GatewayActor> verify(
        String userId,
        String companyId,
        String role,
        String stamp,
        String secret
    ) {
        if (!hasSecret(secret) || stamp == null || stamp.isBlank()) {
            return Optional.empty();
        }
        if (userId == null || userId.isBlank() || role == null || role.isBlank()) {
            return Optional.empty();
        }
        Integer company = parseCompanyId(companyId);
        if (companyId != null && !companyId.isBlank() && company == null) {
            return Optional.empty();
        }
        UUID parsedUserId;
        try {
            parsedUserId = UUID.fromString(userId.trim());
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
        String expected = hmac(canonical(parsedUserId.toString(), company, role.trim()), secret);
        if (expected == null || !MessageDigest.isEqual(
            expected.getBytes(StandardCharsets.UTF_8),
            stamp.trim().getBytes(StandardCharsets.UTF_8)
        )) {
            return Optional.empty();
        }
        return Optional.of(new GatewayActor(parsedUserId, company, role.trim()));
    }

    private static boolean hasSecret(String secret) {
        return secret != null && !secret.isBlank();
    }

    private static String canonical(String userId, Integer companyId, String role) {
        return userId + "\n" + (companyId == null ? "" : companyId) + "\n" + role;
    }

    private static Integer parseCompanyId(String companyId) {
        if (companyId == null || companyId.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(companyId.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String hmac(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC));
            byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception ex) {
            return null;
        }
    }
}

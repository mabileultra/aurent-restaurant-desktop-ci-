package com.pos.idempotency.support;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class IdempotencyRequestHash {

    private IdempotencyRequestHash() {
    }

    public static String sha256(byte[] body) {
        byte[] input = body == null ? new byte[0] : body;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    public static String sha256(String body) {
        return sha256(body == null ? new byte[0] : body.getBytes(StandardCharsets.UTF_8));
    }
}

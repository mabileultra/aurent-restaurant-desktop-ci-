package com.pos.identity.service.security.support;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Locale;

/**
 * RFC 6238 TOTP (SHA-1, 30s, 6 digits) without an external OTP library.
 */
@Component
public class TotpSupport {

    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int STEP_SECONDS = 30;
    private static final int DIGITS = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    public String otpAuthUrl(String secret, String accountName, String issuer) {
        String label = urlEncode(issuer) + ":" + urlEncode(accountName);
        return "otpauth://totp/" + label
            + "?secret=" + secret
            + "&issuer=" + urlEncode(issuer)
            + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + STEP_SECONDS;
    }

    public boolean verify(String secret, String code) {
        if (!StringUtils.hasText(secret) || !StringUtils.hasText(code)) {
            return false;
        }
        String normalized = code.trim().replace(" ", "");
        if (!normalized.matches("\\d{6}")) {
            return false;
        }
        long counter = System.currentTimeMillis() / 1000L / STEP_SECONDS;
        for (long skew = -1; skew <= 1; skew++) {
            if (normalized.equals(generateCode(secret, counter + skew))) {
                return true;
            }
        }
        return false;
    }

    private String generateCode(String secret, long counter) {
        try {
            byte[] key = decodeBase32(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);
            int otp = binary % 1_000_000;
            return String.format(Locale.ROOT, "%0" + DIGITS + "d", otp);
        } catch (Exception ex) {
            throw new IllegalStateException("TOTP generation failed", ex);
        }
    }

    private static String encodeBase32(byte[] data) {
        StringBuilder out = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                out.append(BASE32.charAt((buffer >> (bitsLeft - 5)) & 31));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            out.append(BASE32.charAt((buffer << (5 - bitsLeft)) & 31));
        }
        return out.toString();
    }

    private static byte[] decodeBase32(String secret) {
        String cleaned = secret.trim().toUpperCase(Locale.ROOT).replace("=", "");
        int buffer = 0;
        int bitsLeft = 0;
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        for (int i = 0; i < cleaned.length(); i++) {
            int val = BASE32.indexOf(cleaned.charAt(i));
            if (val < 0) {
                continue;
            }
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out.write((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return out.toByteArray();
    }

    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value == null ? "" : value, java.nio.charset.StandardCharsets.UTF_8);
    }
}

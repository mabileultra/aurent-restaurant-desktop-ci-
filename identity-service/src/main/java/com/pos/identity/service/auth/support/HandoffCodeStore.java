package com.pos.identity.service.auth.support;

import com.pos.identity.dto.auth.SpaAudience;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory one-time SPA handoff codes (TTL + single use).
 * Single-instance identity is enough for lab; shared Redis can replace later for HA.
 */
@Component
public class HandoffCodeStore {

    public static final int DEFAULT_TTL_SECONDS = 60;

    private final ConcurrentHashMap<String, Entry> codes = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public record Entry(UUID userId, SpaAudience audience, Instant expiresAt) {}

    public String put(UUID userId, SpaAudience audience, int ttlSeconds) {
        purgeExpired();
        int ttl = Math.max(15, Math.min(ttlSeconds, 300));
        String code = newCode();
        codes.put(code, new Entry(userId, audience, Instant.now().plusSeconds(ttl)));
        return code;
    }

    public Optional<Entry> consume(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        Entry entry = codes.remove(code.trim());
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    int sizeForTests() {
        return codes.size();
    }

    private String newCode() {
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, Entry>> it = codes.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Entry> e = it.next();
            if (e.getValue().expiresAt().isBefore(now)) {
                it.remove();
            }
        }
    }
}

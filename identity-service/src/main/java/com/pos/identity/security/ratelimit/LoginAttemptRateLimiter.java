package com.pos.identity.security.ratelimit;

import com.pos.identity.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force protection for login endpoints (per IP).
 */
@Component
public class LoginAttemptRateLimiter {

    private final ConcurrentHashMap<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    @Value("${app.security.login-rate-limit-enabled:true}")
    private boolean enabled;

    @Value("${app.security.login-rate-limit-per-minute:15}")
    private int maxPerMinute;

    public void check(String clientIp, String scope) {
        if (!enabled) return;
        String key = buildKey(clientIp, scope);
        int limit = Math.max(1, maxPerMinute);
        Instant now = Instant.now();
        Instant threshold = now.minusSeconds(60);
        Deque<Instant> queue = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst().isBefore(threshold)) {
                queue.pollFirst();
            }
            if (queue.size() >= limit) {
                throw new TooManyRequestsException("Слишком много попыток входа. Повторите через минуту.");
            }
            queue.addLast(now);
        }
    }

    private String buildKey(String clientIp, String scope) {
        String ip = StringUtils.hasText(clientIp) ? clientIp.trim() : "unknown";
        String action = StringUtils.hasText(scope) ? scope.trim() : "login";
        return ip + "|" + action;
    }
}

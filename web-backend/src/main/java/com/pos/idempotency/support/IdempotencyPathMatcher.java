package com.pos.idempotency.support;

import java.util.regex.Pattern;

/** Paths that honor {@code X-Idempotency-Key} (P0 cashier money endpoints). */
public final class IdempotencyPathMatcher {

    private static final Pattern CASH_MOVEMENT = Pattern.compile(
        "^/cashier/shifts/[^/]+/cash-(in|out)$"
    );

    private IdempotencyPathMatcher() {
    }

    public static boolean matches(String method, String servletPath) {
        if (!"POST".equalsIgnoreCase(method) || servletPath == null) {
            return false;
        }
        if ("/sales".equals(servletPath)) {
            return true;
        }
        return CASH_MOVEMENT.matcher(servletPath).matches();
    }
}

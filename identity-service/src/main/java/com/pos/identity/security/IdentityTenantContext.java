package com.pos.identity.security;

import java.util.UUID;

public final class IdentityTenantContext {

    private static final ThreadLocal<Context> HOLDER = new ThreadLocal<>();

    private IdentityTenantContext() {
    }

    public static void set(Integer companyId, UUID userId, String role) {
        Context current = HOLDER.get();
        UUID sessionId = current != null ? current.sessionId() : null;
        HOLDER.set(new Context(companyId, userId, role, sessionId));
    }

    public static void setSessionId(UUID sessionId) {
        Context current = HOLDER.get();
        if (current == null) {
            HOLDER.set(new Context(null, null, null, sessionId));
            return;
        }
        HOLDER.set(new Context(current.companyId(), current.userId(), current.role(), sessionId));
    }

    public static Integer companyId() {
        Context ctx = HOLDER.get();
        return ctx != null ? ctx.companyId() : null;
    }

    public static UUID userId() {
        Context ctx = HOLDER.get();
        return ctx != null ? ctx.userId() : null;
    }

    public static String role() {
        Context ctx = HOLDER.get();
        return ctx != null ? ctx.role() : null;
    }

    public static UUID sessionId() {
        Context ctx = HOLDER.get();
        return ctx != null ? ctx.sessionId() : null;
    }

    public static void clear() {
        HOLDER.remove();
    }

    private record Context(Integer companyId, UUID userId, String role, UUID sessionId) {
    }
}

package com.pos.identity.security;

import java.util.UUID;

public final class IdentityTenantContext {

    private static final ThreadLocal<Context> HOLDER = new ThreadLocal<>();

    private IdentityTenantContext() {
    }

    public static void set(Integer companyId, UUID userId, String role) {
        HOLDER.set(new Context(companyId, userId, role));
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

    public static void clear() {
        HOLDER.remove();
    }

    private record Context(Integer companyId, UUID userId, String role) {
    }
}

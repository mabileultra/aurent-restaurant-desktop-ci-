package com.pos.pharmacy.security;

import java.util.UUID;

public final class PharmacyTenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private PharmacyTenantContext() {}

    public static void set(Integer companyId, UUID userId, String role) {
        COMPANY_ID.set(companyId);
        USER_ID.set(userId);
        ROLE.set(role);
    }

    public static Integer getCompanyId() {
        return COMPANY_ID.get();
    }

    public static UUID getUserId() {
        return USER_ID.get();
    }

    public static String getRole() {
        return ROLE.get();
    }

    public static void clear() {
        COMPANY_ID.remove();
        USER_ID.remove();
        ROLE.remove();
    }
}

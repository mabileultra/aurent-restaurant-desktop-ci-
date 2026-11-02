package com.pos.catalog.security;

import com.pos.catalog.exception.CatalogExceptions;

import java.util.Optional;
import java.util.UUID;

public final class CatalogTenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private CatalogTenantContext() {
    }

    public static void set(Integer companyId, UUID userId, String role) {
        COMPANY_ID.set(companyId);
        USER_ID.set(userId);
        ROLE.set(role);
    }

    public static void clear() {
        COMPANY_ID.remove();
        USER_ID.remove();
        ROLE.remove();
    }

    public static Integer requireCompanyId() {
        return companyId().orElseThrow(() -> CatalogExceptions.badRequest("Не указана компания в контексте запроса"));
    }

    public static Optional<Integer> companyId() {
        return Optional.ofNullable(COMPANY_ID.get());
    }
}

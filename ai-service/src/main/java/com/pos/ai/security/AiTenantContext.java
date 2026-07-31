package com.pos.ai.security;

import java.util.UUID;

public final class AiTenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private AiTenantContext() {}

    public static void set(Integer companyId, UUID userId, String role) {
        COMPANY_ID.set(companyId);
        USER_ID.set(userId);
        ROLE.set(role);
    }

    public static Integer getCompanyId() {
        return COMPANY_ID.get();
    }

    public static Integer requireCompanyId() {
        Integer companyId = COMPANY_ID.get();
        if (companyId == null) {
            throw new IllegalStateException("Не указана компания в контексте запроса");
        }
        return companyId;
    }

    public static UUID getUserId() {
        return USER_ID.get();
    }

    public static UUID requireUserId() {
        UUID userId = USER_ID.get();
        if (userId == null) {
            throw new IllegalStateException("Пользователь не аутентифицирован");
        }
        return userId;
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

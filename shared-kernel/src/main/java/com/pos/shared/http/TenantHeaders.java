package com.pos.shared.http;

/**
 * Заголовки tenant-контекста между сервисами.
 */
public final class TenantHeaders {

    public static final String COMPANY_ID = "X-Company-Id";
    public static final String USER_ROLES = "X-User-Roles";
    public static final String USER_ID = "X-User-Id";
    public static final String GATEWAY_STAMP = "X-Gateway-Stamp";

    private TenantHeaders() {
    }
}

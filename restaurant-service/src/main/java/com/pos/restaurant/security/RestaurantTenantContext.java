package com.pos.restaurant.security;

import java.util.UUID;

public final class RestaurantTenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> CAN_REQUEST_BILL = new ThreadLocal<>();

    private RestaurantTenantContext() {}

    public static void set(Integer companyId, UUID userId, String role) {
        set(companyId, userId, role, false);
    }

    public static void set(Integer companyId, UUID userId, String role, boolean canRequestBill) {
        COMPANY_ID.set(companyId);
        USER_ID.set(userId);
        ROLE.set(role);
        CAN_REQUEST_BILL.set(canRequestBill);
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

    public static boolean canRequestBill() {
        return Boolean.TRUE.equals(CAN_REQUEST_BILL.get());
    }

    public static void clear() {
        COMPANY_ID.remove();
        USER_ID.remove();
        ROLE.remove();
        CAN_REQUEST_BILL.remove();
    }
}

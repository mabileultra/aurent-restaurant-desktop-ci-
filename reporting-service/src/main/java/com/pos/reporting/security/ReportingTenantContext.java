package com.pos.reporting.security;

public final class ReportingTenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();

    private ReportingTenantContext() {
    }

    public static void setCompanyId(Integer companyId) {
        COMPANY_ID.set(companyId);
    }

    public static void clear() {
        COMPANY_ID.remove();
    }

    public static Integer requireCompanyId() {
        Integer companyId = COMPANY_ID.get();
        if (companyId == null) {
            throw new IllegalStateException("Не указана компания в контексте запроса");
        }
        return companyId;
    }
}

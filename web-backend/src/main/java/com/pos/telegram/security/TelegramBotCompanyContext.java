package com.pos.telegram.security;

/**
 * Company scope for the current Telegram bot API request.
 */
public final class TelegramBotCompanyContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();

    private TelegramBotCompanyContext() {
    }

    public static void setCompanyId(Integer companyId) {
        COMPANY_ID.set(companyId);
    }

    public static Integer getCompanyId() {
        return COMPANY_ID.get();
    }

    public static void clear() {
        COMPANY_ID.remove();
    }
}

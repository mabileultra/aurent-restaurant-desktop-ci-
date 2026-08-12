package com.pos.telegram.dto;

public record CompanyTelegramBotResponse(
    Integer companyId,
    String botUsername,
    String supportGroupId,
    boolean enabled,
    boolean botTokenConfigured,
    boolean apiTokenConfigured,
    /** Shown only right after save/regenerate — use as X-Bot-Token. */
    String apiToken
) {
}

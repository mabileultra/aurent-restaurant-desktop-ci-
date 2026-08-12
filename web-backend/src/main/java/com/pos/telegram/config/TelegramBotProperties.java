package com.pos.telegram.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.telegram-bot")
public class TelegramBotProperties {

    /** Legacy shared secret for X-Bot-Token. Prefer per-company api_token in DB. */
    private String apiToken = "";

    /** Legacy single-company scope when using global apiToken. Empty = not set. */
    private String companyId = "";

    /** Master token for GET /public/bot/runtime/instances (multi-bot runner). */
    private String runtimeToken = "";

    private int maxResults = 10;

    private int minQueryLength = 2;

    public Integer resolveCompanyId() {
        if (!StringUtils.hasText(companyId)) {
            return null;
        }
        try {
            return Integer.valueOf(companyId.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}

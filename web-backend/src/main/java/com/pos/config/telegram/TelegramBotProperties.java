package com.pos.config.telegram;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.telegram-bot")
public class TelegramBotProperties {

    /** Shared secret for X-Bot-Token header. Empty = bot API disabled. */
    private String apiToken = "";

    /** Optional company scope as string (empty = all companies). */
    private String companyId = "";

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

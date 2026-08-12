package com.pos.support.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.support")
public class SupportContactsProperties {

    /** Телефон поддержки CRM/кассы (не аптека). */
    private String phone = "";

    /**
     * Username бота поддержки веба/десктопа (без @).
     * Это telegram-web-support-bot, НЕ аптечный telegram-support-bot.
     */
    private String telegramBot = "";

    public String normalizedTelegramBot() {
        if (!StringUtils.hasText(telegramBot)) {
            return null;
        }
        String value = telegramBot.trim();
        if (value.startsWith("@")) {
            value = value.substring(1);
        }
        return value.isBlank() ? null : value;
    }
}

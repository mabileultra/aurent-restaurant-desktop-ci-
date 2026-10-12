package com.pos.integrations.markingvalidation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/** Сервис налоговой `validation-onkm` (проверка КМ перед чеком ФМ). Логин/пароль — только из окружения. */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.marking-validation")
public class MarkingValidationProperties {

    private String url;

    private String username;

    private String password;

    private int connectTimeoutMs = 5000;

    private int readTimeoutMs = 10000;

    public boolean isConfigured() {
        return StringUtils.hasText(url) && StringUtils.hasText(username) && StringUtils.hasText(password);
    }
}

package com.pos.telegram.support;

import com.pos.telegram.config.TelegramBotProperties;
import com.pos.telegram.security.TelegramBotCompanyContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Company scope for bot request.
 * {@code null} = общий аптечный каталог (все магазины с типом PHARMACY).
 */
@Component
@RequiredArgsConstructor
public class TelegramBotCompanyResolver {

    private final TelegramBotProperties properties;

    public Integer optionalCompanyId() {
        Integer fromRequest = TelegramBotCompanyContext.getCompanyId();
        if (fromRequest != null) {
            return fromRequest;
        }
        return properties.resolveCompanyId();
    }
}

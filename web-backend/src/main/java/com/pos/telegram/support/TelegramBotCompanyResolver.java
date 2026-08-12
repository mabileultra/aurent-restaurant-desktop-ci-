package com.pos.telegram.support;

import com.pos.exception.PosExceptions;
import com.pos.telegram.config.TelegramBotProperties;
import com.pos.telegram.security.TelegramBotCompanyContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TelegramBotCompanyResolver {

    private final TelegramBotProperties properties;

    /**
     * Company for the current bot request. Never falls back to "all companies".
     */
    public Integer requireCompanyId() {
        Integer fromRequest = TelegramBotCompanyContext.getCompanyId();
        if (fromRequest != null) {
            return fromRequest;
        }
        Integer legacy = properties.resolveCompanyId();
        if (legacy != null) {
            return legacy;
        }
        throw PosExceptions.badRequest("Telegram bot is not bound to a company");
    }
}

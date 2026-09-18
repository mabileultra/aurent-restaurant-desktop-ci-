package com.pos.identity.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Секрет HMAC для PIN кассира. Если PIN_SECRET не задан, берётся JWT_SECRET,
 * чтобы уже сохранённые отпечатки продолжили входить.
 */
@Component
public class PinSecret {

    private final String value;

    public PinSecret(@Value("${app.pin.secret}") String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}

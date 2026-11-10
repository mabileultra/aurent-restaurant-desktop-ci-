package com.pos.service.email.support;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Map;

/**
 * Broadcast chrome (greeting / footer) by locale. Body subject/message stay as the admin typed them.
 */
@Component
public class PlatformEmailLocaleSupport {

    public static final String DEFAULT_LOCALE = "uz";

    public String normalize(String locale) {
        if (!StringUtils.hasText(locale)) {
            return DEFAULT_LOCALE;
        }
        String code = locale.trim().toLowerCase(Locale.ROOT);
        if (code.startsWith("ru")) {
            return "ru";
        }
        return DEFAULT_LOCALE;
    }

    public void putChrome(Map<String, String> vars, String locale) {
        String code = normalize(locale);
        if ("ru".equals(code)) {
            vars.put("lang", "ru");
            vars.put("greeting", "Здравствуйте,");
            vars.put("footerNote", "Это автоматическое сообщение, отвечать на него не нужно.");
            vars.put("recipientFallback", "Пользователь");
            vars.put("emptyMessage", "Текст сообщения для пользователей системы.");
        } else {
            vars.put("lang", "uz");
            vars.put("greeting", "Assalomu alaykum,");
            vars.put("footerNote", "Bu avtomatik xabar. Javob yozish shart emas.");
            vars.put("recipientFallback", "Foydalanuvchi");
            vars.put("emptyMessage", "Tizim foydalanuvchilari uchun xabar matni.");
        }
    }
}

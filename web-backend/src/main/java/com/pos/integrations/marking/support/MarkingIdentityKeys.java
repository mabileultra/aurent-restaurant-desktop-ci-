package com.pos.integrations.marking.support;

import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Ключи одной упаковки — как на фронте markingIdentity и в pharmacy-service.
 */
public final class MarkingIdentityKeys {

    private static final Pattern GS1_SERIAL = Pattern.compile(
        "01(\\d{14})21([\\x21-\\x7E]{4,30}?)(?:91|92|93|$)"
    );
    private static final Pattern CRYPTO_TAIL = Pattern.compile("(91|92|93).{1,64}$");

    private MarkingIdentityKeys() {
    }

    public static Set<String> keysOf(String raw) {
        Set<String> keys = new LinkedHashSet<>();
        if (!StringUtils.hasText(raw)) {
            return keys;
        }
        String mark = raw.replace("\u001D", "").replace(" ", "").trim();
        if (!StringUtils.hasText(mark)) {
            return keys;
        }
        String full = mark.toLowerCase(Locale.ROOT);
        keys.add("full:" + full);
        String identification = identificationCode(mark);
        if (StringUtils.hasText(identification)) {
            keys.add("id:" + identification.toLowerCase(Locale.ROOT));
        }

        Matcher m = GS1_SERIAL.matcher(mark);
        if (m.find()) {
            String serial = m.group(2);
            if (serial != null && serial.length() >= 4 && serial.length() <= 30) {
                keys.add(("gs1:01" + m.group(1) + "|21" + serial).toLowerCase(Locale.ROOT));
            }
        }
        return keys;
    }

    static String identificationCode(String mark) {
        if (!StringUtils.hasText(mark)) {
            return "";
        }
        if (mark.length() > 18 && mark.startsWith("01") && mark.startsWith("21", 16)) {
            String serialAndTail = mark.substring(18);
            Matcher crypto = CRYPTO_TAIL.matcher(serialAndTail);
            if (crypto.find() && crypto.start() >= 4) {
                return mark.substring(0, 18 + crypto.start());
            }
        }
        return mark;
    }
}

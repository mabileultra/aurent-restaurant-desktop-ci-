package com.pos.pharmacy.sales.support;

import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Ключи КМ для запрета повторной продажи (как на фронте pharmacyMarkIdentity).
 */
public final class PharmacyMarkIdentityKeys {

    private static final Pattern GS1_SERIAL = Pattern.compile(
        "01(\\d{14})21([0-9A-Za-z]{4,28})(?:91|92|93|$)"
    );

    private PharmacyMarkIdentityKeys() {
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

        Matcher m = GS1_SERIAL.matcher(mark);
        if (m.find()) {
            String gtin = m.group(1);
            String serial = m.group(2);
            if (serial != null && serial.length() >= 4 && serial.length() <= 28) {
                keys.add(("gs1:01" + gtin + "|21" + serial).toLowerCase(Locale.ROOT));
            }
        }
        return keys;
    }
}

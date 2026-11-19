package com.pos.sales.support.mxik;

import java.util.Locale;
import java.util.Set;

/** Запрещённые MXIK/IKPU для продажи (AUR-14). */
public final class ForbiddenMxikCodes {

    public static final String REASON_CODE = "FORBIDDEN_MXIK";

    private static final Set<String> BLOCKED = Set.of(
        "06302001004033010",
        "09405001011002016",
        "00000000000000000"
    );

    private ForbiddenMxikCodes() {
    }

    /** Нормализация: только цифры, без пробелов. */
    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String digits = raw.trim().replaceAll("\\D+", "");
        return digits;
    }

    public static boolean isForbidden(String rawMxikOrIkpu) {
        String code = normalize(rawMxikOrIkpu);
        return !code.isEmpty() && BLOCKED.contains(code);
    }

    public static Set<String> all() {
        return BLOCKED;
    }
}

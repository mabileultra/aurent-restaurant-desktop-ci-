package com.pos.pharmacy.warehouse.support;

import java.util.List;
import java.util.Map;

/**
 * Чтение ячеек строго по карте ролей пользователя (index из match request).
 * Никакой «подмены» соседней колонкой.
 */
public final class PharmacyImportRoleCells {

    private PharmacyImportRoleCells() {}

    public static String text(List<String> row, Map<String, Integer> roles, String role) {
        if (roles == null || role == null) {
            return "";
        }
        return PharmacyImportValueParser.cell(row, roles.get(role));
    }

    public static Integer index(Map<String, Integer> roles, String role) {
        if (roles == null || role == null) {
            return null;
        }
        Integer index = roles.get(role);
        if (index == null || index < 0) {
            return null;
        }
        return index;
    }

    /** Роль указывает на колонку внутри ширины строки. */
    public static boolean inRange(Map<String, Integer> roles, String role, int width) {
        Integer index = index(roles, role);
        return index != null && index < width;
    }
}

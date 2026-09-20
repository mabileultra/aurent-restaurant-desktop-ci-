package com.pos.pharmacy.warehouse.support;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Карта ролей с match-запроса: только валидные index, без сдвига на «соседнюю» колонку.
 */
public final class PharmacyImportRoleMap {

    private PharmacyImportRoleMap() {}

    public static Map<String, Integer> normalize(Map<String, Integer> roles, int width) {
        if (roles == null || roles.isEmpty()) {
            return Map.of();
        }
        Map<String, Integer> out = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> entry : roles.entrySet()) {
            String role = entry.getKey();
            Integer index = entry.getValue();
            if (role == null || role.isBlank() || PharmacyImportRoles.SKIP.equals(role)) {
                continue;
            }
            if (!PharmacyImportRoles.ALL.contains(role)) {
                continue;
            }
            if (index == null || index < 0 || index >= width) {
                continue;
            }
            out.putIfAbsent(role, index);
        }
        return Map.copyOf(out);
    }

    public static int rowWidth(List<List<String>> rows) {
        int width = 0;
        if (rows == null) {
            return 0;
        }
        for (List<String> row : rows) {
            if (row != null) {
                width = Math.max(width, row.size());
            }
        }
        return width;
    }
}

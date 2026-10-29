package com.pos.shared.text;

/**
 * Регистр для поиска товара. SQL {@code lower()} на Alpine Postgres и SQLite
 * не уменьшает кириллицу, поэтому и колонка, и строка запроса идут через
 * {@code translate} с этой парой алфавитов.
 */
public final class CatalogSearchFold {

    public static final String FROM =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
            + "ЎҚҒҲІ";

    public static final String TO =
        "abcdefghijklmnopqrstuvwxyz"
            + "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
            + "ўқғҳі";

    private CatalogSearchFold() {
    }

    public static String fold(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "";
        }
        StringBuilder out = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            int at = FROM.indexOf(c);
            out.append(at >= 0 ? TO.charAt(at) : c);
        }
        return out.toString();
    }
}

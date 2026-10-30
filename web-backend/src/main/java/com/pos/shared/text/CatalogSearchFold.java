package com.pos.shared.text;

/**
 * Same alphabet pair as desktop-electron catalogSearchFold / shared-kernel.
 * Used with SQL {@code translate(col, FROM, TO)} for case-insensitive Cyrillic search.
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

    static {
        if (FROM.length() != TO.length()) {
            throw new IllegalStateException("catalog search fold alphabets differ");
        }
    }

    private CatalogSearchFold() {}
}

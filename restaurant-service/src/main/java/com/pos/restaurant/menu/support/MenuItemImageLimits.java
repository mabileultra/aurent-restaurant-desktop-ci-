package com.pos.restaurant.menu.support;

import com.pos.restaurant.exception.ValidationException;

import java.util.Locale;
import java.util.Set;

/** Caps for menu photos stored as data-URI in Postgres (object storage can replace later). */
public final class MenuItemImageLimits {

    /** ~1.5 MiB decoded payload. */
    public static final int MAX_BYTES = 1_500_000;

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    );

    private MenuItemImageLimits() {
    }

    public static void assertAllowed(MenuItemDataUriParser.Parsed parsed) {
        if (parsed == null) {
            return;
        }
        if (!isAllowedType(parsed.contentType())) {
            throw new ValidationException("Menu item image type is not allowed: " + parsed.contentType());
        }
        byte[] bytes = parsed.bytes();
        if (bytes != null && bytes.length > MAX_BYTES) {
            throw new ValidationException(
                "Menu item image is too large (max " + (MAX_BYTES / 1024) + " KB)"
            );
        }
    }

    /** Validate raw imageUrl when it is a data URI; ignore external http(s) refs. */
    public static void assertDataUriIfPresent(String imageUrl) {
        MenuItemDataUriParser.Parsed parsed = MenuItemDataUriParser.parseOrNull(imageUrl);
        assertAllowed(parsed);
    }

    static boolean isAllowedType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return false;
        }
        String type = contentType.trim().toLowerCase(Locale.ROOT);
        int semi = type.indexOf(';');
        if (semi >= 0) {
            type = type.substring(0, semi).trim();
        }
        if ("image/jpg".equals(type)) {
            type = "image/jpeg";
        }
        return ALLOWED_TYPES.contains(type);
    }
}

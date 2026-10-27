package com.pos.restaurant.menu.support;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.exception.ValidationException;

import java.util.Base64;

public final class MenuItemDataUriParser {

    private MenuItemDataUriParser() {
    }

    public record Parsed(String contentType, byte[] bytes) {
    }

    public static Parsed parseOrNull(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        String trimmed = imageUrl.trim();
        if (!trimmed.regionMatches(true, 0, "data:", 0, 5)) {
            return null;
        }
        int comma = trimmed.indexOf(',');
        if (comma < 5) {
            throw new ValidationException("Invalid menu item image");
        }
        String meta = trimmed.substring(5, comma);
        String data = trimmed.substring(comma + 1);
        if (!meta.toLowerCase().contains(";base64")) {
            throw new ValidationException("Menu item image must be base64 data URI");
        }
        String contentType = meta.split(";", 2)[0].trim();
        if (contentType.isBlank()) {
            contentType = "application/octet-stream";
        }
        try {
            return new Parsed(contentType, Base64.getDecoder().decode(data));
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Invalid menu item image encoding");
        }
    }

    public static Parsed requireParsed(String imageUrl) {
        Parsed parsed = parseOrNull(imageUrl);
        if (parsed == null || parsed.bytes().length == 0) {
            throw new NotFoundException("Menu item image not found");
        }
        return parsed;
    }
}

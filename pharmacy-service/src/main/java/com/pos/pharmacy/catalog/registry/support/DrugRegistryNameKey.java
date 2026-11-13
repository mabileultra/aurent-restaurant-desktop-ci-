package com.pos.pharmacy.catalog.registry.support;

import java.util.Locale;

public final class DrugRegistryNameKey {

    private DrugRegistryNameKey() {
    }

    public static String of(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.toLowerCase(Locale.ROOT)
            .replace('ё', 'е')
            .replace('\u00a0', ' ')
            .replace("®", "")
            .replace("™", "")
            .replace("©", "")
            .replaceAll("[\"'«»]", "")
            .replaceAll("\\s+", " ")
            .trim();
    }
}

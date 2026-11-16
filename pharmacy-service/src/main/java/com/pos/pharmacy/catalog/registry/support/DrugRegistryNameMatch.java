package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;

import java.util.ArrayList;
import java.util.List;

/** Точное или «торговое имя в начале» названия товара; берём самый длинный ключ. */
public final class DrugRegistryNameMatch {

    private static final int MIN_KEY = 4;

    private DrugRegistryNameMatch() {
    }

    public static boolean matches(String productKey, String registryKey) {
        String product = DrugRegistryNameKey.of(productKey);
        String registry = DrugRegistryNameKey.of(registryKey);
        if (product.isBlank() || registry.length() < MIN_KEY) {
            return false;
        }
        if (product.equals(registry)) {
            return true;
        }
        if (!product.startsWith(registry) || product.length() <= registry.length()) {
            return false;
        }
        char next = product.charAt(registry.length());
        return next == ' ' || next == '/' || next == '-' || next == '(' || next == ',';
    }

    /** Среди кандидатов — строки с самым длинным name_key, которые матчятся к productKey. */
    public static List<DrugRegistryEntry> bestGroup(String productKey, List<DrugRegistryEntry> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }
        String product = DrugRegistryNameKey.of(productKey);
        int bestLen = -1;
        List<DrugRegistryEntry> best = new ArrayList<>();
        for (DrugRegistryEntry row : candidates) {
            String key = DrugRegistryNameKey.of(row.getNameKey());
            if (!matches(product, key)) {
                continue;
            }
            if (key.length() > bestLen) {
                bestLen = key.length();
                best = new ArrayList<>();
                best.add(row);
            } else if (key.length() == bestLen) {
                best.add(row);
            }
        }
        return best;
    }
}

package com.pos.shared.catalog;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Stable UUIDs for migrating Integer-keyed grocery categories into catalog-service.
 */
public final class CatalogLegacyIds {

    private CatalogLegacyIds() {
    }

    public static UUID categoryId(Integer companyId, Integer legacyCategoryId) {
        if (companyId == null || legacyCategoryId == null) {
            return null;
        }
        String key = "pos-category:" + companyId + ":" + legacyCategoryId;
        return UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8));
    }
}

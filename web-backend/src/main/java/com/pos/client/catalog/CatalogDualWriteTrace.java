package com.pos.client.catalog;

import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.shared.log.LogUtil;

/**
 * Soak-facing success traces for dual-write (fail path already warns in {@link CatalogServiceClient}).
 */
final class CatalogDualWriteTrace {

    private CatalogDualWriteTrace() {
    }

    static void ok(Class<?> source, CatalogServiceProperties properties, String operation, Object id) {
        LogUtil.info(
            source,
            "catalog dual-write {} id={} writeMode={}",
            operation,
            id,
            properties.effectiveWriteMode()
        );
    }
}

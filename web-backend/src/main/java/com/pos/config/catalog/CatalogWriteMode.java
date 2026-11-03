package com.pos.config.catalog;

/**
 * Wave 5.3 / 5.7 dial for dual-write into catalog-service.
 * Local web-backend Catalog remains DB SoT; REMOTE_ONLY makes remote mirror mandatory.
 */
public enum CatalogWriteMode {

    /** No outbound writes (same as {@code enabled=false}). */
    LOCAL_ONLY,

    /** After-commit best-effort upsert/deactivate to catalog-service. */
    DUAL,

    /**
     * Sync mirror in-request: remote failure aborts the local write path.
     * Still not “catalog-service SoT” (local rows remain); rehearsal before proxy CRUD.
     */
    REMOTE_ONLY
}

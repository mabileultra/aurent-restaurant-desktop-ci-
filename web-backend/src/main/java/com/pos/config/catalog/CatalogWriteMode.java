package com.pos.config.catalog;

/**
 * Dial for outbound product/category card writes toward catalog-service.
 *
 * <p><b>Local grocery {@code products} remains the DB row until Wave 7 drop.</b>
 * Modes differ in <em>when</em> remote must succeed and who is treated as card SoT.
 */
public enum CatalogWriteMode {

    /** No outbound writes (same as {@code enabled=false}). */
    LOCAL_ONLY,

    /** After-commit best-effort upsert/deactivate to catalog-service. Local SoT. */
    DUAL,

    /**
     * Strict <em>mirror</em>: remote must succeed in-request; local row still written first.
     * Not catalog SoT — rehearsal before {@link #CATALOG_PRIMARY}.
     */
    REMOTE_ONLY,

    /**
     * Wave 7: catalog-service is card SoT for grocery create/update/deactivate.
     * Upsert remote <em>before</em> local save (fail-fast); local row is mirror until drop.
     * Do not confuse with {@link #REMOTE_ONLY}.
     */
    CATALOG_PRIMARY
}

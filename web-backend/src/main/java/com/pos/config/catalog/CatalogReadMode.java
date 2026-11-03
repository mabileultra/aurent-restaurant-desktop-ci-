package com.pos.config.catalog;

/**
 * Wave 5.1 cutover dial for {@link com.pos.catalog.api.CatalogFacade} reads.
 * Writes stay on local SoT + optional dual-write until full cutover.
 */
public enum CatalogReadMode {

    /** Ignore catalog-service; local DB only. */
    LOCAL_ONLY,

    /** Prefer remote, fall back to local (Wave 4.2 default when enabled). */
    REMOTE_FIRST,

    /** Remote only — no local fallback (cutover rehearsal). */
    REMOTE_ONLY
}

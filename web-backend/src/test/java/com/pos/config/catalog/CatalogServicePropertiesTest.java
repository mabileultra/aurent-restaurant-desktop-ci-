package com.pos.config.catalog;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogServicePropertiesTest {

    @Test
    void disabledForcesLocalOnly() {
        CatalogServiceProperties p = new CatalogServiceProperties();
        p.setEnabled(false);
        p.setWriteMode(CatalogWriteMode.CATALOG_PRIMARY);
        p.setReadMode(CatalogReadMode.REMOTE_ONLY);

        assertEquals(CatalogWriteMode.LOCAL_ONLY, p.effectiveWriteMode());
        assertEquals(CatalogReadMode.LOCAL_ONLY, p.effectiveReadMode());
        assertFalse(p.dualWriteEnabled());
        assertFalse(p.catalogPrimaryWrite());
        assertFalse(p.strictRemoteWrite());
    }

    @Test
    void dualIsMirrorAfterLocal() {
        CatalogServiceProperties p = enabled(CatalogWriteMode.DUAL);

        assertTrue(p.dualWriteEnabled());
        assertFalse(p.catalogPrimaryWrite());
        assertFalse(p.strictRemoteWrite());
        assertTrue(p.outboundCatalogWriteEnabled());
    }

    @Test
    void remoteOnlyIsStrictMirrorNotPrimary() {
        CatalogServiceProperties p = enabled(CatalogWriteMode.REMOTE_ONLY);

        assertTrue(p.dualWriteEnabled());
        assertFalse(p.catalogPrimaryWrite());
        assertTrue(p.strictRemoteWrite());
        assertTrue(p.outboundCatalogWriteEnabled());
    }

    @Test
    void catalogPrimaryIsNotDualWritePath() {
        CatalogServiceProperties p = enabled(CatalogWriteMode.CATALOG_PRIMARY);

        assertFalse(p.dualWriteEnabled());
        assertTrue(p.catalogPrimaryWrite());
        assertTrue(p.strictRemoteWrite());
        assertTrue(p.outboundCatalogWriteEnabled());
    }

    private static CatalogServiceProperties enabled(CatalogWriteMode writeMode) {
        CatalogServiceProperties p = new CatalogServiceProperties();
        p.setEnabled(true);
        p.setWriteMode(writeMode);
        return p;
    }
}

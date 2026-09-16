package com.pos.pharmacy.catalog.support;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReleasedCatalogIdentityTest {

    @Test
    void freesSkuSoTheSameCodeCanBeCreatedAgain() {
        UUID id = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        String released = ReleasedCatalogIdentity.sku("PARA-500", id);
        assertTrue(released.startsWith("PARA-500#off"));
        assertFalse(released.equals("PARA-500"));
        assertEquals(released, ReleasedCatalogIdentity.sku(released, id));
    }

    @Test
    void longSkuStaysWithinColumnLimit() {
        String released = ReleasedCatalogIdentity.sku("X".repeat(120), UUID.randomUUID());
        assertTrue(released.length() <= 100);
        assertTrue(released.contains("#off"));
    }
}

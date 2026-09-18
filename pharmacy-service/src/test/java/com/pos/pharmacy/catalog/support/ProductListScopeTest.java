package com.pos.pharmacy.catalog.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProductListScopeTest {

    @Test
    void activeOnlyWithoutScopeShowsActive() {
        assertEquals(ProductListScope.ACTIVE, ProductListScope.normalize(null, true));
        assertEquals(Boolean.TRUE, ProductListScope.activeFilter(null, true));
    }

    @Test
    void allWithoutActiveOnlyShowsEverything() {
        assertEquals(ProductListScope.ALL, ProductListScope.normalize(null, false));
        assertNull(ProductListScope.activeFilter(null, false));
    }

    @Test
    void deletedScopeShowsInactiveOnly() {
        assertEquals(ProductListScope.DELETED, ProductListScope.normalize("deleted", false));
        assertEquals(Boolean.FALSE, ProductListScope.activeFilter("DELETED", true));
    }

    @Test
    void unknownScopeFallsBackToAll() {
        assertEquals(ProductListScope.ALL, ProductListScope.normalize("WHATEVER", false));
        assertNull(ProductListScope.activeFilter("WHATEVER", false));
    }
}

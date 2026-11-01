package com.pos.shared.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class FilterTextTest {

    @Test
    void normalizesSearch() {
        assertNull(FilterText.normalizeSearch(null));
        assertNull(FilterText.normalizeSearch("  "));
        assertEquals("abc", FilterText.normalizeSearch(" abc "));
        assertEquals(FilterText.MAX_SEARCH, FilterText.normalizeSearch("x".repeat(100)).length());
    }
}

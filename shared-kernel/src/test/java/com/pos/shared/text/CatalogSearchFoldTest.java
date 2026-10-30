package com.pos.shared.text;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CatalogSearchFoldTest {

    @Test
    void alphabetsStayPaired() {
        assertEquals(CatalogSearchFold.FROM.length(), CatalogSearchFold.TO.length());
    }

    @Test
    void foldsCyrillicAndLatin() {
        assertEquals("молоко", CatalogSearchFold.fold("Молоко"));
        assertEquals("молоко", CatalogSearchFold.fold("МОЛОКО"));
        assertEquals("milk", CatalogSearchFold.fold("Milk"));
        assertEquals("4607", CatalogSearchFold.fold("4607"));
        assertEquals("ўқ", CatalogSearchFold.fold("ЎҚ"));
    }
}

package com.pos.pharmacy.importing.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DidoxSpreadsheetCellCleanerTest {

    @Test
    void stripsOriginFromMoneyCell() {
        assertEquals("98980.00", DidoxSpreadsheetCellCleaner.clean("98980.00 Олди-сотди"));
        assertEquals("98980.00", DidoxSpreadsheetCellCleaner.clean("98980.00 Oldi-sotdi"));
    }

    @Test
    void keepsFirstMxikWhenTwoCodesGlued() {
        assertEquals(
            "06111001017000000 Трусы",
            DidoxSpreadsheetCellCleaner.clean("06111001017000000 Трусы 03004001001000000 Носки")
        );
    }

    @Test
    void leavesSingleMxikAndPlainName() {
        assertEquals("06111001017000000", DidoxSpreadsheetCellCleaner.clean("06111001017000000"));
        assertEquals("Трусы", DidoxSpreadsheetCellCleaner.clean("Трусы"));
        assertEquals("Олди-сотди", DidoxSpreadsheetCellCleaner.clean("Олди-сотди"));
    }
}

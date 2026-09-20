package com.pos.pharmacy.importing.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExcelBarcodeTextTest {

    @Test
    void expandsEuropeanScientificBarcode() {
        assertEquals("4780020000000", ExcelBarcodeText.normalize("4,78002E+12"));
        assertEquals("4502880000000", ExcelBarcodeText.normalize("4,50288E+12"));
        assertTrue(ExcelBarcodeText.looksScientific("4,78002E+12"));
        assertFalse(ExcelBarcodeText.looksScientific("4780063974468"));
    }

    @Test
    void keepsPlainBarcodeDigits() {
        assertEquals("4780063974468", ExcelBarcodeText.normalize("4780063974468"));
        assertEquals("4780063974468", ExcelBarcodeText.normalize("478 0063 974468"));
    }
}

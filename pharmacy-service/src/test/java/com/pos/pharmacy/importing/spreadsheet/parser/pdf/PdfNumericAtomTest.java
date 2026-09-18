package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfNumericAtomTest {

    @Test
    void recognizesSpacedMoneyAndPercent() {
        assertTrue(PdfNumericAtom.looksComplete("259 678.05"));
        assertTrue(PdfNumericAtom.looksComplete("12%"));
        assertTrue(PdfNumericAtom.looksComplete("10.00000"));
        assertFalse(PdfNumericAtom.looksComplete("50шт"));
        assertFalse(PdfNumericAtom.looksComplete("08111001017000000"));
    }

    @Test
    void keepsThousandsGroupTogether() {
        assertTrue(PdfNumericAtom.isThousandsContinuation("259", "678.05"));
        assertTrue(PdfNumericAtom.isThousandsContinuation("259 678", "033.91"));
        assertFalse(PdfNumericAtom.isThousandsContinuation("259 678.05", "12%"));
        assertFalse(PdfNumericAtom.isThousandsContinuation("12%", "31"));
    }
}

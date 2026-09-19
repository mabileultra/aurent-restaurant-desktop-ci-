package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DidoxInvoiceNameNumberStripTest {

    @Test
    void peelsInvoiceRowNumberFromName() {
        assertEquals("Кюпен таб 50мг/500мг №100", DidoxInvoiceNameNumberStrip.peel("1 Кюпен таб 50мг/500мг №100"));
        assertEquals("Болнол таб №100", DidoxInvoiceNameNumberStrip.peel("2 Болнол таб №100"));
        assertEquals("Пиковит 1+ сироп 150мл", DidoxInvoiceNameNumberStrip.peel("12 Пиковит 1+ сироп 150мл"));
    }

    @Test
    void keepsBareIndexAndShortUnits() {
        assertEquals("1", DidoxInvoiceNameNumberStrip.peel("1"));
        assertEquals("100 мг", DidoxInvoiceNameNumberStrip.peel("100 мг"));
        assertEquals("Маҳсулот номи", DidoxInvoiceNameNumberStrip.peel("Маҳсулот номи"));
    }

    @Test
    void peelsFirstCellOnly() {
        List<List<String>> rows = DidoxInvoiceNameNumberStrip.apply(List.of(
            List.of("1 Трусы", "01", "10"),
            List.of("1", "2", "3")
        ));
        assertEquals("Трусы", rows.get(0).get(0));
        assertEquals("01", rows.get(0).get(1));
        assertEquals("1", rows.get(1).get(0));
    }
}

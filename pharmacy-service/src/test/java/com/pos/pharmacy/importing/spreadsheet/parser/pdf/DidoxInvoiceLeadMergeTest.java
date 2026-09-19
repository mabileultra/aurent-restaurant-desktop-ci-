package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DidoxInvoiceLeadMergeTest {

    @Test
    void joinsCarriedNameWithoutRowNumber() {
        List<String> pending = List.of("Кюпен таб", "03004409005039001");
        List<String> product = List.of("1", "Маркировкаланган", "8908");
        List<String> merged = DidoxInvoiceLeadMerge.intoProduct(pending, product);
        assertEquals("Кюпен таб", merged.get(0));
        assertEquals("03004409005039001 Маркировкаланган", merged.get(1));
        assertEquals("8908", merged.get(2));
    }

    @Test
    void peelsNumberWhenNameAlreadyOnTheLine() {
        List<String> pending = List.of("Ципрофлоксацин-");
        List<String> product = List.of("6 Ника таб 500мг");
        assertEquals("Ципрофлоксацин- Ника таб 500мг",
            DidoxInvoiceLeadMerge.intoProduct(pending, product).get(0));
    }
}

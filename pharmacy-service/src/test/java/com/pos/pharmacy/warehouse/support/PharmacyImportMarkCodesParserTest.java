package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportMarkCodesParserTest {

    @Test
    void parsesSemicolonAndNewlines() {
        List<String> codes = PharmacyImportMarkCodesParser.parse(
            "010478001234567821AAAA91X; 010478001234567821BBBB91X\n010478001234567821CCCC91X"
        );
        assertEquals(3, codes.size());
        assertTrue(codes.get(0).startsWith("010478"));
    }

    @Test
    void dedupesCaseInsensitive() {
        List<String> codes = PharmacyImportMarkCodesParser.parse("CODE1;code1;CODE2");
        assertEquals(2, codes.size());
    }

    @Test
    void emptyYieldsEmpty() {
        assertTrue(PharmacyImportMarkCodesParser.parse("").isEmpty());
        assertTrue(PharmacyImportMarkCodesParser.parse(null).isEmpty());
    }
}

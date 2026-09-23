package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
        List<String> codes = PharmacyImportMarkCodesParser.parse(
            "010478001234567821AAAA91X;010478001234567821aaaa91x;010478001234567821BBBB91X"
        );
        assertEquals(2, codes.size());
    }

    @Test
    void emptyYieldsEmpty() {
        assertTrue(PharmacyImportMarkCodesParser.parse("").isEmpty());
        assertTrue(PharmacyImportMarkCodesParser.parse(null).isEmpty());
    }

    @Test
    void dropsDidoxMarkedFlag() {
        assertTrue(PharmacyImportMarkCodesParser.parse("Маркировкаланган").isEmpty());
        assertTrue(PharmacyImportMarkCodesParser.parse("Markirovkalangan").isEmpty());
        assertFalse(PharmacyImportMarkCodesParser.isPlausibleMarkCode("Маркировкаланган"));
    }

    @Test
    void dropsShortOrDigitlessNoise() {
        assertTrue(PharmacyImportMarkCodesParser.parse("short").isEmpty());
        assertTrue(PharmacyImportMarkCodesParser.parse("AAAAAAAAAAAAAAAAAAAA").isEmpty());
    }

    @Test
    void dropsIkpuMxikDigits() {
        assertTrue(PharmacyImportMarkCodesParser.parse("03004409005039001").isEmpty());
        assertTrue(PharmacyImportMarkCodesParser.parse("01004409005039001").isEmpty());
        assertFalse(PharmacyImportMarkCodesParser.isPlausibleMarkCode("03004409005039001"));
        assertTrue(PharmacyImportMarkCodesParser.isPlausibleMarkCode("010478001234567821AAAA91X"));
    }
}

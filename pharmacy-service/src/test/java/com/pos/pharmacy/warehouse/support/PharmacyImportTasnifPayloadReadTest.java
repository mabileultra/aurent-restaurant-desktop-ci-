package com.pos.pharmacy.warehouse.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportTasnifPayloadReadTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void readsFirstHit() throws Exception {
        PharmacyImportTasnifHit hit = PharmacyImportTasnifPayloadRead.first(mapper.readTree("""
            {
              "success": true,
              "data": [{
                "name": "Кюпен",
                "description": "таблетки",
                "label": 1,
                "packages": [
                  { "code": "1" },
                  { "code": 1546940 }
                ]
              }]
            }
            """));
        assertTrue(hit.found());
        assertTrue(hit.labeled());
        assertEquals("1546940", hit.packageCode());
        assertTrue(hit.catalogText().contains("Кюпен"));
    }

    @Test
    void emptyOrFailedIsMiss() throws Exception {
        assertFalse(PharmacyImportTasnifPayloadRead.first(mapper.readTree(
            "{\"success\":false,\"data\":[]}"
        )).found());
        assertFalse(PharmacyImportTasnifPayloadRead.first(mapper.readTree(
            "{\"success\":true,\"data\":[]}"
        )).found());
        assertFalse(PharmacyImportTasnifPayloadRead.first(null).found());
    }

    @Test
    void unlabeledWithoutPackage() throws Exception {
        PharmacyImportTasnifHit hit = PharmacyImportTasnifPayloadRead.first(mapper.readTree("""
            {
              "success": true,
              "data": [{
                "name": "Трусы",
                "label": 0,
                "packages": []
              }]
            }
            """));
        assertTrue(hit.found());
        assertFalse(hit.labeled());
        assertNull(hit.packageCode());
    }
}

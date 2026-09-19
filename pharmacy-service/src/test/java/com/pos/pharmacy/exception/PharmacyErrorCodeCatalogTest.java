package com.pos.pharmacy.exception;

import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyImportErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyMarkErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyShiftErrors;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyErrorCodeCatalogTest {

    @Test
    void codesAreUniqueAndPrefixed() {
        List<String> codes = new ArrayList<>();
        for (PharmacyErrorCode code : PharmacyCommonErrors.values()) {
            codes.add(code.name());
        }
        for (PharmacyErrorCode code : PharmacyCatalogErrors.values()) {
            codes.add(code.name());
        }
        for (PharmacyErrorCode code : PharmacyReceiptErrors.values()) {
            codes.add(code.name());
        }
        for (PharmacyErrorCode code : PharmacyMarkErrors.values()) {
            codes.add(code.name());
        }
        for (PharmacyErrorCode code : PharmacySaleErrors.values()) {
            codes.add(code.name());
        }
        for (PharmacyErrorCode code : PharmacyShiftErrors.values()) {
            codes.add(code.name());
        }
        for (PharmacyErrorCode code : PharmacyImportErrors.values()) {
            codes.add(code.name());
        }
        Set<String> unique = new HashSet<>();
        for (String code : codes) {
            assertTrue(code.startsWith("PHARM_"), code);
            assertTrue(unique.add(code), code);
        }
        assertTrue(codes.size() > 40);
    }
}

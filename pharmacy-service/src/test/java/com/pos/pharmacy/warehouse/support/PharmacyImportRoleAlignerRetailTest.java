package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportRoleAlignerRetailTest {

    @Test
    void dropsRetailWhenColumnIsVatSum() {
        List<PharmacyImportColumnHint> columns = List.of(
            hint(0, "Сотиб", PharmacyImportRoles.PURCHASE),
            hint(1, "Устама", PharmacyImportRoles.MARKUP),
            hint(2, "Миқдор", PharmacyImportRoles.QTY),
            hint(3, "ҚҚС Сумма", PharmacyImportRoles.RETAIL),
            hint(4, "ҚҚС Ставка", PharmacyImportRoles.VAT_RATE)
        );
        List<List<String>> rows = List.of(
            List.of("1741.07", "9.74", "100", "22928.52", "12%"),
            List.of("12500.00", "10", "5", "8250.00", "12%"),
            List.of("44111.93", "5.45", "1", "5582.14", "12%")
        );
        List<PharmacyImportColumnHint> aligned = PharmacyImportRoleAligner.apply(columns, rows);
        assertEquals(PharmacyImportRoles.SKIP, aligned.get(3).suggestedRole());
        assertEquals(PharmacyImportRoles.MARKUP, aligned.get(1).suggestedRole());
        assertEquals(PharmacyImportRoles.VAT_RATE, aligned.get(4).suggestedRole());
    }

    private static PharmacyImportColumnHint hint(int index, String header, String role) {
        return new PharmacyImportColumnHint(index, header, role);
    }
}

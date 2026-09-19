package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportRoleAlignerTest {

    @Test
    void movesVatFromSumToPercentColumn() {
        List<PharmacyImportColumnHint> columns = List.of(
            hint(0, "Миқдор", PharmacyImportRoles.QTY),
            hint(1, "Нарх", PharmacyImportRoles.RETAIL),
            hint(2, "Етказиб", PharmacyImportRoles.SKIP),
            hint(3, "ҚҚС", PharmacyImportRoles.SKIP),
            hint(4, "ҚҚС Ставка", PharmacyImportRoles.VAT_RATE),
            hint(5, "ҚҚСни ҳисобга", PharmacyImportRoles.SKIP)
        );
        List<List<String>> rows = List.of(
            List.of("10", "8837.50", "88375.00", "12%", "10605.00", "98980.00")
        );
        List<PharmacyImportColumnHint> aligned = PharmacyImportRoleAligner.apply(columns, rows);
        assertEquals(PharmacyImportRoles.SKIP, aligned.get(4).suggestedRole());
        assertEquals(PharmacyImportRoles.VAT_RATE, aligned.get(3).suggestedRole());
    }

    @Test
    void keepsSeriesWhenUnitIsOnTheRight() {
        List<PharmacyImportColumnHint> columns = List.of(
            hint(0, "Серия", PharmacyImportRoles.BATCH),
            hint(1, "Улчов", PharmacyImportRoles.SKIP)
        );
        List<List<String>> rows = List.of(
            List.of("01", "dona"),
            List.of("50226", "qadoq+2 blister + 5 dona")
        );
        List<PharmacyImportColumnHint> aligned = PharmacyImportRoleAligner.apply(columns, rows);
        assertEquals(PharmacyImportRoles.BATCH, aligned.get(0).suggestedRole());
        assertEquals(PharmacyImportRoles.SKIP, aligned.get(1).suggestedRole());
    }

    @Test
    void movesSeriesOffUnitColumn() {
        List<PharmacyImportColumnHint> columns = List.of(
            hint(0, "Серия", PharmacyImportRoles.SKIP),
            hint(1, "Улчов", PharmacyImportRoles.BATCH)
        );
        List<List<String>> rows = List.of(
            List.of("01", "dona"),
            List.of("ZA4485", "qadoq + dona")
        );
        List<PharmacyImportColumnHint> aligned = PharmacyImportRoleAligner.apply(columns, rows);
        assertEquals(PharmacyImportRoles.BATCH, aligned.get(0).suggestedRole());
        assertEquals(PharmacyImportRoles.SKIP, aligned.get(1).suggestedRole());
    }

    private static PharmacyImportColumnHint hint(int index, String header, String role) {
        return new PharmacyImportColumnHint(index, header, role);
    }
}

package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * Ручная подмена роли сверху: колонка была «НДС», пользователь ставит «Розничная» —
 * читаем именно этот index, не соседний и не устаму вместо цены.
 */
class PharmacyImportUserRoleRemapTest {

    @Test
    void manualRetailRoleUsesExactColumnIndex() {
        List<String> row = List.of(
            "Меновазин",
            "1741.07",
            "9.74",
            "100",
            "1910.71",
            "12%",
            "22928.52"
        );
        // Авто: col5=VAT, col4 ошибочно SKIP; пользователь ставит RETAIL на col4 (Нарҳ)
        Map<String, Integer> autoWrong = Map.of(
            PharmacyImportRoles.NAME, 0,
            PharmacyImportRoles.PURCHASE, 1,
            PharmacyImportRoles.MARKUP, 2,
            PharmacyImportRoles.QTY, 3,
            PharmacyImportRoles.VAT_RATE, 4,
            PharmacyImportRoles.RETAIL, 6
        );
        Map<String, Integer> userFixed = new HashMap<>(autoWrong);
        userFixed.put(PharmacyImportRoles.VAT_RATE, 5);
        userFixed.put(PharmacyImportRoles.RETAIL, 4);

        BigDecimal wrong = PharmacyImportRetailResolve.resolve(
            dec(row, autoWrong, PharmacyImportRoles.PURCHASE),
            dec(row, autoWrong, PharmacyImportRoles.VAT_RATE),
            dec(row, autoWrong, PharmacyImportRoles.MARKUP),
            dec(row, autoWrong, PharmacyImportRoles.RETAIL),
            dec(row, autoWrong, PharmacyImportRoles.QTY)
        );
        BigDecimal fixed = PharmacyImportRetailResolve.resolve(
            dec(row, userFixed, PharmacyImportRoles.PURCHASE),
            dec(row, userFixed, PharmacyImportRoles.VAT_RATE),
            dec(row, userFixed, PharmacyImportRoles.MARKUP),
            dec(row, userFixed, PharmacyImportRoles.RETAIL),
            dec(row, userFixed, PharmacyImportRoles.QTY)
        );

        assertEquals("1910.71", PharmacyImportRoleCells.text(row, userFixed, PharmacyImportRoles.RETAIL));
        assertEquals("12%", PharmacyImportRoleCells.text(row, userFixed, PharmacyImportRoles.VAT_RATE));
        assertEquals(0, new BigDecimal("2140.00").compareTo(fixed));
        assertNotEquals(0, fixed.compareTo(wrong == null ? BigDecimal.ZERO : wrong));
    }

    @Test
    void manualRetailBeatsMarkupWhenUserMappedPriceColumn() {
        // Цена не совпадает с устамой — доверяем колонке, которую выбрал пользователь
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("10000"),
            new BigDecimal("12"),
            new BigDecimal("20"),
            new BigDecimal("15000"),
            BigDecimal.ONE
        );
        assertEquals(new BigDecimal("15000.00"), retail);
    }

    @Test
    void percentMistakenAsRetailFallsBackToMarkup() {
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("1741.07"),
            new BigDecimal("12"),
            new BigDecimal("9.74"),
            new BigDecimal("12"),
            new BigDecimal("100")
        );
        assertEquals(new BigDecimal("2139.93"), retail);
    }

    private static BigDecimal dec(List<String> row, Map<String, Integer> roles, String role) {
        return PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, role));
    }
}

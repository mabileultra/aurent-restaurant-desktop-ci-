package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportRolesDidoxTest {

    @Test
    void guessesDidoxHisobFakturaHeaders() {
        assertEquals(PharmacyImportRoles.NAME, PharmacyImportRoles.guess("№ Маҳсулот номи (хизматлар)"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("Маркировка коди"));
        assertEquals(
            PharmacyImportRoles.PRESCRIPTION,
            PharmacyImportRoles.guess("Дори воситаларини бериш усули")
        );
        assertEquals(PharmacyImportRoles.PRESCRIPTION, PharmacyImportRoles.guess("Рецептли / Рецептсиз"));
        assertEquals(
            PharmacyImportRoles.IKPU,
            PharmacyImportRoles.guess("Товар (хизмат) лар Ягона электрон миллий каталоги бўйича идентификация коди")
        );
        assertEquals(PharmacyImportRoles.BARCODE, PharmacyImportRoles.guess("Товар/хизмат штрих коди"));
        assertEquals(PharmacyImportRoles.BATCH, PharmacyImportRoles.guess("Серия"));
        assertEquals(PharmacyImportRoles.BATCH, PharmacyImportRoles.guess("Seriya"));
        assertEquals(PharmacyImportRoles.BATCH, PharmacyImportRoles.guess("SERIYA"));
        assertEquals(PharmacyImportRoles.BATCH, PharmacyImportRoles.guess("Series"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("Улчов бирлиги"));
        assertEquals(PharmacyImportRoles.PURCHASE, PharmacyImportRoles.guess("Сотиб олиш қиймати (йиллик нарх)"));
        assertEquals(PharmacyImportRoles.QTY, PharmacyImportRoles.guess("Миқдор"));
        assertEquals(PharmacyImportRoles.RETAIL, PharmacyImportRoles.guess("Нарх"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("Етказиб бериш қиймати"));
        assertEquals(PharmacyImportRoles.VAT_RATE, PharmacyImportRoles.guess("ҚҚС Ставка"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("ҚҚС Сумма"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("ҚҚС"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("Савдо қўшимчаси (устама), %"));
        assertEquals(
            PharmacyImportRoles.SKIP,
            PharmacyImportRoles.guess("Товарнинг келиб чиқиши")
        );
        assertEquals(PharmacyImportRoles.MARK_CODES, PharmacyImportRoles.guess("Коды маркировки КМ DataMatrix"));
    }
}

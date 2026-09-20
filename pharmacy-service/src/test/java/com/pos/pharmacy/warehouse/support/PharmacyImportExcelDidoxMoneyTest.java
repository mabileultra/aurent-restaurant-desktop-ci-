package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.importing.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoicePdfParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Excel (HTML.xls Didox): колонки не съезжают; смена роли RETAIL меняет только эту колонку.
 */
class PharmacyImportExcelDidoxMoneyTest {

    private PharmacyImportGridSupport support;

    @BeforeEach
    void setUp() {
        UzInvoiceSpreadsheetParser spreadsheet = new UzInvoiceSpreadsheetParser();
        support = new PharmacyImportGridSupport(new UzInvoicePdfParser(spreadsheet), spreadsheet);
    }

    @Test
    void excelKeepsSixteenMoneyColumnsAligned() throws Exception {
        byte[] bytes = Files.readAllBytes(Path.of("src/test/resources/import-samples/didox-excel-money.xls"));
        assertTrue(HtmlExcelTableParser.isHtmlSpreadsheet(bytes));
        var file = new MockMultipartFile("f", "didox-excel-money.xls", "application/vnd.ms-excel", bytes);
        List<List<String>> grid = support.readGrid(file);
        int header = support.findHeaderRow(grid);
        List<List<String>> data = support.dataRows(grid, header);
        List<PharmacyImportColumnHint> cols = support.columns(grid.get(header), data);

        Map<String, Integer> roles = new HashMap<>();
        for (PharmacyImportColumnHint col : cols) {
            if (!PharmacyImportRoles.SKIP.equals(col.suggestedRole())) {
                roles.putIfAbsent(col.suggestedRole(), col.index());
            }
        }

        assertTrue(roles.containsKey(PharmacyImportRoles.NAME));
        assertTrue(roles.containsKey(PharmacyImportRoles.PURCHASE));
        assertTrue(roles.containsKey(PharmacyImportRoles.MARKUP));
        assertTrue(roles.containsKey(PharmacyImportRoles.QTY));
        assertTrue(roles.containsKey(PharmacyImportRoles.RETAIL));
        assertTrue(roles.containsKey(PharmacyImportRoles.VAT_RATE));
        assertTrue(roles.containsKey(PharmacyImportRoles.BATCH));

        List<String> menov = find(data, "Меновазин");
        assertEquals("1 741.07", PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.PURCHASE));
        assertEquals("9.74", PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.MARKUP));
        assertEquals("100.000000", PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.QTY));
        assertEquals("1 910.71", PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.RETAIL));
        assertEquals("12%", PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.VAT_RATE));
        assertEquals("072026", PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.BATCH));

        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.PURCHASE)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.VAT_RATE)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.MARKUP)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.RETAIL)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(menov, roles, PharmacyImportRoles.QTY))
        );
        assertEquals(0, new BigDecimal("2140.00").compareTo(retail));
    }

    @Test
    void changingRetailRoleUsesExactColumnNotNeighbor() throws Exception {
        byte[] bytes = Files.readAllBytes(Path.of("src/test/resources/import-samples/didox-excel-money.xls"));
        var file = new MockMultipartFile("f", "didox.xls", "application/vnd.ms-excel", bytes);
        List<List<String>> grid = support.readGrid(file);
        int header = support.findHeaderRow(grid);
        List<List<String>> data = support.dataRows(grid, header);
        List<String> menov = find(data, "Меновазин");

        Map<String, Integer> correct = Map.of(
            PharmacyImportRoles.NAME, 0,
            PharmacyImportRoles.PURCHASE, 7,
            PharmacyImportRoles.MARKUP, 8,
            PharmacyImportRoles.QTY, 9,
            PharmacyImportRoles.RETAIL, 10,
            PharmacyImportRoles.VAT_RATE, 12
        );
        Map<String, Integer> wrongVatSum = new HashMap<>(correct);
        wrongVatSum.put(PharmacyImportRoles.RETAIL, 13);

        BigDecimal fromNarx = PharmacyImportRetailResolve.resolve(
            dec(menov, correct, PharmacyImportRoles.PURCHASE),
            dec(menov, correct, PharmacyImportRoles.VAT_RATE),
            dec(menov, correct, PharmacyImportRoles.MARKUP),
            dec(menov, correct, PharmacyImportRoles.RETAIL),
            dec(menov, correct, PharmacyImportRoles.QTY)
        );
        BigDecimal fromVatSumColumn = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(menov, wrongVatSum, PharmacyImportRoles.RETAIL)
        );
        assertEquals(0, new BigDecimal("2140.00").compareTo(fromNarx));
        assertEquals(0, new BigDecimal("22928.52").compareTo(fromVatSumColumn));
        assertNotEquals(0, fromNarx.compareTo(fromVatSumColumn));

        BigDecimal recovered = PharmacyImportRetailResolve.resolve(
            dec(menov, wrongVatSum, PharmacyImportRoles.PURCHASE),
            dec(menov, wrongVatSum, PharmacyImportRoles.VAT_RATE),
            dec(menov, wrongVatSum, PharmacyImportRoles.MARKUP),
            fromVatSumColumn,
            dec(menov, wrongVatSum, PharmacyImportRoles.QTY)
        );
        assertEquals(0, new BigDecimal("2139.93").compareTo(recovered));
    }

    @Test
    void roleMapDropsOutOfRangeIndexes() {
        Map<String, Integer> normalized = PharmacyImportRoleMap.normalize(
            Map.of(
                PharmacyImportRoles.NAME, 0,
                PharmacyImportRoles.RETAIL, 99,
                PharmacyImportRoles.PURCHASE, 7,
                "SKIP", 3
            ),
            16
        );
        assertEquals(0, normalized.get(PharmacyImportRoles.NAME));
        assertEquals(7, normalized.get(PharmacyImportRoles.PURCHASE));
        assertTrue(!normalized.containsKey(PharmacyImportRoles.RETAIL));
        assertTrue(!normalized.containsKey("SKIP"));
    }

    private static List<String> find(List<List<String>> data, String namePart) {
        return data.stream()
            .filter(row -> row.get(0).contains(namePart))
            .findFirst()
            .orElseThrow();
    }

    private static BigDecimal dec(List<String> row, Map<String, Integer> roles, String role) {
        return PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, role));
    }
}

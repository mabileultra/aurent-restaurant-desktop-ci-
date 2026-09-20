package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.importing.spreadsheet.parser.ExcelBarcodeText;
import com.pos.pharmacy.importing.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoicePdfParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Точность под реальный Didox Excel со скрина: ҚҚС Ставка/Сумма, Ўзбекистон, E+12, 8 571,18. */
class PharmacyImportExcelScreenshotAccuracyTest {

    @Test
    void screenshotExcelMapsAllMoneyRolesExactly() throws Exception {
        byte[] bytes = Files.readAllBytes(Path.of("src/test/resources/import-samples/didox-excel-screenshot.xls"));
        assertTrue(HtmlExcelTableParser.isHtmlSpreadsheet(bytes));

        PharmacyImportGridSupport support = new PharmacyImportGridSupport(
            new UzInvoicePdfParser(new UzInvoiceSpreadsheetParser()),
            new UzInvoiceSpreadsheetParser()
        );
        var file = new MockMultipartFile("f", "didox-excel-screenshot.xls", "application/vnd.ms-excel", bytes);
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

        assertEquals(PharmacyImportRoles.NAME, roleAt(cols, roles.get(PharmacyImportRoles.NAME)));
        assertEquals(PharmacyImportRoles.PURCHASE, roleAt(cols, roles.get(PharmacyImportRoles.PURCHASE)));
        assertEquals(PharmacyImportRoles.MARKUP, roleAt(cols, roles.get(PharmacyImportRoles.MARKUP)));
        assertEquals(PharmacyImportRoles.QTY, roleAt(cols, roles.get(PharmacyImportRoles.QTY)));
        assertEquals(PharmacyImportRoles.RETAIL, roleAt(cols, roles.get(PharmacyImportRoles.RETAIL)));
        assertEquals(PharmacyImportRoles.VAT_RATE, roleAt(cols, roles.get(PharmacyImportRoles.VAT_RATE)));
        assertEquals(PharmacyImportRoles.COUNTRY, roleAt(cols, roles.get(PharmacyImportRoles.COUNTRY)));
        assertEquals(PharmacyImportRoles.BARCODE, roleAt(cols, roles.get(PharmacyImportRoles.BARCODE)));

        List<String> linkas = data.stream()
            .filter(r -> r.get(0).contains("Линкас"))
            .findFirst()
            .orElseThrow();

        assertEquals("8 571,18", PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.PURCHASE));
        assertEquals("13,22", PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.MARKUP));
        assertEquals("10", PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.QTY));
        assertEquals("9 704,29", PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.RETAIL));
        assertEquals("12%", PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.VAT_RATE));
        assertEquals("Ўзбекистон", PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.COUNTRY));

        BigDecimal purchase = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.PURCHASE)
        );
        BigDecimal markup = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.MARKUP)
        );
        BigDecimal narx = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.RETAIL)
        );
        BigDecimal qty = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.QTY)
        );
        BigDecimal vat = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.VAT_RATE)
        );

        assertEquals(new BigDecimal("8571.18"), purchase);
        assertEquals(new BigDecimal("13.22"), markup);
        assertEquals(new BigDecimal("9704.29"), narx);
        assertEquals(new BigDecimal("10"), qty);

        BigDecimal retail = PharmacyImportRetailResolve.resolve(purchase, vat, markup, narx, qty);
        assertEquals(0, new BigDecimal("10868.80").compareTo(retail));

        String barcodeRaw = PharmacyImportRoleCells.text(linkas, roles, PharmacyImportRoles.BARCODE);
        String barcode = ExcelBarcodeText.normalize(barcodeRaw);
        assertTrue(barcode.matches("\\d{12,13}"), barcodeRaw + " → " + barcode);
        assertTrue(!barcode.toUpperCase().contains("E"), barcode);
    }

    @Test
    void decimalParsesUzbekGroupedComma() {
        assertEquals(new BigDecimal("8571.18"), PharmacyImportValueParser.decimal("8 571,18"));
        assertEquals(new BigDecimal("90960.32"), PharmacyImportValueParser.decimal("90 960,32"));
        assertEquals(new BigDecimal("8837.50"), PharmacyImportValueParser.decimal("8 837,50"));
        assertEquals(new BigDecimal("110000.02"), PharmacyImportValueParser.decimal("110 000,02"));
    }

    @Test
    void barcodeExpandsExcelScientific() {
        assertEquals("4780020000000", ExcelBarcodeText.normalize("4,78002E+12"));
        assertEquals("4502880000000", ExcelBarcodeText.normalize("4,50288E+12"));
        assertEquals("4780063974468", ExcelBarcodeText.normalize("4780063974468"));
    }

    private static String roleAt(List<PharmacyImportColumnHint> cols, Integer index) {
        return cols.get(index).suggestedRole();
    }
}

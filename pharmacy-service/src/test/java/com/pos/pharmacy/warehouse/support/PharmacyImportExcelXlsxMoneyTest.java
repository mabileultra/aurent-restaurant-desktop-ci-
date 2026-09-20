package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoicePdfParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Бинарный .xlsx: те же роли и деньги, что HTML.xls. */
class PharmacyImportExcelXlsxMoneyTest {

    @Test
    void xlsxMoneyColumnsStayAligned() throws Exception {
        byte[] bytes = buildXlsx();
        PharmacyImportGridSupport support = new PharmacyImportGridSupport(
            new UzInvoicePdfParser(new UzInvoiceSpreadsheetParser()),
            new UzInvoiceSpreadsheetParser()
        );
        var file = new MockMultipartFile("f", "didox.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);
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
        assertTrue(roles.containsKey(PharmacyImportRoles.PURCHASE));
        assertTrue(roles.containsKey(PharmacyImportRoles.RETAIL));
        assertTrue(roles.containsKey(PharmacyImportRoles.MARKUP));

        List<String> row = data.get(0);
        assertEquals("Меновазин р/р 40мл", PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.NAME));
        assertEquals("1741.07", PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PURCHASE));
        assertEquals("9.74", PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.MARKUP));
        assertEquals("1910.71", PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.RETAIL));

        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PURCHASE)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.VAT_RATE)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.MARKUP)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.RETAIL)),
            PharmacyImportValueParser.decimal(PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.QTY))
        );
        assertEquals(0, new BigDecimal("2140.00").compareTo(retail));
    }

    private static byte[] buildXlsx() throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("invoice");
            String[] headers = {
                "Маҳсулот номи", "Маркировка коди", "Идентификация коди", "Штрих коди",
                "Бериш усули", "Серия", "Ўлчов бирлиги", "Сотиб олиш қиймати",
                "Савдо қўшимчаси (устама), %", "Миқдор", "Нарҳ", "Етказиб бериш қиймати",
                "ҚҚС Ставка", "ҚҚС Сумма", "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати",
                "Товарни келиб чиқиши"
            };
            String[] values = {
                "Меновазин р/р 40мл", "", "03304001003000000", "4780063974468",
                "Рецептсиз", "072026", "dona", "1741.07",
                "9.74", "100", "1910.71", "191071.00",
                "12%", "22928.52", "213999.52", "Олди-сотди"
            };
            Row h = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                h.createCell(i).setCellValue(headers[i]);
            }
            Row r = sheet.createRow(1);
            for (int i = 0; i < values.length; i++) {
                r.createCell(i).setCellValue(values[i]);
            }
            wb.write(out);
            return out.toByteArray();
        }
    }
}

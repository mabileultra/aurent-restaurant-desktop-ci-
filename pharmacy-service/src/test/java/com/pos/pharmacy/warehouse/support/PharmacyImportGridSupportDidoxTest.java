package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.importing.spreadsheet.parser.DidoxSpreadsheetHeaderJoiner;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportGridSupportDidoxTest {

    @Test
    void findsMergedDidoxHeaderAndSkipsIndexRow() {
        PharmacyImportGridSupport support = new PharmacyImportGridSupport(null, null);
        List<List<String>> grid = List.of(
            List.of("Hisob-faktura IS-00008429"),
            List.of(
                "Маҳсулот номи", "Маркировка коди", "Идентификация коди", "Штрих коди",
                "Серия", "Улчов бирлиги", "Сотиб олиш қиймати", "Миқдор", "Нарх"
            ),
            List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"),
            List.of("1 Трусы", "Маркировкаланган", "08111", "", "01", "dona", "8034.71", "10", "8837.50"),
            List.of("Jami:", "", "", "", "", "", "176355.00", "", "")
        );
        int header = support.findHeaderRow(grid);
        assertEquals(1, header);
        List<List<String>> rows = support.dataRows(grid, header);
        assertEquals(1, rows.size());
        assertEquals("1 Трусы", rows.get(0).get(0));
        var columns = support.columns(grid.get(header));
        assertEquals(PharmacyImportRoles.BATCH, columns.get(4).suggestedRole());
    }

    @Test
    void guessesRolesAfterJoiningExcelWrapHeader() {
        PharmacyImportGridSupport support = new PharmacyImportGridSupport(null, null);
        List<List<String>> joined = DidoxSpreadsheetHeaderJoiner.apply(List.of(
            List.of(
                "№ Маҳсулот номи (хизматлар)", "Маркировка",
                "Товар (хизмат) лар Ягона электрон миллий каталоги бўйича идентификация",
                "Товар/хизмат штрих", "Миқдор", "Нарх", "ҚҚС"
            ),
            List.of("", "коди", "коди", "коди", "", "", "Ставка"),
            List.of("1", "2", "3", "4", "5", "6", "7"),
            List.of("1 Трусы", "Маркировкаланган", "06111001017000000", "4602884018285", "10", "8837.50", "12")
        ));
        int header = support.findHeaderRow(joined);
        assertEquals(0, header);
        var columns = support.columns(joined.get(header));
        assertEquals(PharmacyImportRoles.NAME, columns.get(0).suggestedRole());
        assertEquals(PharmacyImportRoles.SKIP, columns.get(1).suggestedRole());
        assertEquals(PharmacyImportRoles.IKPU, columns.get(2).suggestedRole());
        assertEquals(PharmacyImportRoles.BARCODE, columns.get(3).suggestedRole());
        assertEquals(PharmacyImportRoles.QTY, columns.get(4).suggestedRole());
        assertEquals(PharmacyImportRoles.PURCHASE, columns.get(5).suggestedRole());
        assertEquals(PharmacyImportRoles.VAT_RATE, columns.get(6).suggestedRole());
    }
}

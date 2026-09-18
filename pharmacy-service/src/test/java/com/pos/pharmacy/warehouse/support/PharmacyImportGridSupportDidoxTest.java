package com.pos.pharmacy.warehouse.support;

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
            List.of("1 Трусы", "Маркировкаланган", "08111", "", "01", "dona", "8034.71", "10", "8837.50")
        );
        int header = support.findHeaderRow(grid);
        assertEquals(1, header);
        List<List<String>> rows = support.dataRows(grid, header);
        assertEquals(1, rows.size());
        assertEquals("1 Трусы", rows.get(0).get(0));
    }
}

package com.pos.pharmacy.importing.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HtmlExcelTableParserTest {

    @Test
    void keepsEmptyColumnsFromColspan() {
        String html = """
            <html><table>
            <tr><td>Маҳсулот номи</td><td colspan="2">Идентификация</td><td>Штрих</td></tr>
            <tr><td>Трусы</td><td colspan="2">06111001017000000</td><td>4602884018285</td></tr>
            </table></html>
            """;
        List<List<String>> grid = HtmlExcelTableParser.parse(html.getBytes(StandardCharsets.UTF_8));
        assertEquals(2, grid.size());
        assertEquals(List.of("Маҳсулот номи", "Идентификация", "", "Штрих"), grid.get(0));
        assertEquals(List.of("Трусы", "06111001017000000", "", "4602884018285"), grid.get(1));
    }

    @Test
    void keepsColumnsFromRowspan() {
        String html = """
            <html><table>
            <tr><td rowspan="2">Маҳсулот номи</td><td>Идентификация</td></tr>
            <tr><td>коди</td></tr>
            <tr><td>Трусы</td><td>06111001017000000</td></tr>
            </table></html>
            """;
        List<List<String>> grid = HtmlExcelTableParser.parse(html.getBytes(StandardCharsets.UTF_8));
        assertEquals(List.of("Маҳсулот номи", "Идентификация"), grid.get(0));
        assertEquals(List.of("Маҳсулот номи", "коди"), grid.get(1));
        assertEquals(List.of("Трусы", "06111001017000000"), grid.get(2));
    }
}

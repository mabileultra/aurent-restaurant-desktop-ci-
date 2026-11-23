package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HtmlExcelColspanAlignmentTest {

    @Test
    void expandsQqsColspanSoQtyAndLineTotalStayAligned() {
        String html = """
            <html><body><table>
            <tr>
              <td>№</td><td>Маҳсулот номи</td><td>Миқдор</td><td>Нарҳ</td>
              <td colspan="2">ҚҚС</td>
              <td>Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати</td>
            </tr>
            <tr>
              <td></td><td></td><td></td><td></td>
              <td>Ставка</td><td>Сумма</td><td></td>
            </tr>
            <tr>
              <td>1</td><td>Водка</td><td>6</td><td>7 142.86</td>
              <td>12%</td><td>5 142.86</td><td>48 000.00</td>
            </tr>
            </table></body></html>
            """;
        List<List<String>> grid = HtmlExcelTableParser.parse(html.getBytes(StandardCharsets.UTF_8));
        assertTrue(grid.size() >= 3);
        List<String> header = grid.get(0);
        assertEquals(7, header.size());
        assertEquals("Миқдор", header.get(2));
        assertEquals("ҚҚС", header.get(4));
        assertEquals("", header.get(5)); // colspan pad
        List<String> data = grid.get(2);
        assertEquals("6", data.get(2));
        assertEquals("48 000.00", data.get(6));
    }
}

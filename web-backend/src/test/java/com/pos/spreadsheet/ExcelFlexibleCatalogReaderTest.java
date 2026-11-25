package com.pos.spreadsheet;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExcelFlexibleCatalogReaderTest {

    private final ExcelFlexibleCatalogReader reader = new ExcelFlexibleCatalogReader();

    @Test
    void mapsArbitraryHeadersViaManualMapping() throws Exception {
        byte[] xlsx = buildWorkbook(
            List.of("Код", "Товар", "Цена"),
            List.of("A-1", "Молоко", "12000")
        );

        List<Map<String, String>> rows = reader.read(
            new ByteArrayInputStream(xlsx),
            ExcelTemplate.PRODUCTS_CATALOG,
            Map.of(
                "sku", "Код",
                "name", "Товар",
                "selling_price", "Цена"
            )
        );

        assertEquals(1, rows.size());
        assertEquals("A-1", rows.get(0).get("sku"));
        assertEquals("Молоко", rows.get(0).get("name"));
        assertEquals("12000", rows.get(0).get("selling_price"));
    }

    @Test
    void autoSuggestsTemplateHeadersInAnyOrder() throws Exception {
        byte[] xlsx = buildWorkbook(
            List.of("Наименование *", "Артикул (SKU) *", "Цена продажи"),
            List.of("Хлеб", "SKU-2", "5000")
        );

        List<Map<String, String>> rows = reader.read(
            new ByteArrayInputStream(xlsx),
            ExcelTemplate.PRODUCTS_CATALOG,
            null
        );

        assertEquals(1, rows.size());
        assertEquals("SKU-2", rows.get(0).get("sku"));
        assertEquals("Хлеб", rows.get(0).get("name"));
        assertEquals("5000", rows.get(0).get("selling_price"));
        assertTrue(rows.get(0).containsKey("barcode"));
    }

    @Test
    void readsDidoxStyleHtmlXlsAsCatalogGrid() throws Exception {
        byte[] html = """
            <html><body><table>
            <tr><td>Код</td><td>Товар</td><td>Цена</td></tr>
            <tr><td>H-1</td><td>Сок</td><td>9000</td></tr>
            </table></body></html>
            """.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        List<String> headers = reader.readHeaderLabels(new ByteArrayInputStream(html));
        assertEquals(List.of("Код", "Товар", "Цена"), headers);

        List<Map<String, String>> rows = reader.read(
            new ByteArrayInputStream(html),
            ExcelTemplate.PRODUCTS_CATALOG,
            Map.of("sku", "Код", "name", "Товар", "selling_price", "Цена")
        );
        assertEquals(1, rows.size());
        assertEquals("H-1", rows.get(0).get("sku"));
        assertEquals("Сок", rows.get(0).get("name"));
        assertEquals("9000", rows.get(0).get("selling_price"));
    }

    private static byte[] buildWorkbook(List<String> headers, List<String> values) throws Exception {
        try (var wb = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            var sheet = wb.createSheet();
            var h = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                h.createCell(i).setCellValue(headers.get(i));
            }
            var r = sheet.createRow(1);
            for (int i = 0; i < values.size(); i++) {
                r.createCell(i).setCellValue(values.get(i));
            }
            wb.write(out);
            return out.toByteArray();
        }
    }
}

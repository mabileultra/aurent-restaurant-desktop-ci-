package com.pos.pharmacy.importing.spreadsheet.parser;

import com.pos.pharmacy.warehouse.support.PharmacyImportRoles;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoicePdfParserDidoxTest {

    private final UzInvoicePdfParser parser = new UzInvoicePdfParser(new UzInvoiceSpreadsheetParser());

    @Test
    void looksLikePdfDetectsMagic() {
        assertTrue(UzInvoicePdfParser.looksLikePdf("%PDF-1.4".getBytes()));
        assertFalse(UzInvoicePdfParser.looksLikePdf("PK\u0003\u0004".getBytes()));
    }

    @Test
    void parseKeepsSimpleLatinInvoice() throws Exception {
        byte[] pdf = buildSimpleInvoicePdf();
        List<Map<String, String>> rows = parser.parse(pdf);
        assertFalse(rows.isEmpty());
        Map<String, String> first = rows.get(0);
        assertTrue(first.get("name").toLowerCase().contains("pos terminal"));
        assertEquals("08470001002000000", first.get("ikpu"));
        assertEquals("IS-00008429", first.get(UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID));
    }

    @Test
    void readGridPutsWrappedDidoxCellsIntoNumberedColumns() throws Exception {
        byte[] pdf = buildDidoxLikePdf();
        List<List<String>> grid = parser.readGrid(pdf);
        int header = -1;
        for (int i = 0; i < grid.size(); i++) {
            if (String.join(" ", grid.get(i)).toLowerCase().contains("mahsulot")) {
                header = i;
                break;
            }
        }
        assertTrue(header >= 0, grid.toString());
        List<String> headerRow = grid.get(header);
        assertTrue(headerRow.size() >= 12, headerRow.toString());
        assertTrue(headerRow.get(0).toLowerCase().contains("mahsulot"), headerRow.get(0));
        List<String> product = grid.get(header + 1);
        assertFalse(product.get(0).matches("(?s)^\\d+\\s.*"), product.get(0));
        assertTrue(product.get(0).toLowerCase().contains("trusi"), product.get(0));
        assertTrue(product.get(0).toLowerCase().contains("malchikov"), product.get(0));
        assertTrue(product.get(2).contains("08111001"), product.toString());
        assertTrue(product.get(9).replace(" ", "").contains("10.00000"), product.toString());
        assertFalse(product.get(0).toLowerCase().startsWith("50"), product.get(0));
        assertTrue(headerRow.get(5).toLowerCase().contains("seriya"), headerRow.get(5));
        assertEquals(PharmacyImportRoles.BATCH, PharmacyImportRoles.guess(headerRow.get(5)));
        assertEquals("01", product.get(5), product.toString());
        assertTrue(product.get(6).toLowerCase().contains("50sht") || product.get(6).toLowerCase().contains("dona"),
            product.toString());
        assertFalse(product.get(0).contains("12%"), product.get(0));
        assertEquals(header + 2, grid.size(), grid.toString());
    }

    private static byte[] buildSimpleInvoicePdf() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                writeAt(cs, font, 50, 750, "Invoice IS-00008429");
                float[] xs = {40, 90, 250, 380, 450, 520, 580, 650};
                String[] titles = {"No", "mahsulot nomi", "IKPU", "olchov", "miqdor", "narx", "QQS", "summa"};
                String[] values = {"1", "POS Terminal T2", "08470001002000000", "dona", "2", "3125000", "12", "6250000"};
                for (int i = 0; i < xs.length; i++) {
                    writeAt(cs, font, xs[i], 720, titles[i]);
                    writeAt(cs, font, xs[i], 705, String.valueOf(i + 1));
                    writeAt(cs, font, xs[i], 680, values[i]);
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static byte[] buildDidoxLikePdf() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(new PDRectangle(842, 595));
            doc.addPage(page);
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                writeAt(cs, font, 30, 560, "Hisob-faktura IS-00008429");
                String[] titles = {
                    "Mahsulot", "Markirov.", "Identif.", "Shtrix",
                    "Berish", "Seriya", "Olchov", "Sotib",
                    "Ustama", "Miqdor", "Narx", "Yetkaz.",
                    "QQS", "Summa", "YtkzQQS", "Status"
                };
                String[] titles2 = {
                    "nomi", "kodi", "katalog", "kod",
                    "usuli", "", "birligi", "narx",
                    "%", "", "", "qiymat",
                    "stavka", "", "", ""
                };
                for (int i = 0; i < 16; i++) {
                    writeAt(cs, font, x(i), 520, titles[i]);
                    if (!titles2[i].isEmpty()) {
                        writeAt(cs, font, x(i), 508, titles2[i]);
                    }
                }
                for (int i = 1; i <= 16; i++) {
                    writeAt(cs, font, x(i - 1), 492, String.valueOf(i));
                }
                writeAt(cs, font, x(0), 470, "1 Trusi dlya");
                writeAt(cs, font, x(0), 458, "malchikov M (2)");
                writeAt(cs, font, x(1), 470, "Mark.");
                writeAt(cs, font, x(2), 470, "08111001");
                writeAt(cs, font, x(3), 470, "4602884");
                writeAt(cs, font, x(4), 470, "Receptsiz");
                writeAt(cs, font, x(5), 470, "01");
                writeAt(cs, font, x(6), 470, "dona");
                writeAt(cs, font, x(7), 470, "8034.71");
                writeAt(cs, font, x(8), 470, "9.99");
                writeAt(cs, font, x(9), 470, "10.00000");
                writeAt(cs, font, x(10), 470, "8837.50");
                writeAt(cs, font, x(11), 470, "88375.00");
                writeAt(cs, font, x(12), 470, "12");
                writeAt(cs, font, x(13), 470, "10605.00");
                writeAt(cs, font, x(14), 470, "98980.00");
                writeAt(cs, font, x(15), 470, "Oldi-sotdi");
                writeAt(cs, font, x(6), 458, "50sht");
                writeAt(cs, font, x(11), 446, "259 678.05 12% 31 033.91");
                writeAt(cs, font, x(0), 420, "Jami:");
                writeAt(cs, font, x(11), 420, "176355.00");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static float x(int column) {
        return 18f + column * 51f;
    }

    private static void writeAt(PDPageContentStream cs, PDType1Font font, float x, float y, String text)
        throws Exception {
        cs.beginText();
        cs.setFont(font, 7);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }
}

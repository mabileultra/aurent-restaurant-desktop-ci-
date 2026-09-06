package com.pos.spreadsheet.parser;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoicePdfParserTest {

    private final UzInvoicePdfParser parser = new UzInvoicePdfParser(new UzInvoiceSpreadsheetParser());

    @Test
    void looksLikePdfDetectsMagic() {
        assertTrue(UzInvoicePdfParser.looksLikePdf("%PDF-1.4".getBytes()));
        assertFalse(UzInvoicePdfParser.looksLikePdf("PK\u0003\u0004".getBytes()));
    }

    @Test
    void parsesTextPdfInvoiceIntoCatalogRows() throws Exception {
        byte[] pdf = buildSampleInvoicePdf();
        List<Map<String, String>> rows = parser.parse(pdf);

        assertFalse(rows.isEmpty());
        Map<String, String> first = rows.get(0);
        assertTrue(first.get("name").toLowerCase().contains("pos terminal"));
        assertEquals("08470001002000000", first.get("ikpu"));
        assertEquals("3125000", first.get("selling_price").replace(".00", "").replace(".0", ""));
        assertEquals("IS-00008429", first.get(UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID));
    }

    private static byte[] buildSampleInvoicePdf() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                writeLine(cs, font, 50, 750, "Hisob-faktura IS-00008429");
                // Header row — columns spaced so gap detection splits cells
                writeAt(cs, font, 40, 700, "No");
                writeAt(cs, font, 90, 700, "mahsulot nomi");
                writeAt(cs, font, 250, 700, "IKPU");
                writeAt(cs, font, 380, 700, "olchov");
                writeAt(cs, font, 450, 700, "miqdor");
                writeAt(cs, font, 520, 700, "narx");
                writeAt(cs, font, 580, 700, "QQS");
                // Product row
                writeAt(cs, font, 40, 680, "1");
                writeAt(cs, font, 90, 680, "POS Terminal T2");
                writeAt(cs, font, 250, 680, "08470001002000000");
                writeAt(cs, font, 380, 680, "dona");
                writeAt(cs, font, 450, 680, "2");
                writeAt(cs, font, 520, 680, "3125000");
                writeAt(cs, font, 580, 680, "12");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static void writeLine(PDPageContentStream cs, PDType1Font font, float x, float y, String text)
        throws Exception {
        writeAt(cs, font, x, y, text);
    }

    private static void writeAt(PDPageContentStream cs, PDType1Font font, float x, float y, String text)
        throws Exception {
        cs.beginText();
        cs.setFont(font, 10);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }
}

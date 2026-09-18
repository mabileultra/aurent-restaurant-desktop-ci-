package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DidoxInvoiceTableRebuilderTest {

    private final DidoxInvoiceTableRebuilder rebuilder = new DidoxInvoiceTableRebuilder();

    @Test
    void rebuildsDidoxColumnsAndMergesWrappedName() {
        List<PdfTextToken> tokens = new ArrayList<>();
        add(tokens, 1, 20, 20, "Hisob-faktura IS-00008429");

        add(tokens, 1, x(0), 70, "Mahsulot");
        add(tokens, 1, x(1), 70, "Markirovka");
        add(tokens, 1, x(2), 70, "Identifikatsiya");
        add(tokens, 1, x(3), 70, "Shtrix");
        add(tokens, 1, x(4), 70, "Berish");
        add(tokens, 1, x(5), 70, "Seriya");
        add(tokens, 1, x(6), 70, "Olchov");
        add(tokens, 1, x(7), 70, "Sotib olish");
        add(tokens, 1, x(8), 70, "Ustama");
        add(tokens, 1, x(9), 70, "Miqdor");
        add(tokens, 1, x(10), 70, "Narx");
        add(tokens, 1, x(11), 70, "Yetkazib");
        add(tokens, 1, x(12), 70, "QQS");
        add(tokens, 1, x(13), 70, "QQS summa");
        add(tokens, 1, x(14), 70, "Yetkazib QQS");
        add(tokens, 1, x(15), 70, "Status");

        add(tokens, 1, x(0), 82, "nomi");
        add(tokens, 1, x(1), 82, "kodi");
        add(tokens, 1, x(2), 82, "kodi va nomi");
        add(tokens, 1, x(7), 82, "yillik narx");
        add(tokens, 1, x(9), 82, "qty");

        for (int i = 1; i <= 16; i++) {
            add(tokens, 1, x(i - 1), 95, String.valueOf(i));
        }

        add(tokens, 1, x(0), 120, "1 Trusi dlya");
        add(tokens, 1, x(1), 120, "Markirovkalangan");
        add(tokens, 1, x(2), 120, "08111001017000000");
        add(tokens, 1, x(3), 120, "4602884018285");
        add(tokens, 1, x(4), 120, "Receptsiz");
        add(tokens, 1, x(5), 120, "01");
        add(tokens, 1, x(6), 120, "dona");
        add(tokens, 1, x(7), 120, "8034.71");
        add(tokens, 1, x(8), 120, "9.99");
        add(tokens, 1, x(9), 120, "10.00000");
        add(tokens, 1, x(10), 120, "8837.50");
        add(tokens, 1, x(11), 120, "88375.00");
        add(tokens, 1, x(12), 120, "12");
        add(tokens, 1, x(13), 120, "10605.00");
        add(tokens, 1, x(14), 120, "98980.00");
        add(tokens, 1, x(15), 120, "Oldi-sotdi");
        add(tokens, 1, x(0), 132, "malchikov M (2)");
        add(tokens, 1, x(2), 132, "Trusi dlya detey");

        add(tokens, 1, x(0), 160, "2 Sirop");
        add(tokens, 1, x(2), 160, "0304017001018002");
        add(tokens, 1, x(5), 160, "50226");
        add(tokens, 1, x(9), 160, "10.00000");
        add(tokens, 1, x(7), 160, "8671.16");

        for (int i = 1; i <= 16; i++) {
            add(tokens, 2, x(i - 1), PdfPageTextExtractor.PAGE_STRIDE + 40, String.valueOf(i));
        }
        add(tokens, 2, x(0), PdfPageTextExtractor.PAGE_STRIDE + 70, "Mahsulot nomi");
        add(tokens, 2, x(9), PdfPageTextExtractor.PAGE_STRIDE + 70, "Miqdor");
        add(tokens, 2, x(0), PdfPageTextExtractor.PAGE_STRIDE + 95, "3 Vigas");
        add(tokens, 2, x(2), PdfPageTextExtractor.PAGE_STRIDE + 95, "0302200500100000");
        add(tokens, 2, x(9), PdfPageTextExtractor.PAGE_STRIDE + 95, "2.00000");

        List<List<String>> grid = rebuilder.rebuild(tokens);

        assertTrue(grid.get(0).get(0).contains("IS-00008429"));
        int header = indexWith(grid, "Mahsulot");
        List<String> headerRow = grid.get(header);
        assertEquals(16, headerRow.size(), String.join(" || ", headerRow));
        assertEquals("Mahsulot nomi", headerRow.get(0));
        assertTrue(headerRow.get(1).toLowerCase().contains("markirovka"));
        assertTrue(headerRow.get(2).toLowerCase().contains("identifikatsiya"));
        assertTrue(headerRow.get(9).toLowerCase().contains("miqdor"));

        List<String> first = grid.get(header + 1);
        assertTrue(first.get(0).contains("1 Trusi dlya"));
        assertTrue(first.get(0).contains("malchikov M (2)"));
        assertEquals("Markirovkalangan", first.get(1));
        assertTrue(first.get(2).contains("08111001017000000"));
        assertTrue(first.get(2).contains("Trusi dlya detey"));
        assertEquals("4602884018285", first.get(3));
        assertEquals("01", first.get(5));
        assertEquals("8034.71", first.get(7));
        assertEquals("10.00000", first.get(9));
        assertEquals("8837.50", first.get(10));

        List<String> second = grid.get(header + 2);
        assertTrue(second.get(0).startsWith("2 "));
        assertEquals("8671.16", second.get(7));

        List<String> third = grid.get(header + 3);
        assertTrue(third.get(0).startsWith("3 "));
        assertEquals("2.00000", third.get(9));
        assertEquals(header + 4, grid.size());
    }

    @Test
    void fallsBackToGapCellsWhenNoNumberedHeader() {
        List<PdfTextToken> tokens = new ArrayList<>();
        add(tokens, 1, 40, 40, "mahsulot nomi");
        add(tokens, 1, 200, 40, "IKPU");
        add(tokens, 1, 40, 60, "POS Terminal");
        add(tokens, 1, 200, 60, "08470001002000000");
        List<List<String>> grid = rebuilder.rebuild(tokens);
        assertEquals(2, grid.size());
        assertEquals("mahsulot nomi", grid.get(0).get(0));
        assertEquals("IKPU", grid.get(0).get(1));
        assertEquals("POS Terminal", grid.get(1).get(0));
        assertEquals("08470001002000000", grid.get(1).get(1));
    }

    private static int indexWith(List<List<String>> grid, String needle) {
        for (int i = 0; i < grid.size(); i++) {
            if (String.join(" ", grid.get(i)).contains(needle)) {
                return i;
            }
        }
        throw new AssertionError("no row with " + needle);
    }

    private static float x(int column) {
        return 20f + column * 62f;
    }

    private static void add(List<PdfTextToken> tokens, int page, float x, float y, String text) {
        float cursor = x;
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            float width = ch == ' ' ? 1.5f : 3.0f;
            tokens.add(new PdfTextToken(page, cursor, cursor + width, y, String.valueOf(ch)));
            cursor += width;
        }
    }
}

package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
        assertTrue(headerRow.get(2).toLowerCase().contains("identifikatsiya"), String.join(" || ", headerRow));
        assertTrue(headerRow.get(9).toLowerCase().contains("miqdor"));

        List<String> first = grid.get(header + 1);
        assertTrue(first.get(0).contains("Trusi dlya"));
        assertFalse(first.get(0).matches("(?s)^\\d+\\s.*"), first.get(0));
        assertTrue(first.get(0).contains("malchikov M (2)"));
        assertEquals("Markirovkalangan", first.get(1));
        assertTrue(first.get(2).contains("08111001017000000"));
        assertTrue(first.get(2).contains("Trusi dlya detey"));
        assertEquals("4602884018285", first.get(3));
        assertEquals("01", first.get(5));
        assertEquals("dona", first.get(6));
        assertEquals("8034.71", first.get(7));
        assertEquals("10.00000", first.get(9));
        assertEquals("8837.50", first.get(10));

        List<String> second = grid.get(header + 2);
        assertTrue(second.get(0).toLowerCase().contains("sirop"), second.get(0));
        assertFalse(second.get(0).matches("(?s)^\\d+\\s.*"), second.get(0));
        assertEquals("50226", second.get(5));
        assertEquals("8671.16", second.get(7));
        assertEquals("", second.get(3).trim());
        assertEquals(16, second.size());

        List<String> third = grid.get(header + 3);
        assertTrue(third.get(0).toLowerCase().contains("vigas"), third.get(0));
        assertFalse(third.get(0).matches("(?s)^\\d+\\s.*"), third.get(0));
        assertEquals("2.00000", third.get(9));
        assertEquals(header + 4, grid.size());
    }

    @Test
    void keepsAlphanumericAndNumericSeriesOutOfDonaColumn() {
        List<PdfTextToken> tokens = numberedDidoxFrame();
        add(tokens, 1, x(0), 120, "1 Trusi");
        add(tokens, 1, x(5), 120, "ZA4485");
        add(tokens, 1, x(6), 120, "do");
        add(tokens, 1, x(9), 120, "10.00000");
        add(tokens, 1, x(0), 150, "2 Sirop");
        add(tokens, 1, x(5), 150, "010726");
        add(tokens, 1, x(6), 150, "dona");
        add(tokens, 1, x(9), 150, "2.00000");
        add(tokens, 1, x(0), 180, "3 Vigas");
        add(tokens, 1, x(5), 180, "NE 260306");
        add(tokens, 1, x(6), 180, "dona");
        add(tokens, 1, x(9), 180, "1.00000");

        List<List<String>> grid = rebuilder.rebuild(tokens);
        int header = indexWith(grid, "Mahsulot");
        assertEquals("ZA4485", grid.get(header + 1).get(5));
        assertTrue(grid.get(header + 1).get(6).toLowerCase().contains("do"), grid.get(header + 1).toString());
        assertEquals("010726", grid.get(header + 2).get(5));
        assertTrue(grid.get(header + 2).get(6).toLowerCase().contains("dona"), grid.get(header + 2).toString());
        assertEquals("NE 260306", grid.get(header + 3).get(5));
    }

    @Test
    void keepsNameWrapAboveNextNumberOnThatProduct() {
        List<PdfTextToken> tokens = numberedDidoxFrame();
        add(tokens, 1, x(0), 120, "1 Sistema TB-S");
        add(tokens, 1, x(9), 120, "10.00000");
        add(tokens, 1, x(15), 132, "Oldi-");
        add(tokens, 1, x(0) + 8f, 148, "Teymurova krem-");
        add(tokens, 1, x(15), 148, "sotdi");
        add(tokens, 1, x(0), 156, "2 pasta 50g");
        add(tokens, 1, x(9), 156, "10.00000");

        List<List<String>> grid = rebuilder.rebuild(tokens);
        int header = indexWith(grid, "Mahsulot");
        assertEquals(2, grid.size() - header - 1, grid.toString());
        assertTrue(grid.get(header + 1).get(0).contains("Sistema"), grid.get(header + 1).toString());
        assertFalse(grid.get(header + 1).get(0).matches("(?s)^\\d+\\s.*"), grid.get(header + 1).get(0));
        assertFalse(grid.get(header + 1).get(0).toLowerCase().contains("teymurova"), grid.get(header + 1).toString());
        assertFalse(grid.get(header + 2).get(0).matches("(?s)^\\d+\\s.*"), grid.get(header + 2).get(0));
        assertTrue(grid.get(header + 2).get(0).toLowerCase().contains("teymurova"), grid.get(header + 2).toString());
        assertTrue(grid.get(header + 2).get(0).toLowerCase().contains("pasta"), grid.get(header + 2).toString());
    }

    @Test
    void peelsSeriesGluedToDonaAndQadoq() {
        List<PdfTextToken> tokens = numberedDidoxFrame();
        add(tokens, 1, x(0), 120, "1 Kupen");
        add(tokens, 1, x(5), 120, "UQT24112 dona (tabletka) qadoq=10");
        add(tokens, 1, x(9), 120, "5.000000");
        add(tokens, 1, x(0), 150, "2 Nika");
        add(tokens, 1, x(5), 150, "qadoq=10 blister * 10 660425 dona");
        add(tokens, 1, x(9), 150, "10.00000");

        List<List<String>> grid = rebuilder.rebuild(tokens);
        int header = indexWith(grid, "Mahsulot");
        assertEquals("UQT24112", grid.get(header + 1).get(5), grid.get(header + 1).toString());
        assertTrue(grid.get(header + 1).get(6).toLowerCase().contains("dona"), grid.get(header + 1).toString());
        assertEquals("660425", grid.get(header + 2).get(5), grid.get(header + 2).toString());
        assertTrue(grid.get(header + 2).get(6).toLowerCase().contains("qadoq"), grid.get(header + 2).toString());
    }

    @Test
    void doesNotTreatWrappedQtyAsNewProductAndSkipsFooter() {
        List<PdfTextToken> tokens = numberedDidoxFrame();
        add(tokens, 1, x(0), 120, "1 Trusi dlya");
        add(tokens, 1, x(2), 120, "08111001017000000");
        add(tokens, 1, x(6), 120, "dona");
        add(tokens, 1, x(9), 120, "10.00000");
        add(tokens, 1, x(0), 132, "malchikov M (2)");
        add(tokens, 1, x(6), 132, "50шт");
        add(tokens, 1, x(0), 160, "Jami:");
        add(tokens, 1, x(11), 160, "176355.00");
        add(tokens, 1, x(0), 180, "Rahbar: KARIMOV");
        add(tokens, 1, x(0), 192, "Tovar berdi: 2029467763");
        add(tokens, 1, x(9), 192, "87.192");
        add(tokens, 1, x(10), 192, "224.100");

        List<List<String>> grid = rebuilder.rebuild(tokens);
        int header = indexWith(grid, "Mahsulot");
        assertEquals(1, grid.size() - header - 1, grid.toString());
        List<String> first = grid.get(header + 1);
        assertTrue(first.get(0).contains("Trusi"));
        assertFalse(first.get(0).matches("(?s)^\\d+\\s.*"), first.get(0));
        assertTrue(first.get(0).contains("malchikov"));
        assertFalse(first.get(0).toLowerCase().contains("rahbar"), first.get(0));
        assertFalse(first.get(0).contains("2029467763"), first.get(0));
        assertTrue(first.get(6).contains("50шт"), first.toString());
        assertEquals("10.00000", first.get(9));
    }

    @Test
    void splitsGluedMoneyIntoSeparateDidoxColumns() {
        List<PdfTextToken> tokens = numberedDidoxFrame();
        add(tokens, 1, x(0), 120, "1 Trusi");
        add(tokens, 1, x(9), 120, "10.00000");
        add(tokens, 1, x(10), 120, "8837.50");
        tokens.add(new PdfTextToken(1, x(11), x(14), 120, "259 678.05 12% 31 033.91"));

        List<List<String>> grid = rebuilder.rebuild(tokens);
        int header = indexWith(grid, "Mahsulot");
        List<String> first = grid.get(header + 1);
        assertEquals(16, first.size(), first.toString());
        assertFalse(first.get(0).contains("12%"), first.toString());
        assertFalse(first.get(0).contains("259 678"), first.toString());
        String money = String.join(" | ", first.subList(10, 15));
        assertTrue(money.contains("259 678.05"), money);
        assertTrue(money.contains("12%"), money);
        assertTrue(money.contains("31 033.91"), money);
        assertTrue(ownCell(first, "12%"), first.toString());
        assertTrue(ownCell(first, "259 678.05"), first.toString());
        assertTrue(distinctMoneyCells(first) >= 3, first.toString());
    }

    @Test
    void readsGluedHeaderIndexesAsSixteenBands() {
        List<PdfTextToken> tokens = new ArrayList<>();
        add(tokens, 1, 20, 20, "Hisob-faktura IS-00008429");
        add(tokens, 1, x(0), 70, "Mahsulot nomi");
        tokens.add(new PdfTextToken(1, x(0), x(15) + 20f, 95, "12345678910111213141516"));
        add(tokens, 1, x(0), 120, "1 Trusi");
        add(tokens, 1, x(9), 120, "10.00000");

        List<List<String>> grid = rebuilder.rebuild(tokens);
        int header = indexWith(grid, "Mahsulot");
        assertEquals(16, grid.get(header).size());
        assertEquals(16, grid.get(header + 1).size());
        assertEquals("10.00000", grid.get(header + 1).get(9));
    }

    @Test
    void doesNotUseGapBuilderForHisobFakturaWithoutNumbers() {
        List<PdfTextToken> tokens = new ArrayList<>();
        add(tokens, 1, 20, 20, "Hisob-faktura IS-00008429 didox.uz");
        add(tokens, 1, 40, 60, "POS Terminal");
        add(tokens, 1, 200, 60, "08470001002000000");
        List<List<String>> grid = rebuilder.rebuild(tokens);
        assertTrue(grid.isEmpty());
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

    private static List<PdfTextToken> numberedDidoxFrame() {
        List<PdfTextToken> tokens = new ArrayList<>();
        add(tokens, 1, 20, 20, "Hisob-faktura IS-00008429");
        add(tokens, 1, x(0), 70, "Mahsulot");
        add(tokens, 1, x(1), 70, "Markirovka");
        add(tokens, 1, x(2), 70, "Identifikatsiya");
        add(tokens, 1, x(5), 70, "Seriya");
        add(tokens, 1, x(6), 70, "Olchov");
        add(tokens, 1, x(9), 70, "Miqdor");
        add(tokens, 1, x(10), 70, "Narx");
        for (int i = 1; i <= 16; i++) {
            add(tokens, 1, x(i - 1), 95, String.valueOf(i));
        }
        return tokens;
    }

    private static boolean ownCell(List<String> row, String atom) {
        for (String cell : row) {
            if (cell != null && cell.contains(atom)) {
                return cell.trim().equals(atom);
            }
        }
        return false;
    }

    private static int distinctMoneyCells(List<String> row) {
        int n = 0;
        for (int i = 10; i <= 14; i++) {
            if (row.get(i) != null && !row.get(i).isBlank()) {
                n++;
            }
        }
        return n;
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

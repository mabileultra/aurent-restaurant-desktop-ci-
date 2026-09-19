package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PdfLineRunMergerTest {

    @Test
    void splitsCompleteAmountsAndKeepsThousands() {
        List<PdfTextToken> tokens = new ArrayList<>();
        addWord(tokens, 0f, "259");
        addWord(tokens, 12f, "678.05");
        addWord(tokens, 36f, "12%");
        addWord(tokens, 50f, "31");
        addWord(tokens, 62f, "033.91");
        List<PdfTextRun> runs = PdfLineRunMerger.merge(tokens);
        assertEquals(3, runs.size(), runs.toString());
        assertEquals("259 678.05", runs.get(0).text());
        assertEquals("12%", runs.get(1).text());
        assertEquals("31 033.91", runs.get(2).text());
    }

    @Test
    void doesNotGlueSeriesToDona() {
        List<PdfTextToken> tokens = new ArrayList<>();
        addWord(tokens, 0f, "ZA4485");
        addWord(tokens, 18f, "dona");
        List<PdfTextRun> runs = PdfLineRunMerger.merge(tokens);
        assertEquals(2, runs.size(), runs.toString());
        assertEquals("ZA4485", runs.get(0).text());
        assertEquals("dona", runs.get(1).text());
    }

    @Test
    void doesNotGlueNumericSeriesToDona() {
        List<PdfTextToken> tokens = new ArrayList<>();
        addWord(tokens, 0f, "010726");
        addWord(tokens, 20f, "do");
        List<PdfTextRun> runs = PdfLineRunMerger.merge(tokens);
        assertEquals(2, runs.size(), runs.toString());
        assertEquals("010726", runs.get(0).text());
        assertEquals("do", runs.get(1).text());
    }

    private static void addWord(List<PdfTextToken> tokens, float x, String text) {
        float cursor = x;
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            float width = 3f;
            tokens.add(new PdfTextToken(1, cursor, cursor + width, 10f, String.valueOf(ch)));
            cursor += width;
        }
    }
}

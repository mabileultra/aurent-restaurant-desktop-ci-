package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DidoxColumnIndexSplitterTest {

    @Test
    void splitsGluedDidoxHeaderIndexes() {
        PdfTextRun glued = new PdfTextRun(1, 0f, 160f, 10f, "12345678910111213141516");
        List<DidoxColumnIndexSplitter.IndexMark> marks = DidoxColumnIndexSplitter.marks(glued);
        assertEquals(16, marks.size());
        assertEquals(1, marks.get(0).number());
        assertEquals(16, marks.get(15).number());
    }

    @Test
    void splitsSpacedHeaderIndexes() {
        PdfTextRun spaced = new PdfTextRun(1, 20f, 180f, 10f, "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16");
        List<DidoxColumnIndexSplitter.IndexMark> marks = DidoxColumnIndexSplitter.marks(spaced);
        assertEquals(16, marks.size());
        assertEquals(10, marks.get(9).number());
    }
}

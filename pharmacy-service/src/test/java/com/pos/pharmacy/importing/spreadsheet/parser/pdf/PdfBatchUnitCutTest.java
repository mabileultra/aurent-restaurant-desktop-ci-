package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfBatchUnitCutTest {

    @Test
    void peelsSeriesInFrontOfDonaAndQadoq() {
        assertCut("UQT24112 dona (tabletka (500 mg + 50 mg)) qadoq=10 blister ( 10",
            "UQT24112", "dona (tabletka (500 mg + 50 mg)) qadoq=10 blister ( 10");
        assertCut("ZZA5022 dona (tabletka) qadoq=1 blister ( 10", "ZZA5022",
            "dona (tabletka) qadoq=1 blister ( 10");
        assertCut("53116A dona (tabletka (400 mg))", "53116A", "dona (tabletka (400 mg))");
        assertCut("20260428 dona", "20260428", "dona");
        assertCut("F20 g)) qadoq=1 dona (flakon", "F20", "g)) qadoq=1 dona (flakon");
        assertCut("ZA4485dona", "ZA4485", "dona");
        assertCut("010726do", "010726", "do");
        assertCut("NE 260306 dona", "NE 260306", "dona");
    }

    @Test
    void peelsSeriesHiddenInsideUnitWrap() {
        assertCut("qadoq=10 blister * 10 660425 dona (tabletka (500 mg))",
            "660425", "qadoq=10 blister * 10 dona (tabletka (500 mg))");
        assertCut("qadoq=1 blister ( 4 NE260203 dona (tabletka (100 mg))",
            "NE260203", "qadoq=1 blister ( 4 dona (tabletka (100 mg))");
        assertCut("qadoq=1 blister ( 4 RNL-35 dona (tabletka)",
            "RNL-35", "qadoq=1 blister ( 4 dona (tabletka)");
        assertCut("dona (flakon (100 190525AX mg/ml ,100 ml))",
            "190525AX", "dona (flakon (100 mg/ml ,100 ml))");
    }

    @Test
    void leavesNamesAndMoneyAlone() {
        assertTrue(PdfBatchUnitCut.split("ZA4485 Trusi").isEmpty());
        assertTrue(PdfBatchUnitCut.split("10.00000").isEmpty());
        assertTrue(PdfBatchUnitCut.split("51 723.21").isEmpty());
        assertTrue(PdfBatchUnitCut.split("12%").isEmpty());
        assertTrue(PdfBatchUnitCut.split("UQT24112").isEmpty());
    }

    private static void assertCut(String text, String series, String unit) {
        Optional<PdfBatchUnitCut.Parts> cut = PdfBatchUnitCut.split(text);
        assertTrue(cut.isPresent(), text);
        assertEquals(series, cut.get().series(), text);
        assertEquals(unit, cut.get().unit(), text);
    }
}

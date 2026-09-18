package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Достаёт глифы с абсолютным Y: страница N смещена на {@link #PAGE_STRIDE},
 * чтобы строки разных страниц не смешивались.
 */
public final class PdfPageTextExtractor {

    /** Зазор между страницами по Y, больше любой реальной высоты A4/Letter. */
    public static final float PAGE_STRIDE = 2000f;

    private PdfPageTextExtractor() {
    }

    public static List<PdfTextToken> extract(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.getNumberOfPages() == 0) {
                return List.of();
            }
            TokenStripper stripper = new TokenStripper();
            stripper.setSortByPosition(true);
            stripper.setStartPage(1);
            stripper.setEndPage(document.getNumberOfPages());
            stripper.getText(document);
            return stripper.tokens;
        }
    }

    private static final class TokenStripper extends PDFTextStripper {

        private final List<PdfTextToken> tokens = new ArrayList<>();

        TokenStripper() throws IOException {
            super();
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) {
            if (!StringUtils.hasText(text) || textPositions == null || textPositions.isEmpty()) {
                return;
            }
            int page = Math.max(getCurrentPageNo(), 1);
            float yOffset = (page - 1) * PAGE_STRIDE;
            for (TextPosition tp : textPositions) {
                String unicode = tp.getUnicode();
                if (unicode == null || unicode.isEmpty()) {
                    continue;
                }
                if (unicode.chars().allMatch(ch -> ch < 0x20 && ch != '\t')) {
                    continue;
                }
                float x = tp.getXDirAdj();
                float y = yOffset + tp.getYDirAdj();
                float width = Math.max(tp.getWidthDirAdj(), 0.1f);
                tokens.add(new PdfTextToken(page, x, x + width, y, unicode));
            }
        }
    }
}

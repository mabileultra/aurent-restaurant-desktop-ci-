package com.pos.spreadsheet.parser;

import com.pos.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * PDF счёт-фактура (Didox / Faktura.uz / Soliq): текстовый PDF → сетка → тот же разбор, что Excel/HTML.
 * Сканы без текстового слоя не поддерживаются (нужен OCR).
 */
@Component
public class UzInvoicePdfParser {

    private static final float ROW_Y_TOLERANCE = 2.5f;

    private final UzInvoiceSpreadsheetParser spreadsheetParser;

    public UzInvoicePdfParser(UzInvoiceSpreadsheetParser spreadsheetParser) {
        this.spreadsheetParser = spreadsheetParser;
    }

    public static boolean looksLikePdf(byte[] bytes) {
        if (bytes == null || bytes.length < 5) {
            return false;
        }
        return bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    public List<Map<String, String>> parse(byte[] bytes) {
        if (!looksLikePdf(bytes)) {
            throw new BadRequestException("Файл не является PDF");
        }
        try {
            List<List<String>> grid = extractGrid(bytes);
            if (grid.isEmpty()) {
                throw new BadRequestException(
                    "В PDF не найден текст. Загрузите текстовый PDF счёт-фактуры или Excel/JSON с портала."
                );
            }
            return spreadsheetParser.parseFromGrid(grid);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException("Не удалось прочитать PDF: " + e.getMessage());
        }
    }

    public List<List<String>> readGrid(byte[] bytes) throws IOException {
        return extractGrid(bytes);
    }

    List<List<String>> extractGrid(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.getNumberOfPages() == 0) {
                return List.of();
            }
            GridBuildingStripper stripper = new GridBuildingStripper();
            stripper.setSortByPosition(true);
            stripper.setStartPage(1);
            stripper.setEndPage(document.getNumberOfPages());
            stripper.getText(document);
            return stripper.toGrid();
        }
    }

    private static final class GridBuildingStripper extends PDFTextStripper {

        private final List<RowBucket> rows = new ArrayList<>();

        GridBuildingStripper() throws IOException {
            super();
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) {
            if (!StringUtils.hasText(text) || textPositions == null || textPositions.isEmpty()) {
                return;
            }
            for (TextPosition tp : textPositions) {
                String unicode = tp.getUnicode();
                if (unicode == null || unicode.isEmpty()) {
                    continue;
                }
                // Keep spaces — skipping blanks broke words like "POS Terminal"
                if (unicode.chars().allMatch(ch -> ch < 0x20 && ch != '\t')) {
                    continue;
                }
                float x = tp.getXDirAdj();
                float y = tp.getYDirAdj();
                float width = Math.max(tp.getWidthDirAdj(), 0.1f);
                RowBucket row = findOrCreateRow(y);
                row.tokens.add(new Token(x, x + width, unicode));
            }
        }

        private RowBucket findOrCreateRow(float y) {
            for (RowBucket row : rows) {
                if (Math.abs(row.y - y) <= ROW_Y_TOLERANCE) {
                    row.y = (row.y * row.tokenCount + y) / (row.tokenCount + 1);
                    row.tokenCount++;
                    return row;
                }
            }
            RowBucket created = new RowBucket(y);
            rows.add(created);
            return created;
        }

        List<List<String>> toGrid() {
            rows.sort(Comparator.comparingDouble(r -> r.y));
            List<List<String>> grid = new ArrayList<>();
            for (RowBucket row : rows) {
                List<String> cells = mergeTokensIntoCells(row.tokens);
                if (cells.stream().anyMatch(s -> s != null && !s.isBlank())) {
                    grid.add(cells);
                }
            }
            return grid;
        }

        private static List<String> mergeTokensIntoCells(List<Token> tokens) {
            if (tokens.isEmpty()) {
                return List.of();
            }
            tokens.sort(Comparator.comparingDouble(t -> t.x0));

            float avgCharWidth = 0f;
            int counted = 0;
            for (Token t : tokens) {
                if (t.text.isBlank()) {
                    continue;
                }
                float w = (t.x1 - t.x0) / Math.max(t.text.length(), 1);
                if (w > 0.2f) {
                    avgCharWidth += w;
                    counted++;
                }
            }
            // Larger gap → new cell; medium gap → space inside cell
            float cellGap = counted > 0
                ? (avgCharWidth / counted) * 3.8f
                : 10f;
            float spaceGap = counted > 0
                ? (avgCharWidth / counted) * 0.35f
                : 1.2f;

            List<String> cells = new ArrayList<>();
            StringBuilder current = new StringBuilder();
            float lastX1 = tokens.get(0).x0;

            for (Token token : tokens) {
                float gap = token.x0 - lastX1;
                if (current.length() > 0 && gap > cellGap) {
                    cells.add(normalizeCell(current.toString()));
                    current.setLength(0);
                } else if (current.length() > 0 && gap > spaceGap && !token.text.isBlank()
                    && current.charAt(current.length() - 1) != ' ') {
                    current.append(' ');
                }
                current.append(token.text);
                lastX1 = Math.max(lastX1, token.x1);
            }
            if (current.length() > 0) {
                cells.add(normalizeCell(current.toString()));
            }
            return cells;
        }

        private static String normalizeCell(String raw) {
            return raw.replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim();
        }
    }

    private static final class RowBucket {
        float y;
        int tokenCount = 1;
        final List<Token> tokens = new ArrayList<>();

        RowBucket(float y) {
            this.y = y;
        }
    }

    private static final class Token {
        final float x0;
        final float x1;
        final String text;

        Token(float x0, float x1, String text) {
            this.x0 = x0;
            this.x1 = x1;
            this.text = text;
        }
    }
}

package com.pos.pharmacy.importing.spreadsheet.parser;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceTableRebuilder;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.PdfPageTextExtractor;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.PdfTextToken;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * PDF счёт-фактура (Didox / Faktura.uz / Soliq): текстовый PDF → сетка → тот же разбор, что Excel/HTML.
 * Сканы без текстового слоя не поддерживаются (нужен OCR).
 */
@Component
public class UzInvoicePdfParser {

    private final UzInvoiceSpreadsheetParser spreadsheetParser;
    private final DidoxInvoiceTableRebuilder tableRebuilder = new DidoxInvoiceTableRebuilder();

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
            throw new BusinessException("Файл не является PDF");
        }
        try {
            List<List<String>> grid = extractGrid(bytes);
            if (grid.isEmpty()) {
                throw new BusinessException(
                    "В PDF не найден текст. Загрузите текстовый PDF счёт-фактуры или Excel/JSON с портала."
                );
            }
            return spreadsheetParser.parseFromGrid(grid);
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException("Не удалось прочитать PDF: " + e.getMessage());
        }
    }

    public List<List<String>> readGrid(byte[] bytes) throws IOException {
        return extractGrid(bytes);
    }

    List<List<String>> extractGrid(byte[] bytes) throws IOException {
        List<PdfTextToken> tokens = PdfPageTextExtractor.extract(bytes);
        if (tokens.isEmpty()) {
            return List.of();
        }
        return tableRebuilder.rebuild(tokens);
    }
}

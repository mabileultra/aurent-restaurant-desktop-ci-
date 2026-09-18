package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import com.pos.pharmacy.importing.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.pharmacy.importing.spreadsheet.parser.InvoiceGridRowKinds;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoiceDocumentIdExtractor;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoicePdfParser;
import com.pos.pharmacy.importing.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class PharmacyImportGridSupport {

    private final UzInvoicePdfParser pdfParser;
    private final UzInvoiceSpreadsheetParser spreadsheetParser;

    public List<List<String>> readGrid(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Выберите файл Excel или PDF");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BusinessException("Не удалось прочитать файл");
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        try {
            if (UzInvoicePdfParser.looksLikePdf(bytes) || name.endsWith(".pdf")) {
                List<List<String>> grid = pdfParser.readGrid(bytes);
                if (grid.isEmpty()) {
                    throw new BusinessException(
                        "В PDF не найден текст. Загрузите текстовый PDF или Excel."
                    );
                }
                return normalize(grid);
            }
            if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
                return normalize(HtmlExcelTableParser.parse(bytes));
            }
            return normalize(spreadsheetParser.readGrid(bytes));
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException("Не удалось разобрать файл: " + e.getMessage());
        }
    }

    public String extractInvoiceId(List<List<String>> grid) {
        return UzInvoiceDocumentIdExtractor.extractFromGrid(grid);
    }

    public int findHeaderRow(List<List<String>> grid) {
        int fallback = 0;
        int limit = Math.min(120, grid.size());
        for (int r = 0; r < limit; r++) {
            List<String> row = grid.get(r);
            if (InvoiceGridRowKinds.numericIndexRow(row)) {
                continue;
            }
            String joined = String.join(" ", row).toLowerCase(Locale.ROOT);
            int filled = 0;
            for (String cell : row) {
                if (StringUtils.hasText(cell)) {
                    filled++;
                }
            }
            if (joined.contains("наименован") || joined.contains("маҳсулот") || joined.contains("mahsulot")) {
                if (filled >= 4) {
                    return r;
                }
                fallback = r;
            }
        }
        return fallback;
    }

    public List<PharmacyImportColumnHint> columns(List<String> header) {
        List<PharmacyImportColumnHint> out = new ArrayList<>();
        for (int i = 0; i < header.size(); i++) {
            String title = header.get(i) == null ? "" : header.get(i).trim();
            out.add(new PharmacyImportColumnHint(i, title, PharmacyImportRoles.guess(title)));
        }
        return out;
    }

    public List<List<String>> dataRows(List<List<String>> grid, int headerRow) {
        List<List<String>> rows = new ArrayList<>();
        for (int r = headerRow + 1; r < grid.size(); r++) {
            List<String> row = grid.get(r);
            if (!row.stream().anyMatch(StringUtils::hasText)) {
                continue;
            }
            if (InvoiceGridRowKinds.numericIndexRow(row) || InvoiceGridRowKinds.repeatedProductHeader(row)) {
                continue;
            }
            rows.add(row);
        }
        if (rows.isEmpty()) {
            throw new BusinessException("В файле нет строк товаров");
        }
        return rows;
    }

    private static List<List<String>> normalize(List<List<String>> grid) {
        int width = 0;
        for (List<String> row : grid) {
            width = Math.max(width, row.size());
        }
        List<List<String>> out = new ArrayList<>();
        for (List<String> row : grid) {
            List<String> padded = new ArrayList<>(width);
            padded.addAll(row);
            while (padded.size() < width) {
                padded.add("");
            }
            out.add(padded);
        }
        return out;
    }
}

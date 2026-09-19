package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyImportErrors;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import com.pos.pharmacy.importing.spreadsheet.parser.DidoxSpreadsheetCellCleaner;
import com.pos.pharmacy.importing.spreadsheet.parser.DidoxSpreadsheetHeaderJoiner;
import com.pos.pharmacy.importing.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.pharmacy.importing.spreadsheet.parser.InvoiceGridRowKinds;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceFooterFilter;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceNameNumberStrip;
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
            throw PharmacyErrors.of(PharmacyImportErrors.PHARM_IMPORT_FILE_REQUIRED);
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw PharmacyErrors.of(PharmacyImportErrors.PHARM_IMPORT_FILE_UNREADABLE);
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        try {
            if (UzInvoicePdfParser.looksLikePdf(bytes) || name.endsWith(".pdf")) {
                List<List<String>> grid = pdfParser.readGrid(bytes);
                if (grid.isEmpty()) {
                    throw PharmacyErrors.of(PharmacyImportErrors.PHARM_IMPORT_PDF_NO_TEXT);
                }
                return normalize(grid);
            }
            if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
                return normalize(prepareSpreadsheet(HtmlExcelTableParser.parse(bytes)));
            }
            return normalize(prepareSpreadsheet(spreadsheetParser.readGrid(bytes)));
        } catch (PharmacyException e) {
            throw e;
        } catch (IOException e) {
            throw PharmacyErrors.of(
                PharmacyImportErrors.PHARM_IMPORT_FILE_PARSE_FAILED,
                "Не удалось разобрать файл: " + e.getMessage()
            );
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
        return columns(header, List.of());
    }

    public List<PharmacyImportColumnHint> columns(List<String> header, List<List<String>> rows) {
        List<PharmacyImportColumnHint> out = new ArrayList<>();
        for (int i = 0; i < header.size(); i++) {
            String title = header.get(i) == null ? "" : header.get(i).trim();
            out.add(new PharmacyImportColumnHint(i, title, PharmacyImportRoles.guess(title)));
        }
        return PharmacyImportRoleAligner.apply(out, rows);
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
            if (DidoxInvoiceFooterFilter.isFooter(row)) {
                continue;
            }
            rows.add(row);
        }
        if (rows.isEmpty()) {
            throw PharmacyErrors.of(PharmacyImportErrors.PHARM_IMPORT_NO_ROWS);
        }
        return rows;
    }

    private static List<List<String>> prepareSpreadsheet(List<List<String>> grid) {
        return DidoxSpreadsheetCellCleaner.apply(DidoxSpreadsheetHeaderJoiner.apply(grid));
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
        return DidoxInvoiceNameNumberStrip.apply(out);
    }
}

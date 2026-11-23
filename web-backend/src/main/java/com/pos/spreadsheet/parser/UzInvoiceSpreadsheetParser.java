package com.pos.spreadsheet.parser;

import com.pos.exception.BadRequestException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Парсер счёт-фактуры (Ҳисоб-фактура): извлекает только поля, нужные для номенклатуры POS.
 * Поддерживает бинарный .xls/.xlsx и HTML-файлы с расширением .xls (экспорт с didox / soliq).
 */
@Component
public class UzInvoiceSpreadsheetParser {

    private static final Pattern TOTAL_ROW = Pattern.compile("(?i).*(жами|jami|итого|total).*");

    public List<Map<String, String>> parse(InputStream in) {
        try {
            byte[] bytes = in.readAllBytes();
            List<List<String>> grid;
            if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
                grid = HtmlExcelTableParser.parse(bytes);
            } else {
                grid = readPoiGrid(bytes);
            }
            return parseFromGrid(grid);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException("Не удалось прочитать Excel: " + e.getMessage());
        }
    }

    public List<List<String>> readGrid(byte[] bytes) throws IOException {
        return readPoiGrid(bytes);
    }

    /** Общий разбор сетки (Excel / HTML / PDF) в строки номенклатуры. */
    public List<Map<String, String>> parseFromGrid(List<List<String>> grid) {
        return parseProductGrid(grid);
    }

    private List<List<String>> readPoiGrid(byte[] bytes) throws IOException {
        if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
            return HtmlExcelTableParser.parse(bytes);
        }
        DataFormatter formatter = new DataFormatter(Locale.ROOT);
        List<List<String>> grid = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                List<String> cells = new ArrayList<>();
                int last = Math.max(row.getLastCellNum(), 0);
                for (int c = 0; c < last; c++) {
                    Cell cell = row.getCell(c);
                    cells.add(cell == null ? "" : formatter.formatCellValue(cell).trim());
                }
                if (cells.stream().anyMatch(StringUtils::hasText)) {
                    grid.add(cells);
                }
            }
            return grid;
        } catch (Exception e) {
            throw new BadRequestException(
                "Файл не является корректным Excel. Если это счёт-фактура с портала, загрузите исходный .xls или сохраните таблицу как .xlsx."
            );
        }
    }

    private List<Map<String, String>> parseProductGrid(List<List<String>> grid) {
        int headerRow = findHeaderRow(grid);
        if (headerRow < 0) {
            throw new BadRequestException(
                "Не найдена таблица товаров в счёт-фактуре. Ожидаются колонки «Маҳсулот номи», «Нарх» и т.д."
            );
        }
        String documentId = UzInvoiceDocumentIdExtractor.extractFromGrid(grid);
        UzInvoiceColumnMap columns = UzInvoiceColumnMapper.mapColumns(grid.get(headerRow));
        List<Map<String, String>> rows = new ArrayList<>();
        for (int r = headerRow + 1; r < grid.size(); r++) {
            Map<String, String> mapped = mapRow(grid.get(r), columns, r + 1, documentId);
            if (mapped != null) {
                rows.add(mapped);
            }
        }
        if (rows.isEmpty()) {
            throw new BadRequestException("В файле не найдено строк товаров для импорта");
        }
        return rows;
    }

    private int findHeaderRow(List<List<String>> grid) {
        int limit = Math.min(45, grid.size());
        for (int r = 0; r < limit; r++) {
            String joined = rowToLower(grid.get(r));
            if (joined.contains("маҳсулот") || joined.contains("mahsulot") || joined.contains("наименован")) {
                if (joined.contains("нарх") || joined.contains("миқдор") || joined.contains("miqdor")
                    || joined.contains("колич") || joined.contains("цена")) {
                    return r;
                }
            }
            if (joined.contains("№") && (joined.contains("номи") || joined.contains("наимен"))) {
                return r;
            }
        }
        return -1;
    }

    private Map<String, String> mapRow(
        List<String> row,
        UzInvoiceColumnMap cols,
        int excelRowNum,
        String uzInvoiceDocumentId
    ) {
        if (row == null || row.isEmpty()) {
            return null;
        }
        String name = cell(row, cols.name);
        if (!StringUtils.hasText(name)) {
            return null;
        }
        if (TOTAL_ROW.matcher(name).matches()) {
            return null;
        }
        if (isSubHeaderOrIndexRow(row, name)) {
            return null;
        }

        return UzInvoiceProductRowMapper.toCatalogRow(
            name.trim(),
            cell(row, cols.ikpu),
            cell(row, cols.barcode),
            cell(row, cols.unit),
            cell(row, cols.qty),
            cell(row, cols.unitPrice),
            cell(row, cols.lineTotalWithVat),
            cell(row, cols.vatRate),
            excelRowNum,
            uzInvoiceDocumentId
        );
    }

    private static boolean isSubHeaderOrIndexRow(List<String> row, String name) {
        String n = name.trim();
        if (n.matches("(?i)ставка|сумма")) {
            return true;
        }
        if (n.matches("\\d{1,2}") && isNumericIndexRow(row)) {
            return true;
        }
        return false;
    }

    private static boolean isNumericIndexRow(List<String> row) {
        int numeric = 0;
        int nonEmpty = 0;
        for (String c : row) {
            if (!StringUtils.hasText(c)) {
                continue;
            }
            nonEmpty++;
            if (c.trim().matches("\\d{1,2}")) {
                numeric++;
            }
        }
        return nonEmpty >= 5 && numeric == nonEmpty;
    }

    private static String cell(List<String> row, int col) {
        if (col < 0 || col >= row.size()) {
            return "";
        }
        String v = row.get(col);
        return v == null ? "" : v.trim();
    }

    private static String rowToLower(List<String> row) {
        StringBuilder sb = new StringBuilder();
        int limit = Math.min(12, row.size());
        for (int c = 0; c < limit; c++) {
            String s = row.get(c);
            sb.append(s == null ? "" : s.trim().toLowerCase(Locale.ROOT).replace('\n', ' ')).append(' ');
        }
        return sb.toString();
    }
}

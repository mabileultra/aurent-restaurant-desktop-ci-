package com.pos.pharmacy.importing.spreadsheet.parser;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Бинарный .xls/.xlsx: сначала заполняет merged-ячейки, потом убирает пустые строки. */
public final class PoiSheetGridReader {

    private PoiSheetGridReader() {}

    public static List<List<String>> read(byte[] bytes) throws IOException {
        DataFormatter formatter = new DataFormatter();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            int width = sheetWidth(sheet);
            List<List<String>> dense = new ArrayList<>();
            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                List<String> cells = new ArrayList<>(width);
                for (int c = 0; c < width; c++) {
                    cells.add(row == null ? "" : plainCell(row.getCell(c), formatter));
                }
                dense.add(cells);
            }
            fillMerged(sheet, formatter, dense);
            List<List<String>> grid = new ArrayList<>();
            for (List<String> row : dense) {
                if (row.stream().anyMatch(StringUtils::hasText)) {
                    grid.add(row);
                }
            }
            return grid;
        }
    }

    private static int sheetWidth(Sheet sheet) {
        int width = 0;
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row != null) {
                width = Math.max(width, Math.max(row.getLastCellNum(), 0));
            }
        }
        for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
            CellRangeAddress region = sheet.getMergedRegion(i);
            width = Math.max(width, region.getLastColumn() + 1);
        }
        return width;
    }

    private static void fillMerged(Sheet sheet, DataFormatter formatter, List<List<String>> dense) {
        for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
            CellRangeAddress region = sheet.getMergedRegion(i);
            Row firstRow = sheet.getRow(region.getFirstRow());
            String value = firstRow == null
                ? ""
                : plainCell(firstRow.getCell(region.getFirstColumn()), formatter);
            if (!StringUtils.hasText(value)) {
                continue;
            }
            for (int r = region.getFirstRow(); r <= region.getLastRow() && r < dense.size(); r++) {
                List<String> cells = dense.get(r);
                for (int c = region.getFirstColumn(); c <= region.getLastColumn() && c < cells.size(); c++) {
                    if (!StringUtils.hasText(cells.get(c))) {
                        cells.set(c, value);
                    }
                }
            }
        }
    }

    static String plainCell(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        try {
            if (cell.getCellType() == CellType.NUMERIC && !DateUtil.isCellDateFormatted(cell)) {
                return numericPlain(cell.getNumericCellValue());
            }
            if (cell.getCellType() == CellType.FORMULA
                && cell.getCachedFormulaResultType() == CellType.NUMERIC
                && !DateUtil.isCellDateFormatted(cell)) {
                return numericPlain(cell.getNumericCellValue());
            }
        } catch (RuntimeException ignored) {
            // текст
        }
        String formatted = formatter.formatCellValue(cell).trim();
        if (ExcelBarcodeText.looksScientific(formatted)) {
            String expanded = ExcelBarcodeText.normalize(formatted);
            if (!expanded.isEmpty() && expanded.chars().allMatch(Character::isDigit)) {
                return expanded;
            }
        }
        return formatted;
    }

    /** Крупные целые (штрихкод) без 4.78E+12. */
    static String numericPlain(double value) {
        BigDecimal number = BigDecimal.valueOf(value);
        if (number.stripTrailingZeros().scale() <= 0
            && number.abs().compareTo(new BigDecimal("100000000")) >= 0) {
            return number.toBigInteger().toString();
        }
        return number.stripTrailingZeros().toPlainString();
    }
}

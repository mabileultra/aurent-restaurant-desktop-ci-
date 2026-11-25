package com.pos.spreadsheet;

import com.pos.exception.BadRequestException;
import com.pos.spreadsheet.parser.HtmlExcelTableParser;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Чтение Excel номенклатуры: любой порядок колонок + ручной маппинг заголовков → наши ключи.
 * Также HTML-таблицы с расширением .xls (Didox / Soliq).
 */
@Component
public class ExcelFlexibleCatalogReader {

    public List<String> readHeaderLabels(InputStream in) throws IOException {
        byte[] bytes = in.readAllBytes();
        try {
            return ExcelFlexibleCatalogGridReader.headerLabels(toGrid(bytes));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Не удалось прочитать заголовки Excel: " + e.getMessage());
        }
    }

    public List<Map<String, String>> read(
        InputStream in,
        ExcelTemplate template,
        Map<String, String> columnMapping
    ) throws IOException {
        byte[] bytes = in.readAllBytes();
        try {
            return ExcelFlexibleCatalogGridReader.readRows(toGrid(bytes), template, columnMapping);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Не удалось прочитать Excel: " + e.getMessage());
        }
    }

    private static List<List<String>> toGrid(byte[] bytes) throws IOException {
        if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
            return HtmlExcelTableParser.parse(bytes);
        }
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            return sheetToGrid(wb.getSheetAt(0));
        }
    }

    private static List<List<String>> sheetToGrid(Sheet sheet) {
        DataFormatter formatter = new DataFormatter();
        int lastRow = sheet.getLastRowNum();
        List<List<String>> grid = new ArrayList<>();
        for (int r = 0; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                grid.add(List.of());
                continue;
            }
            int last = Math.max(row.getLastCellNum(), 0);
            List<String> cells = new ArrayList<>(last);
            for (int c = 0; c < last; c++) {
                cells.add(formatter.formatCellValue(row.getCell(c)).trim());
            }
            grid.add(cells);
        }
        return grid;
    }
}

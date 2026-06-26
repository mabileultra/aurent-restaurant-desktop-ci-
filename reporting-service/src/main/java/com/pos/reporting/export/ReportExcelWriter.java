package com.pos.reporting.export;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Map;

@Component
public class ReportExcelWriter {

    public byte[] write(ExcelSheetTemplate template, List<Map<String, Object>> dataRows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(template.sheetName());
            CellStyle headerStyle = headerStyle(workbook);
            List<ExcelColumn> columns = template.columns();

            Row header = sheet.createRow(0);
            for (int columnIndex = 0; columnIndex < columns.size(); columnIndex++) {
                Cell cell = header.createCell(columnIndex);
                cell.setCellValue(columns.get(columnIndex).header());
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            if (dataRows != null) {
                for (Map<String, Object> rowData : dataRows) {
                    writeDataRow(sheet.createRow(rowIndex++), columns, rowData);
                }
            }

            sheet.createFreezePane(0, 1);
            for (int columnIndex = 0; columnIndex < columns.size(); columnIndex++) {
                sheet.autoSizeColumn(columnIndex);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException("Не удалось сформировать Excel", exception);
        }
    }

    private static void writeDataRow(Row row, List<ExcelColumn> columns, Map<?, ?> values) {
        for (int columnIndex = 0; columnIndex < columns.size(); columnIndex++) {
            String key = columns.get(columnIndex).key();
            Object raw = values.get(key);
            Cell cell = row.createCell(columnIndex);
            if (raw == null) {
                cell.setBlank();
                continue;
            }
            if (raw instanceof Number number) {
                cell.setCellValue(number.doubleValue());
            } else {
                cell.setCellValue(String.valueOf(raw));
            }
        }
    }

    private static CellStyle headerStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }
}

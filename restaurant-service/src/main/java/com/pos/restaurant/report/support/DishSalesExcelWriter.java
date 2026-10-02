package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.DishSalesReportRow;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Component
public class DishSalesExcelWriter {

    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private record Column(String key, String fallback, int width, boolean money, Function<DishSalesReportRow, Object> value) {
    }

    private static final List<Column> COLUMNS = List.of(
        new Column("name", "Блюдо", 32, false, DishSalesReportRow::name),
        new Column("category", "Категория", 20, false, DishSalesReportRow::category),
        new Column("quantity", "Продано", 10, false, DishSalesReportRow::quantity),
        new Column("returnedQuantity", "Возвращено", 12, false, DishSalesReportRow::returnedQuantity),
        new Column("netQuantity", "Итого шт.", 10, false, DishSalesReportRow::netQuantity),
        new Column("grossAmount", "Сумма", 14, true, DishSalesReportRow::grossAmount),
        new Column("refundAmount", "Возврат", 12, true, DishSalesReportRow::refundAmount),
        new Column("netAmount", "Итого", 14, true, DishSalesReportRow::netAmount),
        new Column("orderCount", "Чеков", 8, false, DishSalesReportRow::orderCount),
        new Column("sharePercent", "Доля, %", 9, false, DishSalesReportRow::sharePercent)
    );

    public byte[] write(DishSalesReportResponse report, Instant from, Instant to, Map<String, String> labels, ZoneId zone) {
        Map<String, String> texts = labels == null ? Map.of() : labels;
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Font bold = workbook.createFont();
            bold.setBold(true);
            CellStyle header = workbook.createCellStyle();
            header.setFont(bold);
            CellStyle money = workbook.createCellStyle();
            money.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
            CellStyle moneyBold = workbook.createCellStyle();
            moneyBold.cloneStyleFrom(money);
            moneyBold.setFont(bold);

            Sheet sheet = workbook.createSheet(text(texts, "sheet", "Блюда"));
            int rowIndex = 0;
            Cell title = sheet.createRow(rowIndex++).createCell(0);
            title.setCellValue(text(texts, "title", "Продажи по блюдам"));
            title.setCellStyle(header);
            sheet.createRow(rowIndex++).createCell(0).setCellValue(
                text(texts, "period", "Период") + ": "
                    + PERIOD_FORMAT.format(LocalDateTime.ofInstant(from, zone)) + " — "
                    + PERIOD_FORMAT.format(LocalDateTime.ofInstant(to, zone))
            );
            rowIndex++;

            int headerRow = rowIndex;
            Row head = sheet.createRow(rowIndex++);
            for (int i = 0; i < COLUMNS.size(); i++) {
                Column column = COLUMNS.get(i);
                Cell cell = head.createCell(i);
                cell.setCellValue(text(texts, "col." + column.key(), column.fallback()));
                cell.setCellStyle(header);
                sheet.setColumnWidth(i, column.width() * 256);
            }
            for (DishSalesReportRow row : report.rows()) {
                Row line = sheet.createRow(rowIndex++);
                for (int i = 0; i < COLUMNS.size(); i++) {
                    Column column = COLUMNS.get(i);
                    write(line.createCell(i), column.value().apply(row), column.money() ? money : null);
                }
            }
            sheet.createFreezePane(0, headerRow + 1);

            Row total = sheet.createRow(rowIndex);
            Cell totalLabel = total.createCell(0);
            totalLabel.setCellValue(text(texts, "totals", "Итого"));
            totalLabel.setCellStyle(header);
            write(total.createCell(4), report.netQuantity(), null);
            write(total.createCell(5), report.grossAmount(), moneyBold);
            write(total.createCell(6), report.refundAmount(), moneyBold);
            write(total.createCell(7), report.netAmount(), moneyBold);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException("Не удалось сформировать Excel", exception);
        }
    }

    private static void write(Cell cell, Object value, CellStyle style) {
        if (value == null) {
            cell.setBlank();
            return;
        }
        if (value instanceof BigDecimal decimal) {
            cell.setCellValue(decimal.doubleValue());
        } else if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else {
            cell.setCellValue(String.valueOf(value));
        }
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private static String text(Map<String, String> labels, String key, String fallback) {
        String value = labels.get(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}

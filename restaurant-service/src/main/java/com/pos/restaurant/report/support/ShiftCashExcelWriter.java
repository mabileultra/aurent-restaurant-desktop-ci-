package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.ShiftCashReportRow;
import com.pos.restaurant.report.dto.ShiftCashReportTotals;
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
import java.util.UUID;
import java.util.function.Function;

@Component
public class ShiftCashExcelWriter {

    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final DateTimeFormatter CELL_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private record Column(String key, String fallback, Function<Ctx, Object> value) {
    }

    private record Ctx(ShiftCashReportRow row, Map<String, String> names, ZoneId zone) {
    }

    private static final List<Column> COLUMNS = List.of(
        new Column("openedAt", "Открыта", c -> formatAt(c.row().openedAt(), c.zone())),
        new Column("closedAt", "Закрыта", c -> formatAt(c.row().closedAt(), c.zone())),
        new Column("status", "Статус", c -> c.row().status() == null ? null : c.row().status().name()),
        new Column("cashier", "Кассир", c -> name(c, c.row().openedByUserId())),
        new Column("opening", "Старт", c -> c.row().openingCash()),
        new Column("cashSales", "Нал. продажи", c -> c.row().cashSales()),
        new Column("cashIn", "Внесения", c -> c.row().cashIn()),
        new Column("cashOut", "Изъятия", c -> c.row().cashOut()),
        new Column("collection", "Инкассация", c -> c.row().collection()),
        new Column("expected", "Должно быть", c -> c.row().expectedCash()),
        new Column("closing", "Факт", c -> c.row().closingCash()),
        new Column("difference", "Разница", c -> c.row().difference()),
        new Column("handoverExpected", "Передал", c -> c.row().handoverExpected()),
        new Column("handoverDiff", "Приём ±", c -> c.row().handoverDiff())
    );

    public byte[] write(
        List<ShiftCashReportRow> rows,
        ShiftCashReportTotals totals,
        Instant from,
        Instant to,
        Map<String, String> userNames,
        Map<String, String> labels,
        ZoneId zone
    ) {
        Map<String, String> texts = labels == null ? Map.of() : labels;
        Map<String, String> names = userNames == null ? Map.of() : userNames;
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Font bold = workbook.createFont();
            bold.setBold(true);
            CellStyle header = workbook.createCellStyle();
            header.setFont(bold);
            CellStyle money = workbook.createCellStyle();
            money.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));

            Sheet sheet = workbook.createSheet(text(texts, "sheet", "Касса"));
            int rowIndex = 0;
            Cell title = sheet.createRow(rowIndex++).createCell(0);
            title.setCellValue(text(texts, "title", "Касса и смены"));
            title.setCellStyle(header);
            sheet.createRow(rowIndex++).createCell(0).setCellValue(
                text(texts, "period", "Период") + ": "
                    + PERIOD_FORMAT.format(LocalDateTime.ofInstant(from, zone)) + " — "
                    + PERIOD_FORMAT.format(LocalDateTime.ofInstant(to, zone))
            );
            rowIndex++;

            Row head = sheet.createRow(rowIndex++);
            for (int i = 0; i < COLUMNS.size(); i++) {
                Cell cell = head.createCell(i);
                cell.setCellValue(text(texts, "col." + COLUMNS.get(i).key(), COLUMNS.get(i).fallback()));
                cell.setCellStyle(header);
                sheet.setColumnWidth(i, 16 * 256);
            }
            for (ShiftCashReportRow row : rows) {
                Ctx ctx = new Ctx(row, names, zone);
                Row line = sheet.createRow(rowIndex++);
                for (int i = 0; i < COLUMNS.size(); i++) {
                    write(line.createCell(i), COLUMNS.get(i).value().apply(ctx), money);
                }
            }

            rowIndex++;
            Cell totalsTitle = sheet.createRow(rowIndex++).createCell(0);
            totalsTitle.setCellValue(text(texts, "totals", "Итоги"));
            totalsTitle.setCellStyle(header);
            writeTotal(sheet.createRow(rowIndex++), texts, "shiftCount", "Смен", totals.shiftCount(), money);
            writeTotal(sheet.createRow(rowIndex++), texts, "cashSales", "Нал. продажи", totals.cashSales(), money);
            writeTotal(sheet.createRow(rowIndex++), texts, "expected", "Должно быть", totals.expectedCash(), money);
            writeTotal(sheet.createRow(rowIndex++), texts, "closing", "Факт", totals.closingCash(), money);
            writeTotal(sheet.createRow(rowIndex), texts, "difference", "Разница", totals.difference(), money);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException("Не удалось сформировать Excel", exception);
        }
    }

    private static void writeTotal(
        Row row, Map<String, String> texts, String key, String fallback, Object value, CellStyle money
    ) {
        row.createCell(0).setCellValue(text(texts, "total." + key, fallback));
        write(row.createCell(1), value, money);
    }

    private static void write(Cell cell, Object value, CellStyle money) {
        if (value == null) {
            cell.setBlank();
            return;
        }
        if (value instanceof BigDecimal decimal) {
            cell.setCellValue(decimal.doubleValue());
            cell.setCellStyle(money);
        } else if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else {
            cell.setCellValue(String.valueOf(value));
        }
    }

    private static String formatAt(Instant instant, ZoneId zone) {
        return instant == null ? null : CELL_FORMAT.format(LocalDateTime.ofInstant(instant, zone));
    }

    private static String name(Ctx ctx, UUID userId) {
        if (userId == null) {
            return null;
        }
        String value = ctx.names().get(userId.toString());
        return value == null || value.isBlank() ? userId.toString().substring(0, 8) : value;
    }

    private static String text(Map<String, String> labels, String key, String fallback) {
        String value = labels.get(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}

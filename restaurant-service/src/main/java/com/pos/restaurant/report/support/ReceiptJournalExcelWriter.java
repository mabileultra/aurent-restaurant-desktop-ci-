package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.ReceiptJournalRow;
import com.pos.restaurant.report.dto.ReceiptJournalTotals;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
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
public class ReceiptJournalExcelWriter {

    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private enum Kind { TEXT, INT, MONEY, DATE }

    private record Column(String key, String fallback, int width, Kind kind, Function<Ctx, Object> value) {
    }

    private record Ctx(ReceiptJournalRow row, Labels labels, Map<String, String> userNames, ZoneId zone) {
    }

    private static final List<Column> COLUMNS = List.of(
        new Column("orderNo", "№ чека", 10, Kind.INT, c -> c.row().orderNo()),
        new Column("paidAt", "Дата и время", 18, Kind.DATE, c -> local(c.row().paidAt(), c.zone())),
        new Column("channel", "Тип", 14, Kind.TEXT, c -> c.labels().enumLabel("channel", c.row().channel())),
        new Column("hall", "Зал", 16, Kind.TEXT, c -> c.row().hallName()),
        new Column("table", "Стол", 10, Kind.TEXT, c -> c.row().tableCode()),
        new Column("guests", "Гости", 8, Kind.INT, c -> c.row().guestCount()),
        new Column("waiter", "Официант", 20, Kind.TEXT, c -> userName(c, c.row().waiterUserId())),
        new Column("cashier", "Кассир", 20, Kind.TEXT, c -> userName(c, c.row().cashierUserId())),
        new Column("method", "Оплата", 14, Kind.TEXT, c -> c.labels().enumLabel("method", c.row().method())),
        new Column("cardType", "Карта", 10, Kind.TEXT, c -> c.row().cardType() == null ? null : c.row().cardType().name()),
        new Column("total", "Сумма", 14, Kind.MONEY, c -> c.row().totalAmount()),
        new Column("discount", "Скидка", 12, Kind.MONEY, c -> c.row().discountAmount()),
        new Column("service", "Обслуживание", 14, Kind.MONEY, c -> c.row().serviceAmount()),
        new Column("cash", "Наличные", 14, Kind.MONEY, c -> c.row().cashAmount()),
        new Column("card", "Безнал", 14, Kind.MONEY, c -> c.row().cardAmount()),
        new Column("refund", "Возврат", 12, Kind.MONEY, c -> c.row().refundAmount()),
        new Column("net", "Итого", 14, Kind.MONEY, c -> c.row().netAmount()),
        new Column("status", "Статус", 16, Kind.TEXT, c -> c.labels().enumLabel("status", c.row().status())),
        new Column("client", "Клиент", 18, Kind.TEXT, c -> c.row().clientName()),
        new Column("debtPhone", "Телефон", 16, Kind.TEXT, c -> c.row().debtPhone()),
        new Column("debtComment", "Комментарий", 28, Kind.TEXT, c -> c.row().debtComment()),
        new Column("advancePaid", "Внесено", 12, Kind.MONEY, c -> c.row().advancePaid()),
        new Column("debtRemaining", "Остаток долга", 14, Kind.MONEY, c -> c.row().debtRemaining())
    );

    private record TotalLine(String key, String fallback, boolean money, Function<ReceiptJournalTotals, Object> value) {
    }

    private static final List<TotalLine> TOTALS = List.of(
        new TotalLine("checkCount", "Чеков", false, ReceiptJournalTotals::checkCount),
        new TotalLine("guestCount", "Гостей", false, ReceiptJournalTotals::guestCount),
        new TotalLine("totalAmount", "Продажи", true, ReceiptJournalTotals::totalAmount),
        new TotalLine("refundAmount", "Возвраты", true, ReceiptJournalTotals::refundAmount),
        new TotalLine("netAmount", "Итого за вычетом возвратов", true, ReceiptJournalTotals::netAmount),
        new TotalLine("averageCheck", "Средний чек", true, ReceiptJournalTotals::averageCheck),
        new TotalLine("cashAmount", "Наличные", true, ReceiptJournalTotals::cashAmount),
        new TotalLine("cardAmount", "Безнал", true, ReceiptJournalTotals::cardAmount),
        new TotalLine("creditAmount", "Кредит", true, ReceiptJournalTotals::creditAmount),
        new TotalLine("advanceAmount", "Аванс", true, ReceiptJournalTotals::advanceAmount),
        new TotalLine("debtRemaining", "Остаток долга", true, ReceiptJournalTotals::debtRemaining),
        new TotalLine("discountAmount", "Скидки", true, ReceiptJournalTotals::discountAmount),
        new TotalLine("serviceAmount", "Обслуживание", true, ReceiptJournalTotals::serviceAmount)
    );

    public byte[] write(
        List<ReceiptJournalRow> rows,
        ReceiptJournalTotals totals,
        Instant from,
        Instant to,
        Map<String, String> userNames,
        Map<String, String> labelMap,
        ZoneId zone
    ) {
        Labels labels = new Labels(labelMap);
        Map<String, String> names = userNames == null ? Map.of() : userNames;
        SXSSFWorkbook workbook = new SXSSFWorkbook(200);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles styles = new Styles(workbook);
            Sheet sheet = workbook.createSheet(labels.get("sheet", "Чеки"));

            int rowIndex = 0;
            Cell title = sheet.createRow(rowIndex++).createCell(0);
            title.setCellValue(labels.get("title", "Журнал чеков"));
            title.setCellStyle(styles.title);
            sheet.createRow(rowIndex++).createCell(0).setCellValue(
                labels.get("period", "Период") + ": "
                    + PERIOD_FORMAT.format(local(from, zone)) + " — " + PERIOD_FORMAT.format(local(to, zone))
            );
            rowIndex++;

            int headerRow = rowIndex;
            Row header = sheet.createRow(rowIndex++);
            for (int i = 0; i < COLUMNS.size(); i++) {
                Column column = COLUMNS.get(i);
                Cell cell = header.createCell(i);
                cell.setCellValue(labels.get("col." + column.key(), column.fallback()));
                cell.setCellStyle(styles.header);
                sheet.setColumnWidth(i, column.width() * 256);
            }

            for (ReceiptJournalRow row : rows) {
                Ctx ctx = new Ctx(row, labels, names, zone);
                Row line = sheet.createRow(rowIndex++);
                for (int i = 0; i < COLUMNS.size(); i++) {
                    Column column = COLUMNS.get(i);
                    writeCell(line.createCell(i), column.kind(), column.value().apply(ctx), styles);
                }
            }
            sheet.createFreezePane(0, headerRow + 1);

            rowIndex++;
            Cell totalsTitle = sheet.createRow(rowIndex++).createCell(0);
            totalsTitle.setCellValue(labels.get("totals", "Итоги"));
            totalsTitle.setCellStyle(styles.header);
            for (TotalLine line : TOTALS) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(labels.get("total." + line.key(), line.fallback()));
                writeCell(row.createCell(1), line.money() ? Kind.MONEY : Kind.INT, line.value().apply(totals), styles);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException("Не удалось сформировать Excel", exception);
        } finally {
            workbook.dispose();
        }
    }

    private static void writeCell(Cell cell, Kind kind, Object value, Styles styles) {
        if (value == null) {
            cell.setBlank();
            return;
        }
        switch (kind) {
            case MONEY -> {
                cell.setCellValue(((BigDecimal) value).doubleValue());
                cell.setCellStyle(styles.money);
            }
            case INT -> cell.setCellValue(((Number) value).doubleValue());
            case DATE -> {
                cell.setCellValue((LocalDateTime) value);
                cell.setCellStyle(styles.date);
            }
            case TEXT -> cell.setCellValue(String.valueOf(value));
        }
    }

    private static LocalDateTime local(Instant instant, ZoneId zone) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, zone);
    }

    private static String userName(Ctx ctx, UUID userId) {
        if (userId == null) {
            return null;
        }
        String name = ctx.userNames().get(userId.toString());
        return name == null || name.isBlank() ? userId.toString().substring(0, 8) : name;
    }

    private record Labels(Map<String, String> values) {

        String get(String key, String fallback) {
            String value = values == null ? null : values.get(key);
            return value == null || value.isBlank() ? fallback : value;
        }

        String enumLabel(String group, Enum<?> value) {
            return value == null ? null : get(group + "." + value.name(), value.name());
        }
    }

    private static final class Styles {
        final CellStyle title;
        final CellStyle header;
        final CellStyle money;
        final CellStyle date;

        Styles(Workbook workbook) {
            Font bold = workbook.createFont();
            bold.setBold(true);
            Font big = workbook.createFont();
            big.setBold(true);
            big.setFontHeightInPoints((short) 14);

            title = workbook.createCellStyle();
            title.setFont(big);
            header = workbook.createCellStyle();
            header.setFont(bold);
            money = workbook.createCellStyle();
            money.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
            date = workbook.createCellStyle();
            date.setDataFormat(workbook.createDataFormat().getFormat("dd.mm.yyyy hh:mm"));
        }
    }
}

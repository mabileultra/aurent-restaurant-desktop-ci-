package com.pos.platform.service.support;

import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
public class BillingCollectionsExcelExporter {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private static final Map<String, List<String>> HEADERS = Map.of(
        "ru", List.of("ID", "Компания", "Телефон", "ИНН", "Тариф", "Платёж / мес", "Баланс",
            "След. платёж", "Дней до платежа", "Дней просрочки", "Статус", "Способ оплаты", "Последний платёж"),
        "uz", List.of("ID", "Kompaniya", "Telefon", "STIR", "Tarif", "Oylik to‘lov", "Balans",
            "Keyingi to‘lov", "To‘lovgacha kun", "Kechikkan kun", "Status", "To‘lov turi", "Oxirgi to‘lov")
    );

    private static final Map<String, Map<BillingPaymentState, String>> STATES = Map.of(
        "ru", Map.of(
            BillingPaymentState.ACTIVE, "Активен",
            BillingPaymentState.DUE_SOON, "Скоро срок",
            BillingPaymentState.OVERDUE, "Должник",
            BillingPaymentState.SUSPENDED, "Приостановлен",
            BillingPaymentState.NOT_BILLED, "Без тарифа"),
        "uz", Map.of(
            BillingPaymentState.ACTIVE, "Faol",
            BillingPaymentState.DUE_SOON, "Tez kunda",
            BillingPaymentState.OVERDUE, "Qarzdor",
            BillingPaymentState.SUSPENDED, "To‘xtatilgan",
            BillingPaymentState.NOT_BILLED, "Tarifsiz")
    );

    private static final Map<String, Map<BillingPaymentMethod, String>> METHODS = Map.of(
        "ru", Map.of(
            BillingPaymentMethod.CLICK, "Click",
            BillingPaymentMethod.PAYME, "Payme",
            BillingPaymentMethod.BANK_TRANSFER, "Банковский перевод",
            BillingPaymentMethod.CASH, "Наличные",
            BillingPaymentMethod.OTHER, "Другое"),
        "uz", Map.of(
            BillingPaymentMethod.CLICK, "Click",
            BillingPaymentMethod.PAYME, "Payme",
            BillingPaymentMethod.BANK_TRANSFER, "Bank o‘tkazmasi",
            BillingPaymentMethod.CASH, "Naqd pul",
            BillingPaymentMethod.OTHER, "Boshqa")
    );

    public byte[] export(List<CompanyPaymentRowResponse> rows, String lang) {
        String l = "uz".equalsIgnoreCase(lang) ? "uz" : "ru";
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("billing");
            CellStyle headStyle = wb.createCellStyle();
            Font bold = wb.createFont();
            bold.setBold(true);
            headStyle.setFont(bold);
            CellStyle moneyStyle = wb.createCellStyle();
            moneyStyle.setDataFormat(wb.createDataFormat().getFormat("# ##0"));

            List<String> headers = HEADERS.get(l);
            Row head = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell c = head.createCell(i);
                c.setCellValue(headers.get(i));
                c.setCellStyle(headStyle);
            }
            int r = 1;
            for (CompanyPaymentRowResponse row : rows) {
                CompanyBillingResponse b = row.billing();
                Row x = sheet.createRow(r++);
                int col = 0;
                x.createCell(col++).setCellValue(b.companyId() != null ? b.companyId() : 0);
                x.createCell(col++).setCellValue(nz(b.companyName()));
                x.createCell(col++).setCellValue(nz(row.companyPhone()));
                x.createCell(col++).setCellValue(nz(row.companyTin()));
                x.createCell(col++).setCellValue(nz(b.planName()));
                money(x.createCell(col++), b.monthlyTotal(), moneyStyle);
                money(x.createCell(col++), b.balance(), moneyStyle);
                x.createCell(col++).setCellValue(date(b.nextChargeAt()));
                number(x.createCell(col++), row.daysUntilDue());
                number(x.createCell(col++), row.daysOverdue());
                x.createCell(col++).setCellValue(STATES.get(l).getOrDefault(row.paymentState(), ""));
                x.createCell(col++).setCellValue(
                    row.lastPaymentMethod() != null ? METHODS.get(l).get(row.lastPaymentMethod()) : "");
                x.createCell(col).setCellValue(date(row.lastPaymentAt()));
            }
            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }
            sheet.createFreezePane(0, 1);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void money(Cell cell, BigDecimal v, CellStyle style) {
        cell.setCellValue(v != null ? v.doubleValue() : 0d);
        cell.setCellStyle(style);
    }

    private static void number(Cell cell, Long v) {
        if (v != null) {
            cell.setCellValue(v);
        }
    }

    private static String date(Instant v) {
        return v != null ? DATE.format(LocalDate.ofInstant(v, BillingTime.ZONE)) : "";
    }

    private static String nz(String v) {
        return v != null ? v : "";
    }
}

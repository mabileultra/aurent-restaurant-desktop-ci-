package com.pos.taxanalytics.service.impl;

import com.pos.exception.PosExceptions;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptLineResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptRowResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptsResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsReceiptQueryRepository;
import com.pos.taxanalytics.service.TaxAnalyticsCompanyReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaxAnalyticsCompanyReceiptServiceImpl implements TaxAnalyticsCompanyReceiptService {

    private final TaxAnalyticsReceiptQueryRepository receipts;

    @Override
    @Transactional(readOnly = true)
    public TaxAnalyticsReceiptsResponse list(int companyId, LocalDate date, String kind, int page, int size) {
        String safeKind = normalize(kind);
        int safeSize = Math.min(100, Math.max(1, size));
        int safePage = Math.max(0, page);
        long total = receipts.count(companyId, date, safeKind);
        List<TaxAnalyticsReceiptRowResponse> rows = receipts.list(companyId, date, safeKind, safeSize, safePage * safeSize)
            .stream()
            .map(this::row)
            .toList();
        return new TaxAnalyticsReceiptsResponse(date.toString(), safeKind, total, safePage, safeSize, rows);
    }

    @Override
    @Transactional(readOnly = true)
    public TaxAnalyticsReceiptDetailResponse detail(int companyId, UUID saleId) {
        Map<String, Object> sale = receipts.find(companyId, saleId);
        if (sale == null) {
            throw PosExceptions.notFound("Чек", saleId);
        }
        List<TaxAnalyticsReceiptLineResponse> items = receipts.items(saleId).stream().map(this::line).toList();
        return new TaxAnalyticsReceiptDetailResponse(
            str(sale.get("sale_id")),
            str(sale.get("receipt_number")),
            instant(sale.get("created_at")),
            str(sale.get("store_name")),
            str(sale.get("cashier_name")),
            money(sale.get("subtotal")),
            money(sale.get("tax_total")),
            money(sale.get("discount_total")),
            money(sale.get("total_amount")),
            str(sale.get("payment_method")),
            money(sale.get("cash_amount")),
            money(sale.get("card_amount")),
            money(sale.get("amount_tendered")),
            money(sale.get("change_given")),
            str(sale.get("status")),
            str(sale.get("fiscal_status")),
            str(sale.get("fiscal_sign")),
            str(sale.get("fiscal_receipt_seq")),
            str(sale.get("fiscal_qr_url")),
            str(sale.get("fiscal_terminal_id")),
            bool(sale.get("print_fiscal_qr")),
            items
        );
    }

    private TaxAnalyticsReceiptRowResponse row(Map<String, Object> row) {
        return new TaxAnalyticsReceiptRowResponse(
            str(row.get("sale_id")),
            str(row.get("receipt_number")),
            instant(row.get("created_at")),
            str(row.get("store_name")),
            money(row.get("total_amount")),
            str(row.get("fiscal_status")),
            bool(row.get("has_qr"))
        );
    }

    private TaxAnalyticsReceiptLineResponse line(Map<String, Object> row) {
        return new TaxAnalyticsReceiptLineResponse(
            str(row.get("product_name")),
            money(row.get("quantity")),
            money(row.get("unit_price")),
            money(row.get("line_total")),
            money(row.get("tax_amount"))
        );
    }

    private static String normalize(String kind) {
        if ("QR".equalsIgnoreCase(kind) || "NO_QR".equalsIgnoreCase(kind)) {
            return kind.toUpperCase();
        }
        return "ALL";
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static BigDecimal money(Object value) {
        return value instanceof BigDecimal decimal ? decimal : BigDecimal.ZERO;
    }

    private static boolean bool(Object value) {
        return value instanceof Boolean flag ? flag : Boolean.parseBoolean(String.valueOf(value));
    }

    private static String instant(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant().toString();
        }
        if (value instanceof Instant instant) {
            return instant.toString();
        }
        return value == null ? null : String.valueOf(value);
    }
}

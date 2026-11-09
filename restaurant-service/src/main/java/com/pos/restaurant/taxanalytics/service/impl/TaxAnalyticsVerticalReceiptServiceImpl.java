package com.pos.restaurant.taxanalytics.service.impl;

import com.pos.restaurant.taxanalytics.dto.TaxAnalyticsReceiptDetailDto;
import com.pos.restaurant.taxanalytics.dto.TaxAnalyticsReceiptLineDto;
import com.pos.restaurant.taxanalytics.dto.TaxAnalyticsReceiptRowDto;
import com.pos.restaurant.taxanalytics.repository.TaxAnalyticsVerticalReceiptRepository;
import com.pos.restaurant.taxanalytics.service.TaxAnalyticsVerticalReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsVerticalReceiptServiceImpl implements TaxAnalyticsVerticalReceiptService {

    private final TaxAnalyticsVerticalReceiptRepository repository;

    @Override
    public Map<String, Object> receiptCounts(int companyId, LocalDate from, LocalDate to) {
        return repository.receiptCounts(companyId, from, to.plusDays(1));
    }

    @Override
    public long count(int companyId, LocalDate from, LocalDate to, String kind) {
        return repository.count(companyId, from, to.plusDays(1), kind);
    }

    @Override
    public List<TaxAnalyticsReceiptRowDto> list(
        int companyId,
        LocalDate from,
        LocalDate to,
        String kind,
        int limit,
        int offset
    ) {
        List<TaxAnalyticsReceiptRowDto> rows = new ArrayList<>();
        for (Map<String, Object> row : repository.list(companyId, from, to.plusDays(1), kind, limit, offset)) {
            rows.add(new TaxAnalyticsReceiptRowDto(
                text(row.get("sale_id")),
                text(row.get("receipt_number")),
                instant(row.get("created_at")),
                text(row.get("store_name")),
                decimal(row.get("total_amount")),
                text(row.get("fiscal_status")),
                bool(row.get("has_qr"))
            ));
        }
        return rows;
    }

    @Override
    public TaxAnalyticsReceiptDetailDto detail(int companyId, String saleId) {
        UUID orderId;
        try {
            orderId = UUID.fromString(saleId);
        } catch (Exception ex) {
            return null;
        }
        Map<String, Object> sale = repository.find(companyId, orderId);
        if (sale == null) {
            return null;
        }
        List<TaxAnalyticsReceiptLineDto> items = new ArrayList<>();
        for (Map<String, Object> item : repository.items(orderId)) {
            items.add(new TaxAnalyticsReceiptLineDto(
                text(item.get("product_name")),
                decimal(item.get("quantity")),
                decimal(item.get("unit_price")),
                decimal(item.get("line_total")),
                decimal(item.get("tax_amount"))
            ));
        }
        return new TaxAnalyticsReceiptDetailDto(
            text(sale.get("sale_id")),
            text(sale.get("receipt_number")),
            instant(sale.get("created_at")),
            text(sale.get("store_name")),
            text(sale.get("cashier_name")),
            decimal(sale.get("subtotal")),
            decimal(sale.get("tax_total")),
            decimal(sale.get("discount_total")),
            decimal(sale.get("total_amount")),
            text(sale.get("payment_method")),
            decimal(sale.get("cash_amount")),
            decimal(sale.get("card_amount")),
            decimal(sale.get("amount_tendered")),
            decimal(sale.get("change_given")),
            text(sale.get("status")),
            text(sale.get("fiscal_status")),
            text(sale.get("fiscal_sign")),
            text(sale.get("fiscal_receipt_seq")),
            text(sale.get("fiscal_qr_url")),
            text(sale.get("fiscal_terminal_id")),
            bool(sale.get("print_fiscal_qr")),
            items
        );
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
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

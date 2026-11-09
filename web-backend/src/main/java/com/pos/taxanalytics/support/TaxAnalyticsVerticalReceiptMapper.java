package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptDetailDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptLineDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptRowDto;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptLineResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptRowResponse;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class TaxAnalyticsVerticalReceiptMapper {

    private TaxAnalyticsVerticalReceiptMapper() {
    }

    public static long asLong(Map<String, Object> row, String key) {
        if (row == null) {
            return 0L;
        }
        Object value = row.get(key);
        return value instanceof Number number ? number.longValue() : 0L;
    }

    public static TaxAnalyticsReceiptRowResponse toRow(TaxAnalyticsVerticalReceiptRowDto row, int companyId) {
        if (row == null) {
            return null;
        }
        return new TaxAnalyticsReceiptRowResponse(
            row.saleId(),
            row.receiptNumber(),
            row.createdAt(),
            row.storeName(),
            nz(row.totalAmount()),
            row.fiscalStatus(),
            row.hasQr(),
            companyId,
            null,
            nz(row.itemsQuantity())
        );
    }

    public static TaxAnalyticsReceiptDetailResponse toDetail(TaxAnalyticsVerticalReceiptDetailDto detail) {
        if (detail == null) {
            return null;
        }
        List<TaxAnalyticsReceiptLineResponse> items = new ArrayList<>();
        if (detail.items() != null) {
            for (TaxAnalyticsVerticalReceiptLineDto line : detail.items()) {
                if (line == null) {
                    continue;
                }
                items.add(new TaxAnalyticsReceiptLineResponse(
                    line.productName(),
                    nz(line.quantity()),
                    nz(line.unitPrice()),
                    nz(line.lineTotal()),
                    nz(line.taxAmount())
                ));
            }
        }
        return new TaxAnalyticsReceiptDetailResponse(
            detail.saleId(),
            detail.receiptNumber(),
            detail.createdAt(),
            detail.storeName(),
            detail.cashierName(),
            nz(detail.subtotal()),
            nz(detail.taxTotal()),
            nz(detail.discountTotal()),
            nz(detail.totalAmount()),
            detail.paymentMethod(),
            nz(detail.cashAmount()),
            nz(detail.cardAmount()),
            nz(detail.amountTendered()),
            nz(detail.changeGiven()),
            detail.status(),
            detail.fiscalStatus(),
            detail.fiscalSign(),
            detail.fiscalReceiptSeq(),
            detail.fiscalQrUrl(),
            detail.fiscalTerminalId(),
            detail.printFiscalQr(),
            items
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.TaxAnalyticsPharmacyClient;
import com.pos.taxanalytics.client.TaxAnalyticsRestaurantClient;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptDetailDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptRowDto;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptRowResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Loads restaurant/pharmacy receipts when grocery sales has none for the company. */
@Component
@RequiredArgsConstructor
public class TaxAnalyticsVerticalReceiptBridge {

    private final TaxAnalyticsRestaurantClient restaurantClient;
    private final TaxAnalyticsPharmacyClient pharmacyClient;

    public record Counts(long fiscal, long nonFiscal) {
        public long total() {
            return fiscal + nonFiscal;
        }
    }

    public Counts receiptCounts(int companyId, LocalDate from, LocalDate to) {
        Counts restaurant = fromMap(restaurantClient.receiptCounts(companyId, from, to));
        if (restaurant.total() > 0) {
            return restaurant;
        }
        return fromMap(pharmacyClient.receiptCounts(companyId, from, to));
    }

    public long count(int companyId, LocalDate from, LocalDate to, String kind) {
        long restaurant = restaurantClient.receiptCount(companyId, from, to, kind);
        if (restaurant > 0) {
            return restaurant;
        }
        return pharmacyClient.receiptCount(companyId, from, to, kind);
    }

    public List<TaxAnalyticsReceiptRowResponse> list(
        int companyId,
        LocalDate from,
        LocalDate to,
        String kind,
        int limit,
        int offset
    ) {
        List<TaxAnalyticsVerticalReceiptRowDto> restaurant = restaurantClient.receipts(
            companyId, from, to, kind, limit, offset
        );
        if (restaurant != null && !restaurant.isEmpty()) {
            return mapRows(restaurant, companyId);
        }
        List<TaxAnalyticsVerticalReceiptRowDto> pharmacy = pharmacyClient.receipts(
            companyId, from, to, kind, limit, offset
        );
        return mapRows(pharmacy, companyId);
    }

    public TaxAnalyticsReceiptDetailResponse detail(int companyId, String saleId) {
        TaxAnalyticsVerticalReceiptDetailDto restaurant = restaurantClient.receiptDetail(companyId, saleId);
        if (restaurant != null) {
            return TaxAnalyticsVerticalReceiptMapper.toDetail(restaurant);
        }
        return TaxAnalyticsVerticalReceiptMapper.toDetail(pharmacyClient.receiptDetail(companyId, saleId));
    }

    private static Counts fromMap(Map<String, Object> row) {
        return new Counts(
            TaxAnalyticsVerticalReceiptMapper.asLong(row, "fiscal_receipt_count"),
            TaxAnalyticsVerticalReceiptMapper.asLong(row, "non_fiscal_receipt_count")
        );
    }

    private static List<TaxAnalyticsReceiptRowResponse> mapRows(
        List<TaxAnalyticsVerticalReceiptRowDto> rows,
        int companyId
    ) {
        List<TaxAnalyticsReceiptRowResponse> out = new ArrayList<>();
        if (rows == null) {
            return out;
        }
        for (TaxAnalyticsVerticalReceiptRowDto row : rows) {
            TaxAnalyticsReceiptRowResponse mapped = TaxAnalyticsVerticalReceiptMapper.toRow(row, companyId);
            if (mapped != null) {
                out.add(mapped);
            }
        }
        return out;
    }
}

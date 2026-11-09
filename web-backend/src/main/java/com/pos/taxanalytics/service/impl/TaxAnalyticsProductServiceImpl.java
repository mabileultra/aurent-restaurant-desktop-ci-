package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.dto.TaxAnalyticsProductRankResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsProductsResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptCountsResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsProductQueryRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsReceiptCountRepository;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsWeekMath;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsProductServiceImpl {

    private final TaxAnalyticsProductQueryRepository productRepository;
    private final TaxAnalyticsReceiptCountRepository receiptCountRepository;

    public TaxAnalyticsProductsResponse products(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String businessType,
        int limit
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return new TaxAnalyticsProductsResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            blankToNull(regionCode),
            blankToNull(districtCode),
            blankToNull(businessType),
            safeLimit,
            mapRows(productRepository.rankedProducts(range, regionCode, districtCode, businessType, false, safeLimit)),
            mapRows(productRepository.rankedProducts(range, regionCode, districtCode, businessType, true, safeLimit))
        );
    }

    public TaxAnalyticsReceiptCountsResponse receiptCounts(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String businessType
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        Map<String, Object> row = receiptCountRepository.counts(range, regionCode, districtCode, businessType);
        long fiscal = asLong(row.get("fiscal_receipt_count"));
        long nonFiscal = asLong(row.get("non_fiscal_receipt_count"));
        return new TaxAnalyticsReceiptCountsResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            blankToNull(regionCode),
            blankToNull(districtCode),
            blankToNull(businessType),
            fiscal,
            nonFiscal,
            fiscal + nonFiscal
        );
    }

    private static List<TaxAnalyticsProductRankResponse> mapRows(List<Map<String, Object>> rows) {
        List<TaxAnalyticsProductRankResponse> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            out.add(new TaxAnalyticsProductRankResponse(
                row.get("product_name") == null ? "" : String.valueOf(row.get("product_name")),
                TaxAnalyticsWeekMath.decimal(row.get("quantity")),
                TaxAnalyticsWeekMath.decimal(row.get("amount"))
            ));
        }
        return out;
    }

    private static long asLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

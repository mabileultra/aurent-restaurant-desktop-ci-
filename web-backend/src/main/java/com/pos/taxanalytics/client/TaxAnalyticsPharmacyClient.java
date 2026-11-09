package com.pos.taxanalytics.client;

import com.pos.shared.log.LogUtil;
import com.pos.taxanalytics.client.dto.TaxAnalyticsDayMoneyDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalProductDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptDetailDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalReceiptRowDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalUri;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TaxAnalyticsPharmacyClient {

    private static final String ROOT = TaxAnalyticsVerticalUri.PHARMACY;

    private final RestClient pharmacyRestClient;

    public TaxAnalyticsVerticalSnapshotDto snapshot(
        LocalDate from,
        LocalDate to,
        LocalDate weekFrom,
        LocalDate weekTo,
        LocalDate prevWeekFrom,
        LocalDate prevWeekTo
    ) {
        try {
            return pharmacyRestClient.get()
                .uri(uri -> withWindow(uri.pathSegment(
                    "internal", ROOT, "tax-analytics", "snapshot"
                ), from, to, weekFrom, weekTo, prevWeekFrom, prevWeekTo))
                .retrieve()
                .body(TaxAnalyticsVerticalSnapshotDto.class);
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy tax snapshot failed", ex);
            return null;
        }
    }

    public List<TaxAnalyticsDayMoneyDto> daily(int companyId, LocalDate from, LocalDate to) {
        try {
            return pharmacyRestClient.get()
                .uri(uri -> uri.pathSegment(
                        "internal", ROOT, "tax-analytics", "companies", String.valueOf(companyId), "daily"
                    )
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy tax daily failed companyId=" + companyId, ex);
            return List.of();
        }
    }

    public Map<String, Object> receiptCounts(int companyId, LocalDate from, LocalDate to) {
        try {
            return pharmacyRestClient.get()
                .uri(uri -> uri.pathSegment(
                        "internal", ROOT, "tax-analytics", "companies", String.valueOf(companyId), "receipt-counts"
                    )
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy receipt counts failed companyId=" + companyId, ex);
            return Map.of();
        }
    }

    public long receiptCount(int companyId, LocalDate from, LocalDate to, String kind) {
        try {
            Long count = pharmacyRestClient.get()
                .uri(uri -> uri.pathSegment(
                        "internal", ROOT, "tax-analytics", "companies",
                        String.valueOf(companyId), "receipts", "count"
                    )
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .queryParam("kind", kind == null ? "ALL" : kind)
                    .build())
                .retrieve()
                .body(Long.class);
            return count == null ? 0L : count;
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy receipts count failed companyId=" + companyId, ex);
            return 0L;
        }
    }

    public List<TaxAnalyticsVerticalReceiptRowDto> receipts(
        int companyId,
        LocalDate from,
        LocalDate to,
        String kind,
        int limit,
        int offset
    ) {
        try {
            return pharmacyRestClient.get()
                .uri(uri -> uri.pathSegment(
                        "internal", ROOT, "tax-analytics", "companies", String.valueOf(companyId), "receipts"
                    )
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .queryParam("kind", kind == null ? "ALL" : kind)
                    .queryParam("limit", limit)
                    .queryParam("offset", offset)
                    .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy receipts failed companyId=" + companyId, ex);
            return List.of();
        }
    }

    public TaxAnalyticsVerticalReceiptDetailDto receiptDetail(int companyId, String saleId) {
        try {
            return pharmacyRestClient.get()
                .uri(uri -> TaxAnalyticsVerticalUri.receiptDetail(uri, ROOT, companyId, saleId))
                .retrieve()
                .body(TaxAnalyticsVerticalReceiptDetailDto.class);
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy receipt detail failed saleId=" + saleId, ex);
            return null;
        }
    }

    public List<TaxAnalyticsVerticalProductDto> topProducts(int companyId, LocalDate from, LocalDate to, int limit) {
        try {
            return pharmacyRestClient.get()
                .uri(uri -> uri.pathSegment(
                        "internal", ROOT, "tax-analytics", "companies", String.valueOf(companyId), "products"
                    )
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .queryParam("limit", limit)
                    .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsPharmacyClient.class, "Pharmacy top products failed companyId=" + companyId, ex);
            return List.of();
        }
    }

    private static URI withWindow(
        UriBuilder uri,
        LocalDate from,
        LocalDate to,
        LocalDate weekFrom,
        LocalDate weekTo,
        LocalDate prevWeekFrom,
        LocalDate prevWeekTo
    ) {
        return uri
            .queryParam("from", from)
            .queryParam("to", to)
            .queryParam("weekFrom", weekFrom)
            .queryParam("weekTo", weekTo)
            .queryParam("prevWeekFrom", prevWeekFrom)
            .queryParam("prevWeekTo", prevWeekTo)
            .build();
    }
}

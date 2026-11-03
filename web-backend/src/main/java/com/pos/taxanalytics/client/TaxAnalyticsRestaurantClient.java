package com.pos.taxanalytics.client;

import com.pos.shared.log.LogUtil;
import com.pos.taxanalytics.client.dto.TaxAnalyticsDayMoneyDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TaxAnalyticsRestaurantClient {

    private final RestClient restaurantRestClient;

    public TaxAnalyticsVerticalSnapshotDto snapshot(
        LocalDate from,
        LocalDate to,
        LocalDate weekFrom,
        LocalDate weekTo,
        LocalDate prevWeekFrom,
        LocalDate prevWeekTo
    ) {
        try {
            return restaurantRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/rst/tax-analytics/snapshot")
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .queryParam("weekFrom", weekFrom)
                    .queryParam("weekTo", weekTo)
                    .queryParam("prevWeekFrom", prevWeekFrom)
                    .queryParam("prevWeekTo", prevWeekTo)
                    .build())
                .retrieve()
                .body(TaxAnalyticsVerticalSnapshotDto.class);
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsRestaurantClient.class, "Restaurant tax snapshot failed", ex);
            return null;
        }
    }

    public List<TaxAnalyticsDayMoneyDto> daily(int companyId, LocalDate from, LocalDate to) {
        try {
            return restaurantRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/rst/tax-analytics/companies/{companyId}/daily")
                    .queryParam("from", from)
                    .queryParam("to", to)
                    .build(companyId))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        } catch (Exception ex) {
            LogUtil.warn(TaxAnalyticsRestaurantClient.class, "Restaurant tax daily failed companyId=" + companyId, ex);
            return List.of();
        }
    }
}

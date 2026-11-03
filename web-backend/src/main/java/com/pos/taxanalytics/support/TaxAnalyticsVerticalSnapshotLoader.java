package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.TaxAnalyticsPharmacyClient;
import com.pos.taxanalytics.client.TaxAnalyticsRestaurantClient;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class TaxAnalyticsVerticalSnapshotLoader {

    private final TaxAnalyticsRestaurantClient restaurantClient;
    private final TaxAnalyticsPharmacyClient pharmacyClient;

    public record Pair(
        TaxAnalyticsVerticalSnapshotDto restaurant,
        TaxAnalyticsVerticalSnapshotDto pharmacy
    ) {
    }

    public Pair load(
        LocalDate from,
        LocalDate to,
        LocalDate weekFrom,
        LocalDate weekTo,
        LocalDate prevWeekFrom,
        LocalDate prevWeekTo
    ) {
        return new Pair(
            restaurantClient.snapshot(from, to, weekFrom, weekTo, prevWeekFrom, prevWeekTo),
            pharmacyClient.snapshot(from, to, weekFrom, weekTo, prevWeekFrom, prevWeekTo)
        );
    }
}

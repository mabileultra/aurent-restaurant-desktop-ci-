package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.dto.TaxAnalyticsCompanyMoneyDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaxAnalyticsVerticalScopeTest {

    @Test
    void moneyKeepsOnlyCompaniesInScope() {
        TaxAnalyticsVerticalSnapshotDto restaurant = new TaxAnalyticsVerticalSnapshotDto(
            List.of(
                new TaxAnalyticsCompanyMoneyDto(1, BigDecimal.ZERO, new BigDecimal("100"), BigDecimal.ZERO, BigDecimal.ZERO),
                new TaxAnalyticsCompanyMoneyDto(2, BigDecimal.ZERO, new BigDecimal("50"), BigDecimal.ZERO, BigDecimal.ZERO)
            ),
            List.of(1),
            BigDecimal.ZERO,
            new BigDecimal("150")
        );
        TaxAnalyticsVerticalScope.Money money = TaxAnalyticsVerticalScope.money(
            restaurant, null, Set.of(1)
        );
        assertEquals(new BigDecimal("100"), money.nonFiscal());
        assertEquals(BigDecimal.ZERO, money.fiscal());
    }

    @Test
    void moneyByGeoGroupsRestaurantTurnover() {
        TaxAnalyticsVerticalSnapshotDto restaurant = new TaxAnalyticsVerticalSnapshotDto(
            List.of(
                new TaxAnalyticsCompanyMoneyDto(10, BigDecimal.ZERO, new BigDecimal("40"), BigDecimal.ZERO, BigDecimal.ZERO),
                new TaxAnalyticsCompanyMoneyDto(11, BigDecimal.ZERO, new BigDecimal("60"), BigDecimal.ZERO, BigDecimal.ZERO)
            ),
            List.of(),
            BigDecimal.ZERO,
            new BigDecimal("100")
        );
        Map<String, TaxAnalyticsVerticalScope.Money> byRegion = TaxAnalyticsVerticalScope.moneyByGeo(
            restaurant,
            null,
            Map.of(10, "18", 11, "18"),
            Set.of(10, 11)
        );
        assertEquals(new BigDecimal("100"), byRegion.get("18").total());
    }
}

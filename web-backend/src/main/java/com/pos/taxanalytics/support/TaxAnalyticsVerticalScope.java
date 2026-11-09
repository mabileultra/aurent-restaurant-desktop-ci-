package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.dto.TaxAnalyticsCompanyMoneyDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Filters restaurant/pharmacy snapshot money down to companies in the current geo/type scope. */
public final class TaxAnalyticsVerticalScope {

    public record Money(BigDecimal fiscal, BigDecimal nonFiscal) {
        public BigDecimal total() {
            return fiscal.add(nonFiscal);
        }
    }

    private TaxAnalyticsVerticalScope() {
    }

    public static Money money(TaxAnalyticsVerticalSnapshotDto snapshot, Set<Integer> companyIds) {
        if (snapshot == null || snapshot.companies() == null || companyIds == null || companyIds.isEmpty()) {
            return new Money(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        BigDecimal fiscal = BigDecimal.ZERO;
        BigDecimal nonFiscal = BigDecimal.ZERO;
        for (TaxAnalyticsCompanyMoneyDto row : snapshot.companies()) {
            if (row == null || !companyIds.contains(row.companyId())) {
                continue;
            }
            fiscal = fiscal.add(nz(row.fiscalTurnover()));
            nonFiscal = nonFiscal.add(nz(row.nonFiscalTurnover()));
        }
        return new Money(fiscal, nonFiscal);
    }

    public static Money money(
        TaxAnalyticsVerticalSnapshotDto restaurant,
        TaxAnalyticsVerticalSnapshotDto pharmacy,
        Set<Integer> companyIds
    ) {
        Money left = money(restaurant, companyIds);
        Money right = money(pharmacy, companyIds);
        return new Money(left.fiscal().add(right.fiscal()), left.nonFiscal().add(right.nonFiscal()));
    }

    public static Set<Integer> connectedInScope(
        TaxAnalyticsVerticalSnapshotDto restaurant,
        TaxAnalyticsVerticalSnapshotDto pharmacy,
        Set<Integer> companyIds
    ) {
        Set<Integer> connected = new HashSet<>(TaxAnalyticsVerticalMerge.connectedIds(restaurant, pharmacy));
        connected.retainAll(companyIds);
        return connected;
    }

    public static Map<String, Money> moneyByGeo(
        TaxAnalyticsVerticalSnapshotDto restaurant,
        TaxAnalyticsVerticalSnapshotDto pharmacy,
        Map<Integer, String> companyGeo,
        Set<Integer> companyIds
    ) {
        Map<String, Money> map = new HashMap<>();
        addByGeo(map, restaurant, companyGeo, companyIds);
        addByGeo(map, pharmacy, companyGeo, companyIds);
        return map;
    }

    public static Map<String, BigDecimal> turnoverByGeo(
        TaxAnalyticsVerticalSnapshotDto restaurant,
        TaxAnalyticsVerticalSnapshotDto pharmacy,
        Map<Integer, String> companyGeo,
        Set<Integer> companyIds
    ) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (Map.Entry<String, Money> entry : moneyByGeo(restaurant, pharmacy, companyGeo, companyIds).entrySet()) {
            map.put(entry.getKey(), entry.getValue().total());
        }
        return map;
    }

    private static void addByGeo(
        Map<String, Money> map,
        TaxAnalyticsVerticalSnapshotDto snapshot,
        Map<Integer, String> companyGeo,
        Set<Integer> companyIds
    ) {
        if (snapshot == null || snapshot.companies() == null) {
            return;
        }
        for (TaxAnalyticsCompanyMoneyDto row : snapshot.companies()) {
            if (row == null || !companyIds.contains(row.companyId())) {
                continue;
            }
            String geo = companyGeo.get(row.companyId());
            if (geo == null || geo.isBlank()) {
                continue;
            }
            Money add = new Money(nz(row.fiscalTurnover()), nz(row.nonFiscalTurnover()));
            map.merge(geo, add, (left, right) -> new Money(
                left.fiscal().add(right.fiscal()),
                left.nonFiscal().add(right.nonFiscal())
            ));
        }
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

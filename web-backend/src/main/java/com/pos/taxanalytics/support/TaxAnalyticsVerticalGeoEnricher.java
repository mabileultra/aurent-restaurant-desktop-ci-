package com.pos.taxanalytics.support;

import com.pos.taxanalytics.repository.TaxAnalyticsCompanyScopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Adds restaurant/pharmacy snapshot money onto grocery geo aggregates. */
@Component
@RequiredArgsConstructor
public class TaxAnalyticsVerticalGeoEnricher {

    private final TaxAnalyticsCompanyScopeRepository companyScopeRepository;
    private final TaxAnalyticsVerticalSnapshotLoader verticalLoader;

    public void addToRegionTurnover(
        Map<String, BigDecimal> turnover,
        TaxAnalyticsPeriod range,
        String regionCode,
        String districtCode,
        String businessType,
        String search
    ) {
        ScopedVertical scoped = load(range, regionCode, districtCode, businessType, search);
        Map<Integer, String> geo = companyScopeRepository.regionByCompanyId(scoped.scope());
        Map<String, BigDecimal> extra = TaxAnalyticsVerticalScope.turnoverByGeo(
            scoped.pair().restaurant(), scoped.pair().pharmacy(), geo, scoped.scope()
        );
        extra.forEach((code, amount) -> turnover.merge(code, amount, BigDecimal::add));
    }

    public void addToGeoRows(
        List<Map<String, Object>> rows,
        TaxAnalyticsPeriod range,
        String regionCode,
        String businessType,
        boolean districtLevel
    ) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        ScopedVertical scoped = load(range, regionCode, null, businessType, null);
        Map<Integer, String> geo = districtLevel
            ? companyScopeRepository.districtByCompanyId(scoped.scope())
            : companyScopeRepository.regionByCompanyId(scoped.scope());
        Map<String, TaxAnalyticsVerticalScope.Money> extra = TaxAnalyticsVerticalScope.moneyByGeo(
            scoped.pair().restaurant(), scoped.pair().pharmacy(), geo, scoped.scope()
        );
        for (Map<String, Object> row : rows) {
            Object code = row.get("code");
            if (code == null) {
                continue;
            }
            TaxAnalyticsVerticalScope.Money money = extra.get(String.valueOf(code));
            if (money == null) {
                continue;
            }
            row.put("fiscal_turnover", decimal(row.get("fiscal_turnover")).add(money.fiscal()));
            row.put("non_fiscal_turnover", decimal(row.get("non_fiscal_turnover")).add(money.nonFiscal()));
        }
    }

    private ScopedVertical load(
        TaxAnalyticsPeriod range,
        String regionCode,
        String districtCode,
        String businessType,
        String search
    ) {
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        TaxAnalyticsVerticalSnapshotLoader.Pair pair = verticalLoader.load(
            range.from(), range.to(), week.weekFrom(), week.weekTo(), week.prevWeekFrom(), week.prevWeekTo()
        );
        Set<Integer> scope = companyScopeRepository.companyIds(regionCode, districtCode, businessType, search);
        return new ScopedVertical(pair, scope);
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
    }

    private record ScopedVertical(TaxAnalyticsVerticalSnapshotLoader.Pair pair, Set<Integer> scope) {
    }
}

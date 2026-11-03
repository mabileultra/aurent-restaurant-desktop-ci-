package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.dto.TaxAnalyticsCompanyMoneyDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsDayMoneyDto;
import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyRowResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Merges grocery rows with restaurant/pharmacy money + connected flags. */
public final class TaxAnalyticsVerticalMerge {

    private TaxAnalyticsVerticalMerge() {
    }

    public static Map<Integer, TaxAnalyticsCompanyMoneyDto> index(TaxAnalyticsVerticalSnapshotDto snapshot) {
        Map<Integer, TaxAnalyticsCompanyMoneyDto> map = new HashMap<>();
        if (snapshot == null || snapshot.companies() == null) {
            return map;
        }
        for (TaxAnalyticsCompanyMoneyDto row : snapshot.companies()) {
            if (row == null) {
                continue;
            }
            map.merge(row.companyId(), row, TaxAnalyticsVerticalMerge::sumMoney);
        }
        return map;
    }

    public static Set<Integer> connectedIds(TaxAnalyticsVerticalSnapshotDto... snapshots) {
        Set<Integer> ids = new HashSet<>();
        for (TaxAnalyticsVerticalSnapshotDto snapshot : snapshots) {
            if (snapshot == null || snapshot.connectedCompanyIds() == null) {
                continue;
            }
            ids.addAll(snapshot.connectedCompanyIds());
        }
        return ids;
    }

    public static BigDecimal periodTotal(TaxAnalyticsVerticalSnapshotDto snapshot) {
        if (snapshot == null) {
            return BigDecimal.ZERO;
        }
        return nz(snapshot.periodFiscalTotal()).add(nz(snapshot.periodNonFiscalTotal()));
    }

    public static TaxAnalyticsCompanyRowResponse mergeRow(
        TaxAnalyticsCompanyRowResponse base,
        TaxAnalyticsCompanyMoneyDto extra,
        boolean forceConnected
    ) {
        if (extra == null && !forceConnected) {
            return base;
        }
        BigDecimal fiscal = base.fiscalTurnover().add(extra == null ? BigDecimal.ZERO : nz(extra.fiscalTurnover()));
        BigDecimal nonFiscal = base.nonFiscalTurnover().add(extra == null ? BigDecimal.ZERO : nz(extra.nonFiscalTurnover()));
        BigDecimal week = base.weekTurnover().add(extra == null ? BigDecimal.ZERO : nz(extra.weekTurnover()));
        BigDecimal prevWeek = base.prevWeekTurnover().add(extra == null ? BigDecimal.ZERO : nz(extra.prevWeekTurnover()));
        return new TaxAnalyticsCompanyRowResponse(
            base.companyId(),
            base.name(),
            base.tin(),
            base.regionCode(),
            base.regionNameRu(),
            base.regionNameUz(),
            base.districtCode(),
            base.districtNameRu(),
            base.districtNameUz(),
            base.connected() || forceConnected,
            base.storeCount(),
            base.storeNames(),
            fiscal,
            nonFiscal,
            fiscal.add(nonFiscal),
            week,
            prevWeek,
            TaxAnalyticsWeekMath.deltaAmount(week, prevWeek),
            TaxAnalyticsWeekMath.deltaPct(week, prevWeek)
        );
    }

    public static void mergeDays(
        Map<LocalDate, TaxAnalyticsCompanyWeeks.DayTurnover> byDate,
        List<TaxAnalyticsDayMoneyDto> days
    ) {
        if (days == null) {
            return;
        }
        for (TaxAnalyticsDayMoneyDto day : days) {
            if (day == null || day.saleDate() == null) {
                continue;
            }
            LocalDate date = LocalDate.parse(day.saleDate().substring(0, 10));
            TaxAnalyticsCompanyWeeks.DayTurnover existing = byDate.get(date);
            BigDecimal fiscal = nz(day.fiscalTurnover());
            BigDecimal nonFiscal = nz(day.nonFiscalTurnover());
            if (existing == null) {
                byDate.put(date, new TaxAnalyticsCompanyWeeks.DayTurnover(fiscal, nonFiscal));
            } else {
                byDate.put(date, new TaxAnalyticsCompanyWeeks.DayTurnover(
                    existing.fiscal().add(fiscal),
                    existing.nonFiscal().add(nonFiscal)
                ));
            }
        }
    }

    private static TaxAnalyticsCompanyMoneyDto sumMoney(
        TaxAnalyticsCompanyMoneyDto left,
        TaxAnalyticsCompanyMoneyDto right
    ) {
        return new TaxAnalyticsCompanyMoneyDto(
            left.companyId(),
            nz(left.fiscalTurnover()).add(nz(right.fiscalTurnover())),
            nz(left.nonFiscalTurnover()).add(nz(right.nonFiscalTurnover())),
            nz(left.weekTurnover()).add(nz(right.weekTurnover())),
            nz(left.prevWeekTurnover()).add(nz(right.prevWeekTurnover()))
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

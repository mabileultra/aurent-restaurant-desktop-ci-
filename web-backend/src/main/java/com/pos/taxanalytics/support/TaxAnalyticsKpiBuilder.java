package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.dto.TaxAnalyticsVerticalSnapshotDto;
import com.pos.taxanalytics.dto.TaxAnalyticsKpiResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsOverviewQueryRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TaxAnalyticsKpiBuilder {

    private final TaxAnalyticsQueryRepository repository;
    private final TaxAnalyticsOverviewQueryRepository overviewRepository;
    private final TaxAnalyticsVerticalSnapshotLoader verticalLoader;

    public TaxAnalyticsKpiResponse build(TaxAnalyticsPeriod range) {
        return build(range, null, null, null);
    }

    public TaxAnalyticsKpiResponse build(
        TaxAnalyticsPeriod range,
        String regionCode,
        String connectionStatus,
        String search
    ) {
        if (isBlank(regionCode) && isBlank(connectionStatus) && isBlank(search)) {
            return unfiltered(range);
        }
        long total = overviewRepository.countCompanies(regionCode, connectionStatus, search);
        long connected = overviewRepository.countConnected(regionCode, connectionStatus, search);
        long notConnected = Math.max(0, total - connected);
        BigDecimal fiscal = overviewRepository.sumTurnover(range, true, false, regionCode, connectionStatus, search);
        BigDecimal nonFiscal = overviewRepository.sumTurnover(range, false, true, regionCode, connectionStatus, search);
        TaxAnalyticsPeriod prev = new TaxAnalyticsPeriod(
            range.prevFrom(), range.prevTo(), range.prevFrom(), range.prevTo(), range.key()
        );
        BigDecimal prevTurnover = overviewRepository.sumTurnover(prev, false, false, regionCode, connectionStatus, search);
        BigDecimal totalTurnover = fiscal.add(nonFiscal);
        return new TaxAnalyticsKpiResponse(
            total,
            null,
            connected,
            TaxAnalyticsMath.share(connected, total),
            null,
            notConnected,
            TaxAnalyticsMath.share(notConnected, total),
            null,
            totalTurnover,
            fiscal,
            nonFiscal,
            TaxAnalyticsMath.deltaPct(totalTurnover, prevTurnover),
            0,
            null,
            0,
            null
        );
    }

    private TaxAnalyticsKpiResponse unfiltered(TaxAnalyticsPeriod range) {
        TaxAnalyticsPeriod prev = new TaxAnalyticsPeriod(
            range.prevFrom(), range.prevTo(), range.prevFrom(), range.prevTo(), range.key()
        );
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        TaxAnalyticsVerticalSnapshotLoader.Pair vertical = verticalLoader.load(
            range.from(), range.to(), week.weekFrom(), week.weekTo(), week.prevWeekFrom(), week.prevWeekTo()
        );
        TaxAnalyticsVerticalSnapshotLoader.Pair verticalPrev = verticalLoader.load(
            prev.from(), prev.to(), week.weekFrom(), week.weekTo(), week.prevWeekFrom(), week.prevWeekTo()
        );

        long total = repository.countCompanies();
        Set<Integer> connectedIds = new HashSet<>(repository.listConnectedCompanyIds());
        connectedIds.addAll(TaxAnalyticsVerticalMerge.connectedIds(vertical.restaurant(), vertical.pharmacy()));
        long connected = connectedIds.size();
        long notConnected = Math.max(0, total - connected);

        BigDecimal fiscal = repository.sumTurnover(range, true, false)
            .add(fiscalOf(vertical.restaurant()))
            .add(fiscalOf(vertical.pharmacy()));
        BigDecimal nonFiscal = repository.sumTurnover(range, false, true)
            .add(nonFiscalOf(vertical.restaurant()))
            .add(nonFiscalOf(vertical.pharmacy()));
        BigDecimal totalTurnover = fiscal.add(nonFiscal);
        BigDecimal prevTurnover = repository.sumTurnover(prev, false, false)
            .add(TaxAnalyticsVerticalMerge.periodTotal(verticalPrev.restaurant()))
            .add(TaxAnalyticsVerticalMerge.periodTotal(verticalPrev.pharmacy()));

        long newConn = repository.countNewFiscalConnections(range);
        long prevNewConn = repository.countNewFiscalConnections(prev);
        long errors = repository.countFiscalErrors(range);
        long prevErrors = repository.countFiscalErrors(prev);

        return new TaxAnalyticsKpiResponse(
            total,
            null,
            connected,
            TaxAnalyticsMath.share(connected, total),
            null,
            notConnected,
            TaxAnalyticsMath.share(notConnected, total),
            null,
            totalTurnover,
            fiscal,
            nonFiscal,
            TaxAnalyticsMath.deltaPct(totalTurnover, prevTurnover),
            newConn,
            TaxAnalyticsMath.deltaPct(BigDecimal.valueOf(newConn), BigDecimal.valueOf(prevNewConn)),
            errors,
            TaxAnalyticsMath.deltaPct(BigDecimal.valueOf(errors), BigDecimal.valueOf(prevErrors))
        );
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static BigDecimal fiscalOf(TaxAnalyticsVerticalSnapshotDto snapshot) {
        if (snapshot == null || snapshot.periodFiscalTotal() == null) {
            return BigDecimal.ZERO;
        }
        return snapshot.periodFiscalTotal();
    }

    private static BigDecimal nonFiscalOf(TaxAnalyticsVerticalSnapshotDto snapshot) {
        if (snapshot == null || snapshot.periodNonFiscalTotal() == null) {
            return BigDecimal.ZERO;
        }
        return snapshot.periodNonFiscalTotal();
    }
}

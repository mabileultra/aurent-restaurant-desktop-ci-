package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.dto.TaxAnalyticsKpiResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsOverviewResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsRegionCardResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultsResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsMissingRegionRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsOverviewQueryRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsQueryRepository;
import com.pos.taxanalytics.service.TaxAnalyticsService;
import com.pos.taxanalytics.support.TaxAnalyticsKpiBuilder;
import com.pos.taxanalytics.support.TaxAnalyticsMath;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsRegionFilter;
import com.pos.taxanalytics.support.TaxAnalyticsResultsBuilder;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalGeoEnricher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsServiceImpl implements TaxAnalyticsService {

    private final TaxAnalyticsQueryRepository repository;
    private final TaxAnalyticsOverviewQueryRepository overviewRepository;
    private final TaxAnalyticsKpiBuilder kpiBuilder;
    private final TaxAnalyticsMissingRegionRepository missingRegionRepository;
    private final TaxAnalyticsVerticalGeoEnricher verticalGeoEnricher;
    private final TaxAnalyticsResultsBuilder resultsBuilder;

    @Override
    public TaxAnalyticsOverviewResponse overview(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsPeriod prev = new TaxAnalyticsPeriod(
            range.prevFrom(), range.prevTo(), range.prevFrom(), range.prevTo(), range.key()
        );
        TaxAnalyticsKpiResponse kpi = kpiBuilder.build(
            range, regionCode, districtCode, businessType, connectionStatus, search
        );

        Map<String, Long> counts = repository.toLongMap(
            overviewRepository.regionEnterpriseCounts(
                regionCode, districtCode, businessType, connectionStatus, search
            ),
            "region_code",
            "cnt"
        );
        Map<String, BigDecimal> curTurnover = repository.toDecimalMap(
            overviewRepository.regionTurnover(
                range, regionCode, districtCode, businessType, connectionStatus, search
            ),
            "region_code",
            "turnover"
        );
        Map<String, BigDecimal> prevTurnoverMap = repository.toDecimalMap(
            overviewRepository.regionTurnover(
                prev, regionCode, districtCode, businessType, connectionStatus, search
            ),
            "region_code",
            "turnover"
        );
        verticalGeoEnricher.addToRegionTurnover(
            curTurnover, range, regionCode, districtCode, businessType, search
        );
        verticalGeoEnricher.addToRegionTurnover(
            prevTurnoverMap, prev, regionCode, districtCode, businessType, search
        );

        List<TaxAnalyticsRegionCardResponse> regions = new ArrayList<>();
        boolean onlyMissing = TaxAnalyticsRegionFilter.isMissing(regionCode);
        if (!onlyMissing) {
            for (Map<String, Object> row : repository.listRegions()) {
                String code = String.valueOf(row.get("code"));
                if (regionCode != null && !regionCode.isBlank() && !regionCode.equals(code)) {
                    continue;
                }
                regions.add(new TaxAnalyticsRegionCardResponse(
                    code,
                    String.valueOf(row.get("name_ru")),
                    String.valueOf(row.get("name_uz")),
                    counts.getOrDefault(code, 0L),
                    TaxAnalyticsMath.deltaPct(
                        curTurnover.getOrDefault(code, BigDecimal.ZERO),
                        prevTurnoverMap.getOrDefault(code, BigDecimal.ZERO)
                    )
                ));
            }
        }
        if (regionCode == null || regionCode.isBlank() || onlyMissing) {
            appendMissingRegionCard(regions, range, connectionStatus);
        }

        return new TaxAnalyticsOverviewResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            kpi,
            regions
        );
    }

    @Override
    public TaxAnalyticsResultsResponse results(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search,
        String level,
        int page,
        int size
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        return resultsBuilder.build(
            range, regionCode, districtCode, businessType, connectionStatus, search, level, page, size
        );
    }

    private void appendMissingRegionCard(
        List<TaxAnalyticsRegionCardResponse> regions,
        TaxAnalyticsPeriod range,
        String connectionStatus
    ) {
        Map<String, Object> row = missingRegionRepository.totals(range, connectionStatus);
        if (!TaxAnalyticsMissingRegionRepository.hasSignal(row)) {
            return;
        }
        BigDecimal current = decimal(row.get("fiscal_turnover")).add(decimal(row.get("non_fiscal_turnover")));
        regions.add(new TaxAnalyticsRegionCardResponse(
            TaxAnalyticsRegionFilter.MISSING_CODE,
            TaxAnalyticsRegionFilter.MISSING_NAME_RU,
            TaxAnalyticsRegionFilter.MISSING_NAME_UZ,
            ((Number) row.get("enterprises")).longValue(),
            TaxAnalyticsMath.deltaPct(current, decimal(row.get("prev_turnover")))
        ));
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
    }
}

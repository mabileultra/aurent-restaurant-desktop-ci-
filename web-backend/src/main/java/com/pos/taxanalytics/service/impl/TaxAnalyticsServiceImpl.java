package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.dto.TaxAnalyticsKpiResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsOverviewResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsRegionCardResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultRowResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultsResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsGeoAggregateRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsGeoWindowsRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsMissingRegionRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsOverviewQueryRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsQueryRepository;
import com.pos.taxanalytics.service.TaxAnalyticsService;
import com.pos.taxanalytics.support.TaxAnalyticsKpiBuilder;
import com.pos.taxanalytics.support.TaxAnalyticsMath;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsRegionFilter;
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
    private final TaxAnalyticsGeoAggregateRepository geoAggregateRepository;
    private final TaxAnalyticsGeoWindowsRepository geoWindowsRepository;
    private final TaxAnalyticsOverviewQueryRepository overviewRepository;
    private final TaxAnalyticsKpiBuilder kpiBuilder;
    private final TaxAnalyticsMissingRegionRepository missingRegionRepository;
    private final TaxAnalyticsVerticalGeoEnricher verticalGeoEnricher;

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
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String resolvedLevel = resolveLevel(level, regionCode, districtCode, search);

        if ("ENTERPRISE".equals(resolvedLevel)) {
            long total = repository.countEnterprises(
                range, regionCode, districtCode, businessType, connectionStatus, search
            );
            List<Map<String, Object>> raw = repository.aggregateEnterprises(
                range, regionCode, districtCode, businessType, connectionStatus, search, safeSize, safePage * safeSize
            );
            List<TaxAnalyticsResultRowResponse> rows = new ArrayList<>();
            for (Map<String, Object> row : raw) {
                rows.add(toEnterpriseRow(row));
            }
            return new TaxAnalyticsResultsResponse(
                range.key(), range.from().toString(), range.to().toString(),
                resolvedLevel, regionCode, total, safePage, safeSize, rows
            );
        }

        boolean districtLevel = "DISTRICT".equals(resolvedLevel);
        List<Map<String, Object>> raw = districtLevel
            ? geoAggregateRepository.aggregateByDistrict(range, regionCode, connectionStatus, businessType)
            : geoAggregateRepository.aggregateByRegion(range, connectionStatus, businessType);
        verticalGeoEnricher.addToGeoRows(raw, range, regionCode, businessType, districtLevel);
        Map<String, Map<String, Object>> windows = districtLevel
            ? geoWindowsRepository.byDistrict(regionCode, connectionStatus, businessType)
            : geoWindowsRepository.byRegion(connectionStatus, businessType);

        List<TaxAnalyticsResultRowResponse> all = new ArrayList<>(
            raw.stream().map(r -> toGeoRow(r, resolvedLevel, windows)).toList()
        );
        if ("REGION".equals(resolvedLevel)) {
            appendMissingRegionRow(all, range, connectionStatus, windows);
        }
        long total = all.size();
        int fromIdx = Math.min(safePage * safeSize, all.size());
        int toIdx = Math.min(fromIdx + safeSize, all.size());
        return new TaxAnalyticsResultsResponse(
            range.key(), range.from().toString(), range.to().toString(),
            resolvedLevel, regionCode, total, safePage, safeSize, all.subList(fromIdx, toIdx)
        );
    }

    private static String resolveLevel(String level, String regionCode, String districtCode, String search) {
        if (level != null && !level.isBlank()) {
            return level.trim().toUpperCase();
        }
        if (search != null && !search.isBlank()) {
            return "ENTERPRISE";
        }
        if (districtCode != null && !districtCode.isBlank()) {
            return "ENTERPRISE";
        }
        if (TaxAnalyticsRegionFilter.isMissing(regionCode)) {
            return "ENTERPRISE";
        }
        if (regionCode != null && !regionCode.isBlank()) {
            return "DISTRICT";
        }
        return "REGION";
    }

    private TaxAnalyticsResultRowResponse toGeoRow(
        Map<String, Object> row,
        String level,
        Map<String, Map<String, Object>> windows
    ) {
        long enterprises = ((Number) row.get("enterprises")).longValue();
        long connected = ((Number) row.get("connected")).longValue();
        long notConnected = Math.max(0, enterprises - connected);
        BigDecimal fiscal = decimal(row.get("fiscal_turnover"));
        BigDecimal nonFiscal = decimal(row.get("non_fiscal_turnover"));
        BigDecimal total = fiscal.add(nonFiscal);
        BigDecimal prev = decimal(row.get("prev_turnover"));
        Map<String, Object> window = windows == null ? null : windows.get(String.valueOf(row.get("code")));
        BigDecimal week = decimal(window == null ? null : window.get("week_turnover"));
        BigDecimal prevWeek = decimal(window == null ? null : window.get("prev_week_turnover"));
        BigDecimal today = decimal(window == null ? null : window.get("today_turnover"));
        BigDecimal year = decimal(window == null ? null : window.get("year_turnover"));
        return new TaxAnalyticsResultRowResponse(
            String.valueOf(row.get("code")),
            row.get("name_ru") == null ? String.valueOf(row.get("code")) : String.valueOf(row.get("name_ru")),
            row.get("name_uz") == null ? String.valueOf(row.get("code")) : String.valueOf(row.get("name_uz")),
            enterprises,
            connected,
            TaxAnalyticsMath.share(connected, enterprises),
            notConnected,
            TaxAnalyticsMath.share(notConnected, enterprises),
            fiscal,
            nonFiscal,
            total,
            TaxAnalyticsMath.shareAmount(fiscal, total),
            TaxAnalyticsMath.deltaPct(total, prev),
            level,
            week,
            TaxAnalyticsMath.deltaPct(week, prevWeek),
            today,
            year
        );
    }

    private TaxAnalyticsResultRowResponse toEnterpriseRow(Map<String, Object> row) {
        boolean connected = ((Number) row.get("connected")).intValue() == 1;
        BigDecimal fiscal = decimal(row.get("fiscal_turnover"));
        BigDecimal nonFiscal = decimal(row.get("non_fiscal_turnover"));
        BigDecimal total = fiscal.add(nonFiscal);
        BigDecimal prev = decimal(row.get("prev_turnover"));
        String name = String.valueOf(row.get("name_ru"));
        Object tin = row.get("tin");
        if (tin != null && !String.valueOf(tin).isBlank()) {
            name = name + " · " + tin;
        }
        return new TaxAnalyticsResultRowResponse(
            String.valueOf(row.get("code")),
            name,
            name,
            1,
            connected ? 1 : 0,
            connected ? BigDecimal.valueOf(100) : BigDecimal.ZERO,
            connected ? 0 : 1,
            connected ? BigDecimal.ZERO : BigDecimal.valueOf(100),
            fiscal,
            nonFiscal,
            total,
            TaxAnalyticsMath.shareAmount(fiscal, total),
            TaxAnalyticsMath.deltaPct(total, prev),
            "ENTERPRISE",
            BigDecimal.ZERO,
            null,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
    }

    private static BigDecimal decimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        return new BigDecimal(v.toString());
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

    private void appendMissingRegionRow(
        List<TaxAnalyticsResultRowResponse> rows,
        TaxAnalyticsPeriod range,
        String connectionStatus,
        Map<String, Map<String, Object>> windows
    ) {
        Map<String, Object> row = missingRegionRepository.totals(range, connectionStatus);
        if (!TaxAnalyticsMissingRegionRepository.hasSignal(row)) {
            return;
        }
        row.put("code", TaxAnalyticsRegionFilter.MISSING_CODE);
        row.put("name_ru", TaxAnalyticsRegionFilter.MISSING_NAME_RU);
        row.put("name_uz", TaxAnalyticsRegionFilter.MISSING_NAME_UZ);
        rows.add(toGeoRow(row, "REGION", windows));
    }
}

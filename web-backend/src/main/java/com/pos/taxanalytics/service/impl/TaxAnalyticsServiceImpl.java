package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.dto.TaxAnalyticsKpiResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsOverviewResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsRegionCardResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultRowResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultsResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsQueryRepository;
import com.pos.taxanalytics.service.TaxAnalyticsService;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsServiceImpl implements TaxAnalyticsService {

    private final TaxAnalyticsQueryRepository repository;

    @Override
    public TaxAnalyticsOverviewResponse overview(String period, LocalDate from, LocalDate to) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsPeriod prev = new TaxAnalyticsPeriod(
            range.prevFrom(), range.prevTo(), range.prevFrom(), range.prevTo(), range.key()
        );

        long total = repository.countCompanies();
        long connected = repository.countConnectedCompanies();
        long notConnected = Math.max(0, total - connected);
        BigDecimal totalTurnover = repository.sumTurnover(range, false, false);
        BigDecimal prevTurnover = repository.sumTurnover(prev, false, false);
        long newConn = repository.countNewFiscalConnections(range);
        long prevNewConn = repository.countNewFiscalConnections(prev);
        long errors = repository.countFiscalErrors(range);
        long prevErrors = repository.countFiscalErrors(prev);

        TaxAnalyticsKpiResponse kpi = new TaxAnalyticsKpiResponse(
            total,
            null,
            connected,
            share(connected, total),
            null,
            notConnected,
            share(notConnected, total),
            null,
            totalTurnover,
            deltaPct(totalTurnover, prevTurnover),
            newConn,
            deltaPct(BigDecimal.valueOf(newConn), BigDecimal.valueOf(prevNewConn)),
            errors,
            deltaPct(BigDecimal.valueOf(errors), BigDecimal.valueOf(prevErrors))
        );

        Map<String, Long> counts = repository.toLongMap(repository.regionEnterpriseCounts(), "region_code", "cnt");
        Map<String, BigDecimal> curTurnover = repository.toDecimalMap(repository.regionTurnover(range), "region_code", "turnover");
        Map<String, BigDecimal> prevTurnoverMap = repository.toDecimalMap(repository.regionTurnover(prev), "region_code", "turnover");

        List<TaxAnalyticsRegionCardResponse> regions = new ArrayList<>();
        for (Map<String, Object> row : repository.listRegions()) {
            String code = String.valueOf(row.get("code"));
            regions.add(new TaxAnalyticsRegionCardResponse(
                code,
                String.valueOf(row.get("name_ru")),
                String.valueOf(row.get("name_uz")),
                counts.getOrDefault(code, 0L),
                deltaPct(curTurnover.getOrDefault(code, BigDecimal.ZERO), prevTurnoverMap.getOrDefault(code, BigDecimal.ZERO))
            ));
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
            long total = repository.countEnterprises(range, regionCode, districtCode, connectionStatus, search);
            List<Map<String, Object>> raw = repository.aggregateEnterprises(
                range, regionCode, districtCode, connectionStatus, search, safeSize, safePage * safeSize
            );
            List<TaxAnalyticsResultRowResponse> rows = new ArrayList<>();
            int i = safePage * safeSize;
            for (Map<String, Object> row : raw) {
                i++;
                rows.add(toEnterpriseRow(row));
            }
            return new TaxAnalyticsResultsResponse(
                range.key(), range.from().toString(), range.to().toString(),
                resolvedLevel, regionCode, total, safePage, safeSize, rows
            );
        }

        List<Map<String, Object>> raw = "DISTRICT".equals(resolvedLevel)
            ? repository.aggregateByDistrict(range, regionCode)
            : repository.aggregateByRegion(range);

        List<TaxAnalyticsResultRowResponse> all = raw.stream().map(r -> toGeoRow(r, resolvedLevel)).toList();
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
        if (regionCode != null && !regionCode.isBlank()) {
            return "DISTRICT";
        }
        return "REGION";
    }

    private TaxAnalyticsResultRowResponse toGeoRow(Map<String, Object> row, String level) {
        long enterprises = ((Number) row.get("enterprises")).longValue();
        long connected = ((Number) row.get("connected")).longValue();
        long notConnected = Math.max(0, enterprises - connected);
        BigDecimal fiscal = decimal(row.get("fiscal_turnover"));
        BigDecimal nonFiscal = decimal(row.get("non_fiscal_turnover"));
        BigDecimal total = fiscal.add(nonFiscal);
        BigDecimal prev = decimal(row.get("prev_turnover"));
        return new TaxAnalyticsResultRowResponse(
            String.valueOf(row.get("code")),
            row.get("name_ru") == null ? String.valueOf(row.get("code")) : String.valueOf(row.get("name_ru")),
            row.get("name_uz") == null ? String.valueOf(row.get("code")) : String.valueOf(row.get("name_uz")),
            enterprises,
            connected,
            share(connected, enterprises),
            notConnected,
            share(notConnected, enterprises),
            fiscal,
            nonFiscal,
            total,
            shareAmount(fiscal, total),
            deltaPct(total, prev),
            level
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
            shareAmount(fiscal, total),
            deltaPct(total, prev),
            "ENTERPRISE"
        );
    }

    private static BigDecimal decimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        return new BigDecimal(v.toString());
    }

    static BigDecimal share(long part, long total) {
        if (total <= 0) return null;
        return BigDecimal.valueOf(part * 100.0 / total).setScale(1, RoundingMode.HALF_UP);
    }

    static BigDecimal shareAmount(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) return null;
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP);
    }

    static BigDecimal deltaPct(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous, 1, RoundingMode.HALF_UP);
    }
}

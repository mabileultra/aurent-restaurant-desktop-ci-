package com.pos.restaurant.analytics.service.impl;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.analytics.dto.SalesReportResponse;
import com.pos.restaurant.analytics.service.RestaurantAnalyticsService;
import com.pos.restaurant.analytics.support.ActivityEventAssembler;
import com.pos.restaurant.analytics.support.AnalyticsOrderQuerySupport;
import com.pos.restaurant.analytics.support.AnalyticsPaymentQuerySupport;
import com.pos.restaurant.analytics.support.AnalyticsPaymentTotalsSupport;
import com.pos.restaurant.analytics.support.DashboardParallelComposer;
import com.pos.restaurant.analytics.support.DashboardPeriodKeyResolver;
import com.pos.restaurant.analytics.support.DashboardSalesRowMapper;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.report.support.StorePeriodSupport;
import com.pos.shared.api.FilterText;
import com.pos.shared.api.InstantRange;
import com.pos.shared.api.PageLimits;
import com.pos.shared.api.PageResponse;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantAnalyticsServiceImpl implements RestaurantAnalyticsService {

    private final FloorTenantSupport tenantSupport;
    private final DashboardPeriodKeyResolver periodKeyResolver;
    private final DashboardParallelComposer dashboardComposer;
    private final AnalyticsPaymentTotalsSupport paymentTotals;
    private final AnalyticsPaymentQuerySupport paymentQueries;
    private final AnalyticsOrderQuerySupport orderQueries;
    private final StorePeriodSupport storePeriodSupport;
    private final ActivityEventAssembler activityEventAssembler;

    @Override
    public DashboardResponse dashboard(
        Integer storeId,
        String periodKey,
        Instant from,
        Instant to,
        Integer hallId,
        UUID waiterUserId
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        var resolved = periodKeyResolver.resolve(periodKey, from, to);
        var previous = periodKeyResolver.previousOf(resolved.period());
        LogUtil.info(
            RestaurantAnalyticsServiceImpl.class,
            "Dashboard load storeId={} period={} hallId={} waiterUserId={}",
            storeId, resolved.key(), hallId, waiterUserId
        );
        return dashboardComposer.compose(
            companyId, storeId, resolved.key(), resolved.period(), previous, hallId, waiterUserId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SalesReportResponse salesReport(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        InstantRange period = storePeriodSupport.resolve(from, to);
        AnalyticsPaymentTotalsSupport.Totals totals = paymentTotals.load(
            companyId, storeId, period.from(), period.to()
        );
        return new SalesReportResponse(
            period.from(),
            period.to(),
            totals.revenue(),
            totals.paymentCount(),
            totals.cashAmount(),
            totals.cardAmount(),
            DashboardSalesRowMapper.dishes(
                orderQueries.salesByDish(companyId, storeId, period.from(), period.to())
            ),
            DashboardSalesRowMapper.hours(
                paymentQueries.salesByHour(companyId, storeId, period.from(), period.to())
            )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ActivityEventResponse> activity(
        Integer storeId,
        Instant from,
        Instant to,
        int page,
        int size,
        String type,
        String search
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        InstantRange period = storePeriodSupport.resolve(from, to);
        int safePage = PageLimits.normalizePage(page);
        int safeSize = PageLimits.normalizeSize(size);
        String typeFilter = type == null || type.isBlank() || "all".equalsIgnoreCase(type.trim())
            ? null
            : type.trim().toUpperCase(Locale.ROOT);
        String q = FilterText.normalizeSearch(search);

        List<ActivityEventResponse> filtered = activityEventAssembler
            .assemble(companyId, storeId, period.from(), period.to())
            .stream()
            .filter(event -> typeFilter == null || typeFilter.equals(event.type()))
            .filter(event -> matchesSearch(event, q))
            .toList();

        long total = filtered.size();
        int fromIdx = Math.min(safePage * safeSize, filtered.size());
        int toIdx = Math.min(fromIdx + safeSize, filtered.size());
        List<ActivityEventResponse> content = filtered.subList(fromIdx, toIdx);
        return PageResponse.of(content, safePage, safeSize, total);
    }

    private static boolean matchesSearch(ActivityEventResponse event, String q) {
        if (q == null) {
            return true;
        }
        String needle = q.toLowerCase(Locale.ROOT);
        return (event.type() != null && event.type().toLowerCase(Locale.ROOT).contains(needle))
            || (event.summary() != null && event.summary().toLowerCase(Locale.ROOT).contains(needle))
            || (event.entityType() != null && event.entityType().toLowerCase(Locale.ROOT).contains(needle))
            || (event.entityId() != null && event.entityId().toLowerCase(Locale.ROOT).contains(needle));
    }
}

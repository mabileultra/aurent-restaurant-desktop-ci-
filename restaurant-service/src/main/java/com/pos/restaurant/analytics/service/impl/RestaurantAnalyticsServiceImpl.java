package com.pos.restaurant.analytics.service.impl;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.analytics.dto.SalesReportResponse;
import com.pos.restaurant.analytics.service.RestaurantAnalyticsService;
import com.pos.restaurant.analytics.support.ActivityEventAssembler;
import com.pos.restaurant.analytics.support.AnalyticsPeriodResolver;
import com.pos.restaurant.analytics.support.AnalyticsQuerySupport;
import com.pos.restaurant.analytics.support.DashboardParallelComposer;
import com.pos.restaurant.analytics.support.DashboardPeriodKeyResolver;
import com.pos.restaurant.analytics.support.DashboardSalesRowMapper;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantAnalyticsServiceImpl implements RestaurantAnalyticsService {

    private final FloorTenantSupport tenantSupport;
    private final DashboardPeriodKeyResolver periodKeyResolver;
    private final DashboardParallelComposer dashboardComposer;
    private final AnalyticsQuerySupport queries;
    private final AnalyticsPeriodResolver periodResolver;
    private final ActivityEventAssembler activityEventAssembler;

    @Override
    public DashboardResponse dashboard(Integer storeId, String periodKey, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodKeyResolver.resolve(periodKey, from, to);
        var previous = periodKeyResolver.previousOf(period);
        LogUtil.info(RestaurantAnalyticsServiceImpl.class, "Dashboard load storeId={} period={}", storeId, periodKey);
        return dashboardComposer.compose(companyId, storeId, period, previous);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesReportResponse salesReport(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.resolve(from, to);
        BigDecimal revenue = queries.sumPayments(companyId, storeId, period.from(), period.to());
        BigDecimal cash = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASH, period.from(), period.to());
        BigDecimal card = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CARD, period.from(), period.to())
            .add(queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASHLESS, period.from(), period.to()));
        long paymentCount = queries.countPayments(companyId, storeId, period.from(), period.to());

        return new SalesReportResponse(
            period.from(),
            period.to(),
            revenue,
            paymentCount,
            cash,
            card,
            DashboardSalesRowMapper.dishes(queries.salesByDish(companyId, storeId, period.from(), period.to())),
            DashboardSalesRowMapper.hours(queries.salesByHour(companyId, storeId, period.from(), period.to()))
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityEventResponse> activity(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.resolve(from, to);
        return activityEventAssembler.assemble(companyId, storeId, period.from(), period.to());
    }
}

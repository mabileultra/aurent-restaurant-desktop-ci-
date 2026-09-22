package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DishSalesRow;
import com.pos.restaurant.analytics.dto.HourSalesRow;
import com.pos.restaurant.payment.domain.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DashboardFinanceSliceLoader {

    public record FinanceSlice(
        BigDecimal revenue,
        BigDecimal previousRevenue,
        BigDecimal revenueDeltaPct,
        BigDecimal cashAmount,
        BigDecimal cardAmount,
        long closedOrders,
        long previousClosedOrders,
        long closedOrdersDelta,
        long cancelledOrders,
        long guests,
        BigDecimal averageCheck,
        BigDecimal previousAverageCheck,
        BigDecimal averageCheckDeltaPct,
        List<HourSalesRow> byHour,
        List<DishSalesRow> byDish
    ) {
    }

    private final AnalyticsQuerySupport queries;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public FinanceSlice load(
        Integer companyId,
        Integer storeId,
        AnalyticsPeriodResolver.Period period,
        AnalyticsPeriodResolver.Period previous
    ) {
        BigDecimal revenue = queries.sumPayments(companyId, storeId, period.from(), period.to());
        BigDecimal previousRevenue = queries.sumPayments(companyId, storeId, previous.from(), previous.to());
        BigDecimal cash = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASH, period.from(), period.to());
        BigDecimal card = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CARD, period.from(), period.to());
        long closed = queries.countClosedOrders(companyId, storeId, period.from(), period.to());
        long previousClosed = queries.countClosedOrders(companyId, storeId, previous.from(), previous.to());
        long cancelled = queries.countCancelledInRange(companyId, storeId, period.from(), period.to());
        long guests = queries.sumGuestsClosed(companyId, storeId, period.from(), period.to());
        BigDecimal avg = averageCheck(revenue, closed);
        BigDecimal previousAvg = averageCheck(previousRevenue, previousClosed);

        return new FinanceSlice(
            revenue,
            previousRevenue,
            DashboardDeltaMath.percentDelta(revenue, previousRevenue),
            cash,
            card,
            closed,
            previousClosed,
            DashboardDeltaMath.absoluteDelta(closed, previousClosed),
            cancelled,
            guests,
            avg,
            previousAvg,
            DashboardDeltaMath.percentDelta(avg, previousAvg),
            DashboardSalesRowMapper.hours(queries.salesByHour(companyId, storeId, period.from(), period.to())),
            DashboardSalesRowMapper.dishes(queries.salesByDish(companyId, storeId, period.from(), period.to()))
        );
    }

    private static BigDecimal averageCheck(BigDecimal revenue, long closed) {
        if (closed == 0) {
            return BigDecimal.ZERO;
        }
        return revenue.divide(BigDecimal.valueOf(closed), 2, RoundingMode.HALF_UP);
    }
}

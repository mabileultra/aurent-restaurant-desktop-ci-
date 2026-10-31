package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DashboardFinanceBlock;
import com.pos.restaurant.analytics.dto.DishSalesRow;
import com.pos.restaurant.analytics.dto.HourSalesRow;
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

    private final AnalyticsPaymentTotalsSupport paymentTotals;
    private final AnalyticsPaymentQuerySupport paymentQueries;
    private final AnalyticsOrderQuerySupport orderQueries;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public DashboardFinanceBlock load(
        Integer companyId,
        Integer storeId,
        AnalyticsPeriodResolver.Period period,
        AnalyticsPeriodResolver.Period previous
    ) {
        AnalyticsPaymentTotalsSupport.Totals current = paymentTotals.load(
            companyId, storeId, period.from(), period.to()
        );
        BigDecimal previousRevenue = paymentQueries.sumPayments(
            companyId, storeId, previous.from(), previous.to()
        );
        long closed = orderQueries.countClosedOrders(companyId, storeId, period.from(), period.to());
        long previousClosed = orderQueries.countClosedOrders(
            companyId, storeId, previous.from(), previous.to()
        );
        long cancelled = orderQueries.countCancelledInRange(companyId, storeId, period.from(), period.to());
        long guests = orderQueries.sumGuestsClosed(companyId, storeId, period.from(), period.to());
        BigDecimal avg = averageCheck(current.revenue(), closed);
        BigDecimal previousAvg = averageCheck(previousRevenue, previousClosed);
        List<HourSalesRow> byHour = DashboardSalesRowMapper.hours(
            paymentQueries.salesByHour(companyId, storeId, period.from(), period.to())
        );
        List<DishSalesRow> byDish = DashboardSalesRowMapper.dishes(
            orderQueries.salesByDish(companyId, storeId, period.from(), period.to())
        );

        return new DashboardFinanceBlock(
            current.revenue(),
            previousRevenue,
            DashboardDeltaMath.percentDelta(current.revenue(), previousRevenue),
            current.cashAmount(),
            current.cardAmount(),
            closed,
            previousClosed,
            DashboardDeltaMath.absoluteDelta(closed, previousClosed),
            cancelled,
            guests,
            avg,
            previousAvg,
            DashboardDeltaMath.percentDelta(avg, previousAvg),
            byHour,
            byDish
        );
    }

    private static BigDecimal averageCheck(BigDecimal revenue, long closed) {
        if (closed == 0) {
            return BigDecimal.ZERO;
        }
        return revenue.divide(BigDecimal.valueOf(closed), 2, RoundingMode.HALF_UP);
    }
}

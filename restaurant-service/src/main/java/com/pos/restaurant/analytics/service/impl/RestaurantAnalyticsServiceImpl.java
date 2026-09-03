package com.pos.restaurant.analytics.service.impl;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.analytics.dto.DishSalesRow;
import com.pos.restaurant.analytics.dto.HourSalesRow;
import com.pos.restaurant.analytics.dto.SalesReportResponse;
import com.pos.restaurant.analytics.service.RestaurantAnalyticsService;
import com.pos.restaurant.analytics.support.AnalyticsPeriodResolver;
import com.pos.restaurant.analytics.support.AnalyticsQuerySupport;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantAnalyticsServiceImpl implements RestaurantAnalyticsService {

    private final FloorTenantSupport tenantSupport;
    private final AnalyticsQuerySupport queries;
    private final AnalyticsPeriodResolver periodResolver;
    private final RestaurantShiftRepository shiftRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse dashboard(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.today();
        BigDecimal revenue = queries.sumPayments(companyId, storeId, period.from(), period.to());
        BigDecimal cash = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASH, period.from(), period.to());
        BigDecimal card = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CARD, period.from(), period.to());
        long closed = queries.countClosedOrders(companyId, storeId, period.from(), period.to());
        long open = queries.countOrdersByStatuses(companyId, storeId, List.of(OrderStatus.OPEN, OrderStatus.BILLING));
        long cancelled = queries.countCancelledInRange(companyId, storeId, period.from(), period.to());
        long guests = queries.sumGuestsClosed(companyId, storeId, period.from(), period.to());
        long totalTables = queries.countActiveTables(companyId, storeId);
        long freeTables = queries.countFreeTables(companyId, storeId);
        long kitchenWaiting = queries.countKitchenWaiting(companyId, storeId);
        long reservations = queries.countActiveReservations(companyId, storeId);
        BigDecimal avg = closed == 0
            ? BigDecimal.ZERO
            : revenue.divide(BigDecimal.valueOf(closed), 2, RoundingMode.HALF_UP);

        RestaurantShift openShift = shiftRepository.findByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN).orElse(null);
        boolean shiftOpen = openShift != null;
        BigDecimal shiftRevenue = openShift != null ? openShift.getTotalAmount() : BigDecimal.ZERO;
        int shiftSales = openShift != null ? openShift.getSaleCount() : 0;

        return new DashboardResponse(
            period.from(),
            period.to(),
            revenue,
            cash,
            card,
            closed,
            open,
            cancelled,
            avg,
            guests,
            Math.max(0, totalTables - freeTables),
            freeTables,
            totalTables,
            kitchenWaiting,
            reservations,
            shiftOpen,
            shiftRevenue,
            shiftSales
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SalesReportResponse salesReport(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.resolve(from, to);
        BigDecimal revenue = queries.sumPayments(companyId, storeId, period.from(), period.to());
        BigDecimal cash = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASH, period.from(), period.to());
        BigDecimal card = queries.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CARD, period.from(), period.to());
        long paymentCount = queries.countPayments(companyId, storeId, period.from(), period.to());

        List<DishSalesRow> byDish = queries.salesByDish(companyId, storeId, period.from(), period.to()).stream()
            .map(row -> new DishSalesRow(
                String.valueOf(row[0]),
                toDecimal(row[1]),
                toDecimal(row[2])
            ))
            .toList();

        List<HourSalesRow> byHour = queries.salesByHour(companyId, storeId, period.from(), period.to()).stream()
            .map(row -> new HourSalesRow(
                ((Number) row[0]).intValue(),
                ((Number) row[1]).longValue(),
                toDecimal(row[2])
            ))
            .toList();

        return new SalesReportResponse(
            period.from(),
            period.to(),
            revenue,
            paymentCount,
            cash,
            card,
            byDish,
            byHour
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityEventResponse> activity(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.resolve(from, to);
        List<ActivityEventResponse> events = new ArrayList<>();

        for (FloorOrderPayment payment : queries.recentPayments(companyId, storeId, period.from(), period.to())) {
            events.add(new ActivityEventResponse(
                payment.getPaidAt(),
                "PAYMENT",
                payment.getMethod() + "|" + payment.getAmount() + "|" + payment.getOrder().getOrderNo(),
                payment.getPaidByUserId(),
                "payment",
                payment.getId().toString()
            ));
        }

        for (FloorOrder order : queries.recentOrders(companyId, storeId, period.from(), period.to())) {
            events.add(new ActivityEventResponse(
                order.getOpenedAt(),
                "ORDER_OPEN",
                String.valueOf(order.getOrderNo()),
                order.getOpenedByUserId(),
                "order",
                order.getId().toString()
            ));
            if (order.getStatus() == OrderStatus.CANCELLED && order.getUpdatedAt() != null) {
                events.add(new ActivityEventResponse(
                    order.getUpdatedAt(),
                    "ORDER_CANCEL",
                    String.valueOf(order.getOrderNo()),
                    order.getOpenedByUserId(),
                    "order",
                    order.getId().toString()
                ));
            }
            if (order.getStatus() == OrderStatus.CLOSED && order.getClosedAt() != null) {
                events.add(new ActivityEventResponse(
                    order.getClosedAt(),
                    "ORDER_CLOSE",
                    String.valueOf(order.getOrderNo()),
                    order.getOpenedByUserId(),
                    "order",
                    order.getId().toString()
                ));
            }
        }

        for (RestaurantShift shift : queries.recentShifts(companyId, storeId, period.from(), period.to())) {
            events.add(new ActivityEventResponse(
                shift.getOpenedAt(),
                "SHIFT_OPEN",
                String.valueOf(shift.getOpeningCash()),
                shift.getOpenedByUserId(),
                "shift",
                shift.getId().toString()
            ));
            if (shift.getClosedAt() != null) {
                events.add(new ActivityEventResponse(
                    shift.getClosedAt(),
                    "SHIFT_CLOSE",
                    String.valueOf(shift.getTotalAmount()),
                    shift.getClosedByUserId(),
                    "shift",
                    shift.getId().toString()
                ));
            }
        }

        for (FloorReservation reservation : queries.recentReservations(companyId, storeId, period.from(), period.to())) {
            events.add(new ActivityEventResponse(
                reservation.getCreatedAt(),
                "RESERVATION",
                reservation.getStatus() + "|" + reservation.getClientName() + "|" + reservation.getTable().getCode(),
                reservation.getCreatedByUserId(),
                "reservation",
                reservation.getId().toString()
            ));
        }

        return events.stream()
            .sorted(Comparator.comparing(ActivityEventResponse::at).reversed())
            .limit(100)
            .toList();
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        return new BigDecimal(value.toString());
    }
}

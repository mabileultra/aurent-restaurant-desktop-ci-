package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.shift.entity.RestaurantShift;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ActivityEventAssembler {

    private final AnalyticsPaymentQuerySupport paymentQueries;
    private final AnalyticsOrderQuerySupport orderQueries;
    private final AnalyticsFloorQuerySupport floorQueries;

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> assemble(Integer companyId, Integer storeId, Instant from, Instant to) {
        List<ActivityEventResponse> events = new ArrayList<>();

        for (FloorOrderPayment payment : paymentQueries.recentPayments(companyId, storeId, from, to)) {
            events.add(new ActivityEventResponse(
                payment.getPaidAt(),
                "PAYMENT",
                payment.getMethod() + "|" + payment.getAmount() + "|" + payment.getOrder().getOrderNo(),
                payment.getPaidByUserId(),
                "payment",
                payment.getId().toString()
            ));
        }

        for (FloorOrder order : orderQueries.recentOrders(companyId, storeId, from, to)) {
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

        for (RestaurantShift shift : floorQueries.recentShifts(companyId, storeId, from, to)) {
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

        for (FloorReservation reservation : floorQueries.recentReservations(companyId, storeId, from, to)) {
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
            .toList();
    }
}

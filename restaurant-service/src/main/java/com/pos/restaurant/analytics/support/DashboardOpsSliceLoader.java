package com.pos.restaurant.analytics.support;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DashboardOpsSliceLoader {

    public record OpsSlice(
        long openOrders,
        long occupiedTables,
        long freeTables,
        long waitingPaymentTables,
        long reservedTables,
        long blockedTables,
        long totalTables,
        long kitchenNew,
        long kitchenPreparing,
        long kitchenReady,
        long kitchenWaiting,
        long reservationsActive,
        boolean shiftOpen,
        BigDecimal shiftRevenue,
        int shiftSaleCount
    ) {
    }

    private final AnalyticsQuerySupport queries;
    private final RestaurantShiftRepository shiftRepository;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public OpsSlice load(Integer companyId, Integer storeId) {
        long open = queries.countOrdersByStatuses(companyId, storeId, List.of(OrderStatus.OPEN, OrderStatus.BILLING));
        long totalTables = queries.countActiveTables(companyId, storeId);
        long freeTables = queries.countTablesByStatus(companyId, storeId, TableStatus.FREE);
        long occupiedTables = queries.countTablesByStatus(companyId, storeId, TableStatus.OCCUPIED);
        long waitingPayment = queries.countTablesByStatus(companyId, storeId, TableStatus.WAITING_PAYMENT);
        long reservedTables = queries.countTablesByStatus(companyId, storeId, TableStatus.RESERVED);
        long blockedTables = queries.countTablesByStatus(companyId, storeId, TableStatus.BLOCKED);
        long reservations = queries.countActiveReservations(companyId, storeId);

        long kitchenNew = queries.countKitchenByStatuses(
            companyId, storeId, List.of(KitchenTicketStatus.NEW, KitchenTicketStatus.ACCEPTED)
        );
        long kitchenPreparing = queries.countKitchenByStatuses(
            companyId, storeId, List.of(KitchenTicketStatus.PREPARING)
        );
        long kitchenReady = queries.countKitchenByStatuses(
            companyId, storeId, List.of(KitchenTicketStatus.READY)
        );

        RestaurantShift openShift = shiftRepository.findByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN).orElse(null);

        return new OpsSlice(
            open,
            occupiedTables,
            freeTables,
            waitingPayment,
            reservedTables,
            blockedTables,
            totalTables,
            kitchenNew,
            kitchenPreparing,
            kitchenReady,
            kitchenNew + kitchenPreparing + kitchenReady,
            reservations,
            openShift != null,
            openShift != null ? openShift.getTotalAmount() : BigDecimal.ZERO,
            openShift != null ? openShift.getSaleCount() : 0
        );
    }
}

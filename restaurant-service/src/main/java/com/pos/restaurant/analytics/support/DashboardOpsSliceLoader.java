package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DashboardOpsBlock;
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

    private final AnalyticsOrderQuerySupport orderQueries;
    private final AnalyticsFloorQuerySupport floorQueries;
    private final RestaurantShiftRepository shiftRepository;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public DashboardOpsBlock load(Integer companyId, Integer storeId) {
        long open = orderQueries.countOrdersByStatuses(
            companyId, storeId, List.of(OrderStatus.OPEN, OrderStatus.BILLING)
        );
        long totalTables = floorQueries.countActiveTables(companyId, storeId);
        long freeTables = floorQueries.countTablesByStatus(companyId, storeId, TableStatus.FREE);
        long occupiedTables = floorQueries.countTablesByStatus(companyId, storeId, TableStatus.OCCUPIED);
        long waitingPayment = floorQueries.countTablesByStatus(
            companyId, storeId, TableStatus.WAITING_PAYMENT
        );
        long reservedTables = floorQueries.countTablesByStatus(companyId, storeId, TableStatus.RESERVED);
        long blockedTables = floorQueries.countTablesByStatus(companyId, storeId, TableStatus.BLOCKED);
        long reservations = floorQueries.countActiveReservations(companyId, storeId);

        long kitchenNew = floorQueries.countKitchenByStatuses(
            companyId, storeId, List.of(KitchenTicketStatus.NEW, KitchenTicketStatus.ACCEPTED)
        );
        long kitchenPreparing = floorQueries.countKitchenByStatuses(
            companyId, storeId, List.of(KitchenTicketStatus.PREPARING)
        );
        long kitchenReady = floorQueries.countKitchenByStatuses(
            companyId, storeId, List.of(KitchenTicketStatus.READY)
        );

        RestaurantShift openShift = shiftRepository
            .findByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN)
            .orElse(null);

        return new DashboardOpsBlock(
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

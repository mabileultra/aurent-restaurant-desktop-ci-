package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DashboardKitchenLiveRow;
import com.pos.restaurant.analytics.dto.DashboardLiveBlock;
import com.pos.restaurant.analytics.dto.DashboardRecentOrderRow;
import com.pos.restaurant.analytics.dto.DashboardTableLiveRow;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderTotals;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DashboardLiveSnapshotBuilder {

    private static final int RECENT_ORDER_LIMIT = 8;

    private final AnalyticsOrderQuerySupport orderQueries;
    private final AnalyticsFloorQuerySupport floorQueries;
    private final FloorOrderItemRepository itemRepository;
    private final OrderTotals orderTotals;
    private final AnalyticsStaffNameResolver staffNameResolver;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public DashboardLiveBlock build(
        Integer companyId,
        Integer storeId,
        Integer hallId,
        UUID waiterUserId
    ) {
        Instant now = Instant.now();
        List<DashboardTableLiveRow> tables = buildLiveTables(companyId, storeId, hallId, now);
        List<DashboardKitchenLiveRow> kitchen = buildKitchenQueue(companyId, storeId, now);
        List<DashboardRecentOrderRow> recentOrders = buildRecentOrders(companyId, storeId, waiterUserId);
        return new DashboardLiveBlock(tables, kitchen, recentOrders);
    }

    private List<DashboardTableLiveRow> buildLiveTables(
        Integer companyId, Integer storeId, Integer hallId, Instant now
    ) {
        List<DashboardTableLiveRow> rows = new ArrayList<>();
        for (FloorOrder order : orderQueries.openTableOrders(companyId, storeId, hallId)) {
            List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId());
            BigDecimal amount = orderTotals.billable(items);
            long minutes = minutesBetween(order.getOpenedAt(), now);
            String status = order.getTable() != null && order.getTable().getStatus() != null
                ? order.getTable().getStatus().name()
                : order.getStatus().name();
            String code = order.getTable() != null ? order.getTable().getCode() : "—";
            Integer rowHallId = order.getTable() != null && order.getTable().getHall() != null
                ? order.getTable().getHall().getId()
                : null;
            rows.add(new DashboardTableLiveRow(rowHallId, code, amount, minutes, status));
        }
        return rows;
    }

    private List<DashboardKitchenLiveRow> buildKitchenQueue(Integer companyId, Integer storeId, Instant now) {
        List<DashboardKitchenLiveRow> rows = new ArrayList<>();
        for (Object[] row : floorQueries.kitchenQueueRows(companyId, storeId)) {
            int orderNo = ((Number) row[0]).intValue();
            String tableCode = row[1] == null ? "—" : String.valueOf(row[1]);
            Instant sentAt = (Instant) row[2];
            String status = row[3] instanceof KitchenTicketStatus ks ? ks.name() : String.valueOf(row[3]);
            rows.add(new DashboardKitchenLiveRow(orderNo, tableCode, minutesBetween(sentAt, now), status));
        }
        return rows;
    }

    private List<DashboardRecentOrderRow> buildRecentOrders(
        Integer companyId, Integer storeId, UUID waiterUserId
    ) {
        List<FloorOrder> orders = orderQueries.recentOrdersAnyStatus(
            companyId, storeId, waiterUserId, RECENT_ORDER_LIMIT
        );
        Set<UUID> waiterIds = new HashSet<>();
        for (FloorOrder order : orders) {
            UUID waiter = order.getWaiterUserId() != null ? order.getWaiterUserId() : order.getOpenedByUserId();
            if (waiter != null) {
                waiterIds.add(waiter);
            }
        }
        Map<UUID, String> names = staffNameResolver.namesByIds(waiterIds);

        List<DashboardRecentOrderRow> rows = new ArrayList<>();
        for (FloorOrder order : orders) {
            List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId());
            BigDecimal amount = orderTotals.billable(items);
            String tableCode = order.getTable() != null ? order.getTable().getCode() : "—";
            UUID waiter = order.getWaiterUserId() != null ? order.getWaiterUserId() : order.getOpenedByUserId();
            rows.add(new DashboardRecentOrderRow(
                order.getOrderNo(),
                tableCode,
                waiter == null ? null : waiter.toString(),
                waiter == null ? null : names.get(waiter),
                amount,
                order.getStatus().name()
            ));
        }
        return rows;
    }

    static long minutesBetween(Instant start, Instant end) {
        if (start == null || end == null) {
            return 0;
        }
        return Math.max(0, Duration.between(start, end).toMinutes());
    }
}

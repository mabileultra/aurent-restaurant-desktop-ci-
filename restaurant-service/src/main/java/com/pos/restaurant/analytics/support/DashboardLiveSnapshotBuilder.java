package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DashboardKitchenLiveRow;
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
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DashboardLiveSnapshotBuilder {

    private final AnalyticsQuerySupport queries;
    private final FloorOrderItemRepository itemRepository;
    private final OrderTotals orderTotals;

    public record LiveSnapshot(
        List<DashboardTableLiveRow> tables,
        List<DashboardKitchenLiveRow> kitchen,
        List<DashboardRecentOrderRow> recentOrders
    ) {
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public LiveSnapshot build(Integer companyId, Integer storeId) {
        Instant now = Instant.now();
        return new LiveSnapshot(
            buildLiveTables(companyId, storeId, now),
            buildKitchenQueue(companyId, storeId, now),
            buildRecentOrders(companyId, storeId)
        );
    }

    private List<DashboardTableLiveRow> buildLiveTables(Integer companyId, Integer storeId, Instant now) {
        List<DashboardTableLiveRow> rows = new ArrayList<>();
        for (FloorOrder order : queries.openTableOrders(companyId, storeId)) {
            List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId());
            BigDecimal amount = orderTotals.billable(items);
            long minutes = minutesBetween(order.getOpenedAt(), now);
            String status = order.getTable() != null && order.getTable().getStatus() != null
                ? order.getTable().getStatus().name()
                : order.getStatus().name();
            String code = order.getTable() != null ? order.getTable().getCode() : "—";
            rows.add(new DashboardTableLiveRow(code, amount, minutes, status));
        }
        return rows;
    }

    private List<DashboardKitchenLiveRow> buildKitchenQueue(Integer companyId, Integer storeId, Instant now) {
        List<DashboardKitchenLiveRow> rows = new ArrayList<>();
        for (Object[] row : queries.kitchenQueueRows(companyId, storeId)) {
            int orderNo = ((Number) row[0]).intValue();
            String tableCode = row[1] == null ? "—" : String.valueOf(row[1]);
            Instant sentAt = (Instant) row[2];
            String status = row[3] instanceof KitchenTicketStatus ks ? ks.name() : String.valueOf(row[3]);
            rows.add(new DashboardKitchenLiveRow(orderNo, tableCode, minutesBetween(sentAt, now), status));
        }
        return rows;
    }

    private List<DashboardRecentOrderRow> buildRecentOrders(Integer companyId, Integer storeId) {
        List<DashboardRecentOrderRow> rows = new ArrayList<>();
        for (FloorOrder order : queries.recentOrdersAnyStatus(companyId, storeId, 8)) {
            List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId());
            BigDecimal amount = orderTotals.billable(items);
            String tableCode = order.getTable() != null ? order.getTable().getCode() : "—";
            UUID waiter = order.getWaiterUserId() != null ? order.getWaiterUserId() : order.getOpenedByUserId();
            rows.add(new DashboardRecentOrderRow(
                order.getOrderNo(),
                tableCode,
                waiter == null ? null : waiter.toString(),
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

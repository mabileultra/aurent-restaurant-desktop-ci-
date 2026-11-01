package com.pos.restaurant.commission.support;

import com.pos.restaurant.analytics.support.AnalyticsStaffNameResolver;
import com.pos.restaurant.commission.dto.WaiterCommissionOrderRow;
import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionReportRow;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.shared.api.PageLimits;
import com.pos.shared.api.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WaiterCommissionReportAssembler {

    private final WaiterCommissionReportQuerySupport queries;
    private final AnalyticsStaffNameResolver staffNameResolver;

    @Transactional(readOnly = true)
    public WaiterCommissionReportResponse build(
        Integer companyId,
        Integer storeId,
        Instant from,
        Instant to
    ) {
        List<Object[]> grouped = queries.aggregateByWaiter(companyId, storeId, from, to);

        Set<UUID> waiterIds = new HashSet<>(grouped.size());
        for (Object[] row : grouped) {
            if (row[0] instanceof UUID id) {
                waiterIds.add(id);
            }
        }
        Map<UUID, String> names = staffNameResolver.namesByIds(waiterIds);

        List<WaiterCommissionReportRow> rows = new ArrayList<>(grouped.size());
        long orderCount = 0;
        BigDecimal salesTotal = BigDecimal.ZERO;
        BigDecimal commissionTotal = BigDecimal.ZERO;
        for (Object[] row : grouped) {
            UUID waiterId = (UUID) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal sales = money(row[2]);
            BigDecimal commission = money(row[3]);
            orderCount += count;
            salesTotal = salesTotal.add(sales);
            commissionTotal = commissionTotal.add(commission);
            rows.add(new WaiterCommissionReportRow(
                waiterId,
                names.get(waiterId),
                count,
                sales,
                commission
            ));
        }
        return new WaiterCommissionReportResponse(from, to, orderCount, salesTotal, commissionTotal, rows);
    }

    @Transactional(readOnly = true)
    public PageResponse<WaiterCommissionOrderRow> orders(
        Integer companyId,
        Integer storeId,
        UUID waiterUserId,
        Instant from,
        Instant to,
        int page,
        int size
    ) {
        int safeSize = PageLimits.normalizeSize(size);
        int safePage = PageLimits.normalizePage(page);
        long total = queries.countWaiterOrders(companyId, storeId, waiterUserId, from, to);
        if (total == 0) {
            return PageResponse.empty(safePage, safeSize);
        }

        List<FloorOrder> orders = queries.pageWaiterOrders(
            companyId, storeId, waiterUserId, from, to, safePage, safeSize
        );
        List<WaiterCommissionOrderRow> rows = new ArrayList<>(orders.size());
        for (FloorOrder order : orders) {
            String tableCode = order.getTable() == null
                ? OrderResponseAssembler.displayCode(order.getChannel(), order)
                : order.getTable().getCode();
            rows.add(new WaiterCommissionOrderRow(
                order.getId(),
                order.getOrderNo(),
                tableCode,
                order.getClosedAt(),
                money(order.getCommissionBaseAmount()),
                money(order.getCommissionPercent()),
                money(order.getCommissionAmount())
            ));
        }
        return PageResponse.of(rows, safePage, safeSize, total);
    }

    private static BigDecimal money(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        return value instanceof BigDecimal bd ? bd : new BigDecimal(value.toString());
    }
}

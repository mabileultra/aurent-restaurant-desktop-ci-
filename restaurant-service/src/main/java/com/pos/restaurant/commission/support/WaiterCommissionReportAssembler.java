package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.dto.WaiterCommissionOrderRow;
import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionReportRow;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class WaiterCommissionReportAssembler {

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public WaiterCommissionReportResponse build(
        Integer companyId,
        Integer storeId,
        Instant from,
        Instant to
    ) {
        List<FloorOrder> orders = em.createQuery("""
            select o from FloorOrder o left join fetch o.table
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.channel = :channel
              and o.closedAt >= :from and o.closedAt < :to
              and o.commissionAmount is not null
              and o.waiterUserId is not null
            order by o.closedAt desc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("channel", OrderChannel.DINE_IN)
            .setParameter("from", from)
            .setParameter("to", to)
            .getResultList();

        Map<UUID, List<FloorOrder>> byWaiter = new LinkedHashMap<>();
        for (FloorOrder order : orders) {
            byWaiter.computeIfAbsent(order.getWaiterUserId(), ignored -> new ArrayList<>()).add(order);
        }

        List<WaiterCommissionReportRow> rows = new ArrayList<>();
        BigDecimal salesTotal = BigDecimal.ZERO;
        BigDecimal commissionTotal = BigDecimal.ZERO;

        for (Map.Entry<UUID, List<FloorOrder>> entry : byWaiter.entrySet()) {
            List<WaiterCommissionOrderRow> orderRows = new ArrayList<>();
            BigDecimal waiterSales = BigDecimal.ZERO;
            BigDecimal waiterCommission = BigDecimal.ZERO;
            for (FloorOrder order : entry.getValue()) {
                BigDecimal base = order.getCommissionBaseAmount() == null
                    ? BigDecimal.ZERO
                    : order.getCommissionBaseAmount();
                BigDecimal commission = order.getCommissionAmount() == null
                    ? BigDecimal.ZERO
                    : order.getCommissionAmount();
                waiterSales = waiterSales.add(base);
                waiterCommission = waiterCommission.add(commission);
                String tableCode = order.getTable() == null
                    ? OrderResponseAssembler.displayCode(order.getChannel(), order)
                    : order.getTable().getCode();
                orderRows.add(new WaiterCommissionOrderRow(
                    order.getId(),
                    order.getOrderNo(),
                    tableCode,
                    order.getClosedAt(),
                    base,
                    order.getCommissionPercent() == null ? BigDecimal.ZERO : order.getCommissionPercent(),
                    commission
                ));
            }
            salesTotal = salesTotal.add(waiterSales);
            commissionTotal = commissionTotal.add(waiterCommission);
            rows.add(new WaiterCommissionReportRow(
                entry.getKey(),
                orderRows.size(),
                waiterSales,
                waiterCommission,
                orderRows
            ));
        }

        rows.sort(Comparator.comparing(WaiterCommissionReportRow::commissionTotal).reversed());

        return new WaiterCommissionReportResponse(
            from,
            to,
            orders.size(),
            salesTotal,
            commissionTotal,
            rows
        );
    }
}

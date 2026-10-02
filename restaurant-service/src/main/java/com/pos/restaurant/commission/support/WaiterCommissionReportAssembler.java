package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.dto.WaiterCommissionOrderRow;
import com.pos.restaurant.commission.dto.WaiterCommissionOrdersResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionReportRow;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class WaiterCommissionReportAssembler {

    static final int MAX_PAGE_SIZE = 100;

    @PersistenceContext
    private EntityManager em;

    public WaiterCommissionReportResponse build(
        Integer companyId,
        Integer storeId,
        Instant from,
        Instant to
    ) {
        @SuppressWarnings("unchecked")
        List<Object[]> grouped = bind(em.createQuery("""
            select o.waiterUserId,
                   count(o),
                   coalesce(sum(o.commissionBaseAmount), 0),
                   coalesce(sum(o.commissionAmount), 0)
            from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.channel = :channel
              and o.closedAt >= :from and o.closedAt < :to
              and o.commissionAmount is not null
              and o.waiterUserId is not null
            group by o.waiterUserId
            order by coalesce(sum(o.commissionAmount), 0) desc
            """), companyId, storeId, from, to).getResultList();

        List<WaiterCommissionReportRow> rows = new ArrayList<>(grouped.size());
        long orderCount = 0;
        BigDecimal salesTotal = BigDecimal.ZERO;
        BigDecimal commissionTotal = BigDecimal.ZERO;
        for (Object[] row : grouped) {
            long count = ((Number) row[1]).longValue();
            BigDecimal sales = money(row[2]);
            BigDecimal commission = money(row[3]);
            orderCount += count;
            salesTotal = salesTotal.add(sales);
            commissionTotal = commissionTotal.add(commission);
            rows.add(new WaiterCommissionReportRow(
                (UUID) row[0],
                count,
                sales,
                commission,
                List.of()
            ));
        }
        return new WaiterCommissionReportResponse(from, to, orderCount, salesTotal, commissionTotal, rows);
    }

    public WaiterCommissionOrdersResponse orders(
        Integer companyId,
        Integer storeId,
        UUID waiterUserId,
        Instant from,
        Instant to,
        int page,
        int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        long total = ((Number) bind(em.createQuery("""
            select count(o)
            from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.channel = :channel
              and o.closedAt >= :from and o.closedAt < :to
              and o.commissionAmount is not null
              and o.waiterUserId = :waiterUserId
            """), companyId, storeId, from, to)
            .setParameter("waiterUserId", waiterUserId)
            .getSingleResult()).longValue();

        @SuppressWarnings("unchecked")
        List<FloorOrder> orders = total == 0 ? List.of() : bind(em.createQuery("""
            select o from FloorOrder o left join fetch o.table
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.channel = :channel
              and o.closedAt >= :from and o.closedAt < :to
              and o.commissionAmount is not null
              and o.waiterUserId = :waiterUserId
            order by o.closedAt desc
            """), companyId, storeId, from, to)
            .setParameter("waiterUserId", waiterUserId)
            .setFirstResult(safePage * safeSize)
            .setMaxResults(safeSize)
            .getResultList();

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
        return new WaiterCommissionOrdersResponse(rows, safePage, safeSize, total);
    }

    private static Query bind(Query query, Integer companyId, Integer storeId, Instant from, Instant to) {
        return query
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("channel", OrderChannel.DINE_IN)
            .setParameter("from", from)
            .setParameter("to", to);
    }

    private static BigDecimal money(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        return value instanceof BigDecimal bd ? bd : new BigDecimal(value.toString());
    }
}

package com.pos.restaurant.commission.support;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Read queries for commission reports — aggregation + paged waiter orders.
 * Relies on idx_floor_orders_commission_report for store-period scans.
 */
@Component
public class WaiterCommissionReportQuerySupport {

    @PersistenceContext
    private EntityManager em;

    public List<Object[]> aggregateByWaiter(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
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
            """, Object[].class)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("channel", OrderChannel.DINE_IN)
            .setParameter("from", from)
            .setParameter("to", to)
            .getResultList();
    }

    public long countWaiterOrders(
        Integer companyId, Integer storeId, UUID waiterUserId, Instant from, Instant to
    ) {
        return em.createQuery("""
            select count(o)
            from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.channel = :channel
              and o.closedAt >= :from and o.closedAt < :to
              and o.commissionAmount is not null
              and o.waiterUserId = :waiterUserId
            """, Long.class)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("channel", OrderChannel.DINE_IN)
            .setParameter("from", from)
            .setParameter("to", to)
            .setParameter("waiterUserId", waiterUserId)
            .getSingleResult();
    }

    public List<FloorOrder> pageWaiterOrders(
        Integer companyId,
        Integer storeId,
        UUID waiterUserId,
        Instant from,
        Instant to,
        int page,
        int size
    ) {
        TypedQuery<FloorOrder> query = em.createQuery("""
            select o from FloorOrder o left join fetch o.table
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.channel = :channel
              and o.closedAt >= :from and o.closedAt < :to
              and o.commissionAmount is not null
              and o.waiterUserId = :waiterUserId
            order by o.closedAt desc
            """, FloorOrder.class)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("channel", OrderChannel.DINE_IN)
            .setParameter("from", from)
            .setParameter("to", to)
            .setParameter("waiterUserId", waiterUserId)
            .setFirstResult(page * size)
            .setMaxResults(size);
        return query.getResultList();
    }
}

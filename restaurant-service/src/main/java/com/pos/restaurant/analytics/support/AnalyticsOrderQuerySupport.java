package com.pos.restaurant.analytics.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class AnalyticsOrderQuerySupport {

    @PersistenceContext
    private EntityManager em;

    public long countClosedOrders(Integer companyId, Integer storeId, Instant from, Instant to) {
        return (Long) em.createQuery("""
            select count(o) from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.closedAt >= :from and o.closedAt < :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
    }

    public long countOrdersByStatuses(Integer companyId, Integer storeId, List<OrderStatus> statuses) {
        return (Long) em.createQuery("""
            select count(o) from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status in :statuses
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("statuses", statuses)
            .getSingleResult();
    }

    public long countCancelledInRange(Integer companyId, Integer storeId, Instant from, Instant to) {
        return (Long) em.createQuery("""
            select count(o) from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.updatedAt >= :from and o.updatedAt < :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CANCELLED)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
    }

    public long sumGuestsClosed(Integer companyId, Integer storeId, Instant from, Instant to) {
        Number value = (Number) em.createQuery("""
            select coalesce(sum(o.guestCount), 0) from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :status
              and o.closedAt >= :from and o.closedAt < :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", OrderStatus.CLOSED)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
        return value.longValue();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> salesByDish(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
            select i.name, coalesce(sum(i.quantity), 0), coalesce(sum(i.quantity * i.unitPrice), 0)
            from FloorOrderItem i
            join i.order o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :closed
              and o.closedAt >= :from and o.closedAt < :to
              and i.itemStatus <> :cancelled
            group by i.name
            order by coalesce(sum(i.quantity * i.unitPrice), 0) desc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("closed", OrderStatus.CLOSED)
            .setParameter("cancelled", OrderItemStatus.CANCELLED)
            .setParameter("from", from)
            .setParameter("to", to)
            .setMaxResults(50)
            .getResultList();
    }

    public List<FloorOrder> openTableOrders(Integer companyId, Integer storeId, Integer hallId) {
        String jpql = """
            select o from FloorOrder o
            join fetch o.table t
            join fetch t.hall h
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status in :statuses
              and o.table is not null
            """
            + (hallId != null ? " and h.id = :hallId" : "")
            + " order by o.openedAt asc";
        TypedQuery<FloorOrder> query = em.createQuery(jpql, FloorOrder.class)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("statuses", List.of(OrderStatus.OPEN, OrderStatus.BILLING))
            .setMaxResults(24);
        if (hallId != null) {
            query.setParameter("hallId", hallId);
        }
        return query.getResultList();
    }

    public List<FloorOrder> recentOrdersAnyStatus(
        Integer companyId, Integer storeId, UUID waiterUserId, int limit
    ) {
        String jpql = """
            select o from FloorOrder o
            left join fetch o.table
            where o.companyId = :companyId and o.storeId = :storeId
            """
            + (waiterUserId != null
                ? " and (o.waiterUserId = :waiterUserId or o.openedByUserId = :waiterUserId)"
                : "")
            + " order by o.updatedAt desc";
        TypedQuery<FloorOrder> query = em.createQuery(jpql, FloorOrder.class)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setMaxResults(limit);
        if (waiterUserId != null) {
            query.setParameter("waiterUserId", waiterUserId);
        }
        return query.getResultList();
    }

    public List<FloorOrder> recentOrders(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
            select o from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.openedAt >= :from and o.openedAt < :to
            order by o.openedAt desc
            """, FloorOrder.class)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .setMaxResults(40)
            .getResultList();
    }
}

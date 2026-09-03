package com.pos.restaurant.analytics.support;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.shift.entity.RestaurantShift;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class AnalyticsQuerySupport {

    @PersistenceContext
    private EntityManager em;

    public BigDecimal sumPayments(Integer companyId, Integer storeId, Instant from, Instant to) {
        return (BigDecimal) em.createQuery("""
            select coalesce(sum(p.amount), 0) from FloorOrderPayment p
            join p.order o
            where o.companyId = :companyId and o.storeId = :storeId
              and p.paidAt >= :from and p.paidAt < :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
    }

    public BigDecimal sumPaymentsByMethod(
        Integer companyId, Integer storeId, PaymentMethod method, Instant from, Instant to
    ) {
        return (BigDecimal) em.createQuery("""
            select coalesce(sum(p.amount), 0) from FloorOrderPayment p
            join p.order o
            where o.companyId = :companyId and o.storeId = :storeId
              and p.method = :method
              and p.paidAt >= :from and p.paidAt < :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("method", method)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
    }

    public long countPayments(Integer companyId, Integer storeId, Instant from, Instant to) {
        return (Long) em.createQuery("""
            select count(p) from FloorOrderPayment p
            join p.order o
            where o.companyId = :companyId and o.storeId = :storeId
              and p.paidAt >= :from and p.paidAt < :to
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .getSingleResult();
    }

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

    public long countActiveTables(Integer companyId, Integer storeId) {
        return (Long) em.createQuery("""
            select count(t) from FloorTable t
            where t.companyId = :companyId and t.storeId = :storeId and t.active = true
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .getSingleResult();
    }

    public long countFreeTables(Integer companyId, Integer storeId) {
        return (Long) em.createQuery("""
            select count(t) from FloorTable t
            where t.companyId = :companyId and t.storeId = :storeId and t.active = true
              and t.status = :status
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", TableStatus.FREE)
            .getSingleResult();
    }

    public long countKitchenWaiting(Integer companyId, Integer storeId) {
        return (Long) em.createQuery("""
            select count(t) from KitchenTicket t
            where t.companyId = :companyId and t.storeId = :storeId
              and t.status not in :done
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("done", List.of(KitchenTicketStatus.SERVED, KitchenTicketStatus.CANCELLED))
            .getSingleResult();
    }

    public long countActiveReservations(Integer companyId, Integer storeId) {
        return (Long) em.createQuery("""
            select count(r) from FloorReservation r
            where r.companyId = :companyId and r.storeId = :storeId
              and r.status in :statuses
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("statuses", List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED))
            .getSingleResult();
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

    @SuppressWarnings("unchecked")
    public List<Object[]> salesByHour(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createNativeQuery("""
            select extract(hour from p.paid_at)::int as hr,
                   count(*)::bigint,
                   coalesce(sum(p.amount), 0)
            from floor_order_payments p
            join floor_orders o on o.id = p.order_id
            where o.company_id = :companyId and o.store_id = :storeId
              and p.paid_at >= :from and p.paid_at < :to
            group by hr
            order by hr
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", java.sql.Timestamp.from(from))
            .setParameter("to", java.sql.Timestamp.from(to))
            .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<FloorOrderPayment> recentPayments(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
            select p from FloorOrderPayment p
            join fetch p.order o
            where o.companyId = :companyId and o.storeId = :storeId
              and p.paidAt >= :from and p.paidAt < :to
            order by p.paidAt desc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .setMaxResults(40)
            .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<FloorOrder> recentOrders(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
            select o from FloorOrder o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.openedAt >= :from and o.openedAt < :to
            order by o.openedAt desc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .setMaxResults(40)
            .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<RestaurantShift> recentShifts(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
            select s from RestaurantShift s
            where s.companyId = :companyId and s.storeId = :storeId
              and s.openedAt >= :from and s.openedAt < :to
            order by s.openedAt desc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .setMaxResults(20)
            .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<FloorReservation> recentReservations(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createQuery("""
            select r from FloorReservation r
            join fetch r.table
            where r.companyId = :companyId and r.storeId = :storeId
              and r.createdAt >= :from and r.createdAt < :to
            order by r.createdAt desc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("from", from)
            .setParameter("to", to)
            .setMaxResults(40)
            .getResultList();
    }
}

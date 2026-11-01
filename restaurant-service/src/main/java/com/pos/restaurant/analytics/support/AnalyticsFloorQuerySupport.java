package com.pos.restaurant.analytics.support;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class AnalyticsFloorQuerySupport {

    @PersistenceContext
    private EntityManager em;

    public long countActiveTables(Integer companyId, Integer storeId) {
        return (Long) em.createQuery("""
            select count(t) from FloorTable t
            where t.companyId = :companyId and t.storeId = :storeId and t.active = true
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .getSingleResult();
    }

    public long countTablesByStatus(Integer companyId, Integer storeId, TableStatus status) {
        return (Long) em.createQuery("""
            select count(t) from FloorTable t
            where t.companyId = :companyId and t.storeId = :storeId and t.active = true
              and t.status = :status
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("status", status)
            .getSingleResult();
    }

    public long countKitchenByStatuses(
        Integer companyId, Integer storeId, List<KitchenTicketStatus> statuses
    ) {
        return (Long) em.createQuery("""
            select count(t) from KitchenTicket t
            where t.companyId = :companyId and t.storeId = :storeId
              and t.status in :statuses
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("statuses", statuses)
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
    public List<Object[]> kitchenQueueRows(Integer companyId, Integer storeId) {
        return em.createQuery("""
            select o.orderNo, coalesce(t.code, '—'), k.sentAt, k.status
            from KitchenTicket k
            join k.order o
            left join o.table t
            where k.companyId = :companyId and k.storeId = :storeId
              and k.status in :active
            order by k.sentAt asc
            """)
            .setParameter("companyId", companyId)
            .setParameter("storeId", storeId)
            .setParameter("active", List.of(
                KitchenTicketStatus.NEW,
                KitchenTicketStatus.ACCEPTED,
                KitchenTicketStatus.PREPARING,
                KitchenTicketStatus.READY
            ))
            .setMaxResults(12)
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

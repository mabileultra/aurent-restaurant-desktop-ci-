package com.pos.restaurant.analytics.support;

import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class AnalyticsPaymentQuerySupport {

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

    @SuppressWarnings("unchecked")
    public List<Object[]> salesByHour(Integer companyId, Integer storeId, Instant from, Instant to) {
        return em.createNativeQuery("""
            select cast(extract(hour from p.paid_at) as integer) as hr,
                   cast(count(*) as bigint),
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
}

package com.pos.restaurant.report.support;

import com.pos.restaurant.shift.entity.RestaurantShift;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class ShiftCashReportLoader {

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public List<RestaurantShift> shifts(Integer companyId, Integer storeId, Instant from, Instant to) {
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
            .getResultList();
    }
}

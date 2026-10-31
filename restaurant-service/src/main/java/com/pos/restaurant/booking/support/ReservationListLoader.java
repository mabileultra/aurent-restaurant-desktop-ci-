package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.dto.ReservationStatusStats;
import com.pos.restaurant.booking.entity.FloorReservation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ReservationListLoader {

    private static final String FROM = """
        from FloorReservation r
        join r.table t
        join t.hall h
        """;

    private static final String FROM_FETCH = """
        from FloorReservation r
        join fetch r.table t
        join fetch t.hall h
        """;

    private static final String ORDER_BY = " order by r.reservedAt desc";

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public List<FloorReservation> page(ReservationListCriteria criteria, int offset, int limit) {
        Query query = em.createQuery("select r " + FROM_FETCH + criteria.where() + ORDER_BY);
        bind(query, criteria.params());
        return query.setFirstResult(offset).setMaxResults(limit).getResultList();
    }

    public long count(ReservationListCriteria criteria) {
        Query query = em.createQuery("select count(r) " + FROM + criteria.where());
        bind(query, criteria.params());
        return ((Number) query.getSingleResult()).longValue();
    }

    @SuppressWarnings("unchecked")
    public ReservationStatusStats stats(ReservationListCriteria criteria) {
        Query query = em.createQuery(
            "select r.status, count(r) " + FROM + criteria.statsWhere() + " group by r.status"
        );
        bind(query, criteria.statsParams());
        long pending = 0;
        long confirmed = 0;
        long seated = 0;
        long cancelled = 0;
        for (Object[] row : (List<Object[]>) query.getResultList()) {
            ReservationStatus status = (ReservationStatus) row[0];
            long n = ((Number) row[1]).longValue();
            switch (status) {
                case PENDING -> pending = n;
                case CONFIRMED -> confirmed = n;
                case SEATED -> seated = n;
                case CANCELLED, NO_SHOW -> cancelled += n;
            }
        }
        return new ReservationStatusStats(pending, confirmed, seated, cancelled);
    }

    private static void bind(Query query, Map<String, Object> params) {
        params.forEach(query::setParameter);
    }
}

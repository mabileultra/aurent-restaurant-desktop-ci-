package com.pos.restaurant.report.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.report.dto.ReceiptJournalTotals;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ReceiptJournalLoader {

    private static final int ID_CHUNK = 1000;

    static final String FROM = """
        from FloorOrderPayment p
        join p.order o
        left join o.table t
        left join t.hall h
        """;

    private static final String FROM_FETCH = """
        from FloorOrderPayment p
        join fetch p.order o
        left join fetch o.table t
        left join fetch t.hall h
        """;

    private static final String ORDER_BY = " order by p.paidAt desc, o.orderNo desc";

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public List<FloorOrderPayment> page(ReceiptJournalCriteria criteria, int offset, int limit) {
        Query query = em.createQuery("select p " + FROM_FETCH + criteria.where() + ORDER_BY);
        bind(query, criteria.params());
        return query.setFirstResult(offset).setMaxResults(limit).getResultList();
    }

    public long count(ReceiptJournalCriteria criteria) {
        Query query = em.createQuery("select count(p) " + FROM + criteria.where());
        bind(query, criteria.params());
        return ((Number) query.getSingleResult()).longValue();
    }

    /** Returned dish value per order (partial refunds); full refunds are taken from the payment amount. */
    @SuppressWarnings("unchecked")
    public Map<UUID, BigDecimal> returnedAmounts(List<UUID> orderIds) {
        Map<UUID, BigDecimal> result = new HashMap<>();
        for (int start = 0; start < orderIds.size(); start += ID_CHUNK) {
            List<UUID> chunk = orderIds.subList(start, Math.min(start + ID_CHUNK, orderIds.size()));
            List<Object[]> rows = em.createQuery("""
                select i.order.id, coalesce(sum(i.returnedQuantity * i.unitPrice), 0)
                from FloorOrderItem i
                where i.order.id in :ids
                  and i.returnedQuantity > 0
                  and i.itemStatus <> :cancelled
                group by i.order.id
                """)
                .setParameter("ids", chunk)
                .setParameter("cancelled", OrderItemStatus.CANCELLED)
                .getResultList();
            for (Object[] row : rows) {
                result.put((UUID) row[0], money(row[1]));
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public ReceiptJournalTotals totals(ReceiptJournalCriteria criteria) {
        Query base = em.createQuery("""
            select count(p),
                   coalesce(sum(o.guestCount), 0),
                   coalesce(sum(p.amount), 0),
                   coalesce(sum(p.cashAmount), 0),
                   coalesce(sum(p.cardAmount), 0),
                   coalesce(sum(o.discountAmount), 0),
                   coalesce(sum(coalesce(o.serviceAmount, o.commissionAmount, 0)), 0)
            """ + FROM + criteria.where());
        bind(base, criteria.params());
        Object[] sums = (Object[]) base.getSingleResult();

        Query byMethod = em.createQuery(
            "select p.method, coalesce(sum(p.amount), 0), coalesce(sum(coalesce(p.debtRemaining, 0)), 0) "
                + FROM + criteria.where() + " group by p.method"
        );
        bind(byMethod, criteria.params());
        BigDecimal credit = BigDecimal.ZERO;
        BigDecimal advance = BigDecimal.ZERO;
        BigDecimal debtRemaining = BigDecimal.ZERO;
        for (Object[] row : (List<Object[]>) byMethod.getResultList()) {
            PaymentMethod method = (PaymentMethod) row[0];
            if (method == PaymentMethod.CREDIT) {
                credit = money(row[1]);
                debtRemaining = debtRemaining.add(money(row[1]));
            } else if (method == PaymentMethod.ADVANCE) {
                advance = money(row[1]);
                debtRemaining = debtRemaining.add(money(row[2]));
            }
        }

        BigDecimal refunds = fullRefunds(criteria).add(partialRefunds(criteria));
        long count = ((Number) sums[0]).longValue();
        BigDecimal total = money(sums[2]);
        BigDecimal net = total.subtract(refunds).max(BigDecimal.ZERO);
        BigDecimal average = count == 0
            ? BigDecimal.ZERO.setScale(2)
            : net.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        return new ReceiptJournalTotals(
            count,
            ((Number) sums[1]).longValue(),
            total,
            money(sums[3]),
            money(sums[4]),
            credit,
            advance,
            debtRemaining,
            money(sums[5]),
            money(sums[6]),
            refunds,
            net,
            average
        );
    }

    private BigDecimal fullRefunds(ReceiptJournalCriteria criteria) {
        Query query = em.createQuery(
            "select coalesce(sum(p.amount), 0) " + FROM + criteria.where() + " and o.status = :fullRefundStatus"
        );
        bind(query, criteria.params());
        query.setParameter("fullRefundStatus", OrderStatus.REFUNDED);
        return money(query.getSingleResult());
    }

    private BigDecimal partialRefunds(ReceiptJournalCriteria criteria) {
        Query query = em.createQuery("""
            select coalesce(sum(ri2.returnedQuantity * ri2.unitPrice), 0)
            from FloorOrderItem ri2
            where ri2.returnedQuantity > 0
              and ri2.itemStatus <> :cancelledItem
              and ri2.order.id in (select o.id\s""" + FROM + criteria.where()
            + " and o.status = :partialRefundStatus)"
        );
        bind(query, criteria.params());
        query.setParameter("cancelledItem", OrderItemStatus.CANCELLED);
        query.setParameter("partialRefundStatus", OrderStatus.CLOSED);
        return money(query.getSingleResult());
    }

    private static void bind(Query query, Map<String, Object> params) {
        params.forEach(query::setParameter);
    }

    static BigDecimal money(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        BigDecimal decimal = value instanceof BigDecimal bd ? bd : new BigDecimal(value.toString());
        return decimal.setScale(2, RoundingMode.HALF_UP);
    }

    static List<UUID> orderIds(List<FloorOrderPayment> payments) {
        List<UUID> ids = new ArrayList<>(payments.size());
        payments.forEach(p -> ids.add(p.getOrder().getId()));
        return ids;
    }
}

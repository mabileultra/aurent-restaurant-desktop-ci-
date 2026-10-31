package com.pos.restaurant.report.support;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.report.dto.SalesBreakdownRow;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Hour/day aggregates in SQL (viewer TZ) — avoids loading every payment into heap.
 */
@Component
public class SalesTimeBucketQuery {

    private static final String RETURNS_EXIST =
        "exists (select 1 from floor_order_items ri where ri.order_id = o.id and ri.returned_quantity > 0)";

    @PersistenceContext
    private EntityManager em;

    public List<SalesBreakdownRow> byHour(ReceiptJournalCriteria criteria, ZoneId zone) {
        return bucket(criteria, zone, "HH24");
    }

    public List<SalesBreakdownRow> byDay(ReceiptJournalCriteria criteria, ZoneId zone) {
        return bucket(criteria, zone, "YYYY-MM-DD");
    }

    @SuppressWarnings("unchecked")
    private List<SalesBreakdownRow> bucket(ReceiptJournalCriteria criteria, ZoneId zone, String pattern) {
        StringBuilder sql = new StringBuilder("""
            select to_char(p.paid_at AT TIME ZONE :tz, '%s') as bucket,
                   cast(count(*) as bigint),
                   coalesce(sum(p.amount), 0)
            from floor_order_payments p
            join floor_orders o on o.id = p.order_id
            left join floor_tables t on t.id = o.table_id
            left join floor_halls h on h.id = t.hall_id
            where o.company_id = :companyId
              and o.store_id = :storeId
              and o.status in (:paidStatuses)
              and p.paid_at >= :from and p.paid_at < :to
              and p.paid_at = (
                  select max(p2.paid_at) from floor_order_payments p2 where p2.order_id = o.id
              )
            """.formatted(pattern));

        Map<String, Object> params = criteria.params();
        appendOptionalFilters(sql, params);

        sql.append(" group by 1 order by 1");

        Query query = em.createNativeQuery(sql.toString());
        query.setParameter("tz", zone.getId());
        query.setParameter("companyId", params.get("companyId"));
        query.setParameter("storeId", params.get("storeId"));
        query.setParameter("paidStatuses", statusNames(params.get("paidStatuses")));
        query.setParameter("from", Timestamp.from((Instant) params.get("from")));
        query.setParameter("to", Timestamp.from((Instant) params.get("to")));
        bindOptional(query, params);

        List<Object[]> raw = query.getResultList();
        List<SalesBreakdownRow> rows = new ArrayList<>(raw.size());
        for (Object[] row : raw) {
            rows.add(new SalesBreakdownRow(
                row[0] == null ? null : String.valueOf(row[0]),
                ((Number) row[1]).longValue(),
                ReceiptJournalLoader.money(row[2])
            ));
        }
        return rows;
    }

    private static void appendOptionalFilters(StringBuilder sql, Map<String, Object> params) {
        if (params.containsKey("methods")) {
            sql.append(" and p.method in (:methods)");
        }
        if (params.containsKey("receiptStatus")) {
            sql.append(" and o.status = :receiptStatus");
        }
        if (params.containsKey("requireReturns")) {
            if (Boolean.TRUE.equals(params.get("requireReturns"))) {
                sql.append(" and ").append(RETURNS_EXIST);
            } else {
                sql.append(" and not ").append(RETURNS_EXIST);
            }
        }
        if (params.containsKey("waiterUserId")) {
            sql.append(" and o.waiter_user_id = :waiterUserId");
        }
        if (params.containsKey("cashierUserId")) {
            sql.append(" and p.paid_by_user_id = :cashierUserId");
        }
        if (params.containsKey("hallId")) {
            sql.append(" and h.id = :hallId");
        }
        if (params.containsKey("channel")) {
            sql.append(" and o.channel = :channel");
        }
        if (params.containsKey("searchLike")) {
            sql.append("""
                 and (
                   lower(t.code) like :searchLike escape '\\'
                   or lower(o.client_name) like :searchLike escape '\\'
                   or lower(o.client_phone) like :searchLike escape '\\'
                   or lower(p.debt_phone) like :searchLike escape '\\'
                   or lower(p.debt_comment) like :searchLike escape '\\'
                """);
            if (params.containsKey("searchNo")) {
                sql.append(" or o.order_no = :searchNo");
            }
            sql.append(')');
        }
    }

    private static void bindOptional(Query query, Map<String, Object> params) {
        if (params.containsKey("methods")) {
            query.setParameter("methods", enumNames(params.get("methods")));
        }
        if (params.containsKey("receiptStatus")) {
            Object status = params.get("receiptStatus");
            query.setParameter("receiptStatus", status instanceof Enum<?> e ? e.name() : String.valueOf(status));
        }
        if (params.containsKey("waiterUserId")) {
            query.setParameter("waiterUserId", params.get("waiterUserId"));
        }
        if (params.containsKey("cashierUserId")) {
            query.setParameter("cashierUserId", params.get("cashierUserId"));
        }
        if (params.containsKey("hallId")) {
            query.setParameter("hallId", params.get("hallId"));
        }
        if (params.containsKey("channel")) {
            Object channel = params.get("channel");
            query.setParameter("channel", channel instanceof OrderChannel c ? c.name() : String.valueOf(channel));
        }
        if (params.containsKey("searchLike")) {
            query.setParameter("searchLike", params.get("searchLike"));
        }
        if (params.containsKey("searchNo")) {
            query.setParameter("searchNo", params.get("searchNo"));
        }
    }

    private static List<String> statusNames(Object value) {
        if (value instanceof Collection<?> collection) {
            List<String> names = new ArrayList<>(collection.size());
            for (Object item : collection) {
                names.add(item instanceof OrderStatus s ? s.name() : String.valueOf(item));
            }
            return names;
        }
        return List.of(OrderStatus.CLOSED.name(), OrderStatus.REFUNDED.name());
    }

    private static List<String> enumNames(Object value) {
        if (!(value instanceof Collection<?> collection)) {
            return List.of();
        }
        List<String> names = new ArrayList<>(collection.size());
        for (Object item : collection) {
            if (item instanceof PaymentMethod method) {
                names.add(method.name());
            } else if (item instanceof Enum<?> e) {
                names.add(e.name());
            } else {
                names.add(String.valueOf(item));
            }
        }
        return names;
    }
}

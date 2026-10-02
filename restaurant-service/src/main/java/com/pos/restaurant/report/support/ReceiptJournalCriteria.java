package com.pos.restaurant.report.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.report.domain.ReceiptStatus;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * JPQL where-clause for the receipt journal. Aliases: {@code p} payment, {@code o} order,
 * {@code t} table, {@code h} hall. Only the latest payment of a CLOSED/REFUNDED order counts.
 */
public final class ReceiptJournalCriteria {

    static final Duration MAX_RANGE = Duration.ofDays(366);
    private static final int MAX_SEARCH = 64;

    private static final String RETURNED_EXISTS =
        "exists (select 1 from FloorOrderItem ri where ri.order = o and ri.returnedQuantity > 0)";

    private final String where;
    private final Map<String, Object> params;

    private ReceiptJournalCriteria(String where, Map<String, Object> params) {
        this.where = where;
        this.params = params;
    }

    public static ReceiptJournalCriteria of(Integer companyId, Integer storeId, ReceiptJournalFilter filter) {
        if (filter == null || filter.from() == null || filter.to() == null) {
            throw new ValidationException("Укажите период отчёта");
        }
        Instant from = filter.from();
        Instant to = filter.to();
        if (!to.isAfter(from)) {
            throw new ValidationException("Конец периода должен быть позже начала");
        }
        if (Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
            throw new ValidationException("Период отчёта не может быть больше года");
        }

        StringBuilder sql = new StringBuilder("""
             where o.companyId = :companyId and o.storeId = :storeId
               and o.status in :paidStatuses
               and p.paidAt >= :from and p.paidAt < :to
               and p.paidAt = (select max(p2.paidAt) from FloorOrderPayment p2 where p2.order = o)
            """);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("companyId", companyId);
        params.put("storeId", storeId);
        params.put("paidStatuses", List.of(OrderStatus.CLOSED, OrderStatus.REFUNDED));
        params.put("from", from);
        params.put("to", to);

        if (filter.methods() != null && !filter.methods().isEmpty()) {
            sql.append(" and p.method in :methods");
            params.put("methods", List.copyOf(filter.methods()));
        }
        if (filter.status() != null) {
            switch (filter.status()) {
                case PAID -> sql.append(" and o.status = :receiptStatus and not ").append(RETURNED_EXISTS);
                case PARTIAL_REFUND -> sql.append(" and o.status = :receiptStatus and ").append(RETURNED_EXISTS);
                case REFUNDED -> sql.append(" and o.status = :receiptStatus");
            }
            params.put(
                "receiptStatus",
                filter.status() == ReceiptStatus.REFUNDED ? OrderStatus.REFUNDED : OrderStatus.CLOSED
            );
        }
        if (filter.waiterUserId() != null) {
            sql.append(" and o.waiterUserId = :waiterUserId");
            params.put("waiterUserId", filter.waiterUserId());
        }
        if (filter.cashierUserId() != null) {
            sql.append(" and p.paidByUserId = :cashierUserId");
            params.put("cashierUserId", filter.cashierUserId());
        }
        if (filter.hallId() != null) {
            sql.append(" and h.id = :hallId");
            params.put("hallId", filter.hallId());
        }
        if (filter.channel() != null) {
            sql.append(" and o.channel = :channel");
            params.put("channel", filter.channel());
        }
        appendSearch(sql, params, filter.search());
        return new ReceiptJournalCriteria(sql.toString(), params);
    }

    private static void appendSearch(StringBuilder sql, Map<String, Object> params, String raw) {
        if (raw == null || raw.isBlank()) {
            return;
        }
        String term = raw.trim();
        if (term.length() > MAX_SEARCH) {
            term = term.substring(0, MAX_SEARCH);
        }
        String like = "%" + escapeLike(term.toLowerCase(Locale.ROOT)) + "%";
        params.put("searchLike", like);
        sql.append(" and (lower(t.code) like :searchLike escape '\\'")
            .append(" or lower(o.clientName) like :searchLike escape '\\'")
            .append(" or lower(o.clientPhone) like :searchLike escape '\\'")
            .append(" or lower(p.debtPhone) like :searchLike escape '\\'")
            .append(" or lower(p.debtComment) like :searchLike escape '\\'");
        String digits = term.startsWith("№") || term.startsWith("#") ? term.substring(1).trim() : term;
        if (digits.matches("\\d{1,9}")) {
            sql.append(" or o.orderNo = :searchNo");
            params.put("searchNo", Integer.parseInt(digits));
        }
        sql.append(')');
    }

    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    public String where() {
        return where;
    }

    public Map<String, Object> params() {
        return params;
    }
}

package com.pos.restaurant.report.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.report.dto.DishSalesReportRow;
import com.pos.restaurant.report.dto.SalesBreakdownRow;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/** Sales breakdowns over the same check set as the receipt journal ({@link ReceiptJournalCriteria}). */
@Component
public class SalesReportLoader {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    @PersistenceContext
    private EntityManager em;

    public List<SalesBreakdownRow> byMethod(ReceiptJournalCriteria criteria) {
        return breakdown("p.method", "p.amount", "", criteria);
    }

    public List<SalesBreakdownRow> byCardType(ReceiptJournalCriteria criteria) {
        return breakdown("p.cardType", "p.cardAmount", " and p.cardType is not null", criteria);
    }

    public List<SalesBreakdownRow> byChannel(ReceiptJournalCriteria criteria) {
        return breakdown("o.channel", "p.amount", "", criteria);
    }

    public List<SalesBreakdownRow> byHall(ReceiptJournalCriteria criteria) {
        return breakdown("h.name", "p.amount", "", criteria);
    }

    @SuppressWarnings("unchecked")
    public List<DishSalesReportRow> dishes(ReceiptJournalCriteria criteria, int maxRows) {
        Query query = em.createQuery("""
            select di.name,
                   dm.category,
                   coalesce(sum(di.quantity), 0),
                   coalesce(sum(di.returnedQuantity), 0),
                   coalesce(sum(di.quantity * di.unitPrice), 0),
                   coalesce(sum(di.returnedQuantity * di.unitPrice), 0),
                   count(distinct dord.id)
            from FloorOrderItem di
            join di.order dord
            left join di.menuItem dm
            where di.itemStatus <> :cancelledItem
              and dord.id in (select o.id\s""" + ReceiptJournalLoader.FROM + criteria.where() + """
            )
            group by di.name, dm.category
            """);
        criteria.params().forEach(query::setParameter);
        query.setParameter("cancelledItem", OrderItemStatus.CANCELLED);
        List<Object[]> raw = query.getResultList();

        List<DishSalesReportRow> unsorted = new ArrayList<>(raw.size());
        for (Object[] row : raw) {
            BigDecimal gross = ReceiptJournalLoader.money(row[4]);
            BigDecimal refund = ReceiptJournalLoader.money(row[5]);
            BigDecimal net = gross.subtract(refund);
            BigDecimal qty = quantity(row[2]);
            BigDecimal returned = quantity(row[3]);
            unsorted.add(new DishSalesReportRow(
                (String) row[0],
                (String) row[1],
                qty,
                returned,
                qty.subtract(returned),
                gross,
                refund,
                net,
                ((Number) row[6]).longValue(),
                BigDecimal.ZERO.setScale(1)
            ));
        }
        unsorted.sort((a, b) -> {
            int byAmount = b.netAmount().compareTo(a.netAmount());
            return byAmount != 0 ? byAmount : b.netQuantity().compareTo(a.netQuantity());
        });

        int limit = Math.max(maxRows, 1);
        List<DishSalesReportRow> top = unsorted.size() <= limit
            ? unsorted
            : unsorted.subList(0, limit);

        BigDecimal netTotal = BigDecimal.ZERO;
        for (DishSalesReportRow row : top) {
            netTotal = netTotal.add(row.netAmount());
        }

        List<DishSalesReportRow> rows = new ArrayList<>(top.size());
        for (DishSalesReportRow row : top) {
            rows.add(new DishSalesReportRow(
                row.name(),
                row.category(),
                row.quantity(),
                row.returnedQuantity(),
                row.netQuantity(),
                row.grossAmount(),
                row.refundAmount(),
                row.netAmount(),
                row.orderCount(),
                share(row.netAmount(), netTotal)
            ));
        }
        return rows;
    }

    @SuppressWarnings("unchecked")
    private List<SalesBreakdownRow> breakdown(
        String keyExpr, String amountExpr, String extraWhere, ReceiptJournalCriteria criteria
    ) {
        Query query = em.createQuery(
            "select " + keyExpr + ", count(p), coalesce(sum(" + amountExpr + "), 0) "
                + ReceiptJournalLoader.FROM + criteria.where() + extraWhere
                + " group by " + keyExpr
        );
        criteria.params().forEach(query::setParameter);
        List<Object[]> raw = query.getResultList();
        List<SalesBreakdownRow> rows = new ArrayList<>(raw.size());
        for (Object[] row : raw) {
            Object key = row[0];
            rows.add(new SalesBreakdownRow(
                key == null ? null : (key instanceof Enum<?> e ? e.name() : key.toString()),
                ((Number) row[1]).longValue(),
                ReceiptJournalLoader.money(row[2])
            ));
        }
        rows.sort((a, b) -> b.amount().compareTo(a.amount()));
        return rows;
    }

    static BigDecimal share(BigDecimal part, BigDecimal total) {
        if (total == null || total.signum() <= 0) {
            return BigDecimal.ZERO.setScale(1);
        }
        return part.multiply(HUNDRED).divide(total, 1, RoundingMode.HALF_UP);
    }

    private static BigDecimal quantity(Object value) {
        BigDecimal qty = value instanceof BigDecimal bd ? bd : new BigDecimal(String.valueOf(value));
        return qty.stripTrailingZeros().scale() < 0 ? qty.setScale(0) : qty.stripTrailingZeros();
    }
}

package com.pos.restaurant.shift.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.shift.dto.ShiftItemRow;
import com.pos.restaurant.shift.entity.RestaurantShift;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

/**
 * Dishes sold during a shift window (paid orders closed between open and close),
 * matching how {@link ShiftSaleAccumulator} attributes payments to the open shift.
 */
@Component
public class ShiftItemSalesLoader {

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public List<ShiftItemRow> load(RestaurantShift shift, Instant until) {
        Instant to = shift.getClosedAt() != null ? shift.getClosedAt() : until;
        List<Object[]> raw = em.createQuery("""
            select i.name, coalesce(sum(i.quantity), 0), coalesce(sum(i.quantity * i.unitPrice), 0)
            from FloorOrderItem i
            join i.order o
            where o.companyId = :companyId and o.storeId = :storeId
              and o.status = :closed
              and o.closedAt >= :from and o.closedAt <= :to
              and i.itemStatus <> :cancelled
            group by i.name
            order by coalesce(sum(i.quantity), 0) desc, i.name
            """)
            .setParameter("companyId", shift.getCompanyId())
            .setParameter("storeId", shift.getStoreId())
            .setParameter("closed", OrderStatus.CLOSED)
            .setParameter("cancelled", OrderItemStatus.CANCELLED)
            .setParameter("from", shift.getOpenedAt())
            .setParameter("to", to)
            .getResultList();
        return raw.stream()
            .map(row -> new ShiftItemRow(
                (String) row[0],
                scale(row[1]),
                scale(row[2])
            ))
            .toList();
    }

    private static BigDecimal scale(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO.setScale(2);
    }
}

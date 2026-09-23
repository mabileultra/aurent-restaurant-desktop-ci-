package com.pos.restaurant.order.repository.spec;

import com.pos.restaurant.order.domain.DeliveryStatus;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Optional filters must be applied in Java — PostgreSQL cannot infer JDBC types for
 * {@code (:param is null or col = :param)} when the bind is NULL (enums / timestamps).
 */
public final class FloorOrderSpecifications {

    private FloorOrderSpecifications() {}

    public static Specification<FloorOrder> searchByChannel(
        Integer companyId,
        Integer storeId,
        OrderChannel channel,
        OrderStatus status,
        DeliveryStatus deliveryStatus,
        String q,
        Instant openedFrom,
        Instant openedTo
    ) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("companyId"), companyId));
            preds.add(cb.equal(root.get("storeId"), storeId));
            preds.add(cb.equal(root.get("channel"), channel));

            if (status != null) {
                preds.add(cb.equal(root.get("status"), status));
            }
            if (deliveryStatus != null) {
                preds.add(cb.equal(root.get("deliveryStatus"), deliveryStatus));
            }
            if (openedFrom != null) {
                preds.add(cb.greaterThanOrEqualTo(root.get("openedAt"), openedFrom));
            }
            if (openedTo != null) {
                preds.add(cb.lessThan(root.get("openedAt"), openedTo));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                preds.add(cb.or(
                    cb.like(cb.lower(cb.coalesce(root.get("clientName"), "")), like),
                    cb.like(cb.lower(cb.coalesce(root.get("clientPhone"), "")), like),
                    cb.like(cb.lower(cb.coalesce(root.get("deliveryAddress"), "")), like),
                    cb.like(root.get("orderNo").as(String.class), "%" + q.trim() + "%")
                ));
            }

            // Stable default when caller Pageable has no sort (matches previous JPQL order).
            if (query != null && query.getOrderList().isEmpty()) {
                query.orderBy(cb.desc(root.get("openedAt")));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };
    }
}

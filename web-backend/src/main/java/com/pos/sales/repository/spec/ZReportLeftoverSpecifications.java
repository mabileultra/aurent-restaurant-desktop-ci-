package com.pos.sales.repository.spec;

import com.pos.sales.entity.ZReport;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public final class ZReportLeftoverSpecifications {

    private ZReportLeftoverSpecifications() {
    }

    public static Specification<ZReport> notLeftoverEmptyClose() {
        return (root, query, cb) -> cb.not(leftoverEmptyClose(root, cb));
    }

    static Predicate leftoverEmptyClose(Root<ZReport> root, CriteriaBuilder cb) {
        Expression<Double> closedEpoch = cb.function(
            "date_part",
            Double.class,
            cb.literal("epoch"),
            root.get("closedAt")
        );
        Expression<Double> openedEpoch = cb.function(
            "date_part",
            Double.class,
            cb.literal("epoch"),
            root.get("openedAt")
        );
        Predicate shortLived = cb.le(cb.diff(closedEpoch, openedEpoch), 300.0);
        Predicate empty = cb.and(
            cb.or(cb.isNull(root.get("salesCount")), cb.equal(root.get("salesCount"), 0)),
            cb.or(cb.isNull(root.get("returnsCount")), cb.equal(root.get("returnsCount"), 0)),
            zeroOrNull(cb, root, "totalAmount"),
            zeroOrNull(cb, root, "returnsCash"),
            zeroOrNull(cb, root, "returnsCard"),
            zeroOrNull(cb, root, "returnsHumo"),
            zeroOrNull(cb, root, "returnsUzcard"),
            zeroOrNull(cb, root, "returnsCashless"),
            zeroOrNull(cb, root, "vatReturn")
        );
        return cb.and(empty, shortLived);
    }

    private static Predicate zeroOrNull(CriteriaBuilder cb, Root<ZReport> root, String field) {
        return cb.or(cb.isNull(root.get(field)), cb.equal(root.get(field), BigDecimal.ZERO));
    }
}

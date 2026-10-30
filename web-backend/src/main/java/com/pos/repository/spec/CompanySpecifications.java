package com.pos.repository.spec;

import com.pos.entity.Company;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CompanySpecifications {

    private CompanySpecifications() {}

    public static Specification<Company> filter(String search) {
        return filter(search, null, null, null);
    }

    public static Specification<Company> filter(
        String search,
        String status,
        String businessType,
        String regionCode
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("loginCode")), pattern)
                ));
            }

            Boolean active = StoreSpecifications.parseActiveStatus(status);
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            if (StringUtils.hasText(businessType)) {
                predicates.add(cb.equal(cb.upper(root.get("businessType")), businessType.trim().toUpperCase()));
            }

            if (StringUtils.hasText(regionCode)) {
                predicates.add(cb.equal(root.get("regionCode"), regionCode.trim()));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}

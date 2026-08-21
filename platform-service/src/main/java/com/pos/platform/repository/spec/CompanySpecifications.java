package com.pos.platform.repository.spec;

import com.pos.platform.entity.Company;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CompanySpecifications {

    private CompanySpecifications() {}

    public static Specification<Company> filter(String search, String businessType) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.and(root.get("loginCode").isNotNull(), cb.like(cb.lower(root.get("loginCode")), pattern)),
                    cb.and(root.get("legalName").isNotNull(), cb.like(cb.lower(root.get("legalName")), pattern)),
                    cb.and(root.get("tin").isNotNull(), cb.like(cb.lower(root.get("tin")), pattern)),
                    cb.and(root.get("phone").isNotNull(), cb.like(cb.lower(root.get("phone")), pattern))
                ));
            }

            if (StringUtils.hasText(businessType)) {
                predicates.add(cb.equal(cb.upper(root.get("businessType")), businessType.trim().toUpperCase()));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}

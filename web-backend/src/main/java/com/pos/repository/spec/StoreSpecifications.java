package com.pos.repository.spec;

import com.pos.entity.Store;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class StoreSpecifications {

    private StoreSpecifications() {}

    public static Specification<Store> filter(
        String search,
        Integer companyId,
        String businessType,
        String regionCode,
        String districtCode
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var company = root.join("company", JoinType.LEFT);
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.and(root.get("code").isNotNull(), cb.like(cb.lower(root.get("code")), pattern)),
                    cb.and(root.get("address").isNotNull(), cb.like(cb.lower(root.get("address")), pattern)),
                    cb.and(root.get("phone").isNotNull(), cb.like(cb.lower(root.get("phone")), pattern)),
                    cb.and(company.get("name").isNotNull(), cb.like(cb.lower(company.get("name")), pattern)),
                    cb.and(company.get("loginCode").isNotNull(), cb.like(cb.lower(company.get("loginCode")), pattern))
                ));
                if (query != null) {
                    query.distinct(true);
                }
            }

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (StringUtils.hasText(businessType)) {
                predicates.add(cb.equal(cb.upper(root.get("businessType")), businessType.trim().toUpperCase()));
            }

            if (StringUtils.hasText(regionCode)) {
                predicates.add(cb.equal(root.get("regionCode"), regionCode.trim()));
            }

            if (StringUtils.hasText(districtCode)) {
                predicates.add(cb.equal(root.get("districtCode"), districtCode.trim()));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}

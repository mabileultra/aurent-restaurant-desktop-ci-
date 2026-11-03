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
        return filter(search, companyId, businessType, regionCode, districtCode, null);
    }

    public static Specification<Store> filter(
        String search,
        Integer companyId,
        String businessType,
        String regionCode,
        String districtCode,
        String status
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String raw = search.trim();
                String pattern = "%" + raw.toLowerCase() + "%";
                String digits = raw.replaceAll("\\D", "");
                var company = root.join("company", JoinType.LEFT);
                List<Predicate> searchOr = new ArrayList<>();
                searchOr.add(cb.like(cb.lower(root.get("name")), pattern));
                searchOr.add(cb.and(root.get("code").isNotNull(), cb.like(cb.lower(root.get("code")), pattern)));
                searchOr.add(cb.and(root.get("address").isNotNull(), cb.like(cb.lower(root.get("address")), pattern)));
                searchOr.add(cb.and(root.get("phone").isNotNull(), cb.like(cb.lower(root.get("phone")), pattern)));
                searchOr.add(cb.and(company.get("name").isNotNull(), cb.like(cb.lower(company.get("name")), pattern)));
                searchOr.add(cb.and(
                    company.get("loginCode").isNotNull(),
                    cb.like(cb.lower(company.get("loginCode")), pattern)
                ));
                if (digits.length() >= 3) {
                    String digitPattern = "%" + digits + "%";
                    searchOr.add(cb.and(root.get("phone").isNotNull(), cb.like(root.get("phone"), digitPattern)));
                    searchOr.add(cb.and(company.get("phone").isNotNull(), cb.like(company.get("phone"), digitPattern)));
                }
                predicates.add(cb.or(searchOr.toArray(Predicate[]::new)));
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
                String region = regionCode.trim();
                var company = root.join("company", JoinType.LEFT);
                predicates.add(cb.or(
                    cb.equal(root.get("regionCode"), region),
                    cb.and(root.get("regionCode").isNull(), cb.equal(company.get("regionCode"), region))
                ));
            }

            if (StringUtils.hasText(districtCode)) {
                String district = districtCode.trim();
                var company = root.join("company", JoinType.LEFT);
                predicates.add(cb.or(
                    cb.equal(root.get("districtCode"), district),
                    cb.and(root.get("districtCode").isNull(), cb.equal(company.get("districtCode"), district))
                ));
            }

            Boolean active = parseActiveStatus(status);
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /** ACTIVE / INACTIVE / ALL (or null) → Boolean filter; ALL/null = no filter. */
    public static Boolean parseActiveStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        if ("ACTIVE".equals(normalized)) {
            return true;
        }
        if ("INACTIVE".equals(normalized)) {
            return false;
        }
        return null;
    }
}

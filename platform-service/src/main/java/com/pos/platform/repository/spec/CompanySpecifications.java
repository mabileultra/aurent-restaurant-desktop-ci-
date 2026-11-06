package com.pos.platform.repository.spec;

import com.pos.platform.entity.Company;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CompanySpecifications {

    private CompanySpecifications() {}

    public static Specification<Company> filter(
        String search,
        String businessType,
        String regionCode,
        String districtCode
    ) {
        return filter(search, businessType, regionCode, districtCode, null);
    }

    public static Specification<Company> filter(
        String search,
        String businessType,
        String regionCode,
        String districtCode,
        Boolean active
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String raw = search.trim();
                String pattern = "%" + raw.toLowerCase() + "%";
                String digits = raw.replaceAll("\\D", "");
                List<Predicate> searchOr = new ArrayList<>();
                searchOr.add(cb.like(cb.lower(root.get("name")), pattern));
                searchOr.add(cb.and(root.get("loginCode").isNotNull(), cb.like(cb.lower(root.get("loginCode")), pattern)));
                searchOr.add(cb.and(root.get("legalName").isNotNull(), cb.like(cb.lower(root.get("legalName")), pattern)));
                searchOr.add(cb.and(root.get("tin").isNotNull(), cb.like(cb.lower(root.get("tin")), pattern)));
                searchOr.add(cb.and(root.get("phone").isNotNull(), cb.like(cb.lower(root.get("phone")), pattern)));
                if (digits.length() >= 3) {
                    searchOr.add(cb.and(root.get("phone").isNotNull(), cb.like(root.get("phone"), "%" + digits + "%")));
                    searchOr.add(cb.and(root.get("tin").isNotNull(), cb.like(root.get("tin"), "%" + digits + "%")));
                    searchOr.add(cb.and(root.get("loginCode").isNotNull(), cb.like(root.get("loginCode"), "%" + digits + "%")));
                }
                predicates.add(cb.or(searchOr.toArray(Predicate[]::new)));
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

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}

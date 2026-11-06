package com.pos.repository.spec;

import com.pos.entity.Company;
import com.pos.entity.Store;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CompanySpecifications {

    private CompanySpecifications() {}

    public static Specification<Company> filter(String search) {
        return filter(search, null, null, null, null);
    }

    public static Specification<Company> filter(
        String search,
        String status,
        String businessType,
        String regionCode
    ) {
        return filter(search, status, businessType, regionCode, null);
    }

    public static Specification<Company> filter(
        String search,
        String status,
        String businessType,
        String regionCode,
        String districtCode
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String raw = search.trim();
                String pattern = "%" + raw.toLowerCase() + "%";
                String digits = raw.replaceAll("\\D", "");
                List<Predicate> searchOr = new ArrayList<>();
                searchOr.add(cb.like(cb.lower(root.get("name")), pattern));
                searchOr.add(cb.like(cb.lower(root.get("loginCode")), pattern));
                searchOr.add(cb.and(root.get("legalName").isNotNull(), cb.like(cb.lower(root.get("legalName")), pattern)));
                searchOr.add(cb.and(root.get("tin").isNotNull(), cb.like(cb.lower(root.get("tin")), pattern)));
                searchOr.add(cb.and(root.get("phone").isNotNull(), cb.like(cb.lower(root.get("phone")), pattern)));
                if (digits.length() >= 3) {
                    searchOr.add(cb.and(root.get("phone").isNotNull(), cb.like(root.get("phone"), "%" + digits + "%")));
                    searchOr.add(cb.and(root.get("tin").isNotNull(), cb.like(root.get("tin"), "%" + digits + "%")));
                }

                if (query != null) {
                    Subquery<Integer> storeSub = query.subquery(Integer.class);
                    Root<Store> storeRoot = storeSub.from(Store.class);
                    List<Predicate> storeSearchOr = new ArrayList<>();
                    storeSearchOr.add(cb.like(cb.lower(storeRoot.get("name")), pattern));
                    storeSearchOr.add(cb.and(
                        storeRoot.get("code").isNotNull(),
                        cb.like(cb.lower(storeRoot.get("code")), pattern)
                    ));
                    storeSearchOr.add(cb.and(
                        storeRoot.get("address").isNotNull(),
                        cb.like(cb.lower(storeRoot.get("address")), pattern)
                    ));
                    storeSearchOr.add(cb.and(
                        storeRoot.get("phone").isNotNull(),
                        cb.like(cb.lower(storeRoot.get("phone")), pattern)
                    ));
                    if (digits.length() >= 3) {
                        storeSearchOr.add(cb.and(
                            storeRoot.get("phone").isNotNull(),
                            cb.like(storeRoot.get("phone"), "%" + digits + "%")
                        ));
                    }
                    storeSub.select(cb.literal(1)).where(
                        cb.equal(storeRoot.get("company").get("id"), root.get("id")),
                        cb.or(storeSearchOr.toArray(Predicate[]::new))
                    );
                    searchOr.add(cb.exists(storeSub));
                }

                predicates.add(cb.or(searchOr.toArray(Predicate[]::new)));
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

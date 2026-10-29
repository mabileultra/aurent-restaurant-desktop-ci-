package com.pos.identity.repository.spec;

import com.pos.identity.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public final class UserListSpecifications {

    private static final List<String> HIDDEN_ROLES = List.of("PLATFORM_ADMIN", "PLATFORM_ANALYTICS");

    private UserListSpecifications() {
    }

    public static Specification<User> managedList(
        Collection<String> searches,
        Collection<Integer> companyIds,
        Collection<Integer> searchCompanyIds,
        Collection<UUID> searchUserIds,
        Collection<String> allowedRoles,
        boolean includeSuperAdmin,
        Collection<String> roleNames,
        Boolean active
    ) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();
            parts.add(cb.not(root.get("role").get("name").in(HIDDEN_ROLES)));
            if (!includeSuperAdmin) {
                parts.add(cb.notEqual(root.get("role").get("name"), "SUPER_ADMIN"));
            }
            if (companyIds != null) {
                if (companyIds.isEmpty()) {
                    parts.add(cb.disjunction());
                } else {
                    parts.add(root.get("companyId").in(companyIds));
                }
            }
            if (allowedRoles != null && !allowedRoles.isEmpty()) {
                parts.add(root.get("role").get("name").in(allowedRoles));
            }
            if (roleNames != null && !roleNames.isEmpty()) {
                parts.add(root.get("role").get("name").in(roleNames));
            }
            if (active != null) {
                parts.add(cb.equal(root.get("isActive"), active));
            }
            List<Predicate> matches = new ArrayList<>();
            if (searches != null) {
                for (String search : searches) {
                    if (!StringUtils.hasText(search)) {
                        continue;
                    }
                    String pattern = "%" + search.trim().toLowerCase() + "%";
                    matches.add(cb.like(cb.lower(root.get("fullName")), pattern));
                    matches.add(cb.like(cb.lower(root.get("username")), pattern));
                    matches.add(cb.like(cb.lower(root.get("email")), pattern));
                    matches.add(cb.like(cb.lower(root.get("role").get("name")), pattern));
                }
            }
            if (!matches.isEmpty()) {
                if (searchCompanyIds != null && !searchCompanyIds.isEmpty()) {
                    matches.add(root.get("companyId").in(searchCompanyIds));
                }
                if (searchUserIds != null && !searchUserIds.isEmpty()) {
                    matches.add(root.get("id").in(searchUserIds));
                }
                parts.add(cb.or(matches.toArray(Predicate[]::new)));
            }
            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}

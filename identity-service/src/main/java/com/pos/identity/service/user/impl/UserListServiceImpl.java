package com.pos.identity.service.user.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.client.dto.StoreNameItem;
import com.pos.identity.dto.user.ManagedUserCounts;
import com.pos.identity.dto.user.ManagedUserPage;
import com.pos.identity.dto.user.UserListCriteria;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserListSpecifications;
import com.pos.identity.service.user.UserListService;
import com.pos.identity.service.user.support.ManagedUserAssembler;
import com.pos.identity.service.user.support.UserListRoleGroups;
import com.pos.identity.service.user.support.UserListScope;
import com.pos.identity.service.user.support.UserListScopeResolver;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserListServiceImpl implements UserListService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final UserRepository userRepository;
    private final UserListScopeResolver scopeResolver;
    private final ManagedUserAssembler assembler;
    private final PosCoreClient posCoreClient;

    @Override
    public ManagedUserPage list(UserListCriteria criteria, Pageable pageable) {
        Pageable sorted = sorted(pageable);
        UserListScope scope = scopeResolver.resolve(criteria);
        if (scope.companyIds() != null && scope.companyIds().isEmpty()) {
            return ManagedUserPage.empty(sorted.getPageSize(), sorted.getPageNumber());
        }
        Specification<User> context = specification(criteria, scope, null, null);
        Specification<User> pageSpec = specification(criteria, scope, criteria.role(), criteria.active());
        Page<User> page = userRepository.findAll(pageSpec, sorted);
        ManagedUserCounts counts = counts(context, criteria.role());
        if (page.isEmpty()) {
            return ManagedUserPage.of(List.of(), page.getTotalPages(), page.getTotalElements(),
                page.getSize(), page.getNumber(), counts);
        }
        Map<Integer, CompanyDirectoryItem> companies = companiesOf(page.getContent());
        Map<Integer, String> storeNames = storeNamesOf(page.getContent());
        return ManagedUserPage.of(
            page.map(user -> assembler.toRow(user, companies, storeNames)).getContent(),
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber(),
            counts
        );
    }

    private ManagedUserCounts counts(Specification<User> context, String role) {
        long totalUsers = userRepository.count(context);
        long activeUsers = userRepository.count(specificationWith(context, null, true));
        long inactiveUsers = Math.max(0, totalUsers - activeUsers);
        long adminUsers = userRepository.count(specificationWith(context, "MANAGEMENT", null));
        long staffUsers = userRepository.count(specificationWith(context, "STAFF", null));
        if (UserListRoleGroups.resolve(role) == null) {
            return new ManagedUserCounts(
                totalUsers, activeUsers, inactiveUsers, adminUsers, staffUsers,
                totalUsers, activeUsers, inactiveUsers
            );
        }
        Specification<User> tab = specificationWith(context, role, null);
        long tabTotal = userRepository.count(tab);
        long tabActive = userRepository.count(specificationWith(context, role, true));
        long tabInactive = Math.max(0, tabTotal - tabActive);
        return new ManagedUserCounts(
            totalUsers, activeUsers, inactiveUsers, adminUsers, staffUsers,
            tabTotal, tabActive, tabInactive
        );
    }

    private Specification<User> specification(
        UserListCriteria criteria,
        UserListScope scope,
        String role,
        Boolean active
    ) {
        return UserListSpecifications.managedList(
            searches(criteria),
            scope.companyIds(),
            scope.searchCompanyIds(),
            scope.searchUserIds(),
            scope.allowedRoles(),
            scope.includeSuperAdmin(),
            UserListRoleGroups.resolve(role),
            active
        );
    }

    private Specification<User> specificationWith(Specification<User> context, String role, Boolean active) {
        List<String> roleNames = UserListRoleGroups.resolve(role);
        if (roleNames == null && active == null) {
            return context;
        }
        return context.and((root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> parts = new ArrayList<>();
            if (roleNames != null) {
                parts.add(root.get("role").get("name").in(roleNames));
            }
            if (active != null) {
                parts.add(cb.equal(root.get("isActive"), active));
            }
            return cb.and(parts.toArray(jakarta.persistence.criteria.Predicate[]::new));
        });
    }

    private static List<String> searches(UserListCriteria criteria) {
        List<String> terms = new ArrayList<>();
        if (StringUtils.hasText(criteria.search())) {
            terms.add(criteria.search().trim());
        }
        if (StringUtils.hasText(criteria.searchAlt())) {
            String alt = criteria.searchAlt().trim();
            boolean duplicate = terms.stream().anyMatch(term -> term.equalsIgnoreCase(alt));
            if (!duplicate) {
                terms.add(alt);
            }
        }
        return terms;
    }

    private Map<Integer, CompanyDirectoryItem> companiesOf(List<User> users) {
        try {
            return loadCompanies(users);
        } catch (RuntimeException ex) {
            LogUtil.warn(UserListServiceImpl.class, "Company names unavailable: {}", ex.getMessage());
            return Map.of();
        }
    }

    private Map<Integer, String> storeNamesOf(List<User> users) {
        try {
            return loadStoreNames(users);
        } catch (RuntimeException ex) {
            LogUtil.warn(UserListServiceImpl.class, "Store names unavailable: {}", ex.getMessage());
            return Map.of();
        }
    }

    private Map<Integer, CompanyDirectoryItem> loadCompanies(List<User> users) {
        List<Integer> ids = users.stream()
            .map(User::getCompanyId)
            .filter(id -> id != null)
            .distinct()
            .toList();
        Map<Integer, CompanyDirectoryItem> companies = new HashMap<>();
        for (CompanyDirectoryItem company : posCoreClient.findCompaniesByIds(ids)) {
            if (company.id() != null) {
                companies.put(company.id(), company);
            }
        }
        return companies;
    }

    private Map<Integer, String> loadStoreNames(List<User> users) {
        Set<Integer> ids = new HashSet<>();
        for (User user : users) {
            if (user.getStoreIds() != null) {
                ids.addAll(user.getStoreIds());
            }
        }
        Map<Integer, String> names = new HashMap<>();
        for (StoreNameItem store : posCoreClient.findStoreNamesByIds(List.copyOf(ids))) {
            if (store.id() != null) {
                names.put(store.id(), store.name());
            }
        }
        return names;
    }

    private static Pageable sorted(Pageable pageable) {
        int size = pageable.getPageSize();
        if (size < 1) {
            size = DEFAULT_SIZE;
        } else if (size > MAX_SIZE) {
            size = MAX_SIZE;
        }
        int page = Math.max(pageable.getPageNumber(), 0);
        return PageRequest.of(page, size, resolveSort(pageable));
    }

    private static Sort resolveSort(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return Sort.by(Sort.Direction.ASC, "fullName");
        }
        Sort.Order order = pageable.getSort().iterator().next();
        String property = switch (order.getProperty()) {
            case "role" -> "role.name";
            case "status", "active" -> "isActive";
            case "createdAt", "username", "email", "fullName" -> order.getProperty();
            default -> "fullName";
        };
        Sort.Direction direction = order.getDirection().isDescending()
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;
        return Sort.by(direction, property);
    }
}

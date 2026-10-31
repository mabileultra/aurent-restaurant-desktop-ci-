package com.pos.restaurant.floor.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.security.RestaurantTenantContext;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Store-scoped tenant gate: store ∈ company, then user may access that store.
 * Successful checks are cached briefly so menu/floor hot paths do not hit DB on every request.
 */
@Component
public class StoreTenantSupport {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<List<Integer>> INT_LIST = new TypeReference<>() {};

    private final EdgeStoreRepository storeRepository;
    private final EdgeStaffRepository staffRepository;
    private final FloorTenantSupport tenantSupport;
    /** company|store|role|user → authorized store snapshot */
    private final Cache<String, EdgeStore> accessCache = Caffeine.newBuilder()
        .maximumSize(50_000)
        .expireAfterWrite(60, TimeUnit.SECONDS)
        .build();

    public StoreTenantSupport(
        EdgeStoreRepository storeRepository,
        EdgeStaffRepository staffRepository,
        FloorTenantSupport tenantSupport
    ) {
        this.storeRepository = storeRepository;
        this.staffRepository = staffRepository;
        this.tenantSupport = tenantSupport;
    }

    public EdgeStore requireStore(Integer storeId) {
        return requireStore(tenantSupport.requireCompanyId(), storeId);
    }

    public EdgeStore requireStore(Integer companyId, Integer storeId) {
        if (storeId == null) {
            throw new ValidationException("Укажите магазин");
        }
        if (companyId == null) {
            throw new ForbiddenException("Company context is required");
        }
        String role = nullToEmpty(RestaurantTenantContext.getRole());
        String userKey = RestaurantTenantContext.getUserId() == null
            ? "-"
            : RestaurantTenantContext.getUserId().toString();
        String cacheKey = companyId + "|" + storeId + "|" + role + "|" + userKey;
        return accessCache.get(cacheKey, key -> loadAuthorized(companyId, storeId));
    }

    private EdgeStore loadAuthorized(Integer companyId, Integer storeId) {
        EdgeStore store = storeRepository.findByIdAndCompanyId(storeId, companyId)
            .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        assertUserMayAccess(storeId);
        return store;
    }

    private void assertUserMayAccess(Integer storeId) {
        String role = RestaurantTenantContext.getRole();
        if ("ADMIN".equals(role)) {
            return;
        }
        UUID userId = RestaurantTenantContext.getUserId();
        if (userId == null) {
            throw new ForbiddenException("User context is required");
        }
        EdgeStaff staff = staffRepository.findById(userId).orElse(null);
        if (staff == null) {
            return;
        }
        Set<Integer> allowed = parseStoreIds(staff.getStoreIdsJson());
        if (allowed.isEmpty()) {
            return;
        }
        if (!allowed.contains(storeId)) {
            throw new ForbiddenException("Access denied for this store");
        }
    }

    static Set<Integer> parseStoreIds(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptySet();
        }
        try {
            List<Integer> raw = JSON.readValue(json, INT_LIST);
            if (raw == null || raw.isEmpty()) {
                return Collections.emptySet();
            }
            Set<Integer> ids = new HashSet<>();
            for (Integer id : raw) {
                if (id != null) {
                    ids.add(id);
                }
            }
            return ids;
        } catch (Exception ex) {
            return Collections.emptySet();
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}

package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.EdgeStoreBootstrapItem;
import com.pos.restaurant.edge.dto.EdgeStoreBootstrapRequest;
import com.pos.restaurant.edge.dto.EdgeStoreResponse;
import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStoreService {

    private final EdgeStoreRepository storeRepository;
    private final FloorTenantSupport tenantSupport;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @Transactional(readOnly = true)
    public List<EdgeStoreResponse> listForCurrentCompany() {
        Integer companyId = tenantSupport.requireCompanyId();
        return storeRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Integer> listAllIds() {
        return storeRepository.findAll().stream().map(EdgeStore::getId).toList();
    }

    @Transactional
    public int bootstrap(EdgeStoreBootstrapRequest request) {
        if (request.companyId() == null) {
            throw new BusinessException("companyId required");
        }
        long existing = storeRepository.countByCompanyId(request.companyId());
        if (existing == 0
            && StringUtils.hasText(bootstrapSecret)
            && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
            throw new BusinessException("Invalid bootstrap secret");
        }
        int saved = 0;
        if (request.stores() == null) {
            return 0;
        }
        for (EdgeStoreBootstrapItem item : request.stores()) {
            if (item == null || item.id() == null) {
                continue;
            }
            upsert(
                item.id(),
                request.companyId(),
                item.name(),
                item.code(),
                item.address(),
                item.businessType(),
                item.active() == null || item.active()
            );
            saved++;
        }
        return saved;
    }

    /** Fallback when cloud /stores is unavailable — create RESTAURANT rows from staff storeIds. */
    @Transactional
    public void upsertFromStoreIds(Integer companyId, Collection<Integer> storeIds) {
        if (companyId == null || storeIds == null || storeIds.isEmpty()) {
            return;
        }
        Set<Integer> seen = new HashSet<>();
        for (Integer storeId : storeIds) {
            if (storeId == null || !seen.add(storeId)) {
                continue;
            }
            if (storeRepository.existsById(storeId)) {
                continue;
            }
            upsert(storeId, companyId, "Точка #" + storeId, null, null, "RESTAURANT", true);
        }
    }

    @Transactional
    public void upsertFromCatalog(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return;
        }
        if (storeRepository.existsById(storeId)) {
            EdgeStore row = storeRepository.findById(storeId).orElseThrow();
            if (!companyId.equals(row.getCompanyId())) {
                row.setCompanyId(companyId);
            }
            // Catalog lives only on restaurant/canteen floors — never leave UNIVERSAL after import.
            String type = row.getBusinessType();
            if (!StringUtils.hasText(type)
                || "UNIVERSAL".equalsIgnoreCase(type)
                || "GROCERY".equalsIgnoreCase(type)) {
                row.setBusinessType("RESTAURANT");
            }
            row.setActive(true);
            storeRepository.save(row);
            return;
        }
        upsert(storeId, companyId, "Точка #" + storeId, null, null, "RESTAURANT", true);
    }

    private void upsert(
        Integer id,
        Integer companyId,
        String name,
        String code,
        String address,
        String businessType,
        boolean active
    ) {
        EdgeStore row = storeRepository.findById(id).orElseGet(EdgeStore::new);
        row.setId(id);
        row.setCompanyId(companyId);
        String resolvedName = StringUtils.hasText(name) ? name.trim() : row.getName();
        if (!StringUtils.hasText(resolvedName)) {
            resolvedName = "Точка #" + id;
        }
        row.setName(resolvedName);
        if (StringUtils.hasText(code)) {
            row.setCode(code.trim());
        }
        if (address != null) {
            row.setAddress(address);
        }
        String type = StringUtils.hasText(businessType) ? businessType.trim().toUpperCase() : row.getBusinessType();
        if (!StringUtils.hasText(type)) {
            type = "RESTAURANT";
        }
        row.setBusinessType(type);
        row.setActive(active);
        storeRepository.save(row);
    }

    private EdgeStoreResponse toResponse(EdgeStore row) {
        return new EdgeStoreResponse(
            row.getId(),
            row.getName(),
            row.getCode(),
            row.getAddress(),
            null,
            null,
            null,
            row.getCompanyId(),
            null,
            null,
            row.getBusinessType(),
            row.isActive()
        );
    }
}

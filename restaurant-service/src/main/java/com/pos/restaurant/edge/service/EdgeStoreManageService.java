package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.EdgeStoreResponse;
import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Local stand-in for cloud {@code /stores/manage} + store CRUD on the hall PC.
 * Offline-created ids use a high range so they do not collide with cloud sequences.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStoreManageService {

    /** Reserved band for stores created offline on this PC (cloud ids stay far below). */
    static final int OFFLINE_ID_BASE = 1_900_000_000;

    private final EdgeStoreRepository storeRepository;
    private final FloorTenantSupport tenantSupport;
    private final EdgeStoreService storeService;

    @Transactional(readOnly = true)
    public Map<String, Object> listManaged(String search, int page, int size) {
        List<EdgeStoreResponse> all = storeService.listForCurrentCompany();
        String q = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<EdgeStoreResponse> filtered = q.isEmpty()
            ? all
            : all.stream().filter((s) -> matches(s, q)).toList();
        int safeSize = size <= 0 ? 200 : size;
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, filtered.size());
        int to = Math.min(from + safeSize, filtered.size());
        List<EdgeStoreResponse> content = filtered.subList(from, to);
        int totalPages = safeSize == 0 ? 0 : (int) Math.ceil(filtered.size() / (double) safeSize);
        Map<String, Object> body = new HashMap<>();
        body.put("content", content);
        body.put("totalElements", filtered.size());
        body.put("totalPages", Math.max(totalPages, filtered.isEmpty() ? 0 : 1));
        body.put("size", safeSize);
        body.put("number", safePage);
        return body;
    }

    @Transactional
    public EdgeStoreResponse create(Map<String, Object> body) {
        Integer companyId = tenantSupport.requireCompanyId();
        String name = str(body.get("name"));
        if (!StringUtils.hasText(name)) throw new BusinessException("name required");
        int nextId = storeRepository.findAll().stream()
            .map(EdgeStore::getId)
            .filter(id -> id != null && id >= OFFLINE_ID_BASE)
            .max(Integer::compareTo)
            .orElse(OFFLINE_ID_BASE - 1) + 1;
        EdgeStore row = EdgeStore.builder()
            .id(nextId)
            .companyId(companyId)
            .name(name.trim())
            .code(str(body.get("code")))
            .address(str(body.get("address")))
            .phone(str(body.get("phone")))
            .businessType(normalizeType(str(body.get("businessType"))))
            .active(body.get("active") == null || Boolean.parseBoolean(String.valueOf(body.get("active"))))
            .build();
        storeRepository.save(row);
        return storeService.requireForCompany(nextId);
    }

    @Transactional
    public EdgeStoreResponse update(Integer id, Map<String, Object> body) {
        Integer companyId = tenantSupport.requireCompanyId();
        EdgeStore row = storeRepository.findById(id)
            .filter((s) -> companyId.equals(s.getCompanyId()))
            .orElseThrow(() -> new NotFoundException("Store not found"));
        if (body.containsKey("name")) {
            String name = str(body.get("name"));
            if (!StringUtils.hasText(name)) throw new BusinessException("name required");
            row.setName(name.trim());
        }
        if (body.containsKey("code")) row.setCode(str(body.get("code")));
        if (body.containsKey("address")) row.setAddress(str(body.get("address")));
        if (body.containsKey("phone")) row.setPhone(str(body.get("phone")));
        if (body.containsKey("businessType")) {
            row.setBusinessType(normalizeType(str(body.get("businessType"))));
        }
        if (body.containsKey("active") && body.get("active") != null) {
            row.setActive(Boolean.parseBoolean(String.valueOf(body.get("active"))));
        }
        storeRepository.save(row);
        return storeService.requireForCompany(id);
    }

    @Transactional
    public EdgeStoreResponse toggle(Integer id) {
        Integer companyId = tenantSupport.requireCompanyId();
        EdgeStore row = storeRepository.findById(id)
            .filter((s) -> companyId.equals(s.getCompanyId()))
            .orElseThrow(() -> new NotFoundException("Store not found"));
        row.setActive(!row.isActive());
        storeRepository.save(row);
        return storeService.requireForCompany(id);
    }

    @Transactional
    public void delete(Integer id) {
        Integer companyId = tenantSupport.requireCompanyId();
        EdgeStore row = storeRepository.findById(id)
            .filter((s) -> companyId.equals(s.getCompanyId()))
            .orElseThrow(() -> new NotFoundException("Store not found"));
        storeRepository.delete(row);
    }

    private static boolean matches(EdgeStoreResponse s, String q) {
        return contains(s.name(), q)
            || contains(s.code(), q)
            || contains(s.address(), q)
            || contains(s.phone(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private static String normalizeType(String type) {
        if (!StringUtils.hasText(type)) return "RESTAURANT";
        String t = type.trim().toUpperCase(Locale.ROOT);
        if ("CANTEEN".equals(t)) return "CANTEEN";
        return "RESTAURANT";
    }

    private static String str(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() || "null".equalsIgnoreCase(s) ? null : s;
    }
}

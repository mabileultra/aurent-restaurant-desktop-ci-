package com.pos.restaurant.edge.service.support;

import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockReportSupport {

    private final EdgeStoreRepository storeRepository;

    public Integer requireCompany() {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) throw new BusinessException("company required");
        return companyId;
    }

    public Integer resolveStore(Integer companyId, Integer storeId) {
        if (storeId != null) return storeId;
        return firstStore(companyId);
    }

    public Integer firstStore(Integer companyId) {
        return storeRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
            .map(s -> s.getId())
            .findFirst()
            .orElse(null);
    }

    public static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    public static Map<String, Object> emptyPage(int page, int size) {
        return pageOf(List.of(), 0, page, size);
    }

    public static Map<String, Object> pageOf(List<Map<String, Object>> content, long total, int page, int size) {
        int safeSize = Math.max(size, 1);
        Map<String, Object> m = new HashMap<>();
        m.put("content", content);
        m.put("totalElements", total);
        m.put("totalPages", total == 0 ? 0 : (int) ((total + safeSize - 1) / safeSize));
        m.put("size", safeSize);
        m.put("number", page);
        m.put("page", page);
        return m;
    }
}

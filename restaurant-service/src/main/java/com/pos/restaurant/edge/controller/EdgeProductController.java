package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Edge stand-in for web-backend {@code /products} so restaurant-desktop UI keeps working offline.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeProductController {

    private final EdgeProductRepository productRepository;

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false, defaultValue = "true") boolean activeOnly,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "50") int size
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer sid = storeId != null ? storeId : firstStoreOrNull();
        if (companyId == null || sid == null) {
            return ResponseEntity.ok(emptyPage(page, size));
        }
        String q = StringUtils.hasText(search) ? search.trim() : null;
        Page<EdgeProduct> result = productRepository.search(
            companyId, sid, q, activeOnly, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
        );
        List<Map<String, Object>> content = result.getContent().stream().map(this::toDto).toList();
        Map<String, Object> body = new HashMap<>();
        body.put("content", content);
        body.put("page", result.getNumber());
        body.put("size", result.getSize());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> get(
        @PathVariable UUID id,
        @RequestParam(required = false) Integer storeId
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        EdgeProduct p = productRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Product not found"));
        return ResponseEntity.ok(toDto(p));
    }

    @GetMapping("/products/low-stock")
    public ResponseEntity<List<Map<String, Object>>> lowStock(
        @RequestParam(required = false) Integer storeId
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer sid = storeId != null ? storeId : firstStoreOrNull();
        if (companyId == null || sid == null) {
            return ResponseEntity.ok(List.of());
        }
        // Products where stock <= alert threshold (at least 0)
        List<Map<String, Object>> rows = productRepository
            .findByCompanyIdAndStoreIdAndActiveTrue(companyId, sid, PageRequest.of(0, 500))
            .getContent()
            .stream()
            .filter(p -> p.getStockQty().compareTo(BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0))) <= 0)
            .map(this::toDto)
            .toList();
        return ResponseEntity.ok(rows);
    }

    private Map<String, Object> toDto(EdgeProduct p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("sku", p.getSku());
        m.put("name", p.getName());
        m.put("barcode", p.getBarcode());
        m.put("unitCode", p.getUnitCode());
        m.put("taxRate", p.getTaxRate());
        m.put("costPrice", p.getCostPrice());
        m.put("sellingPrice", p.getSellingPrice());
        m.put("stockQuantity", p.getStockQty());
        m.put("lowStockAlert", p.getLowStockAlert());
        m.put("lowStock", p.getStockQty().compareTo(BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0))) <= 0);
        m.put("ikpu", p.getIkpu());
        m.put("packageCode", p.getPackageCode());
        m.put("unitOfMeasure", p.getUnitOfMeasure());
        m.put("unitMeasureCode", p.getUnitMeasureCode());
        m.put("markedProduct", p.isMarkedProduct());
        m.put("active", p.isActive());
        return m;
    }

    private static Map<String, Object> emptyPage(int page, int size) {
        Map<String, Object> body = new HashMap<>();
        body.put("content", List.of());
        body.put("page", page);
        body.put("size", size);
        body.put("totalElements", 0);
        body.put("totalPages", 0);
        return body;
    }

    private Integer firstStoreOrNull() {
        return null;
    }
}

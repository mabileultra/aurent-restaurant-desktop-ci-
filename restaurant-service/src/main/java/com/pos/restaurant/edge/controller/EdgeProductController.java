package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final EdgeStoreRepository storeRepository;

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false, defaultValue = "true") boolean activeOnly,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "50") int size
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer sid = storeId != null ? storeId : firstStoreOrNull(companyId);
        if (companyId == null || sid == null) {
            return ResponseEntity.ok(emptyPage(page, size));
        }
        String q = StringUtils.hasText(search) ? search.trim() : null;
        Page<EdgeProduct> result = productRepository.search(
            companyId, sid, q, activeOnly, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
        );
        return ResponseEntity.ok(pageBody(result));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> get(
        @PathVariable UUID id,
        @RequestParam(required = false) Integer storeId
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        EdgeProduct p = resolve(companyId, storeId, id);
        return ResponseEntity.ok(toDto(p));
    }

    @GetMapping("/products/barcode/{barcode}")
    public ResponseEntity<Map<String, Object>> byBarcode(
        @PathVariable String barcode,
        @RequestParam(required = false) Integer storeId
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer sid = storeId != null ? storeId : firstStoreOrNull(companyId);
        if (companyId == null || sid == null || !StringUtils.hasText(barcode)) {
            throw new NotFoundException("Product not found");
        }
        EdgeProduct p = productRepository.findByCompanyIdAndStoreIdAndBarcode(companyId, sid, barcode.trim())
            .orElseThrow(() -> new NotFoundException("Product not found"));
        return ResponseEntity.ok(toDto(p));
    }

    @GetMapping("/products/low-stock")
    public ResponseEntity<List<Map<String, Object>>> lowStock(
        @RequestParam(required = false) Integer storeId
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer sid = storeId != null ? storeId : firstStoreOrNull(companyId);
        if (companyId == null || sid == null) {
            return ResponseEntity.ok(List.of());
        }
        List<Map<String, Object>> rows = productRepository
            .findByCompanyIdAndStoreIdAndActiveTrue(companyId, sid, PageRequest.of(0, 500))
            .getContent()
            .stream()
            .filter(p -> p.getStockQty().compareTo(BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0))) <= 0)
            .map(this::toDto)
            .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/products")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer storeId = intVal(body.get("storeId"));
        if (storeId == null) storeId = firstStoreOrNull(companyId);
        if (companyId == null || storeId == null) {
            throw new BusinessException("storeId required");
        }
        String name = str(body.get("name"));
        if (!StringUtils.hasText(name)) throw new BusinessException("name required");
        EdgeProduct p = new EdgeProduct();
        p.setId(UUID.randomUUID());
        p.setCompanyId(companyId);
        p.setStoreId(storeId);
        applyBody(p, body);
        p.setActive(body.get("active") == null || Boolean.TRUE.equals(body.get("active")));
        if (p.getStockQty() == null) p.setStockQty(BigDecimal.ZERO);
        productRepository.save(p);
        return ResponseEntity.ok(toDto(p));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> update(
        @PathVariable UUID id,
        @RequestBody Map<String, Object> body
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer storeId = intVal(body.get("storeId"));
        EdgeProduct p = resolve(companyId, storeId, id);
        applyBody(p, body);
        if (body.containsKey("active")) {
            p.setActive(Boolean.TRUE.equals(body.get("active")));
        }
        productRepository.save(p);
        return ResponseEntity.ok(toDto(p));
    }

    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<Map<String, Object>> adjustStock(
        @PathVariable UUID id,
        @RequestParam BigDecimal quantity,
        @RequestParam(required = false) String movementType,
        @RequestParam(required = false) String notes,
        @RequestParam(required = false) Integer storeId
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        EdgeProduct p = resolve(companyId, storeId, id);
        BigDecimal qty = quantity == null ? BigDecimal.ZERO : quantity.abs();
        String type = String.valueOf(movementType == null ? "IN" : movementType).toUpperCase();
        if (type.contains("OUT") || type.contains("DECREASE") || type.contains("WRITE")) {
            p.setStockQty(p.getStockQty().subtract(qty));
        } else {
            p.setStockQty(p.getStockQty().add(qty));
        }
        productRepository.save(p);
        Map<String, Object> dto = toDto(p);
        dto.put("notes", notes);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id, @RequestParam(required = false) Integer storeId) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        EdgeProduct p = resolve(companyId, storeId, id);
        p.setActive(false);
        productRepository.save(p);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/products/bulk/deactivate")
    public ResponseEntity<Map<String, Object>> bulkDeactivate(@RequestBody Map<String, Object> body) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        @SuppressWarnings("unchecked")
        List<Object> ids = body.get("productIds") instanceof List<?> list ? (List<Object>) list : List.of();
        int n = 0;
        for (Object raw : ids) {
            UUID id = uuid(raw);
            if (id == null) continue;
            productRepository.findByIdAndCompanyId(id, companyId).ifPresent(p -> {
                p.setActive(false);
                productRepository.save(p);
            });
            n++;
        }
        return ResponseEntity.ok(Map.of("deactivated", n));
    }

    @PatchMapping("/products/bulk/tax-rate")
    public ResponseEntity<Map<String, Object>> bulkTax(@RequestBody Map<String, Object> body) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        BigDecimal rate = dec(body.get("taxRate"));
        @SuppressWarnings("unchecked")
        List<Object> ids = body.get("productIds") instanceof List<?> list ? (List<Object>) list : List.of();
        int n = 0;
        for (Object raw : ids) {
            UUID id = uuid(raw);
            if (id == null) continue;
            productRepository.findByIdAndCompanyId(id, companyId).ifPresent(p -> {
                p.setTaxRate(rate == null ? BigDecimal.ZERO : rate);
                productRepository.save(p);
            });
            n++;
        }
        return ResponseEntity.ok(Map.of("updated", n));
    }

    private EdgeProduct resolve(Integer companyId, Integer storeId, UUID id) {
        if (companyId == null || id == null) throw new NotFoundException("Product not found");
        if (storeId != null) {
            return productRepository.findByIdAndCompanyIdAndStoreId(id, companyId, storeId)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        }
        return productRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Product not found"));
    }

    private void applyBody(EdgeProduct p, Map<String, Object> body) {
        if (body.containsKey("name") && StringUtils.hasText(str(body.get("name")))) {
            p.setName(str(body.get("name")).trim());
        }
        if (body.containsKey("sku")) p.setSku(str(body.get("sku")));
        if (body.containsKey("barcode")) p.setBarcode(str(body.get("barcode")));
        if (body.containsKey("unitCode")) p.setUnitCode(str(body.get("unitCode")));
        if (body.containsKey("taxRate")) p.setTaxRate(nz(dec(body.get("taxRate"))));
        if (body.containsKey("costPrice")) p.setCostPrice(nz(dec(body.get("costPrice"))));
        if (body.containsKey("sellingPrice")) p.setSellingPrice(nz(dec(body.get("sellingPrice"))));
        if (body.containsKey("stockQuantity")) p.setStockQty(nz(dec(body.get("stockQuantity"))));
        if (body.containsKey("lowStockAlert")) {
            Integer v = intVal(body.get("lowStockAlert"));
            p.setLowStockAlert(v == null ? 0 : v);
        }
        if (body.containsKey("ikpu")) p.setIkpu(str(body.get("ikpu")));
        if (body.containsKey("packageCode")) p.setPackageCode(str(body.get("packageCode")));
        if (body.containsKey("unitOfMeasure")) p.setUnitOfMeasure(str(body.get("unitOfMeasure")));
        if (body.containsKey("unitMeasureCode")) p.setUnitMeasureCode(str(body.get("unitMeasureCode")));
        if (body.containsKey("markedProduct")) {
            p.setMarkedProduct(Boolean.TRUE.equals(body.get("markedProduct")));
        }
    }

    private Map<String, Object> pageBody(Page<EdgeProduct> result) {
        Map<String, Object> body = new HashMap<>();
        body.put("content", result.getContent().stream().map(this::toDto).toList());
        body.put("page", result.getNumber());
        body.put("number", result.getNumber());
        body.put("size", result.getSize());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        return body;
    }

    private Map<String, Object> toDto(EdgeProduct p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("storeId", p.getStoreId());
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
        body.put("number", page);
        body.put("size", size);
        body.put("totalElements", 0);
        body.put("totalPages", 0);
        return body;
    }

    private Integer firstStoreOrNull(Integer companyId) {
        if (companyId == null) return null;
        return storeRepository.findByCompanyIdAndActiveTrueOrderByNameAsc(companyId).stream()
            .map(s -> s.getId())
            .findFirst()
            .orElse(null);
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private static Integer intVal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal dec(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal b) return b;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(String.valueOf(v).trim().replace(',', '.'));
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static UUID uuid(Object v) {
        if (v == null) return null;
        if (v instanceof UUID u) return u;
        try {
            return UUID.fromString(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }
}

package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.entity.EdgeSupplier;
import com.pos.restaurant.edge.repository.EdgeSupplierRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeSupplierController {

    private final EdgeSupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
        @RequestParam(required = false) String search,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) {
            return ResponseEntity.ok(Map.of(
                "content", java.util.List.of(),
                "totalPages", 0,
                "totalElements", 0,
                "size", pageable.getPageSize(),
                "number", 0
            ));
        }
        String q = StringUtils.hasText(search) ? search.trim() : null;
        Page<EdgeSupplier> page = supplierRepository.search(companyId, q, pageable);
        Map<String, Object> body = new HashMap<>();
        body.put("content", page.getContent().stream().map(this::toDto).toList());
        body.put("totalPages", page.getTotalPages());
        body.put("totalElements", page.getTotalElements());
        body.put("size", page.getSize());
        body.put("number", page.getNumber());
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) throw new BusinessException("Company context required");
        String name = body.get("name") == null ? null : String.valueOf(body.get("name")).trim();
        if (!StringUtils.hasText(name)) throw new BusinessException("name required");
        String taxId = body.get("taxId") == null ? null : String.valueOf(body.get("taxId"));
        EdgeSupplier s = EdgeSupplier.builder()
            .id(UUID.randomUUID())
            .companyId(companyId)
            .name(name)
            .inn(taxId)
            .address(body.get("address") == null ? null : String.valueOf(body.get("address")))
            .phone(body.get("phone") == null ? null : String.valueOf(body.get("phone")))
            .active(true)
            .createdAt(Instant.now())
            .build();
        supplierRepository.save(s);
        return ResponseEntity.ok(toDto(s));
    }

    private Map<String, Object> toDto(EdgeSupplier s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("createdAt", s.getCreatedAt());
        m.put("name", s.getName());
        m.put("taxId", s.getInn());
        m.put("address", s.getAddress());
        m.put("email", null);
        m.put("phone", s.getPhone());
        return m;
    }
}

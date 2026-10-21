package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.entity.EdgePharmacyIntegration;
import com.pos.restaurant.edge.repository.EdgePharmacyIntegrationRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Offline stand-in for web-backend pharmacy/ASL marking APIs.
 * Verify accepts codes locally and logs them for later cloud reconcile.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgePharmacyIntegrationController {

    private final EdgePharmacyIntegrationRepository repository;
    private final JdbcTemplate jdbc;

    @GetMapping("/cashier/pharmacy-integration")
    public ResponseEntity<Map<String, Object>> cashierCapabilities(@RequestParam Integer storeId) {
        return ResponseEntity.ok(capabilities(storeId));
    }

    @PostMapping("/cashier/pharmacy-integration/marking/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody Map<String, Object> body) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        Integer storeId = body.get("storeId") instanceof Number n ? n.intValue() : null;
        String code = body.get("code") == null ? null : String.valueOf(body.get("code")).trim();
        if (companyId == null || storeId == null || !StringUtils.hasText(code)) {
            throw new BusinessException("storeId and code required");
        }
        EdgePharmacyIntegration settings = repository.findById(storeId).orElse(null);
        if (settings == null || !settings.isAslMarkingEnabled()) {
            throw new BusinessException("ASL marking is disabled for this store");
        }
        Integer sold = jdbc.queryForObject(
            "SELECT COUNT(*) FROM edge_marking_verify_log WHERE store_id = ? AND code = ? AND status = 'SOLD'",
            Integer.class, storeId, code
        );
        boolean alreadySold = sold != null && sold > 0;
        jdbc.update("""
            INSERT INTO edge_marking_verify_log (id, company_id, store_id, code, status, verified_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            UUID.randomUUID(), companyId, storeId, code,
            alreadySold ? "ALREADY_SOLD" : "ACCEPTED_OFFLINE",
            java.sql.Timestamp.from(Instant.now())
        );
        Map<String, Object> out = new HashMap<>();
        out.put("found", true);
        out.put("code", code);
        out.put("status", alreadySold ? "SOLD" : "OK");
        out.put("gtin", null);
        out.put("productName", null);
        out.put("expirationDate", null);
        out.put("batch", null);
        out.put("ownerInn", null);
        out.put("details", Map.of("offline", true));
        out.put("alreadySold", alreadySold);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/admin/stores/{storeId}/pharmacy-integration")
    public ResponseEntity<Map<String, Object>> adminGet(@PathVariable Integer storeId) {
        return ResponseEntity.ok(adminDto(storeId));
    }

    @PutMapping("/admin/stores/{storeId}/pharmacy-integration")
    public ResponseEntity<Map<String, Object>> adminSave(
        @PathVariable Integer storeId,
        @RequestBody Map<String, Object> body
    ) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) throw new BusinessException("Company context required");
        EdgePharmacyIntegration row = repository.findById(storeId).orElseGet(EdgePharmacyIntegration::new);
        row.setStoreId(storeId);
        row.setCompanyId(companyId);
        row.setAslMarkingEnabled(Boolean.TRUE.equals(body.get("aslMarkingEnabled")));
        if (body.containsKey("aslPortalUrl")) {
            row.setAslPortalUrl(body.get("aslPortalUrl") == null ? null : String.valueOf(body.get("aslPortalUrl")));
        }
        row.setUpdatedAt(Instant.now());
        repository.save(row);
        return ResponseEntity.ok(adminDto(storeId));
    }

    private Map<String, Object> capabilities(Integer storeId) {
        EdgePharmacyIntegration row = storeId == null ? null : repository.findById(storeId).orElse(null);
        Map<String, Object> m = new HashMap<>();
        m.put("aslMarkingEnabled", row != null && row.isAslMarkingEnabled());
        m.put("dmedEnabled", false);
        m.put("aslPortalUrl", row == null ? null : row.getAslPortalUrl());
        m.put("dmedPortalUrl", null);
        m.put("ikpuPortalUrl", null);
        return m;
    }

    private Map<String, Object> adminDto(Integer storeId) {
        Map<String, Object> m = capabilities(storeId);
        m.put("storeId", storeId);
        return m;
    }
}

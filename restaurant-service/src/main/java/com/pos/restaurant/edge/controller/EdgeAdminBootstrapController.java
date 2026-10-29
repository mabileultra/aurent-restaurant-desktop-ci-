package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.service.EdgeCashRegisterService;
import com.pos.restaurant.edge.service.EdgeStockCategoryService;
import com.pos.restaurant.edge.service.EdgeSupplierBootstrapService;
import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * One-shot import of cloud stock categories, suppliers + cash registers during online bootstrap.
 */
@RestController
@RequestMapping("/edge/bootstrap")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeAdminBootstrapController {

    private final EdgeStockCategoryService categories;
    private final EdgeCashRegisterService registers;
    private final EdgeSupplierBootstrapService suppliers;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @PostMapping("/categories")
    public ResponseEntity<Map<String, Object>> categories(@RequestBody Map<String, Object> body) {
        assertSecret(body);
        Integer companyId = intVal(body.get("companyId"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("categories");
        int saved = categories.bootstrapReplace(companyId, rows);
        Map<String, Object> out = new HashMap<>();
        out.put("saved", saved);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/cash-registers")
    public ResponseEntity<Map<String, Object>> cashRegisters(@RequestBody Map<String, Object> body) {
        assertSecret(body);
        Integer companyId = intVal(body.get("companyId"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("cashRegisters");
        int saved = registers.bootstrapReplace(companyId, rows);
        Map<String, Object> out = new HashMap<>();
        out.put("saved", saved);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Map<String, Object>> suppliers(@RequestBody Map<String, Object> body) {
        assertSecret(body);
        Integer companyId = intVal(body.get("companyId"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("suppliers");
        int saved = suppliers.bootstrapReplace(companyId, rows);
        Map<String, Object> out = new HashMap<>();
        out.put("saved", saved);
        return ResponseEntity.ok(out);
    }

    private void assertSecret(Map<String, Object> body) {
        if (!StringUtils.hasText(bootstrapSecret)) return;
        Object got = body.get("bootstrapSecret");
        if (!bootstrapSecret.equals(String.valueOf(got))) {
            throw new BusinessException("Invalid bootstrap secret");
        }
    }

    private static Integer intVal(Object v) {
        if (v instanceof Number n) return n.intValue();
        if (v == null) return null;
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

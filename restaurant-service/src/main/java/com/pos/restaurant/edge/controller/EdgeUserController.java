package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.service.EdgeAuthService;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Local staff CRUD for restaurant-desktop admin (replaces cloud {@code /users}). */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeUserController {

    private final EdgeAuthService authService;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> list() {
        return ResponseEntity.ok(authService.listUsers(RestaurantTenantContext.getCompanyId()));
    }

    @GetMapping("/users/pos-roster")
    public ResponseEntity<List<Map<String, Object>>> posRoster(@RequestParam(required = false) Integer storeId) {
        List<Map<String, Object>> all = authService.listUsers(RestaurantTenantContext.getCompanyId());
        if (storeId == null) return ResponseEntity.ok(all);
        List<Map<String, Object>> filtered = all.stream()
            .filter(u -> {
                Object raw = u.get("storeIds");
                if (!(raw instanceof List<?> ids)) return "ADMIN".equals(String.valueOf(u.get("role")));
                return ids.stream().anyMatch(id -> String.valueOf(storeId).equals(String.valueOf(id)));
            })
            .toList();
        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(authService.getUser(id));
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(authService.createUser(body));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(authService.updateUser(id, body));
    }

    @PatchMapping("/users/{id}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(authService.toggleUser(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

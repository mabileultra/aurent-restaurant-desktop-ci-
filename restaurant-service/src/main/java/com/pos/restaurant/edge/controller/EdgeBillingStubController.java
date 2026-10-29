package com.pos.restaurant.edge.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Cloud billing is not on the hall PC — FE BillingAccessGuard must not 401-loop after login.
 */
@RestController
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
@Tag(name = "Edge billing stub")
public class EdgeBillingStubController {

    @GetMapping("/billing/me/access")
    @Operation(summary = "Always allow on edge (no cloud billing gate)")
    public ResponseEntity<Map<String, Object>> access() {
        return ResponseEntity.ok(Map.of(
            "billingEnabled", false,
            "accessAllowed", true,
            "hallDesktop", true,
            "cloudBillingOnly", true
        ));
    }

    @GetMapping("/billing/me")
    @Operation(summary = "Minimal billing me stub for edge — not a fake invoice ledger")
    public ResponseEntity<Map<String, Object>> me() {
        return ResponseEntity.ok(Map.of(
            "billingEnabled", false,
            "accessAllowed", true,
            "hallDesktop", true,
            "cloudBillingOnly", true,
            "message", "Subscription billing is on r-aurent.uz; hall PC does not store invoices"
        ));
    }
}

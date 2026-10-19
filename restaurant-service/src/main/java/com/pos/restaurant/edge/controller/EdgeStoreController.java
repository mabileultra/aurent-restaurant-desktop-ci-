package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.dto.EdgeStoreBootstrapRequest;
import com.pos.restaurant.edge.dto.EdgeStoreResponse;
import com.pos.restaurant.edge.service.EdgeStoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Cloud {@code GET /stores} lives in web-backend/pos-core. On the hall PC the restaurant UI
 * still calls {@code /stores} — serve the local registry filled during online bootstrap.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
@Tag(name = "Edge stores")
public class EdgeStoreController {

    private final EdgeStoreService edgeStoreService;

    @GetMapping("/stores")
    @Operation(summary = "Local company stores (edge)")
    public List<EdgeStoreResponse> list() {
        return edgeStoreService.listForCurrentCompany();
    }

    @PostMapping("/edge/bootstrap/stores")
    @Operation(summary = "Import store registry after online bootstrap")
    public ResponseEntity<Map<String, Object>> bootstrap(@Valid @RequestBody EdgeStoreBootstrapRequest request) {
        int saved = edgeStoreService.bootstrap(request);
        return ResponseEntity.ok(Map.of("saved", saved));
    }
}

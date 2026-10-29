package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.dto.EdgeStoreBootstrapRequest;
import com.pos.restaurant.edge.dto.EdgeStoreResponse;
import com.pos.restaurant.edge.service.EdgeStoreManageService;
import com.pos.restaurant.edge.service.EdgeStoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
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

/**
 * Cloud store APIs live in web-backend. On the hall PC serve local registry after bootstrap.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
@Tag(name = "Edge stores")
public class EdgeStoreController {

    private final EdgeStoreService edgeStoreService;
    private final EdgeStoreManageService manageService;

    @GetMapping("/stores")
    @Operation(summary = "Local company stores (edge)")
    public List<EdgeStoreResponse> list() {
        return edgeStoreService.listForCurrentCompany();
    }

    @GetMapping("/stores/manage")
    @Operation(summary = "Local managed stores page (edge stand-in for cloud /stores/manage)")
    public Map<String, Object> listManaged(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "200") int size
    ) {
        return manageService.listManaged(search, page, size);
    }

    @PostMapping("/stores")
    @Operation(summary = "Create local store row (edge)")
    public ResponseEntity<EdgeStoreResponse> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(manageService.create(body));
    }

    @PutMapping("/stores/{id}")
    @Operation(summary = "Update local store row (edge)")
    public EdgeStoreResponse update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return manageService.update(id, body);
    }

    @PatchMapping("/stores/{id}/toggle-active")
    @Operation(summary = "Toggle local store active flag (edge)")
    public EdgeStoreResponse toggle(@PathVariable Integer id) {
        return manageService.toggle(id);
    }

    @DeleteMapping("/stores/{id}")
    @Operation(summary = "Delete local store row (edge)")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        manageService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/edge/bootstrap/stores")
    @Operation(summary = "Import store registry after online bootstrap")
    public ResponseEntity<Map<String, Object>> bootstrap(@Valid @RequestBody EdgeStoreBootstrapRequest request) {
        int saved = edgeStoreService.bootstrap(request);
        return ResponseEntity.ok(Map.of("saved", saved));
    }
}

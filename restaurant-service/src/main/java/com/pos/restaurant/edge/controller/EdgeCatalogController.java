package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogImportRequest;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeStockBootstrapRequest;
import com.pos.restaurant.edge.service.EdgeCatalogExportService;
import com.pos.restaurant.edge.service.EdgeCatalogImportService;
import com.pos.restaurant.edge.service.EdgeStockBootstrapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Edge catalog bootstrap")
public class EdgeCatalogController {

    private final EdgeCatalogExportService exportService;
    private final ObjectProvider<EdgeCatalogImportService> importService;
    private final ObjectProvider<EdgeStockBootstrapService> stockBootstrapService;

    @GetMapping("/rst/edge/catalog-export")
    @Operation(summary = "Export store catalog snapshot for restaurant-desktop bootstrap (cloud)")
    public ResponseEntity<EdgeCatalogSnapshot> export(
        @RequestParam Integer storeId,
        @RequestParam(required = false) String companyLoginCode
    ) {
        return ResponseEntity.ok(exportService.export(storeId, companyLoginCode));
    }

    @PostMapping("/edge/bootstrap/catalog")
    @Operation(summary = "Import catalog snapshot into local edge DB")
    public ResponseEntity<Map<String, Object>> importCatalog(@Valid @RequestBody EdgeCatalogImportRequest request) {
        EdgeCatalogImportService importer = importService.getIfAvailable();
        if (importer == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Edge mode is not enabled"));
        }
        return ResponseEntity.ok(importer.importSnapshot(request));
    }

    @PostMapping("/edge/bootstrap/stock")
    @Operation(summary = "Import nomenclature + stock qty into local edge DB")
    public ResponseEntity<Map<String, Object>> importStock(@Valid @RequestBody EdgeStockBootstrapRequest request) {
        EdgeStockBootstrapService stock = stockBootstrapService.getIfAvailable();
        if (stock == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Edge mode is not enabled"));
        }
        return ResponseEntity.ok(stock.importProducts(request));
    }

    @GetMapping("/edge/bootstrap/status")
    @Operation(summary = "Local catalog bootstrap status")
    public ResponseEntity<Map<String, Object>> status() {
        EdgeCatalogImportService importer = importService.getIfAvailable();
        EdgeStockBootstrapService stock = stockBootstrapService.getIfAvailable();
        boolean hasCatalog = importer != null && importer.hasAnyCatalog();
        boolean hasStock = stock != null && stock.hasAnyStock();
        Map<String, Object> body = new HashMap<>();
        body.put("edge", importer != null);
        body.put("hasCatalog", hasCatalog);
        body.put("hasStock", hasStock);
        return ResponseEntity.ok(body);
    }
}

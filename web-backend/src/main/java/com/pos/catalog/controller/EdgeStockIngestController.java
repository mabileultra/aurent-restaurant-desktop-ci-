package com.pos.catalog.controller;

import com.pos.catalog.dto.edge.EdgeStockIngestRequest;
import com.pos.catalog.dto.edge.EdgeStockIngestResponse;
import com.pos.catalog.service.edge.EdgeStockIngestService;
import com.pos.config.openapi.StandardApiResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Каталог товаров, остатки, импорт и экспорт")
@StandardApiResponses
public class EdgeStockIngestController {

    private final EdgeStockIngestService edgeStockIngestService;

    @PostMapping("/edge-stock-ingest")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Ingest hall stock (local-first push, soft LWW upsert)")
    @ApiResponse(responseCode = "200", description = "Upsert counts")
    public ResponseEntity<EdgeStockIngestResponse> ingest(@Valid @RequestBody EdgeStockIngestRequest request) {
        return ResponseEntity.ok(edgeStockIngestService.ingest(request));
    }
}

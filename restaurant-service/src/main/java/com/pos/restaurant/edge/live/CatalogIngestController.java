package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.support.EdgeCatalogStructureWriter;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

/**
 * Cloud: accept catalog structure from restaurant-desktop (hall SoT → server, S2).
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Edge catalog ingest")
public class CatalogIngestController {

    private final EdgeCatalogStructureWriter structureWriter;

    @PostMapping("/rst/edge/catalog-ingest")
    @Operation(summary = "LWW upsert catalog structure from restaurant-desktop")
    public ResponseEntity<Map<String, Object>> ingest(@RequestBody EdgeCatalogSnapshot snapshot) {
        Integer ctxCompany = RestaurantTenantContext.getCompanyId();
        if (ctxCompany != null && snapshot != null && snapshot.companyId() != null
            && !Objects.equals(ctxCompany, snapshot.companyId())) {
            throw new BusinessException("Company mismatch");
        }
        EdgeCatalogSnapshot slice = CatalogStructureSlice.of(snapshot);
        return ResponseEntity.ok(structureWriter.applyStructure(slice));
    }
}

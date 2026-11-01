package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.service.EdgeCatalogExportService;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Local edge: export catalog structure for Electron → cloud catalog-ingest.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogStructureExportController {

    private final EdgeCatalogExportService exportService;

    @Value("${app.restaurant.edge.bootstrap-secret:edge-dev-bootstrap}")
    private String bootstrapSecret;

    @GetMapping("/edge/catalog-structure-export")
    public ResponseEntity<EdgeCatalogSnapshot> export(
        @RequestParam Integer storeId,
        @RequestParam Integer companyId,
        @RequestParam(required = false) String companyLoginCode,
        @RequestParam(required = false) String bootstrapSecret
    ) {
        assertSecret(bootstrapSecret);
        if (storeId == null || companyId == null) {
            throw new BusinessException("storeId and companyId required");
        }
        RestaurantTenantContext.set(companyId, UUID.randomUUID(), "EDGE_SYNC", false);
        try {
            return ResponseEntity.ok(CatalogStructureSlice.of(exportService.export(storeId, companyLoginCode)));
        } finally {
            RestaurantTenantContext.clear();
        }
    }

    private void assertSecret(String given) {
        if (StringUtils.hasText(this.bootstrapSecret)
            && !this.bootstrapSecret.equals(String.valueOf(given))) {
            throw new BusinessException("Invalid bootstrap secret");
        }
    }
}

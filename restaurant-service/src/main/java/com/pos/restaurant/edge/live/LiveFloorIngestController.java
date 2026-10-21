package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.service.EdgeCatalogExportService;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

/**
 * Cloud live floor: hall PC pushes; phones/other desktops pull a live slice.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Edge live floor")
public class LiveFloorIngestController {

    private final LiveFloorApplyService applyService;
    private final EdgeCatalogExportService exportService;

    @PostMapping("/rst/edge/live-ingest")
    @Operation(summary = "Upsert live floor snapshot from restaurant-desktop")
    public ResponseEntity<Map<String, Object>> ingest(@RequestBody EdgeCatalogSnapshot snapshot) {
        Integer ctxCompany = RestaurantTenantContext.getCompanyId();
        if (ctxCompany != null && snapshot != null && snapshot.companyId() != null
            && !Objects.equals(ctxCompany, snapshot.companyId())) {
            throw new BusinessException("Company mismatch");
        }
        return ResponseEntity.ok(applyService.applyLive(snapshot, true));
    }

    @GetMapping("/rst/edge/live-export")
    @Operation(summary = "Export live floor slice (orders/kitchen) for restaurant-desktop pull")
    public ResponseEntity<EdgeCatalogSnapshot> exportLive(
        @RequestParam Integer storeId,
        @RequestParam(required = false) String companyLoginCode
    ) {
        return ResponseEntity.ok(LiveFloorSlice.of(exportService.export(storeId, companyLoginCode)));
    }
}

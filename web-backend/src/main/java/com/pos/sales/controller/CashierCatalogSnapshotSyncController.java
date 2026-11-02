package com.pos.sales.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.entity.User;
import com.pos.sales.dto.sync.CatalogSnapshotPullResponse;
import com.pos.sales.service.sync.CatalogSnapshotPullService;
import com.pos.service.support.TenantAccessSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/sync/catalog/snapshots")
@RequiredArgsConstructor
@Tag(name = "Cashier Catalog Snapshots", description = "Wave 4.7 ProductSnapshot feed for desktop read-model")
@StandardApiResponses
public class CashierCatalogSnapshotSyncController {

    private final CatalogSnapshotPullService snapshotPullService;
    private final TenantAccessSupport tenantAccess;

    @GetMapping
    @Operation(summary = "Pull PRODUCT_SNAPSHOT events since timestamp (idempotent; no outbox ack)")
    public ResponseEntity<CatalogSnapshotPullResponse> pull(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since,
        @RequestParam(defaultValue = "50") int limit,
        @AuthenticationPrincipal User currentUser
    ) {
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        if (companyId == null && currentUser != null && currentUser.getCompany() != null) {
            companyId = currentUser.getCompany().getId();
        }
        return ResponseEntity.ok(snapshotPullService.pull(companyId, since, limit));
    }
}

package com.pos.controller.internal;

import com.pos.dto.shared.PageResponse;
import com.pos.service.report.ProductSnapshotBackfillService;
import com.pos.shared.event.ProductSnapshotEvent;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/reports/ops/product-snapshots")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Hidden
public class ReportsProductSnapshotsInternalController {

    private final ProductSnapshotBackfillService productSnapshotBackfillService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductSnapshotEvent>> page(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "200") int size
    ) {
        return ResponseEntity.ok(productSnapshotBackfillService.page(page, size));
    }
}

package com.pos.pharmacy.pricing.registry.controller;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.pricing.registry.dto.PriceChangeJournalResponse;
import com.pos.pharmacy.pricing.registry.dto.PriceRegistrySnapshotResponse;
import com.pos.pharmacy.pricing.registry.dto.PriceRegistrySyncResult;
import com.pos.pharmacy.pricing.registry.service.PharmacyPriceRegistryService;
import com.pos.shared.api.PageLimits;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/price-registry")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Price Registry", description = "Госреестр предельных розничных цен")
public class PharmacyPriceRegistryController {

    private final PharmacyPriceRegistryService priceRegistryService;
    private final TenantSupport tenant;

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скачать реестр, сверка, журнал было→предел→станет (без auto-apply по умолчанию)")
    public ResponseEntity<PriceRegistrySyncResult> sync() {
        return ResponseEntity.ok(priceRegistryService.syncForCompany(tenant.requireCompanyId()));
    }

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Применить PENDING: снизить наши цены до предела")
    public ResponseEntity<Map<String, Object>> apply(
        @RequestParam(required = false) UUID snapshotId
    ) {
        int applied = priceRegistryService.applyPending(snapshotId);
        return ResponseEntity.ok(Map.of("applied", applied));
    }

    @GetMapping("/journal")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Журнал изменений цен (было / предел / стало)")
    public ResponseEntity<PageResponse<PriceChangeJournalResponse>> journal(
        @RequestParam(required = false) String status,
        @PageableDefault(size = PageLimits.DEFAULT_SIZE) Pageable pageable
    ) {
        Pageable bounded = PageRequest.of(
            PageLimits.normalizePage(pageable.getPageNumber()),
            PageLimits.normalizeSize(pageable.getPageSize()),
            pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return ResponseEntity.ok(priceRegistryService.journal(status, bounded));
    }

    @GetMapping("/latest")
    @Operation(summary = "Последний успешный снимок реестра")
    public ResponseEntity<PriceRegistrySnapshotResponse> latest() {
        return ResponseEntity.ok(priceRegistryService.latestSnapshot());
    }

    @PostMapping("/check-sale")
    @Operation(summary = "Касса: разрешена ли цена продажи относительно предела")
    public ResponseEntity<Map<String, Object>> checkSale(@RequestBody CheckSaleRequest body) {
        boolean ok = priceRegistryService.checkPriceBeforeSale(body.productId(), body.salePrice());
        return ResponseEntity.ok(Map.of("allowed", ok));
    }

    public record CheckSaleRequest(UUID productId, BigDecimal salePrice) {}
}

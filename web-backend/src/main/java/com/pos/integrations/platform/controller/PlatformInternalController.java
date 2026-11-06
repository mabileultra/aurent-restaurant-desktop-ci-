package com.pos.integrations.platform.controller;

import com.pos.dto.platform.internal.CashRegisterStatsResponse;
import com.pos.dto.platform.internal.CompanyStoreCountResponse;
import com.pos.dto.platform.internal.CompanyStoreCountsResponse;
import com.pos.dto.platform.internal.CompanySyncRequest;
import com.pos.dto.platform.internal.CompanyUserCountResponse;
import com.pos.dto.store.CreateStoreRequest;
import com.pos.dto.store.StoreResponse;
import com.pos.service.platform.CashRegisterPlatformStatsService;
import com.pos.service.platform.PlatformInternalService;
import com.pos.service.platform.support.StorePlatformProvisioner;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/platform")
@RequiredArgsConstructor
@Hidden
public class PlatformInternalController {

    private final PlatformInternalService platformInternalService;
    private final CashRegisterPlatformStatsService cashRegisterPlatformStatsService;
    private final StorePlatformProvisioner storePlatformProvisioner;

    @GetMapping("/companies/{id}/store-count")
    public ResponseEntity<CompanyStoreCountResponse> storeCount(@PathVariable Integer id) {
        return ResponseEntity.ok(platformInternalService.storeCount(id));
    }

    @GetMapping("/companies/{id}/user-count")
    public ResponseEntity<CompanyUserCountResponse> userCount(@PathVariable Integer id) {
        return ResponseEntity.ok(platformInternalService.userCount(id));
    }

    @GetMapping("/companies/store-counts")
    public ResponseEntity<CompanyStoreCountsResponse> storeCounts(
        @RequestParam(name = "ids", required = false) List<Integer> ids
    ) {
        return ResponseEntity.ok(platformInternalService.storeCounts(ids));
    }

    @PostMapping("/companies/sync")
    public ResponseEntity<Void> syncCompany(@RequestBody CompanySyncRequest request) {
        platformInternalService.syncCompany(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/stores")
    public ResponseEntity<StoreResponse> createStore(@Valid @RequestBody CreateStoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(storePlatformProvisioner.create(request));
    }

    @DeleteMapping("/stores/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable Integer id) {
        storePlatformProvisioner.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cash-registers/stats")
    public ResponseEntity<CashRegisterStatsResponse> cashRegisterStats() {
        return ResponseEntity.ok(cashRegisterPlatformStatsService.stats());
    }
}

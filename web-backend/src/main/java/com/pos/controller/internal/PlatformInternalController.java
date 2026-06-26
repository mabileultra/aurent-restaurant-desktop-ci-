package com.pos.controller.internal;

import com.pos.dto.platform.internal.CompanyStoreCountResponse;
import com.pos.dto.platform.internal.CompanySyncRequest;
import com.pos.service.platform.PlatformInternalService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/platform")
@RequiredArgsConstructor
@Hidden
public class PlatformInternalController {

    private final PlatformInternalService platformInternalService;

    @GetMapping("/companies/{id}/store-count")
    public ResponseEntity<CompanyStoreCountResponse> storeCount(@PathVariable Integer id) {
        return ResponseEntity.ok(platformInternalService.storeCount(id));
    }

    @PostMapping("/companies/sync")
    public ResponseEntity<Void> syncCompany(@RequestBody CompanySyncRequest request) {
        platformInternalService.syncCompany(request);
        return ResponseEntity.noContent().build();
    }
}

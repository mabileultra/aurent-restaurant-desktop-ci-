package com.pos.platform.controller;

import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.dto.site.UpdateSiteLeadRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.service.SiteLeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/platform/leads")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Site Leads", description = "Заявки с публичного сайта (SUPER_ADMIN)")
public class PlatformSiteLeadController {

    private final SiteLeadService siteLeadService;

    @GetMapping
    @Operation(summary = "Список заявок")
    public ResponseEntity<PageResponse<SiteLeadResponse>> list(
        @RequestParam(required = false) SiteLeadStatus status,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(siteLeadService.list(status, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Заявка по ID")
    public ResponseEntity<SiteLeadResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(siteLeadService.getById(id));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Обновить статус или комментарий")
    public ResponseEntity<SiteLeadResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSiteLeadRequest request
    ) {
        return ResponseEntity.ok(siteLeadService.update(id, request));
    }
}

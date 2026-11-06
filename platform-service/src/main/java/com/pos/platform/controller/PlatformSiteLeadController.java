package com.pos.platform.controller;

import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.dto.site.ConvertLeadRequest;
import com.pos.platform.dto.site.ConvertLeadResponse;
import com.pos.platform.dto.site.CreateLeadCommentRequest;
import com.pos.platform.dto.site.LeadEventResponse;
import com.pos.platform.dto.site.LeadStatsResponse;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.dto.site.UpdateSiteLeadRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.service.SiteLeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/leads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Site Leads", description = "Заявки с публичного сайта (SUPER_ADMIN)")
public class PlatformSiteLeadController {

    private final SiteLeadService siteLeadService;

    @GetMapping("/stats")
    @Operation(summary = "Агрегаты заявок")
    public ResponseEntity<LeadStatsResponse> stats() {
        return ResponseEntity.ok(siteLeadService.stats());
    }

    @GetMapping
    @Operation(summary = "Список заявок")
    public ResponseEntity<PageResponse<SiteLeadResponse>> list(
        @RequestParam(required = false) SiteLeadStatus status,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(siteLeadService.list(status, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Заявка по ID")
    public ResponseEntity<SiteLeadResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(siteLeadService.getById(id));
    }

    @GetMapping("/{id}/events")
    @Operation(summary = "Лента событий заявки")
    public ResponseEntity<List<LeadEventResponse>> events(@PathVariable UUID id) {
        return ResponseEntity.ok(siteLeadService.events(id));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Комментарий к заявке")
    public ResponseEntity<LeadEventResponse> comment(
        @PathVariable UUID id,
        @Valid @RequestBody CreateLeadCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteLeadService.addComment(id, request));
    }

    @PostMapping("/{id}/convert")
    @Operation(summary = "Атомарно создать компанию / филиал / админа")
    public ResponseEntity<ConvertLeadResponse> convert(
        @PathVariable UUID id,
        @Valid @RequestBody ConvertLeadRequest request
    ) {
        return ResponseEntity.ok(siteLeadService.convert(id, request));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Обновить статус или комментарий")
    public ResponseEntity<SiteLeadResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSiteLeadRequest request
    ) {
        return ResponseEntity.ok(siteLeadService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить заявку")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        siteLeadService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

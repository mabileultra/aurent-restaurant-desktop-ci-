package com.pos.integrations.platform.controller;

import com.pos.dto.business.BusinessTypeDetailResponse;
import com.pos.dto.business.ReferenceBookDetailResponse;
import com.pos.dto.business.ReferenceBookResponse;
import com.pos.dto.business.SaveReferenceBookRequest;
import com.pos.dto.business.UpdateReferenceBookRequest;
import com.pos.dto.business.BusinessTypeFieldResponse;
import com.pos.dto.business.BusinessTypeResponse;
import com.pos.dto.business.BusinessTypePriceRuleResponse;
import com.pos.dto.business.BusinessTypeRuleResponse;
import com.pos.dto.business.FieldDisplayRuleResponse;
import com.pos.dto.business.SetBusinessTypePriceRulesRequest;
import com.pos.dto.business.SetFieldDisplayRulesRequest;
import com.pos.dto.business.BusinessTypeUnitAssignmentResponse;
import com.pos.dto.business.SaveBusinessTypeFieldRequest;
import com.pos.dto.business.SaveBusinessTypeRequest;
import com.pos.dto.business.SetBusinessTypeRulesRequest;
import com.pos.dto.business.SetBusinessTypeUnitsRequest;
import com.pos.dto.business.UpdateBusinessTypeFieldRequest;
import com.pos.dto.business.UpdateBusinessTypeRequest;
import com.pos.dto.email.EmailTemplateInfoResponse;
import com.pos.dto.email.EmailTemplatePreviewRequest;
import com.pos.dto.email.EmailTemplatePreviewResponse;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;
import com.pos.integrations.finance.dto.FinanceSyncBackfillResponse;
import com.pos.integrations.finance.dto.FinanceSyncOutboxDto;
import com.pos.dto.monitoring.LogEventDto;
import com.pos.dto.monitoring.MetricDetail;
import com.pos.dto.monitoring.MetricSummary;
import com.pos.dto.monitoring.SystemOverviewResponse;
import com.pos.dto.shared.ApiResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.exception.ResourceNotFoundException;
import com.pos.monitoring.SystemMonitorService;
import com.pos.service.BusinessTypeConfigService;
import com.pos.service.BusinessTypeDefinitionService;
import com.pos.service.ReferenceBookService;
import com.pos.service.email.PlatformEmailService;
import com.pos.integrations.finance.service.FinanceSyncAdminService;
import com.pos.integrations.finance.service.FinanceSyncBackfillService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/platform/ops")
@RequiredArgsConstructor
@Hidden
public class PlatformOpsInternalController {

    private final SystemMonitorService monitorService;
    private final PlatformEmailService platformEmailService;
    private final BusinessTypeDefinitionService businessTypeDefinitionService;
    private final BusinessTypeConfigService businessTypeConfigService;
    private final ReferenceBookService referenceBookService;
    private final FinanceSyncBackfillService backfillService;
    private final FinanceSyncAdminService adminService;

    @GetMapping("/monitoring/overview")
    public ResponseEntity<SystemOverviewResponse> overview() {
        return ResponseEntity.ok(monitorService.overview());
    }

    @GetMapping("/monitoring/metrics")
    public ResponseEntity<List<MetricSummary>> metrics(
        @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(monitorService.listMetrics(search));
    }

    @GetMapping("/monitoring/metrics/{name}")
    public ResponseEntity<MetricDetail> metricDetail(@PathVariable("name") String name) {
        return monitorService.metricDetail(name)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("Metric not found: " + name));
    }

    @GetMapping("/monitoring/logs")
    public ResponseEntity<List<LogEventDto>> logs(
        @RequestParam(value = "limit", defaultValue = "200") int limit,
        @RequestParam(value = "level", required = false) String level
    ) {
        return ResponseEntity.ok(monitorService.recentLogs(limit, level));
    }

    @DeleteMapping("/monitoring/logs")
    public ResponseEntity<Void> clearLogs() {
        monitorService.clearLogs();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/email/templates")
    public ResponseEntity<List<EmailTemplateInfoResponse>> templates() {
        return ResponseEntity.ok(platformEmailService.listTemplates());
    }

    @PostMapping("/email/templates/preview")
    public ResponseEntity<EmailTemplatePreviewResponse> preview(
        @Valid @RequestBody EmailTemplatePreviewRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.preview(request));
    }

    @PostMapping("/email/broadcast")
    public ResponseEntity<SendBroadcastEmailResponse> broadcast(
        @Valid @RequestBody SendBroadcastEmailRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.sendBroadcast(request));
    }

    @GetMapping("/business-types")
    public ResponseEntity<List<BusinessTypeResponse>> listBusinessTypes() {
        return ResponseEntity.ok(businessTypeDefinitionService.list());
    }

    @GetMapping("/business-types/{id}")
    public ResponseEntity<BusinessTypeDetailResponse> getBusinessType(@PathVariable Integer id) {
        return ResponseEntity.ok(businessTypeDefinitionService.getById(id));
    }

    @PostMapping("/business-types")
    public ResponseEntity<BusinessTypeDetailResponse> createBusinessType(
        @Valid @RequestBody SaveBusinessTypeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(businessTypeDefinitionService.create(request));
    }

    @PutMapping("/business-types/{id}")
    public ResponseEntity<BusinessTypeDetailResponse> updateBusinessType(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateBusinessTypeRequest request
    ) {
        return ResponseEntity.ok(businessTypeDefinitionService.update(id, request));
    }

    @DeleteMapping("/business-types/{id}")
    public ResponseEntity<ApiResponse> deleteBusinessType(@PathVariable Integer id) {
        businessTypeDefinitionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Business type deleted"));
    }

    @PostMapping("/business-types/{id}/fields")
    public ResponseEntity<BusinessTypeFieldResponse> addBusinessTypeField(
        @PathVariable Integer id,
        @Valid @RequestBody SaveBusinessTypeFieldRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(businessTypeDefinitionService.addField(id, request));
    }

    @PutMapping("/business-types/{typeId}/fields/{fieldId}")
    public ResponseEntity<BusinessTypeFieldResponse> updateBusinessTypeField(
        @PathVariable Integer typeId,
        @PathVariable Integer fieldId,
        @Valid @RequestBody UpdateBusinessTypeFieldRequest request
    ) {
        return ResponseEntity.ok(businessTypeDefinitionService.updateField(typeId, fieldId, request));
    }

    @DeleteMapping("/business-types/{typeId}/fields/{fieldId}")
    public ResponseEntity<ApiResponse> deleteBusinessTypeField(
        @PathVariable Integer typeId,
        @PathVariable Integer fieldId
    ) {
        businessTypeDefinitionService.deleteField(typeId, fieldId);
        return ResponseEntity.ok(ApiResponse.success("Field deleted"));
    }

    @PutMapping("/business-types/{id}/units")
    public ResponseEntity<List<BusinessTypeUnitAssignmentResponse>> setBusinessTypeUnits(
        @PathVariable Integer id,
        @Valid @RequestBody SetBusinessTypeUnitsRequest request
    ) {
        return ResponseEntity.ok(businessTypeConfigService.setUnits(id, request));
    }

    @PutMapping("/business-types/{id}/rules")
    public ResponseEntity<List<BusinessTypeRuleResponse>> setBusinessTypeRules(
        @PathVariable Integer id,
        @Valid @RequestBody SetBusinessTypeRulesRequest request
    ) {
        return ResponseEntity.ok(businessTypeConfigService.setRules(id, request));
    }

    @PutMapping("/business-types/{id}/form-fields")
    public ResponseEntity<List<BusinessTypeRuleResponse>> setBusinessTypeFormFields(
        @PathVariable Integer id,
        @Valid @RequestBody SetBusinessTypeRulesRequest request
    ) {
        return ResponseEntity.ok(businessTypeConfigService.setFormFields(id, request));
    }

    @PutMapping("/business-types/{id}/price-rules")
    public ResponseEntity<List<BusinessTypePriceRuleResponse>> setBusinessTypePriceRules(
        @PathVariable Integer id,
        @Valid @RequestBody SetBusinessTypePriceRulesRequest request
    ) {
        return ResponseEntity.ok(businessTypeConfigService.setPriceRules(id, request));
    }

    @PutMapping("/business-types/{id}/display-rules")
    public ResponseEntity<List<FieldDisplayRuleResponse>> setFieldDisplayRules(
        @PathVariable Integer id,
        @Valid @RequestBody SetFieldDisplayRulesRequest request
    ) {
        return ResponseEntity.ok(businessTypeConfigService.setDisplayRules(id, request));
    }

    @GetMapping("/reference-books")
    public ResponseEntity<List<ReferenceBookResponse>> listReferenceBooks() {
        return ResponseEntity.ok(referenceBookService.list());
    }

    @GetMapping("/reference-books/{id}")
    public ResponseEntity<ReferenceBookDetailResponse> getReferenceBook(@PathVariable Integer id) {
        return ResponseEntity.ok(referenceBookService.getById(id));
    }

    @PostMapping("/reference-books")
    public ResponseEntity<ReferenceBookDetailResponse> createReferenceBook(
        @Valid @RequestBody SaveReferenceBookRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(referenceBookService.create(request));
    }

    @PutMapping("/reference-books/{id}")
    public ResponseEntity<ReferenceBookDetailResponse> updateReferenceBook(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateReferenceBookRequest request
    ) {
        return ResponseEntity.ok(referenceBookService.update(id, request));
    }

    @DeleteMapping("/reference-books/{id}")
    public ResponseEntity<ApiResponse> deleteReferenceBook(@PathVariable Integer id) {
        referenceBookService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Reference book deleted"));
    }

    @PostMapping("/finance-sync/backfill")
    public ResponseEntity<FinanceSyncBackfillResponse> backfill(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "sales,purchases") String types
    ) {
        Set<String> typeSet = Arrays.stream(types.split(","))
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toSet());
        return ResponseEntity.ok(backfillService.backfill(from, to, typeSet));
    }

    @GetMapping("/finance-sync/outbox")
    public ResponseEntity<PageResponse<FinanceSyncOutboxDto>> outbox(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.listOutbox(status, pageable));
    }

    @PostMapping("/finance-sync/outbox/{id}/retry")
    public ResponseEntity<Void> retryOutbox(@PathVariable UUID id) {
        adminService.retryOutbox(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/finance-sync/retry-pending")
    public ResponseEntity<Map<String, Integer>> retryPending() {
        return ResponseEntity.ok(Map.of("processed", adminService.retryPendingBatch()));
    }
}

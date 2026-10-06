package com.pos.platform.controller;

import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.BillingCalendarResponse;
import com.pos.platform.dto.billing.BillingCollectionsOverviewResponse;
import com.pos.platform.dto.billing.BillingReportsResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;
import com.pos.platform.dto.billing.GrantDeferralRequest;
import com.pos.platform.service.BillingCollectionsService;
import com.pos.platform.service.BillingDeferralService;
import com.pos.platform.service.BillingReportsService;
import com.pos.platform.service.support.BillingCollectionsExcelExporter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/billing/collections")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Billing Collections", description = "Платежи и должники (SUPER_ADMIN)")
public class PlatformBillingCollectionsController {

    private static final MediaType XLSX =
        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final BillingCollectionsService collectionsService;
    private final BillingReportsService reportsService;
    private final BillingCollectionsExcelExporter excelExporter;
    private final BillingDeferralService deferralService;

    @GetMapping("/overview")
    @Operation(summary = "KPI экрана «Платежи и должники»")
    public ResponseEntity<BillingCollectionsOverviewResponse> overview() {
        return ResponseEntity.ok(collectionsService.overview());
    }

    @GetMapping("/companies")
    @Operation(summary = "Компании с вычисленным состоянием оплаты")
    public ResponseEntity<List<CompanyPaymentRowResponse>> companies(
        @RequestParam(required = false) BillingPaymentState state,
        @RequestParam(defaultValue = "false") boolean newOnly,
        @RequestParam(required = false) UUID planId,
        @RequestParam(required = false) BillingPaymentMethod method,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) BillingCollectionsService.DateField dateField,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) List<Integer> ids
    ) {
        return ResponseEntity.ok(collectionsService.list(
            filter(state, newOnly, planId, method, search, dateField, from, to, ids)
        ));
    }

    @GetMapping("/companies/export")
    @Operation(summary = "Excel по текущим фильтрам (или выбранным ids)")
    public ResponseEntity<byte[]> export(
        @RequestParam(required = false) BillingPaymentState state,
        @RequestParam(defaultValue = "false") boolean newOnly,
        @RequestParam(required = false) UUID planId,
        @RequestParam(required = false) BillingPaymentMethod method,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) BillingCollectionsService.DateField dateField,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) List<Integer> ids,
        @RequestParam(defaultValue = "ru") String lang
    ) {
        List<CompanyPaymentRowResponse> rows = collectionsService.list(
            filter(state, newOnly, planId, method, search, dateField, from, to, ids)
        );
        String fileName = "billing_" + LocalDate.now() + ".xlsx";
        return ResponseEntity.ok()
            .contentType(XLSX)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
            .body(excelExporter.export(rows, lang));
    }

    @PostMapping("/companies/{companyId}/deferral")
    @Operation(summary = "Дать компании отсрочку оплаты до даты")
    public ResponseEntity<CompanyBillingResponse> grantDeferral(
        @PathVariable Integer companyId,
        @Valid @RequestBody GrantDeferralRequest request
    ) {
        return ResponseEntity.ok(deferralService.grantDeferral(companyId, request));
    }

    @DeleteMapping("/companies/{companyId}/deferral")
    @Operation(summary = "Отменить отсрочку")
    public ResponseEntity<CompanyBillingResponse> cancelDeferral(@PathVariable Integer companyId) {
        return ResponseEntity.ok(deferralService.cancelDeferral(companyId));
    }

    @GetMapping("/reports")
    @Operation(summary = "Выручка, ожидаемые платежи, задолженность, доли способов оплаты")
    public ResponseEntity<BillingReportsResponse> reports(
        @RequestParam(required = false) BillingReportsService.Period period
    ) {
        return ResponseEntity.ok(reportsService.reports(period));
    }

    @GetMapping("/calendar")
    @Operation(summary = "Календарь ожидаемых списаний за месяц (yyyy-MM)")
    public ResponseEntity<BillingCalendarResponse> calendar(
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month
    ) {
        return ResponseEntity.ok(reportsService.calendar(month));
    }

    private static BillingCollectionsService.Filter filter(
        BillingPaymentState state,
        boolean newOnly,
        UUID planId,
        BillingPaymentMethod method,
        String search,
        BillingCollectionsService.DateField dateField,
        LocalDate from,
        LocalDate to,
        List<Integer> ids
    ) {
        return new BillingCollectionsService.Filter(
            state, newOnly, planId, method, search, dateField, from, to,
            ids != null ? new HashSet<>(ids) : null
        );
    }
}

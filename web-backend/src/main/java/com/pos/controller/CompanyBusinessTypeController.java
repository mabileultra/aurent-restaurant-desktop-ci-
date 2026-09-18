package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.company.CompanyBusinessTypesResponse;
import com.pos.dto.company.SetCompanyBusinessTypesRequest;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import com.pos.service.CompanyBusinessTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Company Business Types", description = "Типы бизнеса компании")
@StandardApiResponses
public class CompanyBusinessTypeController {

    private final CompanyBusinessTypeService companyBusinessTypeService;
    private final CompanyBusinessTypeAssignmentService assignmentService;

    @GetMapping("/company-business-types")
    @Operation(summary = "Типы бизнеса текущей компании")
    @ApiResponse(responseCode = "200", description = "Список разрешённых типов")
    public ResponseEntity<CompanyBusinessTypesResponse> getForCurrentCompany() {
        return ResponseEntity.ok(companyBusinessTypeService.getForCurrentCompany());
    }

    @GetMapping("/admin/companies/{companyId}/business-types")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Типы бизнеса компании (platform)")
    public ResponseEntity<CompanyBusinessTypesResponse> getForCompany(@PathVariable Integer companyId) {
        return ResponseEntity.ok(assignmentService.getForCompany(companyId));
    }

    @PutMapping("/admin/companies/{companyId}/business-types")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Назначить типы бизнеса компании")
    public ResponseEntity<CompanyBusinessTypesResponse> setForCompany(
        @PathVariable Integer companyId,
        @Valid @RequestBody SetCompanyBusinessTypesRequest request
    ) {
        return ResponseEntity.ok(assignmentService.setForCompany(companyId, request));
    }
}

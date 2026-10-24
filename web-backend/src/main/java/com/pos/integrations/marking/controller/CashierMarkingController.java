package com.pos.integrations.marking.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.marking.dto.MarkSoldCheckRequest;
import com.pos.integrations.marking.dto.MarkSoldCheckResponse;
import com.pos.integrations.marking.service.MarkingSoldJournalService;
import com.pos.service.support.TenantAccessSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cashier/marks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
@Tag(name = "Cashier Marking", description = "Журнал пробитых КМ на grocery-кассе")
@StandardApiResponses
public class CashierMarkingController {

    private final MarkingSoldJournalService soldJournalService;
    private final TenantAccessSupport tenantAccess;

    @PostMapping("/check")
    @Operation(summary = "Проверить, был ли КМ уже продан в нашей системе")
    public ResponseEntity<MarkSoldCheckResponse> checkSold(
        @Valid @RequestBody MarkSoldCheckRequest request
    ) {
        return ResponseEntity.ok(
            soldJournalService.checkSold(tenantAccess.requireEffectiveCompanyId(), request.code())
        );
    }
}

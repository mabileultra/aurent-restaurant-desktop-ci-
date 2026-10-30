package com.pos.platform.controller;

import com.pos.platform.client.PosCoreClient;
import com.pos.platform.client.dto.CashRegisterStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/cash-registers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Cash Registers", description = "Статистика касс для Super Admin")
public class PlatformCashRegisterController {

    private final PosCoreClient posCoreClient;

    @GetMapping("/stats")
    @Operation(summary = "Статистика касс", description = "Общие числа касс платформы (без tenant 403)")
    @ApiResponse(responseCode = "200", description = "Статистика")
    public ResponseEntity<CashRegisterStatsResponse> stats() {
        return ResponseEntity.ok(posCoreClient.getCashRegisterStatsOrZero());
    }
}

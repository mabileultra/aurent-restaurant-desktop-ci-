package com.pos.scales.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.scales.dto.ScaleAdapterFamilyDto;
import com.pos.scales.dto.ScalePluExportResponse;
import com.pos.scales.service.ScalePluExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/scales/sync")
@RequiredArgsConstructor
@Tag(name = "Scales Sync", description = "Выгрузка PLU-пакета для адаптеров умных весов")
@StandardApiResponses
public class ScaleSyncController {

    private final ScalePluExportService scalePluExportService;

    @GetMapping("/adapters")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Семейства адаптеров весов")
    @ApiResponse(responseCode = "200", description = "Каталог семейств (много моделей в одном слоте)")
    public ResponseEntity<List<ScaleAdapterFamilyDto>> listAdapterFamilies() {
        return ResponseEntity.ok(ScaleAdapterFamilyDto.catalog());
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт PLU-каталога", description = "Бренд-агностичный пакет для Desktop scale adapters")
    @ApiResponse(responseCode = "200", description = "Пакет PLU")
    public ResponseEntity<ScalePluExportResponse> exportPluCatalog(
        @RequestParam(defaultValue = "true") boolean onlyWithPlu,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(scalePluExportService.exportPluCatalog(onlyWithPlu, storeId));
    }
}

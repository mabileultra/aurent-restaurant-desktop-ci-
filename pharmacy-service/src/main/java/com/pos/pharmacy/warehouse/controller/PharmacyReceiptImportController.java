package com.pos.pharmacy.warehouse.controller;

import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchResponse;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportParseResponse;
import com.pos.pharmacy.warehouse.service.PharmacyReceiptImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/receipts/{id}/import")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Receipt Import", description = "Импорт строк поступления из Excel/PDF")
public class PharmacyReceiptImportController {

    private final PharmacyReceiptImportService pharmacyReceiptImportService;

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Разобрать Excel или PDF в таблицу")
    public ResponseEntity<PharmacyImportParseResponse> parse(
        @PathVariable UUID id,
        @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.ok(pharmacyReceiptImportService.parse(id, file));
    }

    @PostMapping("/match")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Сопоставить строки файла с каталогом")
    public ResponseEntity<PharmacyImportMatchResponse> match(
        @PathVariable UUID id,
        @Valid @RequestBody PharmacyImportMatchRequest request
    ) {
        return ResponseEntity.ok(pharmacyReceiptImportService.match(id, request));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Записать импортированные строки в черновик")
    public ResponseEntity<PharmacyStockReceiptResponse> confirm(
        @PathVariable UUID id,
        @Valid @RequestBody PharmacyImportConfirmRequest request
    ) {
        return ResponseEntity.ok(pharmacyReceiptImportService.confirm(id, request));
    }
}

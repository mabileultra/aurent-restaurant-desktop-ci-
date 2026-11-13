package com.pos.pharmacy.catalog.registry.controller;

import com.pos.pharmacy.catalog.registry.dto.DrugRegistryHit;
import com.pos.pharmacy.catalog.registry.dto.DrugRegistryLatestResponse;
import com.pos.pharmacy.catalog.registry.dto.DrugRegistrySyncResult;
import com.pos.pharmacy.catalog.registry.service.DrugRegistryImportService;
import com.pos.pharmacy.catalog.registry.service.DrugRegistryLookupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/pharmacy/drug-registry")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Drug Registry", description = "Государственный реестр лекарственных средств")
public class DrugRegistryController {

    private final DrugRegistryLookupService lookup;
    private final DrugRegistryImportService imports;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Поиск лекарства в государственном реестре")
    public ResponseEntity<List<DrugRegistryHit>> search(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(lookup.search(q));
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Последний успешный импорт реестра")
    public ResponseEntity<DrugRegistryLatestResponse> latest() {
        return ResponseEntity.ok(imports.latest());
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скачать реестр по URL/странице и дописать пустые поля старых карточек")
    public ResponseEntity<DrugRegistrySyncResult> sync() {
        return ResponseEntity.ok(imports.sync());
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Загрузить ZIP/Excel реестра вручную (если сайт с капчей)")
    public ResponseEntity<DrugRegistrySyncResult> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(imports.upload(file));
    }
}

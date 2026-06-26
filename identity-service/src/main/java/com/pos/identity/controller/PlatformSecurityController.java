package com.pos.identity.controller;

import com.pos.identity.dto.platform.security.CreatePlatformSuperAdminRequest;
import com.pos.identity.dto.platform.security.PlatformSuperAdminResponse;
import com.pos.identity.dto.platform.security.UpdatePlatformSuperAdminRequest;
import com.pos.identity.service.PlatformSuperAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/security")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Security", description = "Безопасность платформы: супер-админы")
public class PlatformSecurityController {

    private final PlatformSuperAdminService platformSuperAdminService;

    @GetMapping("/super-admins")
    @Operation(summary = "Список супер-администраторов платформы")
    public ResponseEntity<List<PlatformSuperAdminResponse>> listSuperAdmins() {
        return ResponseEntity.ok(platformSuperAdminService.listSuperAdmins());
    }

    @PostMapping("/super-admins")
    @Operation(summary = "Создать супер-администратора")
    public ResponseEntity<PlatformSuperAdminResponse> createSuperAdmin(
        @Valid @RequestBody CreatePlatformSuperAdminRequest request
    ) {
        return ResponseEntity.ok(platformSuperAdminService.createSuperAdmin(request));
    }

    @PutMapping("/super-admins/{id}")
    @Operation(summary = "Обновить супер-администратора")
    public ResponseEntity<PlatformSuperAdminResponse> updateSuperAdmin(
        @PathVariable UUID id,
        @Valid @RequestBody UpdatePlatformSuperAdminRequest request
    ) {
        return ResponseEntity.ok(platformSuperAdminService.updateSuperAdmin(id, request));
    }
}

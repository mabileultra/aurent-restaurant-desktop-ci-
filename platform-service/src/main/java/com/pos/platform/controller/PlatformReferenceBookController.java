package com.pos.platform.controller;

import com.pos.platform.service.PosCoreProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/reference-books")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Reference Books", description = "Справочники для LIST-полей конструктора")
public class PlatformReferenceBookController {

    private static final String PUBLIC_PREFIX = "/platform/reference-books";
    private static final String OPS_BASE = "reference-books";

    private final PosCoreProxyService posCoreProxyService;

    @GetMapping
    @Operation(summary = "Список справочников")
    public ResponseEntity<byte[]> list(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Справочник с элементами")
    public ResponseEntity<byte[]> get(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping
    @Operation(summary = "Создать справочник")
    public ResponseEntity<byte[]> create(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить справочник")
    public ResponseEntity<byte[]> update(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить справочник")
    public ResponseEntity<byte[]> delete(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }
}

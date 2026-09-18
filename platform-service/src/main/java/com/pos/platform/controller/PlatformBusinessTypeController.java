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
@RequestMapping("/platform/business-types")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Business Types", description = "Конструктор бизнеса (прокси в POS core)")
public class PlatformBusinessTypeController {

    private static final String PUBLIC_PREFIX = "/platform/business-types";
    private static final String OPS_BASE = "business-types";

    private final PosCoreProxyService posCoreProxyService;

    @GetMapping
    @Operation(summary = "Список типов бизнеса")
    public ResponseEntity<byte[]> list(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Тип бизнеса с полями")
    public ResponseEntity<byte[]> get(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping
    @Operation(summary = "Создать тип бизнеса")
    public ResponseEntity<byte[]> create(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить тип бизнеса")
    public ResponseEntity<byte[]> update(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить тип бизнеса")
    public ResponseEntity<byte[]> delete(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping("/{id}/fields")
    @Operation(summary = "Добавить поле")
    public ResponseEntity<byte[]> addField(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{typeId}/fields/{fieldId}")
    @Operation(summary = "Обновить поле")
    public ResponseEntity<byte[]> updateField(
        HttpServletRequest request,
        @PathVariable Integer typeId,
        @PathVariable Integer fieldId
    ) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @DeleteMapping("/{typeId}/fields/{fieldId}")
    @Operation(summary = "Удалить поле")
    public ResponseEntity<byte[]> deleteField(
        HttpServletRequest request,
        @PathVariable Integer typeId,
        @PathVariable Integer fieldId
    ) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{id}/units")
    @Operation(summary = "Назначить единицы измерения")
    public ResponseEntity<byte[]> setUnits(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{id}/rules")
    @Operation(summary = "Назначить правила поведения")
    public ResponseEntity<byte[]> setRules(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{id}/price-rules")
    @Operation(summary = "Назначить правила ценообразования")
    public ResponseEntity<byte[]> setPriceRules(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PutMapping("/{id}/display-rules")
    @Operation(summary = "Назначить правила отображения полей")
    public ResponseEntity<byte[]> setDisplayRules(HttpServletRequest request, @PathVariable Integer id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }
}

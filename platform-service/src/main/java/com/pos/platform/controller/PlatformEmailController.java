package com.pos.platform.controller;

import com.pos.platform.service.PosCoreProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/email")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Email", description = "Платформенная рассылка email (прокси в POS core)")
public class PlatformEmailController {

    private static final String PUBLIC_PREFIX = "/platform/email";
    private static final String OPS_BASE = "email";

    private final PosCoreProxyService posCoreProxyService;

    @GetMapping("/templates")
    @Operation(summary = "Список шаблонов")
    public ResponseEntity<byte[]> templates(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping("/templates/preview")
    @Operation(summary = "Предпросмотр шаблона")
    public ResponseEntity<byte[]> preview(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Массовая рассылка")
    public ResponseEntity<byte[]> broadcast(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }
}

package com.pos.platform.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.PosCoreProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/platform/email")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Email", description = "Платформенная рассылка email (прокси в POS core)")
public class PlatformEmailController {

    private static final String PUBLIC_PREFIX = "/platform/email";
    private static final String OPS_BASE = "email";

    private final PosCoreProxyService posCoreProxyService;
    private final RestClient posCoreRestClient;
    private final ObjectMapper objectMapper;

    public PlatformEmailController(
        PosCoreProxyService posCoreProxyService,
        @Qualifier("posCoreRestClient") RestClient posCoreRestClient,
        ObjectMapper objectMapper
    ) {
        this.posCoreProxyService = posCoreProxyService;
        this.posCoreRestClient = posCoreRestClient;
        this.objectMapper = objectMapper;
    }

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

    @PostMapping("/test")
    @Operation(summary = "Тестовое письмо текущему администратору")
    public ResponseEntity<byte[]> test(HttpServletRequest request) throws IOException {
        UUID actorUserId = PlatformTenantContext.getUserId();
        if (actorUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current user required");
        }

        byte[] raw = StreamUtils.copyToByteArray(request.getInputStream());
        JsonNode root = objectMapper.readTree(raw.length == 0 ? "{}".getBytes() : raw);
        if (!(root instanceof ObjectNode objectNode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON body");
        }
        objectNode.put("actorUserId", actorUserId.toString());
        byte[] body = objectMapper.writeValueAsBytes(objectNode);

        return posCoreRestClient.post()
            .uri("/internal/platform/ops/email/test")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .exchange((req, res) -> {
                byte[] responseBody = res.getBody() != null
                    ? StreamUtils.copyToByteArray(res.getBody())
                    : new byte[0];
                return ResponseEntity.status(res.getStatusCode()).body(responseBody);
            });
    }
}

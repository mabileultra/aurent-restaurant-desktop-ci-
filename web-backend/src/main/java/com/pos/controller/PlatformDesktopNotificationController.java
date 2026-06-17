package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.dto.desktop.DesktopBroadcastListResponse;
import com.pos.dto.desktop.DesktopBroadcastResponse;
import com.pos.service.desktop.DesktopBroadcastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/desktop-notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Desktop Notifications", description = "Рассылка уведомлений на desktop-кассы")
@StandardApiResponses
public class PlatformDesktopNotificationController {

    private final DesktopBroadcastService desktopBroadcastService;

    @GetMapping
    @Operation(summary = "История рассылок", description = "Последние уведомления для desktop-касс")
    @ApiResponse(responseCode = "200", description = "Список рассылок")
    public ResponseEntity<List<DesktopBroadcastResponse>> list() {
        return ResponseEntity.ok(desktopBroadcastService.listRecentForPlatform());
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Отправить уведомление", description = "Рассылка сообщения всем desktop-кассам")
    @ApiResponse(responseCode = "200", description = "Уведомление создано")
    public ResponseEntity<DesktopBroadcastResponse> broadcast(
        @Valid @RequestBody DesktopBroadcastCreateRequest request
    ) {
        return ResponseEntity.ok(desktopBroadcastService.broadcast(request));
    }
}

package com.pos.platform.controller;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.dto.desktop.DesktopBroadcastResponse;
import com.pos.platform.service.DesktopBroadcastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/platform/desktop-notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Desktop Notifications", description = "Рассылка уведомлений на desktop-кассы")
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

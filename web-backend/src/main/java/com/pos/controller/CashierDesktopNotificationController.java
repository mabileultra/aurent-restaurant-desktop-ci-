package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.desktop.DesktopBroadcastListResponse;
import com.pos.service.desktop.DesktopBroadcastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/cashier/desktop-notifications")
@RequiredArgsConstructor
@Tag(name = "Cashier Desktop Notifications", description = "Уведомления desktop-кассы")
@StandardApiResponses
public class CashierDesktopNotificationController {

    private final DesktopBroadcastService desktopBroadcastService;

    @GetMapping
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Непрочитанные уведомления", description = "Сообщения от платформы и администратора")
    @ApiResponse(responseCode = "200", description = "Список непрочитанных уведомлений")
    public ResponseEntity<DesktopBroadcastListResponse> unread() {
        return ResponseEntity.ok(desktopBroadcastService.listUnreadForCurrentUser());
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Отметить прочитанным", description = "Скрыть уведомление для текущего кассира")
    @ApiResponse(responseCode = "204", description = "Отмечено")
    public ResponseEntity<Void> markRead(@PathVariable UUID id) {
        desktopBroadcastService.markRead(id);
        return ResponseEntity.noContent().build();
    }
}

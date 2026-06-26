package com.pos.platform.controller.internal;

import com.pos.platform.dto.desktop.DesktopBroadcastListResponse;
import com.pos.platform.dto.platform.security.VerifyCashierServerPasswordRequest;
import com.pos.platform.dto.platform.security.VerifyCashierServerPasswordResponse;
import com.pos.platform.service.DesktopBroadcastService;
import com.pos.platform.service.PlatformSecurityService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/platform")
@RequiredArgsConstructor
@Hidden
public class PlatformInternalController {

    private final PlatformSecurityService platformSecurityService;
    private final DesktopBroadcastService desktopBroadcastService;

    @PostMapping("/security/verify-cashier-password")
    public ResponseEntity<VerifyCashierServerPasswordResponse> verifyCashierPassword(
        @Valid @RequestBody VerifyCashierServerPasswordRequest request
    ) {
        return ResponseEntity.ok(platformSecurityService.verifyCashierServerPassword(request.password()));
    }

    @GetMapping("/desktop-notifications/unread")
    public ResponseEntity<DesktopBroadcastListResponse> unread(@RequestParam UUID userId) {
        return ResponseEntity.ok(desktopBroadcastService.listUnreadForUser(userId));
    }

    @PostMapping("/desktop-notifications/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id, @RequestParam UUID userId) {
        desktopBroadcastService.markRead(id, userId);
        return ResponseEntity.noContent().build();
    }
}

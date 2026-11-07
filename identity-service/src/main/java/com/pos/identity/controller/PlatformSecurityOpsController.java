package com.pos.identity.controller;

import com.pos.identity.dto.security.AuthSessionResponse;
import com.pos.identity.dto.security.LoginRulesDto;
import com.pos.identity.dto.security.ReauthRequest;
import com.pos.identity.dto.security.ReauthResponse;
import com.pos.identity.dto.security.TwoFactorSetupResponse;
import com.pos.identity.service.security.PlatformSecurityOpsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.pos.identity.exception.BadRequestException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/platform/security")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Security Ops", description = "Сессии, правила входа, 2FA, re-auth")
public class PlatformSecurityOpsController {

    private final PlatformSecurityOpsService securityOpsService;

    @GetMapping("/sessions")
    @Operation(summary = "Активные сессии платформенных пользователей")
    public ResponseEntity<List<AuthSessionResponse>> sessions() {
        return ResponseEntity.ok(securityOpsService.listSessions());
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Закрыть сессию")
    public ResponseEntity<Void> revokeSession(@PathVariable UUID sessionId) {
        securityOpsService.revokeSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/revoke-others")
    @Operation(summary = "Закрыть все сессии кроме текущей")
    public ResponseEntity<Map<String, Integer>> revokeOthers() {
        return ResponseEntity.ok(Map.of("revoked", securityOpsService.revokeOtherSessions()));
    }

    @GetMapping("/login-rules")
    @Operation(summary = "Правила входа")
    public ResponseEntity<LoginRulesDto> getLoginRules() {
        return ResponseEntity.ok(securityOpsService.getLoginRules());
    }

    @PutMapping("/login-rules")
    @Operation(summary = "Сохранить правила входа (нужен X-Sudo-Token)")
    public ResponseEntity<LoginRulesDto> saveLoginRules(
        @Valid @RequestBody LoginRulesDto rules,
        @RequestHeader(value = "X-Sudo-Token", required = false) String sudoToken
    ) {
        return ResponseEntity.ok(securityOpsService.saveLoginRules(rules, sudoToken));
    }

    @PostMapping("/reauth")
    @Operation(summary = "Повторное подтверждение пароля и 2FA")
    public ResponseEntity<ReauthResponse> reauth(@Valid @RequestBody ReauthRequest request) {
        return ResponseEntity.ok(securityOpsService.reauth(request));
    }

    @GetMapping("/2fa")
    @Operation(summary = "Статус 2FA текущего пользователя")
    public ResponseEntity<TwoFactorSetupResponse> twoFactorStatus() {
        return ResponseEntity.ok(securityOpsService.twoFactorStatus());
    }

    @PostMapping("/2fa/setup")
    @Operation(summary = "Создать секрет и otpauth URL")
    public ResponseEntity<TwoFactorSetupResponse> setupTwoFactor() {
        return ResponseEntity.ok(securityOpsService.setupTwoFactor());
    }

    @PostMapping("/2fa/enable")
    @Operation(summary = "Включить 2FA после проверки кода")
    public ResponseEntity<TwoFactorSetupResponse> enableTwoFactor(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(securityOpsService.enableTwoFactor(required(body, "code")));
    }

    @PostMapping("/2fa/disable")
    @Operation(summary = "Выключить 2FA")
    public ResponseEntity<TwoFactorSetupResponse> disableTwoFactor(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(securityOpsService.disableTwoFactor(
            required(body, "password"),
            body.get("code")
        ));
    }

    private static String required(Map<String, String> body, String key) {
        String value = body != null ? body.get(key) : null;
        if (value == null || value.isBlank()) {
            throw new BadRequestException(key + " required");
        }
        return value;
    }
}

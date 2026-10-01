package com.pos.identity.controller;

import com.pos.identity.dto.auth.AuthRequest;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CashierPinAuthRequest;
import com.pos.identity.dto.auth.PinRosterEntryResponse;
import com.pos.identity.dto.auth.RegisterRequest;
import com.pos.identity.dto.auth.VerifyPasswordRequest;
import com.pos.identity.dto.auth.VerifyPinRequest;
import com.pos.identity.service.auth.AuthLoginService;
import com.pos.identity.service.auth.CashierPinAuthService;
import com.pos.identity.service.auth.TokenRefreshService;
import com.pos.identity.security.ratelimit.LoginAttemptRateLimiter;
import com.pos.identity.util.ClientIpResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Аутентификация, регистрация и проверка учётных данных")
public class AuthController {

    private final AuthLoginService authLoginService;
    private final CashierPinAuthService cashierPinAuthService;
    private final TokenRefreshService tokenRefreshService;
    private final LoginAttemptRateLimiter loginRateLimiter;

    @PostMapping("/login")
    @Operation(summary = "Вход в систему")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Успешная аутентификация")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody AuthRequest request,
        HttpServletRequest httpRequest
    ) {
        String clientIp = ClientIpResolver.resolve(httpRequest);
        loginRateLimiter.check(clientIp, "login");
        return ResponseEntity.ok(authLoginService.authenticate(
            request,
            clientIp,
            httpRequest.getHeader("User-Agent")
        ));
    }

    @GetMapping("/cashier-pin/roster")
    @Operation(summary = "Список сотрудников с PIN для терминала")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Активные пользователи с PIN")
    public ResponseEntity<List<PinRosterEntryResponse>> cashierPinRoster(
        @RequestParam String companyLoginCode,
        HttpServletRequest httpRequest
    ) {
        loginRateLimiter.check(ClientIpResolver.resolve(httpRequest), "cashier-pin-roster");
        return ResponseEntity.ok(cashierPinAuthService.listPinRoster(companyLoginCode));
    }

    @PostMapping("/cashier-pin/login")
    @Operation(summary = "Вход по PIN (терминал)")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Успешная аутентификация")
    public ResponseEntity<AuthResponse> cashierPinLogin(
        @Valid @RequestBody CashierPinAuthRequest request,
        HttpServletRequest httpRequest
    ) {
        loginRateLimiter.check(ClientIpResolver.resolve(httpRequest), "cashier-pin");
        return ResponseEntity.ok(cashierPinAuthService.authenticate(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Регистрация")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Пользователь зарегистрирован")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authLoginService.register(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Обновление токена")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Токены обновлены")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(tokenRefreshService.refresh(bearerToken.substring(7)));
    }

    @PostMapping("/verify-password")
    @Operation(summary = "Проверка пароля")
    @ApiResponse(responseCode = "204", description = "Пароль подтверждён")
    public ResponseEntity<Void> verifyPassword(@Valid @RequestBody VerifyPasswordRequest request) {
        authLoginService.verifyPassword(request.password());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-pin")
    @Operation(summary = "Проверка PIN")
    @ApiResponse(responseCode = "204", description = "PIN подтверждён")
    public ResponseEntity<Void> verifyPin(@Valid @RequestBody VerifyPinRequest request) {
        cashierPinAuthService.verifyPin(request.pin());
        return ResponseEntity.noContent().build();
    }
}

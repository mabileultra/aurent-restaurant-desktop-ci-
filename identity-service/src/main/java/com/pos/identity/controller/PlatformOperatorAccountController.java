package com.pos.identity.controller;

import com.pos.identity.dto.platform.account.PlatformOperatorAccountResponse;
import com.pos.identity.dto.platform.account.UpdatePlatformOperatorAccountRequest;
import com.pos.identity.service.account.PlatformOperatorAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/account")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
@Tag(name = "Platform Operator Account", description = "Свой логин и пароль PLATFORM_ADMIN")
public class PlatformOperatorAccountController {

    private final PlatformOperatorAccountService platformOperatorAccountService;

    @GetMapping
    @Operation(summary = "Текущий логин оператора")
    public ResponseEntity<PlatformOperatorAccountResponse> current() {
        return ResponseEntity.ok(platformOperatorAccountService.current());
    }

    @PutMapping
    @Operation(summary = "Сменить свой логин и/или пароль")
    public ResponseEntity<PlatformOperatorAccountResponse> update(
        @Valid @RequestBody UpdatePlatformOperatorAccountRequest request
    ) {
        return ResponseEntity.ok(platformOperatorAccountService.update(request));
    }
}

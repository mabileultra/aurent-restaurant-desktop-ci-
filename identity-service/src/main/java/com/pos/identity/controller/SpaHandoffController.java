package com.pos.identity.controller;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CreateHandoffRequest;
import com.pos.identity.dto.auth.ExchangeHandoffRequest;
import com.pos.identity.dto.auth.HandoffCodeResponse;
import com.pos.identity.dto.auth.SpaAudience;
import com.pos.identity.security.ratelimit.LoginAttemptRateLimiter;
import com.pos.identity.service.auth.SpaHandoffService;
import com.pos.identity.util.ClientIpResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/handoff")
@RequiredArgsConstructor
@Tag(name = "SPA Handoff", description = "One-time cross-origin session codes (no JWT in URL)")
public class SpaHandoffController {

    private final SpaHandoffService spaHandoffService;
    private final LoginAttemptRateLimiter loginRateLimiter;

    @PostMapping
    @Operation(summary = "Create one-time handoff code for target SPA")
    @ApiResponse(responseCode = "200", description = "Code issued")
    public ResponseEntity<HandoffCodeResponse> create(
        @Valid @RequestBody CreateHandoffRequest request,
        HttpServletRequest httpRequest
    ) {
        loginRateLimiter.check(ClientIpResolver.resolve(httpRequest), "handoff-create");
        SpaAudience audience = SpaAudience.fromRequest(request.audience());
        return ResponseEntity.ok(spaHandoffService.create(audience));
    }

    @PostMapping("/exchange")
    @Operation(summary = "Exchange handoff code for a new session")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Session issued")
    public ResponseEntity<AuthResponse> exchange(
        @Valid @RequestBody ExchangeHandoffRequest request,
        HttpServletRequest httpRequest
    ) {
        loginRateLimiter.check(ClientIpResolver.resolve(httpRequest), "handoff-exchange");
        return ResponseEntity.ok(spaHandoffService.exchange(request.code()));
    }
}

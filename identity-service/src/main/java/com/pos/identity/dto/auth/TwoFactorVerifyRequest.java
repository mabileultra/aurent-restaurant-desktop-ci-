package com.pos.identity.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TwoFactorVerifyRequest(
    @NotBlank @Size(max = 2048) String challengeToken,
    @NotBlank @Size(max = 12) String code
) {
}

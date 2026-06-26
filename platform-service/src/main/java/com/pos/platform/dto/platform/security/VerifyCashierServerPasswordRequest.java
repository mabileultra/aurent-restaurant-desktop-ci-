package com.pos.platform.dto.platform.security;

import jakarta.validation.constraints.NotBlank;

public record VerifyCashierServerPasswordRequest(
    @NotBlank String password
) {
}

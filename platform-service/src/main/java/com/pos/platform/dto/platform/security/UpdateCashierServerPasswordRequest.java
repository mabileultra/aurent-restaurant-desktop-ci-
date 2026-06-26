package com.pos.platform.dto.platform.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCashierServerPasswordRequest(
    @NotBlank @Size(min = 4, max = 64) String password
) {
}

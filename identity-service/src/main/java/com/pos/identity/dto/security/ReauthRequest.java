package com.pos.identity.dto.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReauthRequest(
    @NotBlank @Size(max = 128) String password,
    @Size(max = 12) String totpCode
) {
}

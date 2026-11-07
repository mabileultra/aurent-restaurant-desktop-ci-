package com.pos.dto.email;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendTestEmailRequest(
    @NotBlank @Size(max = 200) String subject,
    @NotBlank @Size(max = 10000) String message,
    @Size(max = 8) String locale,
    /** Filled by platform-service from JWT — never trust a client-supplied actor. */
    @NotNull UUID actorUserId
) {
}

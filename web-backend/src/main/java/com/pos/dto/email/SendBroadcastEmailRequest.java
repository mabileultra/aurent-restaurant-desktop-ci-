package com.pos.dto.email;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SendBroadcastEmailRequest(
    @NotBlank @Size(max = 200) String subject,
    @NotBlank @Size(max = 10000) String message,
    List<UUID> userIds,
    List<String> roles,
    List<Integer> companyIds,
    boolean selectAll,
    /** Optional client key; if blank, backend hashes the payload. Max 64. */
    @Size(max = 64) String idempotencyKey,
    /** ru | uz; default uz for broadcast chrome (greeting/footer). */
    @Size(max = 8) String locale
) {
}

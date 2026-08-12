package com.pos.telegram.dto;

import jakarta.validation.constraints.NotBlank;

public record UpsertCompanyTelegramBotRequest(
    String botUsername,
    @NotBlank String botToken,
    String apiToken,
    String supportGroupId,
    Boolean enabled
) {
}

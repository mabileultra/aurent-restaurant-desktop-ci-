package com.pos.telegram.dto;

public record TelegramBotRuntimeInstanceDto(
    Integer companyId,
    String companyName,
    String botUsername,
    String botToken,
    String apiToken,
    String supportGroupId
) {
}

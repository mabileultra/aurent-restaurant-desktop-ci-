package com.pos.support.dto;

public record SupportContactsResponse(
    String phone,
    String telegramBot,
    String telegramUrl
) {
}

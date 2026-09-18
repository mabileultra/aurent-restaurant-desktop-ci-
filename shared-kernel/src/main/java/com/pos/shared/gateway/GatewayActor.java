package com.pos.shared.gateway;

import java.util.UUID;

/**
 * Пользователь, которого gateway уже проверил и подписал.
 */
public record GatewayActor(
    UUID userId,
    Integer companyId,
    String role
) {
}

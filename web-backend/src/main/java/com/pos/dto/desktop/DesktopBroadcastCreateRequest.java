package com.pos.dto.desktop;

import com.pos.entity.DesktopBroadcastKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DesktopBroadcastCreateRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 4000) String body,
    @NotNull DesktopBroadcastKind kind,
    Integer priority,
    @Size(max = 100) String actionLabel,
    @Size(max = 500) String actionUrl,
    Integer expiresInHours
) {
}

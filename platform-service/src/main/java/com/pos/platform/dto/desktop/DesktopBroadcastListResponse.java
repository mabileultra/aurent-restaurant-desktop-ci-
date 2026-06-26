package com.pos.platform.dto.desktop;

import java.util.List;

public record DesktopBroadcastListResponse(
    List<DesktopBroadcastResponse> items,
    int unreadCount
) {
}

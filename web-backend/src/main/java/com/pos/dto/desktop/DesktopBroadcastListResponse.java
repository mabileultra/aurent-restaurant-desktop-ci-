package com.pos.dto.desktop;

import java.util.List;

public record DesktopBroadcastListResponse(
    List<DesktopBroadcastResponse> items,
    int unreadCount
) {
}
